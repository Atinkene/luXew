<?php
require_once '../config/BaseDeDonnees.php';

class ModeleCommentaire {
    private $db;

    public function __construct() {
        $this->db = BaseDeDonnees::obtenirInstance()->obtenirConnexion();
    }

    public function obtenirCommentairesParArticle($articleId) {
        try {
            $query = "SELECT c.*, u.pseudo as auteurPseudo 
                      FROM Commentaire c 
                      LEFT JOIN Utilisateur u ON c.utilisateurId = u.id 
                      WHERE c.articleId = :articleId AND c.parentId IS NULL 
                      ORDER BY c.dateCreation ASC";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':articleId', $articleId, PDO::PARAM_INT);
            $stmt->execute();
            $commentaires = $stmt->fetchAll();
            foreach ($commentaires as &$commentaire) {
                $commentaire['sousCommentaires'] = $this->obtenirSousCommentaires($commentaire['id']);
            }
            return $commentaires;
        } catch (PDOException $e) {
            throw new Exception("Erreur lors de la récupération des commentaires : " . $e->getMessage());
        }
    }

    private function obtenirSousCommentaires($parentId) {
        try {
            $query = "SELECT c.*, u.pseudo as auteurPseudo 
                      FROM Commentaire c 
                      LEFT JOIN Utilisateur u ON c.utilisateurId = u.id 
                      WHERE c.parentId = :parentId 
                      ORDER BY c.dateCreation ASC";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':parentId', $parentId, PDO::PARAM_INT);
            $stmt->execute();
            $sousCommentaires = $stmt->fetchAll();
            foreach ($sousCommentaires as &$sousCommentaire) {
                $sousCommentaire['sousCommentaires'] = $this->obtenirSousCommentaires($sousCommentaire['id']);
            }
            return $sousCommentaires;
        } catch (PDOException $e) {
            throw new Exception("Erreur lors de la récupération des sous-commentaires : " . $e->getMessage());
        }
    }

    public function ajouterCommentaire($donnees) {
        try {
            if (isset($donnees['parentId']) && $donnees['parentId']) {
                $query = "SELECT id FROM Commentaire WHERE id = :parentId AND articleId = :articleId";
                $stmt = $this->db->prepare($query);
                $stmt->bindParam(':parentId', $donnees['parentId'], PDO::PARAM_INT);
                $stmt->bindParam(':articleId', $donnees['articleId'], PDO::PARAM_INT);
                $stmt->execute();
                if (!$stmt->fetch()) {
                    throw new Exception("Commentaire parent invalide ou n'appartient pas à l'article");
                }
            }
            $query = "INSERT INTO Commentaire (contenu, utilisateurId, articleId, parentId) 
                      VALUES (:contenu, :utilisateurId, :articleId, :parentId)";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':contenu', $donnees['contenu'], PDO::PARAM_STR);
            $stmt->bindParam(':utilisateurId', $donnees['utilisateurId'], PDO::PARAM_INT);
            $stmt->bindParam(':articleId', $donnees['articleId'], PDO::PARAM_INT);
            $stmt->bindParam(':parentId', $donnees['parentId'], PDO::PARAM_INT, $donnees['parentId'] ?? null);
            $stmt->execute();
            return $this->db->lastInsertId();
        } catch (PDOException $e) {
            throw new Exception("Erreur lors de l'ajout du commentaire : " . $e->getMessage());
        }
    }

    public function modifierCommentaire($commentaireId, $donnees) {
        try {
            $query = "UPDATE Commentaire SET contenu = :contenu WHERE id = :commentaireId";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':contenu', $donnees['contenu'], PDO::PARAM_STR);
            $stmt->bindParam(':commentaireId', $commentaireId, PDO::PARAM_INT);
            return $stmt->execute();
        } catch (PDOException $e) {
            throw new Exception("Erreur lors de la modification du commentaire : " . $e->getMessage());
        }
    }

    public function supprimerCommentaire($commentaireId) {
        try {
            $query = "DELETE FROM Commentaire WHERE id = :commentaireId";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':commentaireId', $commentaireId, PDO::PARAM_INT);
            return $stmt->execute();
        } catch (PDOException $e) {
            throw new Exception("Erreur lors de la suppression du commentaire : " . $e->getMessage());
        }
    }
}
?>