<?php
require_once '../modeles/ModeleCategorie.php';

class ControleurCategorie {
    private $modeleCategorie;

    public function __construct() {
        $this->modeleCategorie = new ModeleCategorie();
    }

    public function listerCategories() {
        try {
            $format = filter_input(INPUT_GET, 'format', FILTER_SANITIZE_SPECIAL_CHARS) ?: 'json';
            $categories = $this->modeleCategorie->obtenirToutesCategories();

            if ($format === 'xml') {
                header('Content-Type: application/xml');
                $xml = new SimpleXMLElement('<categories/>');
                foreach ($categories as $categorie) {
                    $categorieXml = $xml->addChild('categorie');
                    $categorieXml->addChild('id', $categorie['id']);
                    $categorieXml->addChild('libelle', htmlspecialchars($categorie['libelle']));
                }
                echo $xml->asXML();
            } else {
                $this->repondreJson(['categories' => $categories]);
            }
        } catch (Exception $e) {
            $this->repondreJson(['erreur' => $e->getMessage()], 400);
        }
    }

    public function obtenirArticlesParCategorie($categorieId) {
        try {
            $format = filter_input(INPUT_GET, 'format', FILTER_SANITIZE_SPECIAL_CHARS) ?: 'json';
            if (!filter_var($categorieId, FILTER_VALIDATE_INT)) {
                throw new Exception('ID de catégorie invalide');
            }
            $articles = $this->modeleCategorie->obtenirArticlesParCategorie($categorieId);

            if ($format === 'xml') {
                header('Content-Type: application/xml');
                $xml = new SimpleXMLElement('<articles/>');
                foreach ($articles as $article) {
                    $articleXml = $xml->addChild('article');
                    $articleXml->addChild('id', $article['id']);
                    $articleXml->addChild('titre', htmlspecialchars($article['titre']));
                    $articleXml->addChild('contenu', htmlspecialchars($article['contenu']));
                }
                echo $xml->asXML();
            } else {
                $this->repondreJson(['articles' => $articles]);
            }
        } catch (Exception $e) {
            $this->repondreJson(['erreur' => $e->getMessage()], 400);
        }
    }

    public function creerCategorie() {
        try {
            if (!isset($_SERVER['utilisateurId']) || !$this->aPermission()) {
                throw new Exception('Non autorisé');
            }
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                throw new Exception('Méthode non autorisée');
            }
            $libelle = filter_input(INPUT_POST, 'libelle', FILTER_SANITIZE_SPECIAL_CHARS);
            if (empty($libelle)) {
                throw new Exception('Libellé manquant');
            }
            $categorieId = $this->modeleCategorie->creerCategorie(['libelle' => $libelle]);
            $this->repondreJson(['succes' => true, 'categorieId' => $categorieId]);
        } catch (Exception $e) {
            $this->repondreJson(['erreur' => $e->getMessage()], 400);
        }
    }

    public function modifierCategorie($categorieId) {
        try {
            if (!isset($_SERVER['utilisateurId']) || !$this->aPermission()) {
                throw new Exception('Non autorisé');
            }
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                throw new Exception('Méthode non autorisée');
            }
            $libelle = filter_input(INPUT_POST, 'libelle', FILTER_SANITIZE_SPECIAL_CHARS);
            if (empty($libelle)) {
                throw new Exception('Libellé manquant');
            }
            if (!$this->modeleCategorie->obtenirCategorieParId($categorieId)) {
                throw new Exception('Catégorie non trouvée');
            }
            $this->modeleCategorie->modifierCategorie($categorieId, ['libelle' => $libelle]);
            $this->repondreJson(['succes' => true]);
        } catch (Exception $e) {
            $this->repondreJson(['erreur' => $e->getMessage()], 400);
        }
    }

    public function supprimerCategorie($categorieId) {
        try {
            if (!isset($_SERVER['utilisateurId']) || !$this->aPermission()) {
                throw new Exception('Non autorisé');
            }
            if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
                throw new Exception('Méthode non autorisée');
            }
            if (!$this->modeleCategorie->obtenirCategorieParId($categorieId)) {
                throw new Exception('Catégorie non trouvée');
            }
            $this->modeleCategorie->supprimerCategorie($categorieId);
            $this->repondreJson(['succes' => true]);
        } catch (Exception $e) {
            $this->repondreJson(['erreur' => $e->getMessage()], 400);
        }
    }

    private function aPermission() {
        return isset($_SERVER['roles']) && 
               (in_array('editeur', $_SERVER['roles']) || in_array('admin', $_SERVER['roles']));
    }

    private function repondreJson($donnees, $codeStatut = 200) {
        http_response_code($codeStatut);
        header('Content-Type: application/json');
        echo json_encode($donnees);
        exit;
    }
}
?>