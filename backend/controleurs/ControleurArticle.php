<?php
require_once '../modeles/ModeleArticle.php';
require_once '../modeles/ModeleCategorie.php';
require_once '../modeles/ModeleReaction.php';
require_once '../modeles/ModeleCommentaire.php';
use Cloudinary\Cloudinary;

class ControleurArticle {
    private $modeleArticle;
    private $modeleCategorie;
    private $modeleReaction;
    private $modeleCommentaire;
    private $cloudinary;

    public function __construct() {
        $this->modeleArticle = new ModeleArticle();
        $this->modeleCategorie = new ModeleCategorie();
        $this->modeleReaction = new ModeleReaction();
        $this->modeleCommentaire = new ModeleCommentaire();
        $this->cloudinary = new Cloudinary([
            'cloud' => [
                'cloud_name' => $_ENV['CLOUDINARY_CLOUD_NAME'],
                'api_key' => $_ENV['CLOUDINARY_API_KEY'],
                'api_secret' => $_ENV['CLOUDINARY_API_SECRET']
            ]
        ]);
    }

    public function listerArticles() {
        try {
            $page = filter_input(INPUT_GET, 'page', FILTER_VALIDATE_INT) ?: 1;
            $limite = filter_input(INPUT_GET, 'limite', FILTER_VALIDATE_INT) ?: 10;
            $format = filter_input(INPUT_GET, 'format', FILTER_SANITIZE_SPECIAL_CHARS) ?: 'json';

            if ($page < 1 || $limite < 1) {
                throw new Exception('Paramètres de pagination invalides');
            }

            $offset = ($page - 1) * $limite;
            $articles = $this->modeleArticle->obtenirArticlesPagine($offset, $limite);
            $categories = $this->modeleCategorie->obtenirToutesCategories();

            foreach ($articles as &$article) {
                $article['reactions'] = $this->modeleReaction->obtenirReactionsParArticle($article['id']);
                $article['peutModifier'] = $this->peutModifierArticle($article['id']);
                $article['peutSupprimer'] = $this->peutSupprimerArticle($article['id']);
            }

            if ($format === 'xml') {
                header('Content-Type: application/xml');
                $xml = new SimpleXMLElement('<articles/>');
                foreach ($articles as $article) {
                    $articleXml = $xml->addChild('article');
                    $articleXml->addChild('id', $article['id']);
                    $articleXml->addChild('titre', htmlspecialchars($article['titre']));
                    $articleXml->addChild('contenu', htmlspecialchars($article['contenu']));
                    $articleXml->addChild('dateCreation', $article['dateCreation']);
                    $articleXml->addChild('peutModifier', $article['peutModifier'] ? 'true' : 'false');
                    $articleXml->addChild('peutSupprimer', $article['peutSupprimer'] ? 'true' : 'false');
                    $reactionsXml = $articleXml->addChild('reactions');
                    foreach ($article['reactions'] as $reaction) {
                        $reactionXml = $reactionsXml->addChild('reaction');
                        $reactionXml->addChild('type', $reaction['type']);
                        $reactionXml->addChild('nombre', $reaction['nombre']);
                    }
                }
                echo $xml->asXML();
            } else {
                $this->repondreJson(['succes' => true, 'articles' => $articles, 'categories' => $categories]);
            }
        } catch (Exception $e) {
            error_log("Erreur dans listerArticles: " . $e->getMessage());
            $this->repondreJson(['erreur' => $e->getMessage()], 400);
        }
    }

    public function afficherArticle($id) {
        try {
            $article = $this->modeleArticle->obtenirArticleParId($id);
            if (!is_array($article) || empty($article)) {
                throw new Exception('Article non trouvé');
            }
            $commentaires = $this->modeleCommentaire->obtenirCommentairesParArticle($id);
            foreach ($commentaires as &$commentaire) {
                $commentaire['reactions'] = $this->modeleReaction->obtenirReactionsParCommentaire($commentaire['id']);
            }
            $reactions = $this->modeleReaction->obtenirReactionsParArticle($id);
            
            $article['peutModifier'] = $this->peutModifierArticle($id);
            $article['peutSupprimer'] = $this->peutSupprimerArticle($id);
            
            $this->repondreJson([
                'succes' => true,
                'article' => $article,
                'commentaires' => $commentaires ?: [],
                'reactions' => $reactions
            ]);
        } catch (Exception $e) {
            error_log("Erreur dans afficherArticle: " . $e->getMessage());
            $this->repondreJson(['erreur' => $e->getMessage()], 404);
        }
    }

