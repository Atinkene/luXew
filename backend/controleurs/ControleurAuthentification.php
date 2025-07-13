<?php
require_once '../modeles/ModeleUtilisateur.php';

class ControleurAuthentification {
    private $modeleUtilisateur;

    public function __construct() {
        $this->modeleUtilisateur = new ModeleUtilisateur();
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
    }

    public function connecter() {
        try {
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                throw new Exception('Méthode non autorisée');
            }
            $email = filter_input(INPUT_POST, 'email', FILTER_SANITIZE_EMAIL);
            $motDePasse = filter_input(INPUT_POST, 'motDePasse', FILTER_SANITIZE_SPECIAL_CHARS);
            if (empty($email) || empty($motDePasse)) {
                throw new Exception('Email ou mot de passe manquant');
            }

            $utilisateur = $this->modeleUtilisateur->obtenirUtilisateurParEmail($email);
            if (!$utilisateur || !password_verify($motDePasse, $utilisateur['motDePasse'])) {
                throw new Exception('Identifiants invalides');
            }

            $_SESSION['utilisateurId'] = $utilisateur['id'];
            $_SESSION['rolesUtilisateur'] = $this->modeleUtilisateur->obtenirRolesUtilisateur($utilisateur['id']);
            $this->repondreJson([
                'succes' => true,
                'utilisateurId' => $utilisateur['id'],
                'pseudo' => $utilisateur['pseudo'],
                'roles' => $_SESSION['rolesUtilisateur']
            ]);
        } catch (Exception $e) {
            $this->repondreJson(['erreur' => $e->getMessage()], 401);
        }
    }

    public function deconnecter() {
        try {
            session_destroy();
            $this->repondreJson(['succes' => true]);
        } catch (Exception $e) {
            $this->repondreJson(['erreur' => $e->getMessage()], 400);
        }
    }

    public function inscrire() {
        try {
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                throw new Exception('Méthode non autorisée');
            }
            $pseudo = filter_input(INPUT_POST, 'pseudo', FILTER_SANITIZE_SPECIAL_CHARS);
            $email = filter_input(INPUT_POST, 'email', FILTER_SANITIZE_EMAIL);
            $motDePasse = filter_input(INPUT_POST, 'motDePasse', FILTER_SANITIZE_SPECIAL_CHARS);
            if (empty($pseudo) || empty($email) || empty($motDePasse)) {
                throw new Exception('Champs manquants');
            }
            if ($this->modeleUtilisateur->obtenirUtilisateurParEmail($email)) {
                throw new Exception('Email déjà utilisé');
            }
            $motDePasseHache = password_hash($motDePasse, PASSWORD_DEFAULT);
            $utilisateurId = $this->modeleUtilisateur->creerUtilisateur([
                'pseudo' => $pseudo,
                'email' => $email,
                'motDePasse' => $motDePasseHache
            ]);
            $_SESSION['utilisateurId'] = $utilisateurId;
            $_SESSION['rolesUtilisateur'] = ['visiteur'];
            $this->repondreJson(['succes' => true, 'utilisateurId' => $utilisateurId]);
        } catch (Exception $e) {
            $this->repondreJson(['erreur' => $e->getMessage()], 400);
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