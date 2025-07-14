<?php
require_once '../config/BaseDeDonnees.php';

class ModeleReaction {
    private $db;

    public function __construct() {
        $this->db = BaseDeDonnees::obtenirInstance()->obtenirConnexion();
    }

    public function ajouterReaction($donnees) {
        try {
            $query = "INSERT INTO Reaction (utilisateurId, articleId, commentaireId, type) 
                      VALUES (:utilisateurId, :articleId, :commentaireId, :type)";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':utilisateurId', $donnees['utilisateurId'], PDO::PARAM_INT);
            
            if ($donnees['articleId'] === null) {
                $stmt->bindParam(':articleId', $donnees['articleId'], PDO::PARAM_NULL);
            } else {
                $stmt->bindParam(':articleId', $donnees['articleId'], PDO::PARAM_INT);
            }
            
            if ($donnees['commentaireId'] === null) {
                $stmt->bindParam(':commentaireId', $donnees['commentaireId'], PDO::PARAM_NULL);
            } else {
                $stmt->bindParam(':commentaireId', $donnees['commentaireId'], PDO::PARAM_INT);
            }
            
            $stmt->bindParam(':type', $donnees['type'], PDO::PARAM_STR);
            $stmt->execute();
            return $this->db->lastInsertId();
        } catch (PDOException $e) {
            throw new Exception("Erreur lors de l'ajout de la réaction : " . $e->getMessage());
        }
    }

    public function supprimerReaction($reactionId) {
        try {
            $query = "DELETE FROM Reaction WHERE id = :reactionId";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':reactionId', $reactionId, PDO::PARAM_INT);
            return $stmt->execute();
        } catch (PDOException $e) {
            throw new Exception("Erreur lors de la suppression de la réaction : " . $e->getMessage());
        }
    }

    public function modifierReaction($reactionId, $nouveauType) {
        try {
            $query = "UPDATE Reaction SET type = :type WHERE id = :reactionId";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':type', $nouveauType, PDO::PARAM_STR);
            $stmt->bindParam(':reactionId', $reactionId, PDO::PARAM_INT);
            return $stmt->execute();
        } catch (PDOException $e) {
            throw new Exception("Erreur lors de la modification de la réaction : " . $e->getMessage());
        }
    }

    public function obtenirReactionsParArticle($articleId) {
        try {
            $query = "SELECT type, COUNT(*) as nombre 
                      FROM Reaction 
                      WHERE articleId = :articleId 
                      GROUP BY type";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':articleId', $articleId, PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            throw new Exception("Erreur lors de la récupération des réactions : " . $e->getMessage());
        }
    }

    public function obtenirReactionsParCommentaire($commentaireId) {
        try {
            $query = "SELECT type, COUNT(*) as nombre 
                      FROM Reaction 
                      WHERE commentaireId = :commentaireId 
                      GROUP BY type";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':commentaireId', $commentaireId, PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            throw new Exception("Erreur lors de la récupération des réactions : " . $e->getMessage());
        }
    }

    /**
     * Obtenir la réaction d'un utilisateur pour un article ou commentaire spécifique
     */
    public function obtenirReactionUtilisateur($utilisateurId, $articleId = null, $commentaireId = null) {
        try {
            $query = "SELECT * FROM Reaction 
                      WHERE utilisateurId = :utilisateurId";
            
            if ($articleId) {
                $query .= " AND articleId = :articleId AND commentaireId IS NULL";
            } elseif ($commentaireId) {
                $query .= " AND commentaireId = :commentaireId AND articleId IS NULL";
            } else {
                throw new Exception("Article ID ou Commentaire ID requis");
            }
            
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':utilisateurId', $utilisateurId, PDO::PARAM_INT);
            
            if ($articleId) {
                $stmt->bindParam(':articleId', $articleId, PDO::PARAM_INT);
            } elseif ($commentaireId) {
                $stmt->bindParam(':commentaireId', $commentaireId, PDO::PARAM_INT);
            }
            
            $stmt->execute();
            return $stmt->fetch();
        } catch (PDOException $e) {
            throw new Exception("Erreur lors de la récupération de la réaction utilisateur : " . $e->getMessage());
        }
    }

    /**
     * Vérifier si un utilisateur est propriétaire d'une réaction
     */
    public function verifierProprietaire($reactionId, $utilisateurId) {
        try {
            $query = "SELECT utilisateurId FROM Reaction WHERE id = :reactionId";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':reactionId', $reactionId, PDO::PARAM_INT);
            $stmt->execute();
            
            $reaction = $stmt->fetch();
            if (!$reaction) {
                throw new Exception("Réaction introuvable");
            }
            
            return $reaction['utilisateurId'] == $utilisateurId;
        } catch (PDOException $e) {
            throw new Exception("Erreur lors de la vérification de propriété : " . $e->getMessage());
        }
    }
}
?>