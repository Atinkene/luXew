# 📖 README.md pour le Projet luXew 🌟

Bienvenue dans **luXew**, une plateforme d’actualités de luxe ! 🎉 Ce projet, développé dans le cadre du cours d’architecture logicielle, combine un site web moderne, des services web **REST** et **SOAP**, et une application client Python. Ce README vous guide pour explorer, installer et tester notre solution élégante. 😎

---

## 🚀 Aperçu du Projet

**luXew** est une plateforme pour gérer des articles, catégories, commentaires, réactions, et utilisateurs, avec trois rôles : visiteurs (consultation), éditeurs (gestion de contenu), et administrateurs (gestion des utilisateurs/jetons). Le projet inclut :

- **Backend** : API PHP/MySQL avec services REST et SOAP.
- **Frontend** : Interface React/Vite pour une navigation fluide.
- **Client** : Application Python/Tkinter pour la gestion des utilisateurs via SOAP.\
  L’architecture est modulaire, avec une séparation claire des responsabilités, répondant aux exigences du projet.

---

## 📂 Structure du Projet

```plaintext
luXew/
├── backend/                    🛠️ API REST/SOAP
│   ├── config/                 🔗 Configuration
│   ├── controleurs/            🎮 Contrôleurs REST
│   ├── modeles/                📚 Modèles
│   ├── services/               🌐 Services SOAP
│   ├── public/                 🌍 Routeur REST/SOAP
│   └── README.md     📖 Documentation
├── frontend/                   🌐 Interface React
│   ├── src/                    📚 Code source
│   ├── public/                 🌍 Assets publics
│   └── README.md    📖 Documentation
├── client/                     🖥️ Application Python
│   ├── services/               🌐 Client SOAP
│   ├── vues/                   🖼️ Interfaces Tkinter
│   ├── utilitaires/            🛠️ Gestion des erreurs
│   └── StructureClient.md      📖 Documentation
└── README.md               📖 Ce fichier
```

---

## 🛠️ Fiche Technique

| Aspect | Détails |
| --- | --- |
| **Langages** | PHP 8.2+, JavaScript (React), Python 3.8+ 🐘🌐🐍 |
| **Base de Données** | MySQL 8.0 🗄️ |
| **Frontend** | React 18, Vite, Tailwind CSS 🚀 |
| **Backend** | PHP, MVC, REST/SOAP, JWT, Cloudinary 📸 |
| **Client** | Python, Tkinter, SOAP client 🖥️ |
| **Serveur Web** | Apache 2.4 🖥️ |
| **Environnement** | Ubuntu 20.04+ 🐧 |

---

## 🎯 Fonctionnalités Clés

- **Site Web** :
  - Page d’accueil avec liste d’articles et navigation (« suivant »/« précédent »).
  - Consultation détaillée des articles et par catégorie.
  - Rôles : visiteurs (consultation), éditeurs (gestion articles/catégories), admins (gestion utilisateurs/jetons).
- **Services Web** :
  - **REST** : Liste des articles (tous, par catégorie, groupés) en XML/JSON.
  - **SOAP** : Gestion des utilisateurs/jetons avec WSDL pour définir les opérations.
- **Client** : Application Python pour authentification et gestion des utilisateurs via SOAP.
- **Stockage** : Médias gérés via Cloudinary.

---

## 🛠️ Installation

1. **Cloner le projet** :

   ```bash
   git clone https://github.com/votre-repo/luXew.git
   cd luXew
   ```

2. **Backend** : Suivez `backend/README.md` pour configurer PHP, MySQL, Cloudinary, et Apache.

3. **Frontend** : Suivez `frontend/README.md` pour installer Node.js, Vite, et lancer le serveur.

4. **Client** : Suivez `client/README.md` pour configurer Python, Tkinter, et le client SOAP.

5. **Base de données** : Importez `sql/database.sql` dans MySQL.

---

## 🌐 Tester le Projet

- **Site Web** : Accédez à `http://localhost/luXew/frontend` pour naviguer, tester les rôles, et gérer le contenu.
- **API REST** : Testez les endpoints via Postman (ex. : `/api/articles`, `/api/auth/login`).
- **API SOAP** : Testez via Postman ou le client Python (ex. : `authentifierUtilisateur`).
- **Client** : Lancez `client/main.py` pour tester l’authentification et la gestion des utilisateurs.

---

## 🐞 Dépannage

- **Backend** : Vérifiez `.htaccess`, jetons JWT, et logs Apache (`/var/log/apache2/error.log`).
- **Frontend** : Assurez-vous que le serveur Vite est lancé (`npm run dev`).
- **Client** : Vérifiez la disponibilité du service SOAP et les dépendances Python (`zeep`).

---

## 🎉 Conclusion

**luXew** est une plateforme élégante et performante, alliant un site web moderne, des services web robustes, et une application client intuitive. Le code est disponible sur notre dépôt Git public \[insérer lien\]. Merci à notre évaluateur pour son attention ! 🌟 Contactez-nous pour toute question ! 📩