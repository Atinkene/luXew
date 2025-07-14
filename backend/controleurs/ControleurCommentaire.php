<?php
require_once '../modeles/ModeleCommentaire.php';
require_once '../modeles/ModeleReaction.php';

class ControleurCommentaire {
    private $modeleCommentaire;
    private $modeleReaction;

    public function __construct() {
        $this->modeleCommentaire = new ModeleCommentaire();
        $this->modeleReaction = new ModeleReaction();
    }

    public function obtenirCommentaires($articleId) {
        try {
            if (!filter_var($articleId, FILTER_VALIDATE_INT)) {
                throw new Exception('ID d\'article invalide');
            }
            $commentaires = $this->modeleCommentaire->obtenirCommentairesParArticle($articleId);
            foreach ($commentaires as &$commentaire) {
                $commentaire['reactions'] = $this->modeleReaction->obtenirReactionsParCommentaire($commentaire['id']);
            }
            $this->repondreJson(['commentaires' => $commentaires]);
        } catch (Exception $e) {
            $this->repondreJson(['erreur' => $e->getMessage()], 400);
        }
    }

    public function ajouterCommentaire() {
        try {
            if (!isset($_SERVER['utilisateurId'])) {
                throw new Exception('Non autorisé');
            }
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                throw new Exception('Méthode non autorisée');
            }
            $contenu = filter_input(INPUT_POST, 'contenu', FILTER_SANITIZE_SPECIAL_CHARS);
            $articleId = filter_input(INPUT_POST, 'articleId', FILTER_VALIDATE_INT);
            $parentId = filter_input(INPUT_POST, 'parentId', FILTER_VALIDATE_INT, FILTER_NULL_ON_FAILURE) ?: null;

            if (empty($contenu) || !$articleId) {
                throw new Exception('Contenu ou ID d\'article manquant');
            }

            $donnees = [
                'contenu' => $contenu,
                'utilisateurId' => $_SERVER['utilisateurId'],
                'articleId' => $articleId,
                'parentId' => $parentId
            ];

            $commentaireId = $this->modeleCommentaire->ajouterCommentaire($donnees);
            $this->repondreJson(['succes' => true, 'commentaireId' => $commentaireId]);
        } catch (Exception $e) {
            $this->repondreJson(['erreur' => $e->getMessage()], 400);
        }
    }

    public function modifierCommentaire($commentaireId) {
        try {
            if (!isset($_SERVER['utilisateurId'])) {
                throw new Exception('Non autorisé');
            }
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                throw new Exception('Méthode non autorisée');
            }
            
            if (!$this->peutModifierCommentaire($commentaireId, $_SERVER['utilisateurId'])) {
                throw new Exception('Vous ne pouvez modifier que vos propres commentaires');
            }
            
            $contenu = filter_input(INPUT_POST, 'contenu', FILTER_SANITIZE_SPECIAL_CHARS);
            if (empty($contenu)) {
                throw new Exception('Contenu manquant');
            }
            
            $this->modeleCommentaire->modifierCommentaire($commentaireId, ['contenu' => $contenu]);
            $this->repondreJson(['succes' => true]);
        } catch (Exception $e) {
            $this->repondreJson(['erreur' => $e->getMessage()], 400);
        }
    }

    public function supprimerCommentaire($commentaireId) {
        try {
            if (!isset($_SERVER['utilisateurId'])) {
                throw new Exception('Non autorisé');
            }
            if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
                throw new Exception('Méthode non autorisée');
            }
            
            if (!$this->peutSupprimerCommentaire($commentaireId, $_SERVER['utilisateurId'])) {
                throw new Exception('Vous ne pouvez supprimer que vos propres commentaires');
            }
            
            $this->modeleCommentaire->supprimerCommentaire($commentaireId);
            $this->repondreJson(['succes' => true]);
        } catch (Exception $e) {
            $this->repondreJson(['erreur' => $e->getMessage()], 400);
        }
    }

    private function peutModifierCommentaire($commentaireId, $utilisateurId) {
        return $this->modeleCommentaire->verifierProprietaire($commentaireId, $utilisateurId);
    }

    private function peutSupprimerCommentaire($commentaireId, $utilisateurId) {
        return $this->modeleCommentaire->verifierProprietaire($commentaireId, $utilisateurId) || 
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