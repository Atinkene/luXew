<?php
require_once '../config/BaseDeDonnees.php';

class ModeleUtilisateur {
    public $db;

    public function __construct() {
        $this->db = BaseDeDonnees::obtenirInstance()->obtenirConnexion();
    }

    public function obtenirUtilisateurParPseudo($pseudo) {
        try {
            $query = "SELECT * FROM Utilisateur WHERE pseudo = :pseudo";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':pseudo', $pseudo, PDO::PARAM_STR);
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result ?: false; // Return false if no user found
        } catch (PDOException $e) {
            throw new Exception("Erreur lors de la récupération de l'utilisateur : " . $e->getMessage());
        }
    }

    public function obtenirUtilisateurParId($id) {
        try {
            $query = "SELECT * FROM Utilisateur WHERE id = :id";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result ?: false; // Return false if no user found
        } catch (PDOException $e) {
            throw new Exception("Erreur lors de la récupération de l'utilisateur : " . $e->getMessage());
        }
    }

    public function obtenirTousUtilisateurs() {
        try {
            $query = "SELECT id, pseudo, email FROM Utilisateur";
            $stmt = $this->db->prepare($query);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw new Exception("Erreur lors de la récupération des utilisateurs : " . $e->getMessage());
        }
    }

    public function obtenirRolesUtilisateur($utilisateurId) {
        try {
            $query = "SELECT r.nom FROM Role r 
                      JOIN UtilisateurRole ur ON r.id = ur.roleId 
                      WHERE ur.utilisateurId = :utilisateurId";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':utilisateurId', $utilisateurId, PDO::PARAM_INT);
            $stmt->execute();
            return array_column($stmt->fetchAll(PDO::FETCH_ASSOC), 'nom');
        } catch (PDOException $e) {
            throw new Exception("Erreur lors de la récupération des rôles : " . $e->getMessage());
        }
    }

    public function creerUtilisateur($pseudo, $email, $motDePasseHache) {
        try {
            $query = "INSERT INTO Utilisateur (pseudo, email, motDePasse) 
                      VALUES (:pseudo, :email, :motDePasse)";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':pseudo', $pseudo, PDO::PARAM_STR);
            $stmt->bindParam(':email', $email, PDO::PARAM_STR);
            $stmt->bindParam(':motDePasse', $motDePasseHache, PDO::PARAM_STR);
            $stmt->execute();
            return $this->db->lastInsertId();
        } catch (PDOException $e) {
            throw new Exception("Erreur lors de la création de l'utilisateur : " . $e->getMessage());
        }
    }

    public function assignerRole($utilisateurId, $roleNom) {
        return $this->ajouterRoleUtilisateur($utilisateurId, $roleNom);
    }

    public function ajouterRoleUtilisateur($utilisateurId, $roleNom) {
        try {
            $query = "INSERT INTO UtilisateurRole (utilisateurId, roleId) 
                      SELECT :utilisateurId, id FROM Role WHERE nom = :roleNom";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':utilisateurId', $utilisateurId, PDO::PARAM_INT);
            $stmt->bindParam(':roleNom', $roleNom, PDO::PARAM_STR);
            $stmt->execute();
        } catch (PDOException $e) {
            throw new Exception("Erreur lors de l'ajout du rôle : " . $e->getMessage());
        }
    }

    public function modifierUtilisateur($utilisateurId, $pseudo, $email) {
        try {
            $query = "UPDATE Utilisateur SET pseudo = :pseudo, email = :email WHERE id = :id";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':pseudo', $pseudo, PDO::PARAM_STR);
            $stmt->bindParam(':email', $email, PDO::PARAM_STR);
            $stmt->bindParam(':id', $utilisateurId, PDO::PARAM_INT);
            return $stmt->execute();
        } catch (PDOException $e) {
            throw new Exception("Erreur lors de la modification de l'utilisateur : " . $e->getMessage());
        }
    }

    public function supprimerUtilisateur($utilisateurId) {
        try {
            $query = "DELETE FROM UtilisateurRole WHERE utilisateurId = :utilisateurId";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':utilisateurId', $utilisateurId, PDO::PARAM_INT);
            $stmt->execute();

            $query = "DELETE FROM Utilisateur WHERE id = :id";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':id', $utilisateurId, PDO::PARAM_INT);
            return $stmt->execute();
        } catch (PDOException $e) {
            throw new Exception("Erreur lors de la suppression de l'utilisateur : " . $e->getMessage());
        }
    }

    public function definirJetonReinitialisation($pseudo, $jeton) {
        try {
            $utilisateur = $this->obtenirUtilisateurParPseudo($pseudo);
            if (!$utilisateur) {
                throw new Exception("Utilisateur non trouvé");
            }
            $expiration = date('Y-m-d H:i:s', strtotime('+1 hour'));
            $query = "INSERT INTO Jeton (jeton, utilisateurId, expiration) 
                      VALUES (:jeton, :utilisateurId, :expiration)";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':jeton', $jeton, PDO::PARAM_STR);
            $stmt->bindParam(':utilisateurId', $utilisateur['id'], PDO::PARAM_INT);
            $stmt->bindParam(':expiration', $expiration, PDO::PARAM_STR);
            return $stmt->execute();
        } catch (PDOException $e) {
            throw new Exception("Erreur lors de la définition du jeton : " . $e->getMessage());
        }
    }

    public function verifierConnexion($pseudo, $motDePasse) {
        try {
            $utilisateur = $this->obtenirUtilisateurParPseudo($pseudo);
            if (!$utilisateur || !password_verify($motDePasse, $utilisateur['motDePasse'])) {
                throw new Exception("Identifiants invalides");
            }
            return $utilisateur;
        } catch (PDOException $e) {
            throw new Exception("Erreur lors de la vérification de la connexion : " . $e->getMessage());
        }
    }
    
}
?>