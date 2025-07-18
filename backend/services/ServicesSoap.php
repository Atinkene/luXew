<?php
require_once '../modeles/ModeleUtilisateur.php';
require_once '../modeles/ModeleJeton.php';
require_once 'ReponsesSoap.php';

class ServicesSoap {
    private $modeleUtilisateur;
    private $modeleJeton;

    public function __construct() {
        $this->modeleUtilisateur = new ModeleUtilisateur();
        $this->modeleJeton = new ModeleJeton();
    }

    private function verifierAdmin($jeton) {
        if (!$this->modeleJeton->validerJeton($jeton)) {
            throw new SoapFault('Server', 'Jeton invalide ou expiré');
        }
        $utilisateur = $this->modeleJeton->obtenirUtilisateurParJeton($jeton);
        $roles = $this->modeleUtilisateur->obtenirRolesUtilisateur($utilisateur['id']);
        if (!is_array($roles) || !in_array('admin', $roles)) {
            throw new SoapFault('Server', 'Non autorisé');
        }
        return $utilisateur;
    }

    public function authentifierUtilisateur($params) {
        $reponse = new AuthResponse();

        try {
            $pseudo = $params->pseudo ?? '';
            $motDePasse = $params->motDePasse ?? '';

            $utilisateur = $this->modeleUtilisateur->verifierConnexion($pseudo, $motDePasse);
            if (!$utilisateur) {
                $reponse->succes = false;
                $reponse->message = 'Identifiants invalides';
                return $reponse;
            }

            $jeton = $this->modeleJeton->obtenirJetonValideParUtilisateur($utilisateur['id']);
            if ($jeton) {
                $reponse->succes = true;
                $reponse->jeton = $jeton;
            } else {
                $nouveauJeton = $this->modeleJeton->genererJeton($utilisateur['id']);
                $reponse->succes = true;
                $reponse->jeton = $nouveauJeton;
            }

        } catch (Exception $e) {
            $reponse->succes = false;
            $reponse->message = $e->getMessage();
        }

        return $reponse;
    }

    public function listerRoles($params) {
        try {
            $jeton = $params->jeton ?? '';
            $this->verifierAdmin($jeton);

            $rolesDisponibles = $this->modeleUtilisateur->obtenirRoles();
            $reponse = new RolesListResponse();
            $reponse->roles = new RolesArray();
            $reponse->roles->item = [];
            
            foreach ($rolesDisponibles as $role) {
                $reponse->roles->item[] = $role;
            }
            return $reponse;
        } catch (Exception $e) {
            throw new SoapFault('Server', 'Erreur lors de la récupération des rôles : ' . $e->getMessage());
        }
    }

    public function listerUtilisateurs($params) {
        try {
            $jeton = $params->jeton ?? '';
            $this->verifierAdmin($jeton);

            $utilisateursBruts = $this->modeleUtilisateur->obtenirTousUtilisateurs();
            if (!is_array($utilisateursBruts)) {
                throw new Exception('Aucun utilisateur trouvé ou erreur de base de données');
            }

            $reponse = new UtilisateursListResponse();
            $reponse->utilisateurs = new UtilisateursArray();
            $reponse->utilisateurs->item = [];

            foreach ($utilisateursBruts as $u) {
                $utilisateurObj = new Utilisateur();
                $utilisateurObj->id = $u['id'];
                $utilisateurObj->pseudo = $u['pseudo'];
                $utilisateurObj->email = $u['email'];
                
                $roles = $this->modeleUtilisateur->obtenirRolesUtilisateur($u['id']);
                $utilisateurObj->roles = new RolesArray();
                $utilisateurObj->roles->item = [];
                
                if (is_array($roles)) {
                    foreach ($roles as $role) {
                        $utilisateurObj->roles->item[] = $role;
                    }
                }
                
                $reponse->utilisateurs->item[] = $utilisateurObj;
            }

            return $reponse;

        } catch (Exception $e) {
            // Au lieu de retourner une réponse vide, lever une exception
            throw new SoapFault('Server', 'Erreur lors de la récupération des utilisateurs : ' . $e->getMessage());
        }
    }

    public function ajouterUtilisateur($params) {
        $reponse = new StandardResponse();

        try {
            $jeton = $params->jeton ?? '';
            $pseudo = $params->pseudo ?? '';
            $email = $params->email ?? '';
            $motDePasse = $params->motDePasse ?? '';
            $role = $params->role ?? 'visiteur';

            $this->verifierAdmin($jeton);

            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                throw new Exception('Email invalide');
            }
            if (empty($pseudo) || strlen($pseudo) < 3) {
                throw new Exception('Pseudo trop court');
            }
            if (strlen($motDePasse) < 8) {
                throw new Exception('Mot de passe trop court (minimum 8 caractères)');
            }

            $rolesDisponibles = $this->modeleUtilisateur->obtenirRoles();
            if (!in_array($role, $rolesDisponibles)) {
                throw new Exception('Rôle invalide');
            }

            $motDePasseHache = password_hash($motDePasse, PASSWORD_BCRYPT);
            $utilisateurId = $this->modeleUtilisateur->creerUtilisateur($pseudo, $email, $motDePasseHache);
            $this->modeleUtilisateur->assignerRole($utilisateurId, $role);

            $reponse->succes = true;
            $reponse->utilisateurId = $utilisateurId;
        } catch (Exception $e) {
            $reponse->succes = false;
            $reponse->message = $e->getMessage();
        }

        return $reponse;
    }

    public function modifierUtilisateur($params) {
        $reponse = new StandardResponse();

        try {
            $jeton = $params->jeton ?? '';
            $utilisateurId = $params->id ?? null;
            $pseudo = $params->pseudo ?? '';
            $email = $params->email ?? '';
            $role = $params->role ?? '';

            $this->verifierAdmin($jeton);

            if (!$this->modeleUtilisateur->obtenirUtilisateurParId($utilisateurId)) {
                throw new Exception('Utilisateur non trouvé');
            }

            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                throw new Exception('Email invalide');
            }
            if (empty($pseudo) || strlen($pseudo) < 3) {
                throw new Exception('Pseudo trop court');
            }

            $this->modeleUtilisateur->modifierUtilisateur($utilisateurId, $pseudo, $email);

            if (!empty($role)) {
                $rolesDisponibles = $this->modeleUtilisateur->obtenirRoles();
                if (!in_array($role, $rolesDisponibles)) {
                    throw new Exception('Rôle invalide');
                }
                $this->modeleUtilisateur->modifierRoleUtilisateur($utilisateurId, $role);
            }

            $reponse->succes = true;
        } catch (Exception $e) {
            $reponse->succes = false;
            $reponse->message = $e->getMessage();
        }

        return $reponse;
    }

    public function supprimerUtilisateur($params) {
        $reponse = new StandardResponse();

        try {
            $jeton = $params->jeton ?? '';
            $utilisateurId = $params->id ?? null;

            $this->verifierAdmin($jeton);

            if (!$this->modeleUtilisateur->obtenirUtilisateurParId($utilisateurId)) {
                throw new Exception('Utilisateur non trouvé');
            }

            $this->modeleUtilisateur->supprimerUtilisateur($utilisateurId);
            $reponse->succes = true;
        } catch (Exception $e) {
            $reponse->succes = false;
            $reponse->message = $e->getMessage();
        }

        return $reponse;
    }
}