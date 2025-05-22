# 📰 luXew App – Plateforme d’Actualités MVC

## 📌 Description

**luXew** est une application web construite selon l’architecture **MVC (Modèle-Vue-Contrôleur)**.  
Elle permet aux utilisateurs de :

- 🔐 S’inscrire et se connecter
- ✍️ Créer, modifier et supprimer des articles
- 💬 Commenter les articles
- 🧭 Naviguer dans une interface responsive claire et moderne

---

## ⚙️ Fonctionnalités Principales

- ✅ Authentification des utilisateurs (inscription / connexion)
- 📝 Gestion complète des articles (CRUD)
- 💬 Gestion des commentaires
- 📱 Interface responsive en CSS
- 🧱 Architecture propre et modulaire en MVC

---

## 🗂️ Structure du Projet
```bash
news-app
├── config
│ └── database.php # Paramètres de connexion à la base de données
├── controllers
│ ├── ArticleController.php # Gère les articles
│ ├── AuthController.php # Gère l’authentification
│ ├── CommentController.php # Gère les commentaires
│ └── UserController.php # Gère les utilisateurs
├── models
│ ├── Article.php # Modèle pour la table Article
│ ├── Comment.php # Modèle pour les Commentaires
│ ├── Reaction.php # Modèle pour les Réactions
│ └── User.php # Modèle pour les Utilisateurs
├── views
│ ├── articles
│ │ ├── create.php # Formulaire de création
│ │ ├── edit.php # Formulaire d’édition
│ │ ├── index.php # Liste des articles
│ │ └── show.php # Détail d’un article
│ ├── auth
│ │ ├── login.php # Formulaire de connexion
│ │ └── register.php # Formulaire d’inscription
│ └── layouts
│ └── main.php # Layout global (header/footer)
├── public
│ ├── css
│ │ └── style.css # Styles personnalisés
│ ├── js
│ │ └── main.js # Scripts JavaScript
│ └── index.php # Point d’entrée principal
├── .htaccess # Réécriture d’URL Apache
└── README.md # Documentation du projet
```
---

## 🚀 Installation

1. **Cloner** le dépôt :
   ```bash
   git clone https://github.com/Atinkene/luXew.git
