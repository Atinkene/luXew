<?php
require_once '../modeles/ModeleUtilisateur.php';
require_once '../modeles/ModeleJeton.php';
require_once '../vendor/autoload.php';
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class ControleurAuthentification {
    private $modeleUtilisateur;
    private $modeleJeton;
    private $jwtSecret;

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
        
            $contenu = file_get_contents('php://input');
            $donnees = json_decode($contenu, true);
        
            $pseudo = $donnees['pseudo'] ?? $_POST['pseudo'] ?? null;
            $motDePasse = $donnees['motDePasse'] ?? $_POST['motDePasse'] ?? null;
        
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
                'exp' => time() + (60 * 60 * 60 *7), 
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

    public function listerRoles() {
        try {
            $roles = $this->modeleUtilisateur->obtenirRoles();
            $this->repondreJson(['succes' => true, 'roles' => $roles]);
        } catch (Exception $e) {
            error_log("Erreur dans listerRoles: " . $e->getMessage());
            $this->repondreJson(['erreur' => $e->getMessage()], 400);
        }
    }

    public function inscrire() {
        try {
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                throw new Exception('Méthode non autorisée');
            }

            $input = file_get_contents('php://input');
            $data = json_decode($input, true);

            if ($data === null || !isset($data['pseudo']) || !isset($data['email']) || !isset($data['motDePasse']) || !isset($data['role'])) {
                throw new Exception('Données manquantes');
            }

            $pseudo = filter_var(trim($data['pseudo']), FILTER_SANITIZE_SPECIAL_CHARS);
            $email = filter_var(trim($data['email']), FILTER_SANITIZE_EMAIL);
            $motDePasse = $data['motDePasse'];
            $role = $data['role'];

            if (strlen($pseudo) < 2) {
                throw new Exception('Le pseudo doit contenir au moins 2 caractères');
            }
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                throw new Exception('Email invalide');
            }
            if (strlen($motDePasse) < 6) {
                throw new Exception('Le mot de passe doit contenir au moins 6 caractères');
            }
            if (!in_array($role, $this->modeleUtilisateur->obtenirRoles()) || $role === 'admin') {
                throw new Exception('Rôle invalide', $role);
            }

            $utilisateurExistant = $this->modeleUtilisateur->obtenirUtilisateurParPseudo($pseudo);
            if (is_array($utilisateurExistant) && !empty($utilisateurExistant)) {
                throw new Exception('Pseudo déjà utilisé');
            }
            $utilisateurExistantx = $this->modeleUtilisateur->obtenirUtilisateurParEmail($email);
            if (is_array($utilisateurExistantx) && !empty($utilisateurExistantx)) {
                throw new Exception('Email déjà utilisé');
            }
            

            $utilisateurId = $this->modeleUtilisateur->creerUtilisateur(
                $pseudo,
                $email,
                $motDePasse
            );
            $this->modeleUtilisateur->assignerRole($utilisateurId, $role);

            $payload = [
                'id' => $utilisateurId,
                'pseudo' => $pseudo,
                'email' => $email,
                'roles' => [$role],
                'exp' => time() + (60 * 60 * 24)
            ];
            $jwt = JWT::encode($payload, $this->jwtSecret, 'HS256');

            error_log("Utilisateur inscrit: ID=$utilisateurId, pseudo=$pseudo");
            $this->repondreJson([
                'succes' => true,
                'utilisateur' => [
                    'id' => $utilisateurId,
                    'pseudo' => $pseudo,
                    'email' => $email,
                    'roles' => [$role]
                ],
                'jwt' => $jwt
            ]);
        } catch (Exception $e) {
            error_log("Erreur dans inscription: " . $e->getMessage());
            $this->repondreJson(['erreur' => $e->getMessage()], 400);
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

   public function genererJetonUtilisateur() {
        try {
            $jwt = $this->validerJWT();
            if (!in_array('admin', $jwt->roles)) {
                throw new Exception('Non autorisé: seuls les administrateurs peuvent créer des jetons');
            }
            $utilisateurId = $jwt->utilisateurId; // Use admin's ID from JWT

            // Parse JSON input
            $contenu = file_get_contents('php://input');
            $donnees = json_decode($contenu, true);
            $dureeValidite = isset($donnees['dureeValidite']) ? filter_var($donnees['dureeValidite'], FILTER_VALIDATE_INT) : null;

            if ($dureeValidite === false || $dureeValidite < 1 || $dureeValidite > 365) {
                throw new Exception('Durée de validité invalide: doit être un entier entre 1 et 365');
            }

            if (!$this->modeleUtilisateur->obtenirUtilisateurParId($utilisateurId)) {
                throw new Exception('Utilisateur non trouvé');
            }

            $payload = [
                'iss' => 'http://localhost/luXew',
                'iat' => time(),
                'exp' => time() + (86400 * $dureeValidite),
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
                throw new Exception('Non autorisé: seuls les administrateurs peuvent supprimer des jetons');
            }
        
            // Parse JSON input
            $contenu = file_get_contents('php://input');
            $donnees = json_decode($contenu, true);
            $jeton = isset($donnees['jeton']) ? filter_var($donnees['jeton'], FILTER_SANITIZE_SPECIAL_CHARS) : null;
        
            if (!$jeton) {
                throw new Exception('Jeton manquant dans la requête');
            }
        
            if (!$this->modeleJeton->validerJeton($jeton)) {
                throw new Exception('Jeton non trouvé ou invalide');
            }
        
            error_log("Deleting token: $jeton"); // Debug log
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
                throw new Exception('Non autorisé: seuls les administrateurs peuvent lister les utilisateurs');
            }
            $utilisateurs = $this->modeleUtilisateur->obtenirTousUtilisateurs();
            $utilisateursAvecRoles = array_map(function($user) {
                $user['roles'] = $this->modeleUtilisateur->obtenirRolesUtilisateur($user['id']);
                return $user;
            }, $utilisateurs);
            $this->repondreJson(['succes' => true, 'utilisateurs' => $utilisateursAvecRoles]);
        } catch (Exception $e) {
            error_log("Erreur dans listerUtilisateurs: " . $e->getMessage());
            $this->repondreJson(['erreur' => $e->getMessage()], 400);
        }
    }

    public function ajouterUtilisateur() {
        try {
            $jwt = $this->validerJWT();
            if (!in_array('admin', $jwt->roles)) {
                throw new Exception('Non autorisé: seuls les administrateurs peuvent créer des utilisateurs');
            }

            $contenu = file_get_contents('php://input');
            $donnees = json_decode($contenu, true);

            $pseudo = isset($donnees['pseudo']) ? filter_var($donnees['pseudo'], FILTER_SANITIZE_SPECIAL_CHARS) : null;
            $email = isset($donnees['email']) ? filter_var($donnees['email'], FILTER_VALIDATE_EMAIL) : null;
            $motDePasse = isset($donnees['motDePasse']) ? filter_var($donnees['motDePasse'], FILTER_SANITIZE_SPECIAL_CHARS) : null;

            if (!$pseudo || !$email || !$motDePasse) {
                throw new Exception('Données invalides: pseudo, email ou mot de passe manquant');
            }

            if (strlen($pseudo) < 3) {
                throw new Exception('Le pseudo doit contenir au moins 3 caractères');
            }

            if (strlen($motDePasse) < 6) {
                throw new Exception('Le mot de passe doit contenir au moins 6 caractères');
            }

            $utilisateurExistant = $this->modeleUtilisateur->obtenirUtilisateurParPseudo($pseudo);
            if (is_array($utilisateurExistant) && !empty($utilisateurExistant)) {
                throw new Exception('Pseudo déjà utilisé');
            }

            $motDePasseHache = password_hash($motDePasse, PASSWORD_BCRYPT);
            $utilisateurId = $this->modeleUtilisateur->creerUtilisateur($pseudo, $email, $motDePasseHache);
            $this->modeleUtilisateur->assignerRole($utilisateurId, 'visiteur');

            error_log("Utilisateur créé: ID=$utilisateurId, pseudo=$pseudo");
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
                throw new Exception('Non autorisé: seuls les administrateurs peuvent modifier des utilisateurs');
            }

            $contenu = file_get_contents('php://input');
            $donnees = json_decode($contenu, true);

            $utilisateurId = isset($donnees['utilisateurId']) ? filter_var($donnees['utilisateurId'], FILTER_VALIDATE_INT) : null;
            $pseudo = isset($donnees['pseudo']) ? filter_var($donnees['pseudo'], FILTER_SANITIZE_SPECIAL_CHARS) : null;
            $role = isset($donnees['role']) ? filter_var($donnees['role'], FILTER_SANITIZE_SPECIAL_CHARS) : null;
            $email = isset($donnees['email']) ? filter_var($donnees['email'], FILTER_VALIDATE_EMAIL) : null;

            if (!$utilisateurId || !$pseudo || !$email) {
                throw new Exception('Données invalides: ID, pseudo ou email manquant');
            }

            if (strlen($pseudo) < 3) {
                throw new Exception('Le pseudo doit contenir au moins 3 caractères');
            }

            $utilisateur = $this->modeleUtilisateur->obtenirUtilisateurParId($utilisateurId);
            if (!is_array($utilisateur) || empty($utilisateur)) {
                throw new Exception('Utilisateur non trouvé');
            }

            $utilisateurExistant = $this->modeleUtilisateur->obtenirUtilisateurParPseudo($pseudo);
            if (is_array($utilisateurExistant) && !empty($utilisateurExistant) && $utilisateurExistant['id'] != $utilisateurId) {
                throw new Exception('Pseudo déjà utilisé par un autre utilisateur');
            }

            $this->modeleUtilisateur->modifierUtilisateur($utilisateurId, $pseudo, $email);
            $this->modeleUtilisateur->modifierRoleUtilisateur($utilisateurId, $role);
            error_log("Utilisateur modifié: ID=$utilisateurId, pseudo=$pseudo, role = $role");
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
                throw new Exception('Non autorisé: seuls les administrateurs peuvent supprimer des utilisateurs');
            }

            $contenu = file_get_contents('php://input');
            $donnees = json_decode($contenu, true);
            $utilisateurId = isset($donnees['utilisateurId']) ? filter_var($donnees['utilisateurId'], FILTER_VALIDATE_INT) : null;

            if (!$utilisateurId) {
                throw new Exception('ID utilisateur invalide ou manquant');
            }

            $utilisateur = $this->modeleUtilisateur->obtenirUtilisateurParId($utilisateurId);
            if (!is_array($utilisateur) || empty($utilisateur)) {
                throw new Exception('Utilisateur non trouvé');
            }

            if ($jwt->utilisateurId == $utilisateurId) {
                throw new Exception('Impossible de supprimer votre propre compte');
            }

            $this->modeleUtilisateur->supprimerUtilisateur($utilisateurId);
            error_log("Utilisateur supprimé: ID=$utilisateurId");
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