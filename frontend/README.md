# 📖 README.md pour le Frontend de l'Application luXew 🌟

Bienvenue dans le frontend de **luXew** ! 🎉 Cette interface utilisateur moderne, construite avec **React** et **Vite**, offre une expérience fluide pour consulter et gérer des actualités de luxe. Ce README vous guide pour installer, explorer et tester notre frontend avec style ! 😎

---

## 🚀 Aperçu du Projet

Le frontend de **luXew** est une application React qui permet aux visiteurs de consulter des articles, aux éditeurs de gérer articles/catégories, et aux administrateurs de gérer utilisateurs/jetons. Il communique avec le backend via des API **REST** et s’appuie sur **Tailwind CSS** pour un design élégant. 🖼️

---

## 📂 Structure du Projet

```plaintext
frontend/
├── public/                     🌍 Assets publics
│   └── vite.svg
├── src/                        📚 Code source
│   ├── assets/                 🖼️ Ressources (ex. : react.svg)
│   ├── components/             🧩 Composants réutilisables
│   │   ├── DebugAuth.jsx
│   │   ├── Footer.jsx
│   │   ├── Header.jsx
│   │   └── ProtectedRoute.jsx
│   ├── contexte/               🔐 Gestion de l’authentification
│   │   └── AuthContexte.jsx
│   ├── layouts/                📐 Mise en page
│   │   ├── LayoutAdmin.jsx
│   │   └── LayoutEditeur.jsx
│   ├── pages/                  📄 Pages principales
│   │   ├── Admin/
│   │   │   ├── CreerCategorie.jsx
│   │   │   ├── GestionArticles.jsx
│   │   │   ├── GestionCategories.jsx
│   │   │   ├── GestionJetons.jsx
│   │   │   ├── GestionUtilisateurs.jsx
│   │   │   ├── ModifierCategorie.jsx
│   │   │   ├── ModifierUtilisateur.jsx
│   │   │   ├── TableauDeBord.jsx
│   │   │   └── TousLesArticles.jsx
│   │   ├── ArticleDetail.jsx
│   │   ├── Editeur/
│   │   │   ├── GestionArticles.jsx
│   │   │   ├── GestionCategories.jsx
│   │   │   └── TableauDeBord.jsx
│   │   ├── ListeArticles.jsx
│   │   ├── PageAccueil.jsx
│   │   ├── PageAdmin.jsx
│   │   ├── PageConnexion.jsx
│   │   ├── PageInscription.jsx
│   │   └── PageNonTrouvee.jsx
│   ├── services/               🌐 Appels API
│   │   └── api.js
│   ├── App.css
│   ├── App.jsx
│   ├── AppRoutes.jsx
│   ├── index.css
│   └── main.jsx
├── package.json                📦 Dépendances
├── vite.config.js              ⚙️ Configuration Vite
└── README.md        📖 Documentation
```

---

## 🛠️ Fiche Technique

| Aspect | Détails |
| --- | --- |
| **Framework** | React 18, Vite 🚀 |
| **Style** | Tailwind CSS 🎨 |
| **Authentification** | JWT via API REST 🔒 |
| **API Client** | Axios pour appels REST 🌐 |
| **Environnement** | Node.js 16+, Ubuntu 20.04+ 🐧 |

---

## 🎯 Fonctionnalités Clés

- **Page d’accueil** (`PageAccueil.jsx`) : Liste des articles avec navigation (« suivant »/« précédent »).
- **Consultation** : Détails des articles (`ArticleDetail.jsx`) et filtrage par catégorie (`ListeArticles.jsx`).
- **Rôles utilisateurs** :
  - **Visiteurs** : Consultation sans connexion.
  - **Éditeurs** : Gestion articles/catégories (`GestionArticles.jsx`, `GestionCategories.jsx`).
  - **Admins** : Gestion utilisateurs/jetons (`GestionUtilisateurs.jsx`, `GestionJetons.jsx`).
- **Authentification** : Connexion/inscription (`PageConnexion.jsx`, `PageInscription.jsx`) avec JWT.
- **Protection** : Routes sécurisées via `ProtectedRoute.jsx` et contexte `AuthContexte.jsx`.

---

## 🛠️ Installation

1. **Cloner le projet** :

   ```bash
   git clone https://github.com/Atinkene/luXew.git
   cd luXew/frontend
   ```

2. **Installer les dépendances** :

   ```bash
   npm install
   ```

3. **Configurer l’environnement** :

   - Créez `.env` à partir de `.env.example` et ajoutez l’URL du backend :

     ```env
     VITE_API_URL=http://localhost/luXew/backend/public/api
     ```

4. **Lancer le serveur** :

   ```bash
   npm run dev
   ```

   Accédez à `http://localhost:5173`.

---

## 🌐 Tester le Frontend

- **Page d’accueil** : Visitez `http://localhost:5173` pour voir la liste des articles.
- **Connexion** : Testez avec `admin@luxew.com`/`passer123` sur `/connexion`.
- **Gestion** : Connectez-vous en tant qu’éditeur/admin pour tester la création/modification d’articles, catégories, ou utilisateurs.
- **API REST** : Vérifiez les appels dans `src/services/api.js` via la console du navigateur ou Postman.

---

## 🐞 Dépannage

- **Erreur de connexion API** : Vérifiez `VITE_API_URL` dans `.env` et assurez-vous que le backend est lancé.
- **Erreur 401** : Confirmez le jeton JWT via l’API `/api/auth/login`.
- **Logs** : Consultez la console du navigateur (F12).

---

## 🎉 Conclusion

Le frontend de **luXew** offre une interface moderne et réactive pour une expérience utilisateur élégante. Testez, explorez, et plongez dans notre code ! 🌟 Contactez-nous pour toute question ! 📩