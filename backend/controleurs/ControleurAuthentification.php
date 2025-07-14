<?php
require_once '../modeles/ModeleUtilisateur.php';
require_once '../modeles/ModeleJeton.php';
require_once '../vendor/autoload.php';
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class ControleurAuthentification {
    private $modeleUtilisateur;
    private $modeleJeton;
    private $jwtSecret; // Remplacez par une clé sécurisée

    public function __construct() {
        $this->modeleUtilisateur = new ModeleUtilisateur();
        $this->modeleJeton = new ModeleJeton();
        $this->jwtSecret = $_ENV['JWT_SECRET'];
    }

    public function connecter() {
        try {
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                throw new Exception('Méthode non autorisée');
            }

            $pseudo = filter_input(INPUT_POST, 'pseudo', FILTER_SANITIZE_SPECIAL_CHARS);
            $motDePasse = filter_input(INPUT_POST, 'motDePasse', FILTER_SANITIZE_SPECIAL_CHARS);

            if (!$pseudo || !$motDePasse) {
                throw new Exception('Identifiants invalides');
            }

            $utilisateur = $this->modeleUtilisateur->obtenirUtilisateurParPseudo($pseudo);
            if (!is_array($utilisateur) || empty($utilisateur)) {
                throw new Exception('Utilisateur non trouvé');
            }

            if (!password_verify($motDePasse, $utilisateur['motDePasse'])) {
                throw new Exception('Mot de passe incorrect');
            }

            $payload = [
                'iss' => 'http://localhost/luXew',
                'iat' => time(),
                'exp' => time() + 3600, // Expire dans 1 heure
                'utilisateurId' => $utilisateur['id'],
                'roles' => $this->modeleUtilisateur->obtenirRolesUtilisateur($utilisateur['id'])
            ];

            $jwt = JWT::encode($payload, $this->jwtSecret, 'HS256');
            $this->repondreJson([
                'succes' => true,
                'jwt' => $jwt,
                'utilisateurId' => $utilisateur['id'],
                'pseudo' => $utilisateur['pseudo'],
                'roles' => $payload['roles']
            ]);
        } catch (Exception $e) {
            error_log("Erreur dans connecter: " . $e->getMessage());
            $this->repondreJson(['erreur' => $e->getMessage()], 401);
        }
    }

    public function deconnecter() {
        try {
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                throw new Exception('Méthode non autorisée');
            }
            $this->repondreJson(['succes' => true]);
        } catch (Exception $e) {
            error_log("Erreur dans deconnecter: " . $e->getMessage());
            $this->repondreJson(['erreur' => $e->getMessage()], 500);
        }
    }

    public function inscrire() {
        try {
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                throw new Exception('Méthode non autorisée');
            }

            $pseudo = filter_input(INPUT_POST, 'pseudo', FILTER_SANITIZE_SPECIAL_CHARS);
            $email = filter_input(INPUT_POST, 'email', FILTER_VALIDATE_EMAIL);
            $motDePasse = filter_input(INPUT_POST, 'motDePasse', FILTER_SANITIZE_SPECIAL_CHARS);

            if (!$pseudo || !$email || !$motDePasse) {
                throw new Exception('Données invalides: pseudo, email ou mot de passe manquant');
            }

            $utilisateurExistant = $this->modeleUtilisateur->obtenirUtilisateurParPseudo($pseudo);
            if (is_array($utilisateurExistant) && !empty($utilisateurExistant)) {
                throw new Exception('Pseudo déjà utilisé');
            }

            $motDePasseHache = password_hash($motDePasse, PASSWORD_BCRYPT);
            $utilisateurId = $this->modeleUtilisateur->creerUtilisateur($pseudo, $email, $motDePasseHache);
            $this->modeleUtilisateur->assignerRole($utilisateurId, 'visiteur');

            $payload = [
                'iss' => 'http://localhost/luXew',
                'iat' => time(),
                'exp' => time() + 3600,
                'utilisateurId' => $utilisateurId,
                'roles' => ['visiteur']
            ];

            $jwt = JWT::encode($payload, $this->jwtSecret, 'HS256');
            $this->repondreJson([
                'succes' => true,
                'jwt' => $jwt,
                'utilisateurId' => $utilisateurId
            ]);
        } catch (Exception $e) {
            error_log("Erreur dans inscrire: " . $e->getMessage());
            $this->repondreJson(['erreur' => $e->getMessage()], 400);
        }
    }

    public function genererJetonUtilisateur() {
    try {
        $jwt = $this->validerJWT();
        if (!in_array('admin', $jwt->roles)) {
            throw new Exception('Non autorisé');
        }
        $utilisateurId = filter_input(INPUT_POST, 'utilisateurId', FILTER_VALIDATE_INT);
        $dureeValidite = filter_input(INPUT_POST, 'dureeValidite', FILTER_VALIDATE_INT);
        
        // Valider la durée (entre 1 et 365 jours)
        if (!$dureeValidite || $dureeValidite < 1 || $dureeValidite > 365) {
            $dureeValidite = 1; // Durée par défaut : 1 jour
        }
        
        if (!$utilisateurId || !$this->modeleUtilisateur->obtenirUtilisateurParId($utilisateurId)) {
            throw new Exception('Utilisateur non trouvé');
        }

        $payload = [
            'iss' => 'http://localhost/luXew',
            'iat' => time(),
            'exp' => time() + (86400 * $dureeValidite), // Conversion en secondes
            'utilisateurId' => $utilisateurId,
            'roles' => $this->modeleUtilisateur->obtenirRolesUtilisateur($utilisateurId)
        ];
        
        $jeton = JWT::encode($payload, $this->jwtSecret, 'HS256');
        $jetonId = $this->modeleJeton->creerJeton($utilisateurId, $jeton, $dureeValidite);
        $this->repondreJson(['succes' => true, 'jeton' => $jeton]);
    } catch (Exception $e) {
        error_log("Erreur dans genererJetonUtilisateur: " . $e->getMessage());
        $this->repondreJson(['erreur' => $e->getMessage()], 400);
    }
}

    public function supprimerJeton() {
        try {
            $jwt = $this->validerJWT();
            if (!in_array('admin', $jwt->roles)) {
                throw new Exception('Non autorisé');
            }
            $jeton = filter_input(INPUT_POST, 'jeton', FILTER_SANITIZE_SPECIAL_CHARS);
            if (!$jeton || !$this->modeleJeton->validerJeton($jeton)) {
                throw new Exception('Jeton non trouvé ou invalide');
            }
            $this->modeleJeton->supprimerJeton($jeton);
            $this->repondreJson(['succes' => true]);
        } catch (Exception $e) {
            error_log("Erreur dans supprimerJeton: " . $e->getMessage());
            $this->repondreJson(['erreur' => $e->getMessage()], 400);
        }
    }

    public function listerJetons() {
        try {
            $jwt = $this->validerJWT();
            if (!in_array('admin', $jwt->roles)) {
                throw new Exception('Non autorisé');
            }
            $jetons = $this->modeleJeton->obtenirTousJetons();
            $this->repondreJson(['succes' => true, 'jetons' => $jetons]);
        } catch (Exception $e) {
            error_log("Erreur dans listerJetons: " . $e->getMessage());
            $this->repondreJson(['erreur' => $e->getMessage()], 400);
        }
    }

    public function listerUtilisateurs() {
        try {
            $jwt = $this->validerJWT();
            if (!in_array('admin', $jwt->roles)) {
                throw new Exception('Non autorisé');
            }
            $utilisateurs = $this->modeleUtilisateur->obtenirTousUtilisateurs();
            $this->repondreJson(['succes' => true, 'utilisateurs' => $utilisateurs]);
        } catch (Exception $e) {
            error_log("Erreur dans listerUtilisateurs: " . $e->getMessage());
            $this->repondreJson(['erreur' => $e->getMessage()], 400);
        }
    }

    public function ajouterUtilisateur() {
        try {
            $jwt = $this->validerJWT();
            if (!in_array('admin', $jwt->roles)) {
                throw new Exception('Non autorisé');
            }
            $pseudo = filter_input(INPUT_POST, 'pseudo', FILTER_SANITIZE_SPECIAL_CHARS);
            $email = filter_input(INPUT_POST, 'email', FILTER_VALIDATE_EMAIL);
            $motDePasse = filter_input(INPUT_POST, 'motDePasse', FILTER_SANITIZE_SPECIAL_CHARS);

            if (!$pseudo || !$email || !$motDePasse) {
                throw new Exception('Données invalides: pseudo, email ou mot de passe manquant');
            }

            $utilisateurExistant = $this->modeleUtilisateur->obtenirUtilisateurParPseudo($pseudo);
            if (is_array($utilisateurExistant) && !empty($utilisateurExistant)) {
                throw new Exception('Pseudo déjà utilisé');
            }

            $motDePasseHache = password_hash($motDePasse, PASSWORD_BCRYPT);
            $utilisateurId = $this->modeleUtilisateur->creerUtilisateur($pseudo, $email, $motDePasseHache);
            $this->modeleUtilisateur->assignerRole($utilisateurId, 'visiteur');

            $this->repondreJson(['succes' => true, 'utilisateurId' => $utilisateurId]);
        } catch (Exception $e) {
            error_log("Erreur dans ajouterUtilisateur: " . $e->getMessage());
            $this->repondreJson(['erreur' => $e->getMessage()], 400);
        }
    }

    public function modifierUtilisateur() {
        try {
            $jwt = $this->validerJWT();
            if (!in_array('admin', $jwt->roles)) {
                throw new Exception('Non autorisé');
            }
            $utilisateurId = filter_input(INPUT_POST, 'utilisateurId', FILTER_VALIDATE_INT);
            $pseudo = filter_input(INPUT_POST, 'pseudo', FILTER_SANITIZE_SPECIAL_CHARS);
            $email = filter_input(INPUT_POST, 'email', FILTER_VALIDATE_EMAIL);

            if (!$utilisateurId || !$pseudo || !$email) {
                throw new Exception('Données invalides: ID, pseudo ou email manquant');
            }

            $utilisateur = $this->modeleUtilisateur->obtenirUtilisateurParId($utilisateurId);
            if (!is_array($utilisateur) || empty($utilisateur)) {
                throw new Exception('Utilisateur non trouvé');
            }

            $this->modeleUtilisateur->modifierUtilisateur($utilisateurId, $pseudo, $email);
            $this->repondreJson(['succes' => true]);
        } catch (Exception $e) {
            error_log("Erreur dans modifierUtilisateur: " . $e->getMessage());
            $this->repondreJson(['erreur' => $e->getMessage()], 400);
        }
    }

    public function supprimerUtilisateur() {
        try {
            $jwt = $this->validerJWT();
            if (!in_array('admin', $jwt->roles)) {
                throw new Exception('Non autorisé');
            }
            $utilisateurId = filter_input(INPUT_POST, 'utilisateurId', FILTER_VALIDATE_INT);
            if (!$utilisateurId) {
                throw new Exception('ID utilisateur invalide');
            }

            $utilisateur = $this->modeleUtilisateur->obtenirUtilisateurParId($utilisateurId);
            if (!is_array($utilisateur) || empty($utilisateur)) {
                throw new Exception('Utilisateur non trouvé');
            }

            $this->modeleUtilisateur->supprimerUtilisateur($utilisateurId);
            $this->repondreJson(['succes' => true]);
        } catch (Exception $e) {
            error_log("Erreur dans supprimerUtilisateur: " . $e->getMessage());
            $this->repondreJson(['erreur' => $e->getMessage()], 400);
        }
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