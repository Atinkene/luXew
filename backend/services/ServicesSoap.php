<?php
require_once '../modeles/ModeleUtilisateur.php';
require_once '../modeles/ModeleCommentaire.php';
require_once '../modeles/ModeleReaction.php';

class ServicesSoap {
    private $modeleUtilisateur;
    private $modeleCommentaire;
    private $modeleReaction;

    public function __construct() {
        $this->modeleUtilisateur = new ModeleUtilisateur();
        $this->modeleCommentaire = new ModeleCommentaire();
        $this->modeleReaction = new ModeleReaction();
    }

    public function authentifierUtilisateur($email, $motDePasse) {
        try {
            if (empty($email) || empty($motDePasse)) {
                throw new SoapFault('Client', 'Email ou mot de passe manquant');
            }
            $utilisateur = $this->modeleUtilisateur->obtenirUtilisateurParEmail($email);
            if (!$utilisateur || !password_verify($motDePasse, $utilisateur['motDePasse'])) {
                throw new SoapFault('Client', 'Identifiants invalides');
            }
            $roles = $this->modeleUtilisateur->obtenirRolesUtilisateur($utilisateur['id']);
            $estAdmin = in_array('admin', $roles);
            $jeton = bin2hex(random_bytes(32));
            $this->modeleUtilisateur->definirJetonReinitialisation($email, $jeton);
            return ['jeton' => $jeton, 'estAdmin' => $estAdmin];
        } catch (Exception $e) {
            throw new SoapFault('Server', 'Erreur d\'authentification : ' . $e->getMessage());
        }
    }

    public function listerUtilisateurs($jeton) {
        try {
            if (!$this->validerJeton($jeton)) {
                throw new SoapFault('Client', 'Jeton invalide');
            }
            $utilisateurs = $this->modeleUtilisateur->obtenirTousUtilisateurs();
            return ['utilisateurs' => $utilisateurs];
        } catch (Exception $e) {
            throw new SoapFault('Server', 'Erreur lors de la récupération des utilisateurs : ' . $e->getMessage());
        }
    }

    public function ajouterUtilisateur($jeton, $pseudo, $email, $motDePasse) {
        try {
            if (!$this->validerJeton($jeton)) {
                throw new SoapFault('Client', 'Jeton invalide');
            }
            if (empty($pseudo) || empty($email) || empty($motDePasse)) {
                throw new SoapFault('Client', 'Champs manquants');
            }
            if ($this->modeleUtilisateur->obtenirUtilisateurParEmail($email)) {
                throw new SoapFault('Client', 'Email déjà utilisé');
            }
            $motDePasseHache = password_hash($motDePasse, PASSWORD_DEFAULT);
            $donnees = [
                'pseudo' => $pseudo,
                'email' => $email,
                'motDePasse' => $motDePasseHache
            ];
            $succes = $this->modeleUtilisateur->creerUtilisateur($donnees);
            return ['succes' => $succes];
        } catch (Exception $e) {
            throw new SoapFault('Server', 'Erreur lors de l\'ajout de l\'utilisateur : ' . $e->getMessage());
        }
    }

    public function listerCommentairesArticle($jeton, $articleId) {
        try {
            if (!$this->validerJeton($jeton)) {
                throw new SoapFault('Client', 'Jeton invalide');
            }
            if (!is_numeric($articleId) || $articleId < 1) {
                throw new SoapFault('Client', 'ID d\'article invalide');
            }
            $commentaires = $this->modeleCommentaire->obtenirCommentairesParArticle($articleId);
            foreach ($commentaires as &$commentaire) {
                $commentaire['reactions'] = $this->modeleReaction->obtenirReactionsParCommentaire($commentaire['id']);
            }
            return ['commentaires' => $commentaires];
        } catch (Exception $e) {
            throw new SoapFault('Server', 'Erreur lors de la récupération des commentaires : ' . $e->getMessage());
        }
    }

