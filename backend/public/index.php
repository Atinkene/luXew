<?php
require_once '../vendor/autoload.php';
require_once '../controleurs/ControleurArticle.php';
require_once '../controleurs/ControleurCategorie.php';
require_once '../controleurs/ControleurCommentaire.php';
require_once '../controleurs/ControleurAuthentification.php';
require_once '../controleurs/ControleurReaction.php';

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

$requete = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH); // Ignore query string
$methode = $_SERVER['REQUEST_METHOD'];

error_log("Requête reçue: " . $requete);

try {
    $controleurArticle = new ControleurArticle();
    $controleurCategorie = new ControleurCategorie();
    $controleurCommentaire = new ControleurCommentaire();
    $controleurAuthentification = new ControleurAuthentification();
    $controleurReaction = new ControleurReaction();

    switch (true) {
        case preg_match('#^/luXew/backend/public/articles/?$#', $requete) && $methode === 'GET':
            $controleurArticle->listerArticles();
            break;
        case preg_match('#^/luXew/backend/public/articles/(\d+)/?$#', $requete, $matches) && $methode === 'GET':
            $controleurArticle->afficherArticle($matches[1]);
            break;
        case preg_match('#^/luXew/backend/public/articles/create/?$#', $requete) && $methode === 'POST':
            $controleurArticle->creerArticle();
            break;
        case preg_match('#^/luXew/backend/public/categories/?$#', $requete) && $methode === 'GET':
            $controleurCategorie->listerCategories();
            break;
        case preg_match('#^/luXew/backend/public/categories/(\d+)/articles/?$#', $requete, $matches) && $methode === 'GET':
            $controleurCategorie->obtenirArticlesParCategorie($matches[1]);
            break;
        case preg_match('#^/luXew/backend/public/categories/create/?$#', $requete) && $methode === 'POST':
            $controleurCategorie->creerCategorie();
            break;
        case preg_match('#^/luXew/backend/public/comments/(\d+)/?$#', $requete, $matches) && $methode === 'GET':
            $controleurCommentaire->obtenirCommentaires($matches[1]);
            break;
        case preg_match('#^/luXew/backend/public/comments/create/?$#', $requete) && $methode === 'POST':
            $controleurCommentaire->ajouterCommentaire();
            break;
        case preg_match('#^/luXew/backend/public/comments/(\d+)/?$#', $requete, $matches) && $methode === 'POST':
            $controleurCommentaire->modifierCommentaire($matches[1]);
            break;
        case preg_match('#^/luXew/backend/public/comments/(\d+)/?$#', $requete, $matches) && $methode === 'DELETE':
            $controleurCommentaire->supprimerCommentaire($matches[1]);
            break;
        case preg_match('#^/luXew/backend/public/login/?$#', $requete) && $methode === 'POST':
            $controleurAuthentification->connecter();
            break;
        case preg_match('#^/luXew/backend/public/logout/?$#', $requete) && $methode === 'POST':
            $controleurAuthentification->deconnecter();
            break;
        case preg_match('#^/luXew/backend/public/register/?$#', $requete) && $methode === 'POST':
            $controleurAuthentification->inscrire();
            break;
        case preg_match('#^/luXew/backend/public/reactions/create/?$#', $requete) && $methode === 'POST':
            $controleurReaction->ajouterReaction();
            break;
        case preg_match('#^/luXew/backend/public/reactions/(\d+)/?$#', $requete, $matches) && $methode === 'DELETE':
            $controleurReaction->supprimerReaction($matches[1]);
            break;
        case preg_match('#^/luXew/backend/public/reactions/article/(\d+)/?$#', $requete, $matches) && $methode === 'GET':
            $controleurReaction->obtenirStatistiquesReactions($matches[1], null);
            break;
        case preg_match('#^/luXew/backend/public/reactions/commentaire/(\d+)/?$#', $requete, $matches) && $methode === 'GET':
            $controleurReaction->obtenirStatistiquesReactions(null, $matches[1]);
            break;
        default:
            throw new Exception('Route non trouvée');
    }
} catch (Exception $e) {
    http_response_code(404);
    header('Content-Type: application/json');
    echo json_encode(['erreur' => $e->getMessage()]);
} catch (Error $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['erreur' => 'Erreur serveur: ' . $e->getMessage()]);
}
?>