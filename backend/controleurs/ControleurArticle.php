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
            $limite = filter_input(INPUT_GET, 'limite', FILTER_VALIDATE_INT) ?: 50;
            $format = filter_input(INPUT_GET, 'format', FILTER_SANITIZE_SPECIAL_CHARS) ?: 'json';

            if ($page < 1 || $limite < 1) {
                throw new Exception('Paramètres de pagination invalides');
            }

            $offset = ($page - 1) * $limite;
            $articles = $this->modeleArticle->obtenirArticlesPagine($offset, $limite);

            foreach ($articles as &$article) {
                $article['categories'] = $this->modeleArticle->obtenirCategoriesArticle($article['id']);
                $article['reactions'] = $this->modeleReaction->obtenirReactionsParArticle($article['id']);
                $article['peutModifier'] = $this->peutModifierArticle($article['id']);
                $article['peutSupprimer'] = $this->peutSupprimerArticle($article['id']);
                $article['medias'] = $this->modeleArticle->obtenirMediasArticle($article['id']);
            }

            $categories = $this->modeleCategorie->obtenirToutesCategories();

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
                    $categoriesXml = $articleXml->addChild('categories');
                    foreach ($article['categories'] as $category) {
                        $categoryXml = $categoriesXml->addChild('category');
                        $categoryXml->addChild('id', $category['id']);
                        $categoryXml->addChild('libelle', htmlspecialchars($category['libelle']));
                    }
                    $reactionsXml = $articleXml->addChild('reactions');
                    foreach ($article['reactions'] as $reaction) {
                        $reactionXml = $reactionsXml->addChild('reaction');
                        $reactionXml->addChild('type', $reaction['type']);
                        $reactionXml->addChild('nombre', $reaction['nombre']);
                    }
                    $mediasXml = $articleXml->addChild('medias');
                    foreach ($article['medias'] as $media) {
                        $mediaXml = $mediasXml->addChild('media');
                        $mediaXml->addChild('id', $media['id']);
                        $mediaXml->addChild('type', $media['type']);
                        $mediaXml->addChild('url', $media['url']);
                        $mediaXml->addChild('description', htmlspecialchars($media['description']));
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

        error_log("POST data: " . json_encode($_POST));
        error_log("FILES data: " . json_encode($_FILES));

        $titre = isset($_POST['titre']) ? trim($_POST['titre']) : '';
        $contenu = isset($_POST['contenu']) ? trim($_POST['contenu']) : '';
        
        // Nettoyer les données après vérification
        $titre = filter_var($titre, FILTER_SANITIZE_SPECIAL_CHARS);
        $contenu = filter_var($contenu, FILTER_SANITIZE_SPECIAL_CHARS);
        
        // Gérer les catégories - peut être un tableau ou une valeur unique
        $categories = [];
        if (isset($_POST['categories']) && is_array($_POST['categories'])) {
            $categories = $_POST['categories'];
        } elseif (isset($_POST['categories'])) {
            $categories = [$_POST['categories']];
        }
        
        // Debug pour voir les données reçues
        error_log("Titre reçu: " . var_export($titre, true));
        error_log("Contenu reçu: " . var_export($contenu, true));
        error_log("Categories reçues: " . var_export($categories, true));

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

        // Traiter les catégories
        foreach ($categories as $categorieId) {
            $categorieId = filter_var($categorieId, FILTER_VALIDATE_INT);
            if (empty($categorieId) || !$this->modeleCategorie->obtenirCategorieParId($categorieId)) {
                throw new Exception('ID de catégorie invalide ou catégorie non trouvée');
            }
            $this->modeleArticle->ajouterCategorieArticle($articleId, $categorieId);
        }

        // Gérer les médias - supporter les deux formats
        if (!empty($_FILES['medias']['name'][0])) {
            // Format tableau (medias[])
            $this->uploaderMedias($_FILES['medias'], $articleId);
        } elseif (!empty($_FILES['media']['name'])) {
            // Format simple (media)
            $this->uploaderMedias($_FILES['media'], $articleId);
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

            error_log("POST data: " . json_encode($_POST));
            error_log("FILES data: " . json_encode($_FILES));

            $titre = isset($_POST['titre']) ? filter_var(trim($_POST['titre']), FILTER_SANITIZE_SPECIAL_CHARS) : '';
            $contenu = isset($_POST['contenu']) ? filter_var(trim($_POST['contenu']), FILTER_SANITIZE_SPECIAL_CHARS) : '';
            $categories = isset($_POST['categories']) && is_array($_POST['categories']) ? $_POST['categories'] : [];

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
                if (empty($categorieId) || !$this->modeleCategorie->obtenirCategorieParId($categorieId)) {
                    throw new Exception('ID de catégorie invalide ou catégorie non trouvée');
                }
                $this->modeleArticle->ajouterCategorieArticle($id, $categorieId);
            }

            if (!empty($_FILES['medias']['name'][0])) {
                $this->modeleArticle->supprimerMediasArticle($id); 
                $this->uploaderMedias($_FILES['medias'], $id);
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

    private function uploaderMedias($fichiers, $articleId) {
        try {
            $fileCount = count($fichiers['name']);
            for ($i = 0; $i < $fileCount; $i++) {
                if ($fichiers['error'][$i] !== UPLOAD_ERR_OK) {
                    error_log("Erreur upload fichier $i: " . $fichiers['error'][$i]);
                    continue;
                }

                $type = $this->determinerTypeMedia($fichiers['type'][$i]);
                if (!in_array($type, ['image', 'audio', 'video'])) {
                    error_log("Type de média non supporté pour fichier $i: " . $fichiers['type'][$i]);
                    continue;
                }

                $resultat = $this->cloudinary->uploadApi()->upload($fichiers['tmp_name'][$i], [
                    'folder' => 'luxew_medias',
                    'public_id' => 'media_' . $articleId . '_' . time() . '_' . $i
                ]);

                $mediaData = [
                    'articleId' => $articleId,
                    'type' => $type,
                    'url' => $resultat['secure_url'],
                    'description' => $fichiers['name'][$i]
                ];

                $this->modeleArticle->ajouterMedia($mediaData);
            }
        } catch (Exception $e) {
            error_log("Erreur dans uploaderMedias: " . $e->getMessage());
            throw new Exception('Échec de l\'upload des médias : ' . $e->getMessage());
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
                error_log("DEBUG utilisateurId: " . $_SERVER['utilisateurId']);
                error_log("DEBUG auteurId de l'article $articleId: " . $article['auteurId']);

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
                error_log("DEBUG utilisateurId: " . $_SERVER['utilisateurId']);
                error_log("DEBUG auteurId de l'article $articleId: " . $article['auteurId']);

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
