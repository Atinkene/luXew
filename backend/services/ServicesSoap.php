<?php
require_once '../modeles/ModeleUtilisateur.php';
require_once '../modeles/ModeleJeton.php';

class ServicesSoap {
    private $modeleUtilisateur;
    private $modeleJeton;

    public function __construct() {
        $this->modeleUtilisateur = new ModeleUtilisateur();
        $this->modeleJeton = new ModeleJeton();
    }

    public function authentifierUtilisateur($pseudo, $motDePasse) {
        try {
            $utilisateur = $this->modeleUtilisateur->verifierConnexion($pseudo, $motDePasse);
            if (!$utilisateur) {
                throw new Exception("Identifiants invalides");
            }

            $jeton = $this->modeleJeton->obtenirJetonValideParUtilisateur($utilisateur['id']);
            if ($jeton) {
                return ['succes' => true, 'jeton' => $jeton];
            } else {
                return ['succes' => false, 'message' => 'Aucun jeton valide trouvé. Veuillez générer un nouveau jeton.'];
            }
        } catch (Exception $e) {
            return ['succes' => false, 'message' => $e->getMessage()];
        }
    }

    public function listerUtilisateurs($jeton) {
        try {
            if (!$this->modeleJeton->validerJeton($jeton)) {
                throw new SoapFault('Server', 'Jeton invalide ou expiré');
            }
            $utilisateur = $this->modeleJeton->obtenirUtilisateurParJeton($jeton);
            if (!in_array('admin', $this->modeleUtilisateur->obtenirRolesUtilisateur($utilisateur['id']))) {
                throw new SoapFault('Server', 'Non autorisé');
            }
            $utilisateurs = $this->modeleUtilisateur->obtenirTousUtilisateurs();
            return ['utilisateurs' => $utilisateurs];
        } catch (Exception $e) {
            throw new SoapFault('Server', 'Erreur lors de la liste des utilisateurs : ' . $e->getMessage());
        }
    }

    public function ajouterUtilisateur($jeton, $pseudo, $email, $motDePasse) {
        try {
            if (!$this->modeleJeton->validerJeton($jeton)) {
                throw new SoapFault('Server', 'Jeton invalide ou expiré');
            }
            $utilisateur = $this->modeleJeton->obtenirUtilisateurParJeton($jeton);
            if (!in_array('admin', $this->modeleUtilisateur->obtenirRolesUtilisateur($utilisateur['id']))) {
                throw new SoapFault('Server', 'Non autorisé');
            }
            $motDePasseHache = password_hash($motDePasse, PASSWORD_BCRYPT);
            $utilisateurId = $this->modeleUtilisateur->creerUtilisateur($pseudo, $email, $motDePasseHache);
            $this->modeleUtilisateur->assignerRole($utilisateurId, 'visiteur');
            return ['succes' => true, 'utilisateurId' => $utilisateurId];
        } catch (Exception $e) {
            throw new SoapFault('Server', 'Erreur lors de l\'ajout de l\'utilisateur : ' . $e->getMessage());
        }
    }

    public function modifierUtilisateur($jeton, $utilisateurId, $pseudo, $email) {
        try {
            if (!$this->modeleJeton->validerJeton($jeton)) {
                throw new SoapFault('Server', 'Jeton invalide ou expiré');
            }
            $utilisateur = $this->modeleJeton->obtenirUtilisateurParJeton($jeton);
            if (!in_array('admin', $this->modeleUtilisateur->obtenirRolesUtilisateur($utilisateur['id']))) {
                throw new SoapFault('Server', 'Non autorisé');
            }
            if (!$this->modeleUtilisateur->obtenirUtilisateurParId($utilisateurId)) {
                throw new SoapFault('Server', 'Utilisateur non trouvé');
            }
            $this->modeleUtilisateur->modifierUtilisateur($utilisateurId, $pseudo, $email);
            return ['succes' => true];
        } catch (Exception $e) {
            throw new SoapFault('Server', 'Erreur lors de la modification de l\'utilisateur : ' . $e->getMessage());
        }
    }

    public function supprimerUtilisateur($jeton, $utilisateurId) {
        try {
            if (!$this->modeleJeton->validerJeton($jeton)) {
                throw new SoapFault('Server', 'Jeton invalide ou expiré');
            }
            $utilisateur = $this->modeleJeton->obtenirUtilisateurParJeton($jeton);
            if (!in_array('admin', $this->modeleUtilisateur->obtenirRolesUtilisateur($utilisateur['id']))) {
                throw new SoapFault('Server', 'Non autorisé');
            }
            if (!$this->modeleUtilisateur->obtenirUtilisateurParId($utilisateurId)) {
                throw new SoapFault('Server', 'Utilisateur non trouvé');
            }
            $this->modeleUtilisateur->supprimerUtilisateur($utilisateurId);
            return ['succes' => true];
        } catch (Exception $e) {
            throw new SoapFault('Server', 'Erreur lors de la suppression de l\'utilisateur : ' . $e->getMessage());
        }
    }
}
?>