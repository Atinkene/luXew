<?php
require_once '../modeles/ModeleCategorie.php';
require_once '../vendor/autoload.php';
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class ControleurCategorie {
    private $modeleCategorie;
    private $jwtSecret;

    public function __construct() {
        $this->modeleCategorie = new ModeleCategorie();
        $this->jwtSecret = $_ENV['JWT_SECRET'];
    }

    public function listerCategories() {
        try {
            // $jwt = $this->validerJWT();
            $categories = $this->modeleCategorie->obtenirToutesCategories();
            $this->repondreJson(['succes' => true, 'categories' => $categories]);
        } catch (Exception $e) {
            error_log("Erreur dans listerCategories: " . $e->getMessage());
            $this->repondreJson(['erreur' => $e->getMessage()], 400);
        }
    }

    public function obtenirArticlesParCategorie($categorieId) {
        try {
            // $jwt = $this->validerJWT();
            if (!filter_var($categorieId, FILTER_VALIDATE_INT)) {
                throw new Exception('ID de catégorie invalide');
            }
            $articles = $this->modeleCategorie->obtenirArticlesParCategorie($categorieId);
            $this->repondreJson(['succes' => true, 'articles' => $articles]);
        } catch (Exception $e) {
            error_log("Erreur dans obtenirArticlesParCategorie: " . $e->getMessage());
            $this->repondreJson(['erreur' => $e->getMessage()], 400);
        }
    }

    public function creerCategorie() {
        try {
            $jwt = $this->validerJWT();
            if (!$this->aPermission($jwt)) {
                throw new Exception('Non autorisé: seuls les administrateurs ou éditeurs peuvent créer des catégories');
            }
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                throw new Exception('Méthode non autorisée');
            }

            $input = file_get_contents('php://input');
            $data = json_decode($input, true);

            if ($data === null || !isset($data['libelle']) || empty(trim($data['libelle']))) {
                throw new Exception('Libellé manquant ou vide');
            }

            $libelle = filter_var(trim($data['libelle']), FILTER_SANITIZE_SPECIAL_CHARS);
            if (strlen($libelle) < 2) {
                throw new Exception('Le libellé doit contenir au moins 2 caractères');
            }

            if ($this->modeleCategorie->libelleExiste($libelle)) {
                throw new Exception('Libellé déjà utilisé');
            }

            $categorieId = $this->modeleCategorie->creerCategorie(['libelle' => $libelle]);
            error_log("Catégorie créée: ID=$categorieId, libelle=$libelle");
            $this->repondreJson(['succes' => true, 'categorieId' => $categorieId]);
        } catch (Exception $e) {
            error_log("Erreur dans creerCategorie: " . $e->getMessage());
            $this->repondreJson(['erreur' => $e->getMessage()], 400);
        }
    }

    public function modifierCategorie() {
        try {
            $jwt = $this->validerJWT();
            if (!$this->aPermission($jwt)) {
                throw new Exception('Non autorisé: seuls les administrateurs ou éditeurs peuvent modifier des catégories');
            }
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                throw new Exception('Méthode non autorisée');
            }

            $input = file_get_contents('php://input');
            $data = json_decode($input, true);

            if ($data === null || !isset($data['categorieId']) || !isset($data['libelle']) || empty(trim($data['libelle']))) {
                throw new Exception('ID ou libellé manquant ou vide');
            }

            $categorieId = filter_var($data['categorieId'], FILTER_VALIDATE_INT);
            $libelle = filter_var(trim($data['libelle']), FILTER_SANITIZE_SPECIAL_CHARS);

            if (!$categorieId) {
                throw new Exception('ID de catégorie invalide');
            }
            if (strlen($libelle) < 2) {
                throw new Exception('Le libellé doit contenir au moins 2 caractères');
            }

            if (!$this->modeleCategorie->obtenirCategorieParId($categorieId)) {
                throw new Exception('Catégorie non trouvée');
            }

            if ($this->modeleCategorie->libelleExiste($libelle, $categorieId)) {
                throw new Exception('Libellé déjà utilisé par une autre catégorie');
            }

            $this->modeleCategorie->modifierCategorie($categorieId, ['libelle' => $libelle]);
            error_log("Catégorie modifiée: ID=$categorieId, libelle=$libelle");
            $this->repondreJson(['succes' => true]);
        } catch (Exception $e) {
            error_log("Erreur dans modifierCategorie: " . $e->getMessage());
            $this->repondreJson(['erreur' => $e->getMessage()], 400);
        }
    }

    public function supprimerCategorie($categorieId) {
        try {
            $jwt = $this->validerJWT();
            if (!$this->aPermission($jwt)) {
                throw new Exception('Non autorisé: seuls les administrateurs ou éditeurs peuvent supprimer des catégories');
            }
            if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
                throw new Exception('Méthode non autorisée');
            }
            if (!filter_var($categorieId, FILTER_VALIDATE_INT)) {
                throw new Exception('ID de catégorie invalide');
            }
            if (!$this->modeleCategorie->obtenirCategorieParId($categorieId)) {
                throw new Exception('Catégorie non trouvée');
            }
            $this->modeleCategorie->supprimerCategorie($categorieId);
            error_log("Catégorie supprimée: ID=$categorieId");
            $this->repondreJson(['succes' => true]);
        } catch (Exception $e) {
            error_log("Erreur dans supprimerCategorie: " . $e->getMessage());
            $this->repondreJson(['erreur' => $e->getMessage()], 400);
        }
    }

    private function aPermission($jwt) {
        return is_array($jwt->roles) && (in_array('editeur', $jwt->roles) || in_array('admin', $jwt->roles));
    }

    private function validerJWT() {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (!preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            throw new Exception('Jeton JWT manquant');
        }
        $jwt = $matches[1];
        try {
            return JWT::decode($jwt, new Key($this->jwtSecret, 'HS256'));
        } catch (Exception $e) {
            throw new Exception('Jeton JWT invalide: ' . $e->getMessage());
        }
    }

    private function repondreJson($donnees, $codeStatut = 200) {
        http_response_code($codeStatut);
        header('Content-Type: application/json');
        echo json_encode($donnees);
        exit;
    }
}
?>
