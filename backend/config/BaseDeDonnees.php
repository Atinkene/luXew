<?php

require_once '../vendor/autoload.php'; 
use Dotenv\Dotenv;

class BaseDeDonnees {
    private static $instance = null;
    private $connexion;

    private function __construct() {
        $dotenv = Dotenv::createImmutable(__DIR__ . '/..');
        $dotenv->load();

        foreach (['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASS', 'DB_CHARSET'] as $key) {
            if (!isset($_ENV[$key])) {
                throw new Exception("Variable d'environnement manquante : $key");
            }
        }

        $hote = $_ENV['DB_HOST'];
        $nomBase = $_ENV['DB_NAME'];
        $nomUtilisateur = $_ENV['DB_USER'];
        $motDePasse = $_ENV['DB_PASS'];
        $charset = $_ENV['DB_CHARSET'];

        try {
            $dsn = "mysql:host={$hote};dbname={$nomBase};charset={$charset}";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES {$charset}"
            ];
            $this->connexion = new PDO($dsn, $nomUtilisateur, $motDePasse, $options);
        } catch (PDOException $e) {
            throw new Exception("Échec de la connexion à la base de données : " . $e->getMessage());
        }
    }

    private function __clone() {}
    private function __wakeup() {}

    public static function obtenirInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function obtenirConnexion() {
        return $this->connexion;
    }
}
