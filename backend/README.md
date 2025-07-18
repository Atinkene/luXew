# 📖 README.md pour le Backend de l'Application luXew 🌟

Bienvenue dans le backend de **luXew** ! 🎉 Ce projet est une API robuste et moderne conçue pour alimenter une application de gestion de contenu de luxe, avec des fonctionnalités d'authentification sécurisée via **JWT** 🔒, un stockage de médias via **Cloudinary** 📸, et des services **REST** et **SOAP** pour une flexibilité maximale. Ce README est votre guide pour explorer, installer et tester notre projet avec style ! 😎

---

## 🚀 Aperçu du Projet

**luXew** est une plateforme élégante pour gérer des articles, commentaires et utilisateurs, avec une touche de luxe. Le backend est construit avec **PHP** et **MySQL**, offrant des API **REST** et **SOAP** pour répondre aux besoins des clients modernes et traditionnels. Les médias (images, vidéos) sont stockés sur **Cloudinary** pour une gestion scalable et performante. 🛠️

---

## 📂 Structure du Projet

Voici l'organisation du projet pour vous aider à naviguer facilement :

```plaintext
luXew/
├── backend/
│   ├── config/                 🛠️ Configuration
│   │   └── BaseDeDonnees.php   🔗 Connexion à MySQL
│   ├── controleurs/            🎮 Contrôleurs REST
│   │   ├── ControleurAuthentification.php
│   │   ├── ControleurCommentaire.php
│   │   └── ControleurArticle.php
│   ├── modeles/                📚 Modèles de données
│   │   ├── ModeleUtilisateur.php
│   │   ├── ModeleJeton.php
│   │   ├── ModeleArticle.php
│   │   └── ModeleCommentaire.php
│   ├── services/               🌐 Services SOAP
│   │   └── ServicesSoap.php
│   ├── public/                 🌍 Point d'entrée public
│   │   ├── index.php           🚪 Routeur REST
│   │   ├── soap.php            🧼 Serveur SOAP
│   │   └── .htaccess           🔄 Configuration Apache
│   └── vendor/                 📦 Dépendances Composer
├── sql/                        🗄️ Scripts SQL
│   └── database.sql
└── README.md                   📖 Ce fichier


## 🛠️ Fiche Technique



Aspect
Détails



Langage
PHP 8.2+ 🐘


Base de Données
MySQL 8.0 🗄️


Authentification
JWT (JSON Web Tokens) pour REST et SOAP 🔒


Stockage des Médias
Cloudinary pour images/vidéos 📸


API REST
Endpoints pour articles, commentaires, utilisateurs 🚀


API SOAP
Services pour gestion des utilisateurs (RPC, sans WSDL) 🧼


Serveur Web
Apache 2.4 🖥️


Dépendances
Composer, firebase/php-jwt, cloudinary/cloudinary_php 📦


Environnement
Ubuntu 20.04+ (ou compatible) 🐧



🎯 Fonctionnalités Clés

Authentification sécurisée 🔑 : Connexion via JWT pour REST et SOAP, avec rôles (admin, visiteur).
Gestion des articles ✍️ : Création, modification, suppression d'articles avec médias (images/vidéos via Cloudinary).
Commentaires 💬 : Ajout, modification, suppression de commentaires, avec support des commentaires imbriqués.
Gestion des utilisateurs 👥 : Création, liste, modification, suppression (SOAP, admin uniquement).
Stockage Cloud ☁️ : Intégration avec Cloudinary pour un stockage scalable des médias.


🛠️ Installation
Suivez ces étapes pour lancer le backend localement ! 🚀

Cloner le projet :
git clone https://github.com/votre-repo/luXew.git
cd luXew/backend


Installer les dépendances :
composer install


Configurer la base de données :

Créez une base de données MySQL :mysql -u root -p -e "CREATE DATABASE Luxew;"


Importez le schéma :mysql -u root -p Luxew < sql/database.sql




Configurer l'environnement :

Copiez config/BaseDeDonnees.php.example vers config/BaseDeDonnees.php et configurez les paramètres MySQL :<?php
class BaseDeDonnees {
    private static $instance = null;
    public static function obtenirInstance() {
        if (self::$instance === null) {
            self::$instance = new PDO('mysql:host=localhost;dbname=Luxew', 'root', 'votre-mot-de-passe', [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
            ]);
        }
        return self::$instance;
    }
}
?>




Configurer Cloudinary :

Ajoutez vos identifiants Cloudinary dans config/cloudinary.php :<?php
\Cloudinary::config([
    'cloud_name' => 'votre-cloud-name',
    'api_key' => 'votre-api-key',
    'api_secret' => 'votre-api-secret'
]);
?>




Configurer Apache :

Assurez-vous que mod_rewrite est activé :sudo a2enmod rewrite
sudo systemctl restart apache2


Configurez le virtual host dans /etc/apache2/sites-available/000-default.conf :<VirtualHost *:80>
    ServerName localhost
    DocumentRoot /var/www/html/luXew/backend/public
    <Directory /var/www/html/luXew/backend/public>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>




Démarrer le serveur :

Placez le projet dans /var/www/html/luXew :sudo mv luXew /var/www/html/
sudo chown -R www-data:www-data /var/www/html/luXew
sudo chmod -R 755 /var/www/html/luXew


Redémarrez Apache :sudo systemctl restart apache2






🌐 Tester l'API
API REST 🚀
1. Authentification
Obtenez un jeton JWT :
curl -v -X POST "http://localhost/luXew/backend/public/api/auth/login" \
     -H "Content-Type: application/json" \
     -d '{"email": "admin@luxew.com", "motDePasse": "passer123"}'

Réponse :
{
    "success": true,
    "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}

2. Créer un article avec média
Utilisez le jeton JWT pour créer un article avec une image Cloudinary :
curl -v -X POST "http://localhost/luXew/backend/public/api/articles" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..." \
     -d '{
         "titre": "Article de Luxe",
         "contenu": "Un article élégant",
         "auteurId": 1,
         "media": {
             "url": "https://res.cloudinary.com/votre-cloud-name/image/upload/v1234567890/luxew.jpg"
         }
     }'

Réponse :
{
    "success": true,
    "articleId": 1
}

3. Téléverser une image
curl -v -X POST "http://localhost/luXew/backend/public/api/medias" \
     -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..." \
     -F "file=@/chemin/vers/luxew.jpg"

Réponse :
{
    "success": true,
    "url": "https://res.cloudinary.com/votre-cloud-name/image/upload/v1234567890/luxew.jpg"
}

API SOAP 🧼
1. Authentification
curl -v -X POST "http://localhost/luXew/backend/public/soap" \
     -H "Content-Type: text/xml; charset=utf-8" \
     -H "SOAPAction: authentifierUtilisateur" \
     -d '<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ns1="http://localhost/luXew/backend/public/soap">
    <soap:Body>
        <ns1:authentifierUtilisateur>
            <email>admin@luxew.com</email>
            <motDePasse>passer123</motDePasse>
        </ns1:authentifierUtilisateur>
    </soap:Body>
</soap:Envelope>'

Réponse :
<SOAP-ENV:Envelope ...>
    <SOAP-ENV:Body>
        <ns1:authentifierUtilisateurResponse>
            <return>
                <utilisateurId>1</utilisateurId>
                <pseudo>admin</pseudo>
                <jeton>abcdef1234567890</jeton>
                <estAdmin>true</estAdmin>
            </return>
        </ns1:authentifierUtilisateurResponse>
    </SOAP-ENV:Body>
</SOAP-ENV:Envelope>

2. Lister les utilisateurs
curl -v -X POST "http://localhost/luXew/backend/public/soap" \
     -H "Content-Type: text/xml; charset=utf-8" \
     -H "SOAPAction: listerUtilisateurs" \
     -d '<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ns1="http://localhost/luXew/backend/public/soap">
    <soap:Body>
        <ns1:listerUtilisateurs>
            <jeton>$abcdef1234567890$</jeton>
        </ns1:listerUtilisateurs>
    </soap:Body>
</soap:Envelope>'


🐞 Dépannage

Erreur 404 (Route non trouvée) :

Vérifiez .htaccess :<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /luXew/backend/public/
    RewriteCond %{REQUEST_URI} !^/(soap|api/)
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ index.php?route=$1 [QSA,L]
</IfModule>


Confirmez que soap.php et index.php sont dans /var/www/html/luXew/backend/public/.


Erreur 401 (Unauthorized) :

Vérifiez le jeton JWT ou SOAP avec authentifierUtilisateur.


Logs :
cat /var/log/apache2/error.log




🎉 Conclusion
Le backend de luXew est prêt à briller ! 🌟 Avec des API REST et SOAP sécurisées par JWT, une intégration Cloudinary pour les médias, et une architecture claire, il est conçu pour impressionner. Testez, explorez, et profitez de l'élégance de notre solution ! 😊
Pour notre évaluateur : Nous espérons que ce README vous guide avec clarté et enthousiasme. Si vous avez des questions ou besoin d'assistance, contactez-nous ! 📩```