    public function ajouterCommentaire($jeton, $contenu, $articleId, $utilisateurId, $parentId = null) {
        try {
            if (!$this->validerJeton($jeton)) {
                throw new SoapFault('Client', 'Jeton invalide');
            }
            if (empty($contenu) || !is_numeric($articleId) || !is_numeric($utilisateurId)) {
                throw new SoapFault('Client', 'Champs manquants ou invalides');
            }
            $donnees = [
                'contenu' => $contenu,
                'utilisateurId' => $utilisateurId,
                'articleId' => $articleId,
                'parentId' => $parentId
            ];
            $commentaireId = $this->modeleCommentaire->ajouterCommentaire($donnees);
            return ['succes' => true, 'commentaireId' => $commentaireId];
        } catch (Exception $e) {
            throw new SoapFault('Server', 'Erreur lors de l\'ajout du commentaire : ' . $e->getMessage());
        }
    }

    public function supprimerCommentaire($jeton, $commentaireId) {
        try {
            if (!$this->validerJeton($jeton)) {
                throw new SoapFault('Client', 'Jeton invalide');
            }
            if (!is_numeric($commentaireId)) {
                throw new SoapFault('Client', 'ID de commentaire invalide');
            }
            $succes = $this->modeleCommentaire->supprimerCommentaire($commentaireId);
            return ['succes' => $succes];
        } catch (Exception $e) {
            throw new SoapFault('Server', 'Erreur lors de la suppression du commentaire : ' . $e->getMessage());
        }
    }

    public function ajouterReaction($jeton, $utilisateurId, $type, $articleId = null, $commentaireId = null) {
        try {
            if (!$this->validerJeton($jeton)) {
                throw new SoapFault('Client', 'Jeton invalide');
            }
            if (!in_array($type, ['aimer', 'nePasAimer']) || !is_numeric($utilisateurId) || (!$articleId && !$commentaireId)) {
                throw new SoapFault('Client', 'Type ou cible invalide');
            }
            $donnees = [
                'utilisateurId' => $utilisateurId,
                'articleId' => $articleId,
                'commentaireId' => $commentaireId,
                'type' => $type
            ];
            $reactionId = $this->modeleReaction->ajouterReaction($donnees);
            return ['succes' => true, 'reactionId' => $reactionId];
        } catch (Exception $e) {
            throw new SoapFault('Server', 'Erreur lors de l\'ajout de la réaction : ' . $e->getMessage());
        }
    }

    public function supprimerReaction($jeton, $reactionId) {
        try {
            if (!$this->validerJeton($jeton)) {
                throw new SoapFault('Client', 'Jeton invalide');
            }
            if (!is_numeric($reactionId)) {
                throw new SoapFault('Client', 'ID de réaction invalide');
            }
            $succes = $this->modeleReaction->supprimerReaction($reactionId);
            return ['succes' => $succes];
        } catch (Exception $e) {
            throw new SoapFault('Server', 'Erreur lors de la suppression de la réaction : ' . $e->getMessage());
        }
    }

    public function obtenirStatistiquesReactions($jeton, $articleId = null, $commentaireId = null) {
        try {
            if (!$this->validerJeton($jeton)) {
                throw new SoapFault('Client', 'Jeton invalide');
            }
            if (!$articleId && !$commentaireId) {
                throw new SoapFault('Client', 'Cible manquante');
            }
            $reactions = $articleId 
                ? $this->modeleReaction->obtenirReactionsParArticle($articleId)
                : $this->modeleReaction->obtenirReactionsParCommentaire($commentaireId);
            return ['reactions' => $reactions];
        } catch (Exception $e) {
            throw new SoapFault('Server', 'Erreur lors de la récupération des réactions : ' . $e->getMessage());
        }
    }

    private function validerJeton($jeton) {
        try {
            $query = "SELECT * FROM Jeton WHERE jeton = :jeton AND expiration > NOW()";
            $stmt = $this->modeleUtilisateur->db->prepare($query);
            $stmt->bindParam(':jeton', $jeton, PDO::PARAM_STR);
            $stmt->execute();
            return $stmt->fetch() !== false;
        } catch (PDOException $e) {
            throw new Exception('Erreur lors de la validation du jeton : ' . $e->getMessage());
        }
    }
}
?>