    public function creerArticle() {
        try {
            if (!isset($_SERVER['utilisateurId']) || !isset($_SERVER['roles']) || !$this->aPermission()) {
                throw new Exception('Non autorisé: vous devez être connecté en tant qu\'éditeur ou administrateur');
            }
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                throw new Exception('Méthode non autorisée');
            }

            $titre = filter_input(INPUT_POST, 'titre', FILTER_SANITIZE_SPECIAL_CHARS);
            $contenu = filter_input(INPUT_POST, 'contenu', FILTER_SANITIZE_SPECIAL_CHARS);
            $categories = filter_input(INPUT_POST, 'categories', FILTER_DEFAULT, FILTER_FORCE_ARRAY) ?? [];

            if (empty($titre) || empty($contenu)) {
                throw new Exception('Champs titre ou contenu manquants');
            }

            $articleData = [
                'titre' => $titre,
                'contenu' => $contenu,
                'auteurId' => $_SERVER['utilisateurId']
            ];

            $articleId = $this->modeleArticle->creerArticle($articleData);
            if (!$articleId) {
                throw new Exception('Échec de la création de l\'article');
            }

            foreach ($categories as $categorieId) {
                $categorieId = filter_var($categorieId, FILTER_VALIDATE_INT);
                if (!$categorieId || !$this->modeleCategorie->obtenirCategorieParId($categorieId)) {
                    throw new Exception('ID de catégorie invalide ou catégorie non trouvée');
                }
                $this->modeleArticle->ajouterCategorieArticle($articleId, $categorieId);
            }

            if (!empty($_FILES['media'])) {
                $this->uploaderMedia($_FILES['media'], $articleId);
            }

            $this->repondreJson(['succes' => true, 'articleId' => $articleId]);
        } catch (Exception $e) {
            error_log("Erreur dans creerArticle: " . $e->getMessage());
            $this->repondreJson(['erreur' => $e->getMessage()], 400);
        }
    }

    public function modifierArticle($id) {
        try {
            if (!isset($_SERVER['utilisateurId']) || !isset($_SERVER['roles']) || !$this->aPermission()) {
                throw new Exception('Non autorisé: vous devez être connecté en tant qu\'éditeur ou administrateur');
            }
            
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                throw new Exception('Méthode non autorisée');
            }

            if (!$this->peutModifierArticle($id)) {
                throw new Exception('Non autorisé: vous ne pouvez modifier que vos propres articles');
            }

            $titre = filter_input(INPUT_POST, 'titre', FILTER_SANITIZE_SPECIAL_CHARS);
            $contenu = filter_input(INPUT_POST, 'contenu', FILTER_SANITIZE_SPECIAL_CHARS);
            $categories = filter_input(INPUT_POST, 'categories', FILTER_DEFAULT, FILTER_FORCE_ARRAY) ?? [];

            if (empty($titre) || empty($contenu)) {
                throw new Exception('Champs titre ou contenu manquants');
            }

            $articleData = [
                'id' => $id,
                'titre' => $titre,
                'contenu' => $contenu
            ];

            $success = $this->modeleArticle->modifierArticle($articleData);
            if (!$success) {
                throw new Exception('Échec de la modification de l\'article');
            }

            $this->modeleArticle->supprimerCategoriesArticle($id);
            foreach ($categories as $categorieId) {
                $categorieId = filter_var($categorieId, FILTER_VALIDATE_INT);
                if (!$categorieId || !$this->modeleCategorie->obtenirCategorieParId($categorieId)) {
                    throw new Exception('ID de catégorie invalide ou catégorie non trouvée');
                }
                $this->modeleArticle->ajouterCategorieArticle($id, $categorieId);
            }

            if (!empty($_FILES['media'])) {
                $this->uploaderMedia($_FILES['media'], $id);
            }

            $this->repondreJson(['succes' => true, 'message' => 'Article modifié avec succès']);
        } catch (Exception $e) {
            error_log("Erreur dans modifierArticle: " . $e->getMessage());
            $this->repondreJson(['erreur' => $e->getMessage()], 400);
        }
    }

    public function supprimerArticle($id) {
        try {
            if (!isset($_SERVER['utilisateurId']) || !isset($_SERVER['roles']) || !$this->aPermission()) {
                throw new Exception('Non autorisé: vous devez être connecté en tant qu\'éditeur ou administrateur');
            }
            
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                throw new Exception('Méthode non autorisée');
            }

            if (!$this->peutSupprimerArticle($id)) {
                throw new Exception('Non autorisé: vous ne pouvez supprimer que vos propres articles');
            }

            $success = $this->modeleArticle->supprimerArticle($id);
            if (!$success) {
                throw new Exception('Échec de la suppression de l\'article');
            }

            $this->repondreJson(['succes' => true, 'message' => 'Article supprimé avec succès']);
        } catch (Exception $e) {
            error_log("Erreur dans supprimerArticle: " . $e->getMessage());
            $this->repondreJson(['erreur' => $e->getMessage()], 400);
        }
    }

    private function uploaderMedia($fichier, $articleId) {
        try {
            if ($fichier['error'] !== UPLOAD_ERR_OK) {
                throw new Exception('Erreur lors de l\'upload du fichier');
            }

            $type = $this->determinerTypeMedia($fichier['type']);
            if (!in_array($type, ['image', 'audio', 'video'])) {
                throw new Exception('Type de média non supporté');
            }

            $resultat = $this->cloudinary->uploadApi()->upload($fichier['tmp_name'], [
                'folder' => 'luxew_medias',
                'public_id' => 'media_' . $articleId . '_' . time()
            ]);

            $mediaData = [
                'articleId' => $articleId,
                'type' => $type,
                'url' => $resultat['secure_url'],
                'description' => $fichier['name']
            ];

            $this->modeleArticle->ajouterMedia($mediaData);
        } catch (Exception $e) {
            error_log("Erreur dans uploaderMedia: " . $e->getMessage());
            throw new Exception('Échec de l\'upload du média : ' . $e->getMessage());
        }
    }

    private function determinerTypeMedia($mimeType) {
        if (str_contains($mimeType, 'image')) return 'image';
        if (str_contains($mimeType, 'audio')) return 'audio';
        if (str_contains($mimeType, 'video')) return 'video';
        return 'image';
    }

    private function aPermission() {
        return isset($_SERVER['roles']) && 
               (in_array('editeur', $_SERVER['roles']) || in_array('admin', $_SERVER['roles']));
    }

    private function estAdmin() {
        return isset($_SERVER['roles']) && in_array('admin', $_SERVER['roles']);
    }

    private function peutModifierArticle($articleId) {
        if ($this->estAdmin()) {
            return true;
        }
        
        if (isset($_SERVER['roles']) && in_array('editeur', $_SERVER['roles'])) {
            $article = $this->modeleArticle->obtenirArticleParId($articleId);
            return $article && $article['auteurId'] == $_SERVER['utilisateurId'];
        }
        
        return false;
    }

    private function peutSupprimerArticle($articleId) {
        if ($this->estAdmin()) {
            return true;
        }
        
        if (isset($_SERVER['roles']) && in_array('editeur', $_SERVER['roles'])) {
            $article = $this->modeleArticle->obtenirArticleParId($articleId);
            return $article && $article['auteurId'] == $_SERVER['utilisateurId'];
        }
        
        return false;
    }

    private function repondreJson($donnees, $codeStatut = 200) {
        http_response_code($codeStatut);
        header('Content-Type: application/json');
        echo json_encode($donnees);
        exit;
    }
}
?>