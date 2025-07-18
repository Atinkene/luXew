<?php
require_once '../modeles/ModeleReaction.php';

class ControleurReaction {
    private $modeleReaction;

    public function __construct() {
        $this->modeleReaction = new ModeleReaction();
    }

    public function ajouterReaction() {
        try {
            if (!isset($_SERVER['utilisateurId'])) {
                throw new Exception('Non autorisé');
            }
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                throw new Exception('Méthode non autorisée');
            }

            // Read JSON input
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);

            if ($data === null || !isset($data['type'])) {
                throw new Exception('Données invalides');
            }

            $type = strtolower(trim($data['type']));
            if (!in_array($type, ['like', 'unlike'])) {
                throw new Exception('Type invalide');
            }

            $articleId = isset($data['articleId']) ? filter_var($data['articleId'], FILTER_VALIDATE_INT, FILTER_NULL_ON_FAILURE) : null;
            $commentaireId = isset($data['commentaireId']) ? filter_var($data['commentaireId'], FILTER_VALIDATE_INT, FILTER_NULL_ON_FAILURE) : null;

            if (!$articleId && !$commentaireId) {
                throw new Exception('Cible (article ou commentaire) requise');
            }

            $reactionExistante = $this->modeleReaction->obtenirReactionUtilisateur(
                $_SERVER['utilisateurId'],
                $articleId,
                $commentaireId
            );

            if ($reactionExistante) {
                if ($reactionExistante['type'] === $type) {
                    $this->modeleReaction->supprimerReaction($reactionExistante['id']);
                    $this->repondreJson(['succes' => true, 'action' => 'supprimee']);
                } else {
                    $this->modeleReaction->modifierReaction($reactionExistante['id'], $type);
                    $this->repondreJson(['succes' => true, 'action' => 'modifiee']);
                }
            } else {
                $donnees = [
                    'utilisateurId' => $_SERVER['utilisateurId'],
                    'articleId' => $articleId,
                    'commentaireId' => $commentaireId,
                    'type' => $type
                ];
                $reactionId = $this->modeleReaction->ajouterReaction($donnees);
                $this->repondreJson(['succes' => true, 'reactionId' => $reactionId, 'action' => 'ajoutee']);
            }
        } catch (Exception $e) {
            $this->repondreJson(['erreur' => $e->getMessage()], 400);
        }
    }

    public function supprimerReaction($reactionId) {
        try {
            if (!isset($_SERVER['utilisateurId'])) {
                throw new Exception('Non autorisé');
            }
            if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
                throw new Exception('Méthode non autorisée');
            }

            if (!$this->peutSupprimerReaction($reactionId, $_SERVER['utilisateurId'])) {
                throw new Exception('Vous ne pouvez supprimer que vos propres réactions');
            }

            $this->modeleReaction->supprimerReaction($reactionId);
            $this->repondreJson(['succes' => true]);
        } catch (Exception $e) {
            $this->repondreJson(['erreur' => $e->getMessage()], 400);
        }
    }

    public function obtenirStatistiquesReactions($articleId = null, $commentaireId = null) {
        try {
            if ($articleId && !filter_var($articleId, FILTER_VALIDATE_INT)) {
                throw new Exception('ID d\'article invalide');
            }
            if ($commentaireId && !filter_var($commentaireId, FILTER_VALIDATE_INT)) {
                throw new Exception('ID de commentaire invalide');
            }
            if (!$articleId && !$commentaireId) {
                throw new Exception('Cible manquante');
            }

            $reactions = $articleId
                ? $this->modeleReaction->obtenirReactionsParArticle($articleId)
                : $this->modeleReaction->obtenirReactionsParCommentaire($commentaireId);

            $this->repondreJson(['reactions' => $reactions]);
        } catch (Exception $e) {
            $this->repondreJson(['erreur' => $e->getMessage()], 400);
        }
    }

    public function obtenirReactionUtilisateur($articleId = null, $commentaireId = null) {
        try {
            if (!isset($_SERVER['utilisateurId'])) {
                throw new Exception('Non autorisé');
            }

            if ($articleId && !filter_var($articleId, FILTER_VALIDATE_INT)) {
                throw new Exception('ID d\'article invalide');
            }
            if ($commentaireId && !filter_var($commentaireId, FILTER_VALIDATE_INT)) {
                throw new Exception('ID de commentaire invalide');
            }
            if (!$articleId && !$commentaireId) {
                throw new Exception('Cible manquante');
            }

            $reaction = $this->modeleReaction->obtenirReactionUtilisateur(
                $_SERVER['utilisateurId'],
                $articleId,
                $commentaireId
            );

            $this->repondreJson(['reaction' => $reaction]);
        } catch (Exception $e) {
            $this->repondreJson(['erreur' => $e->getMessage()], 400);
        }
    }

    private function peutSupprimerReaction($reactionId, $utilisateurId) {
        return $this->modeleReaction->verifierProprietaire($reactionId, $utilisateurId) ||
               $this->aPermissionAdmin();
    }

    private function aPermissionAdmin() {
        return isset($_SERVER['roles']) &&
               in_array('admin', $_SERVER['roles']);
    }

    private function repondreJson($donnees, $codeStatut = 200) {
        http_response_code($codeStatut);
        header('Content-Type: application/json');
        echo json_encode($donnees);
        exit;
    }
}
?>
