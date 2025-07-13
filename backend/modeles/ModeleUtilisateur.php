<?php
require_once '../config/BaseDeDonnees.php';

class ModeleUtilisateur {
    public $db;

    public function __construct() {
        $this->db = BaseDeDonnees::obtenirInstance()->obtenirConnexion();
    }

    public function obtenirUtilisateurParEmail($email) {
        try {
            $query = "SELECT * FROM Utilisateur WHERE email = :email";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':email', $email, PDO::PARAM_STR);
            $stmt->execute();
            return $stmt->fetch();
        } catch (PDOException $e) {
            throw new Exception("Erreur lors de la récupération de l'utilisateur : " . $e->getMessage());
        }
    }

    public function obtenirTousUtilisateurs() {
        try {
            $query = "SELECT id, pseudo, email FROM Utilisateur";
            $stmt = $this->db->prepare($query);
            $stmt->execute();
            return $stmt->fetchAll();
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
            return array_column($stmt->fetchAll(), 'nom');
        } catch (PDOException $e) {
            throw new Exception("Erreur lors de la récupération des rôles : " . $e->getMessage());
        }
    }

    public function creerUtilisateur($donnees) {
        try {
            $query = "INSERT INTO Utilisateur (pseudo, email, motDePasse) 
                      VALUES (:pseudo, :email, :motDePasse)";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':pseudo', $donnees['pseudo'], PDO::PARAM_STR);
            $stmt->bindParam(':email', $donnees['email'], PDO::PARAM_STR);
            $stmt->bindParam(':motDePasse', $donnees['motDePasse'], PDO::PARAM_STR);
            $stmt->execute();
            $utilisateurId = $this->db->lastInsertId();
            $this->ajouterRoleUtilisateur($utilisateurId, 'visiteur');
            return $utilisateurId;
        } catch (PDOException $e) {
            throw new Exception("Erreur lors de la création de l'utilisateur : " . $e->getMessage());
        }
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

    public function definirJetonReinitialisation($email, $jeton) {
        try {
            $utilisateur = $this->obtenirUtilisateurParEmail($email);
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
}
?>