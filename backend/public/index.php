<?php
require_once '../vendor/autoload.php';
require_once '../controleurs/ControleurArticle.php';
require_once '../controleurs/ControleurCategorie.php';
require_once '../controleurs/ControleurCommentaire.php';
require_once '../controleurs/ControleurAuthentification.php';
require_once '../controleurs/ControleurReaction.php';
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable(__DIR__ . '/..'); 
$dotenv->load();

// Récupérer la clé JWT
$jwtSecret = $_ENV['JWT_SECRET'];

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

$requete = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$methode = $_SERVER['REQUEST_METHOD'];

function validerJWT($jwtSecret) {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        throw new Exception('Jeton JWT manquant');
    }

    $jwt = $matches[1];
    try {
        return JWT::decode($jwt, new Key($jwtSecret, 'HS256'));
    } catch (Exception $e) {
        throw new Exception('Jeton JWT invalide: ' . $e->getMessage());
    }
}

try {
    $controleurArticle = new ControleurArticle();
    $controleurCategorie = new ControleurCategorie();
    $controleurCommentaire = new ControleurCommentaire();
    $controleurAuthentification = new ControleurAuthentification();
    $controleurReaction = new ControleurReaction();

    // Routes publiques (pas de JWT requis)
    if (preg_match('#^/luXew/backend/public/connexion/?$#', $requete) && $methode === 'POST') {
        $controleurAuthentification->connecter();
    } elseif (preg_match('#^/luXew/backend/public/inscription/?$#', $requete) && $methode === 'POST') {
        $controleurAuthentification->inscrire();
    } elseif (preg_match('#^/luXew/backend/public/articles/?$#', $requete) && $methode === 'GET') {
        $controleurArticle->listerArticles();
    } elseif (preg_match('#^/luXew/backend/public/articles/(\d+)/?$#', $requete, $matches) && $methode === 'GET') {
        $controleurArticle->afficherArticle($matches[1]);
    } elseif (preg_match('#^/luXew/backend/public/categories/?$#', $requete) && $methode === 'GET') {
        $controleurCategorie->listerCategories();
    } elseif (preg_match('#^/luXew/backend/public/categories/(\d+)/articles/?$#', $requete, $matches) && $methode === 'GET') {
        $controleurCategorie->obtenirArticlesParCategorie($matches[1]);
    } elseif (preg_match('#^/luXew/backend/public/commentaires/(\d+)/?$#', $requete, $matches) && $methode === 'GET') {
        $controleurCommentaire->obtenirCommentaires($matches[1]);
    } elseif (preg_match('#^/luXew/backend/public/reactions/article/(\d+)/?$#', $requete, $matches) && $methode === 'GET') {
        $controleurReaction->obtenirStatistiquesReactions($matches[1], null);
    } elseif (preg_match('#^/luXew/backend/public/reactions/commentaire/(\d+)/?$#', $requete, $matches) && $methode === 'GET') {
        $controleurReaction->obtenirStatistiquesReactions(null, $matches[1]);
    } else {
        // Routes protégées (JWT requis)
        $jwt = validerJWT($jwtSecret);
        $_SERVER['utilisateurId'] = $jwt->utilisateurId;
        $_SERVER['roles'] = $jwt->roles;

        switch (true) {
            // Articles
            case preg_match('#^/luXew/backend/public/articles/creer/?$#', $requete) && $methode === 'POST':
                $controleurArticle->creerArticle();
                break;
            case preg_match('#^/luXew/backend/public/articles/(\d+)/modifier/?$#', $requete, $matches) && $methode === 'POST':
                $controleurArticle->modifierArticle($matches[1]);
                break;
            case preg_match('#^/luXew/backend/public/articles/(\d+)/supprimer/?$#', $requete, $matches) && $methode === 'POST':
                $controleurArticle->supprimerArticle($matches[1]);
                break;

            // Commentaires
            case preg_match('#^/luXew/backend/public/commentaires/creer/?$#', $requete) && $methode === 'POST':
                $controleurCommentaire->ajouterCommentaire();
                break;
            case preg_match('#^/luXew/backend/public/commentaires/(\d+)/modifier/?$#', $requete, $matches) && $methode === 'POST':
                $controleurCommentaire->modifierCommentaire($matches[1]);
                break;
            case preg_match('#^/luXew/backend/public/commentaires/(\d+)/supprimer/?$#', $requete, $matches) && $methode === 'DELETE':
                $controleurCommentaire->supprimerCommentaire($matches[1]);
                break;

            // Réactions
            case preg_match('#^/luXew/backend/public/reactions/creer/?$#', $requete) && $methode === 'POST':
                $controleurReaction->ajouterReaction();
                break;
            case preg_match('#^/luXew/backend/public/reactions/(\d+)/supprimer/?$#', $requete, $matches) && $methode === 'DELETE':
                $controleurReaction->supprimerReaction($matches[1]);
                break;
            case preg_match('#^/luXew/backend/public/reactions/utilisateur/article/(\d+)/?$#', $requete, $matches) && $methode === 'GET':
                $controleurReaction->obtenirReactionUtilisateur($matches[1], null);
                break;
            case preg_match('#^/luXew/backend/public/reactions/utilisateur/commentaire/(\d+)/?$#', $requete, $matches) && $methode === 'GET':
                $controleurReaction->obtenirReactionUtilisateur(null, $matches[1]);
                break;

            // Catégories
            case preg_match('#^/luXew/backend/public/categories/creer/?$#', $requete) && $methode === 'POST':
                $controleurCategorie->creerCategorie();
                break;
            case preg_match('#^/luXew/backend/public/categories/(\d+)/modifier/?$#', $requete, $matches) && $methode === 'POST':
                $controleurCategorie->modifierCategorie($matches[1]);
                break;
            case preg_match('#^/luXew/backend/public/categories/(\d+)/supprimer/?$#', $requete, $matches) && $methode === 'DELETE':
                $controleurCategorie->supprimerCategorie($matches[1]);
                break;

            // Authentification
            case preg_match('#^/luXew/backend/public/deconnexion/?$#', $requete) && $methode === 'POST':
                $controleurAuthentification->deconnecter();
                break;
            case preg_match('#^/luXew/backend/public/jetons/?$#', $requete) && $methode === 'GET':
                $controleurAuthentification->listerJetons();
                break;
            case preg_match('#^/luXew/backend/public/jetons/creer/?$#', $requete) && $methode === 'POST':
                $controleurAuthentification->genererJetonUtilisateur();
                break;
            case preg_match('#^/luXew/backend/public/jetons/supprimer/?$#', $requete) && $methode === 'POST':
                $controleurAuthentification->supprimerJeton();
                break;

            // Utilisateurs
            case preg_match('#^/luXew/backend/public/utilisateurs/?$#', $requete) && $methode === 'GET':
                $controleurAuthentification->listerUtilisateurs();
                break;
            case preg_match('#^/luXew/backend/public/utilisateurs/creer/?$#', $requete) && $methode === 'POST':
                $controleurAuthentification->ajouterUtilisateur();
                break;
            case preg_match('#^/luXew/backend/public/utilisateurs/modifier/?$#', $requete) && $methode === 'POST':
                $controleurAuthentification->modifierUtilisateur();
                break;
            case preg_match('#^/luXew/backend/public/utilisateurs/supprimer/?$#', $requete) && $methode === 'POST':
                $controleurAuthentification->supprimerUtilisateur();
                break;

            default:
                throw new Exception('Route non trouvée');
        }
    }
} catch (Exception $e) {
    http_response_code(401);
    header('Content-Type: application/json');
    echo json_encode(['erreur' => $e->getMessage()]);
} catch (Error $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['erreur' => 'Erreur serveur: ' . $e->getMessage()]);
}
?>