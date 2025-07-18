<?php
require_once '../config/BaseDeDonnees.php';

class ModeleJeton {
    private $connexion;

    public function __construct() {
        try {
            $this->connexion = BaseDeDonnees::obtenirInstance()->obtenirConnexion();
        } catch (Exception $e) {
            throw new Exception("Erreur de connexion à la base de données : " . $e->getMessage());
        }
    }

    public function creerJeton($utilisateurId, $jeton, $dureeValidite = 1) {
        try {
            $requete = $this->connexion->prepare(
                "INSERT INTO Jeton (utilisateurId, jeton, dateCreation, dateExpiration) 
                 VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL ? DAY))"
            );
            $requete->execute([$utilisateurId, $jeton, $dureeValidite]);
            return $this->connexion->lastInsertId();
        } catch (PDOException $e) {
            if ($e->getCode() == 23000) {
                throw new Exception("Erreur : utilisateur non trouvé ou jeton déjà existant");
            }
            throw new Exception("Erreur lors de la création du jeton : " . $e->getMessage());
        }
    }

    public function validerJeton($jeton) {
        try {
            $requete = $this->connexion->prepare("SELECT * FROM Jeton WHERE jeton = ? AND dateExpiration > NOW()");
            $requete->execute([$jeton]);
            return $requete->fetch(PDO::FETCH_ASSOC) !== false;
        } catch (PDOException $e) {
            throw new Exception("Erreur lors de la validation du jeton : " . $e->getMessage());
        }
    }

    public function obtenirUtilisateurParJeton($jeton) {
        try {
            $requete = $this->connexion->prepare("SELECT utilisateurId FROM Jeton WHERE jeton = ? AND dateExpiration > NOW()");
            $requete->execute([$jeton]);
            $result = $requete->fetch(PDO::FETCH_ASSOC);
            return $result ? ['id' => $result['utilisateurId']] : null;
        } catch (PDOException $e) {
            throw new Exception("Erreur lors de la récupération de l'utilisateur par jeton : " . $e->getMessage());
        }
    }

    public function supprimerJeton($jeton) {
        try {
            $requete = $this->connexion->prepare("DELETE FROM Jeton WHERE jeton = ?");
            $requete->execute([$jeton]);
            if ($requete->rowCount() === 0) {
                throw new Exception("Aucun jeton supprimé: jeton non trouvé");
            }
            return true;
        } catch (PDOException $e) {
            throw new Exception("Erreur lors de la suppression du jeton: " . $e->getMessage());
        }
    }

    public function obtenirTousJetons() {
        try {
            $requete = $this->connexion->prepare("SELECT j.jeton, j.utilisateurId, u.pseudo, j.dateCreation, j.dateExpiration FROM Jeton j JOIN Utilisateur u ON j.utilisateurId = u.id");
            $requete->execute();
            return $requete->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw new Exception("Erreur lors de la récupération des jetons : " . $e->getMessage());
        }
    }

    public function obtenirJetonValideParUtilisateur($utilisateurId) {
        try {
            $requete = $this->connexion->prepare("SELECT jeton FROM Jeton WHERE utilisateurId = ? AND dateExpiration > NOW() LIMIT 1");
            $requete->execute([$utilisateurId]);
            $result = $requete->fetch(PDO::FETCH_ASSOC);
            return $result ? $result['jeton'] : null;
        } catch (PDOException $e) {
            throw new Exception("Erreur lors de la récupération du jeton valide : " . $e->getMessage());
        }
    }
}
?>
