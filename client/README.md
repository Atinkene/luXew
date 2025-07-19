# 📖 README.md pour l'Application Client Python de luXew 🌟

Bienvenue dans l’application client de **luXew** ! 🎉 Cette application Python, utilisant **Tkinter** pour l’interface et **zeep** pour les appels SOAP, permet aux administrateurs de gérer les utilisateurs via le service SOAP du backend. Ce README vous guide pour installer, configurer et tester l’application. 😎

---

## 🚀 Aperçu du Projet

L’application client Python authentifie les administrateurs et permet la gestion des utilisateurs (création, liste, modification, suppression) en invoquant le service SOAP du backend. Elle est conçue pour être simple, robuste, et intégrée avec le WSDL du backend.

---

## 📂 Structure du Projet

```plaintext
client/
├── services/                   🌐 Client SOAP
│   └── serviceSoap.py
├── utilitaires/                🛠️ Gestion des erreurs
│   ├── exceptions.py
│   ├── gestionExceptions.py
│   └── utilitairesTkinter.py
├── vues/                       🖼️ Interfaces Tkinter
│   ├── ecranConnexion.py
│   ├── ecranGestionUtilisateurs.py
├── main.py                     🚪 Point d’entrée
└── README.md          📖 Documentation
```

---

## 🛠️ Fiche Technique

| Aspect | Détails |
| --- | --- |
| **Langage** | Python 3.8+ 🐍 |
| **Interface** | Tkinter 🖼️ |
| **Client SOAP** | Zeep pour appels SOAP 🌐 |
| **Environnement** | Ubuntu 20.04+ (ou compatible) 🐧 |

---

## 🎯 Fonctionnalités Clés

- **Authentification** : Connexion des admins via SOAP (`authentifierUtilisateur`).
- **Gestion des utilisateurs** : Création, liste, modification, suppression via SOAP.
- **Interface** : Écrans Tkinter pour connexion (`ecranConnexion.py`) et gestion (`ecranGestionUtilisateurs.py`).
- **Gestion des erreurs** : Exceptions personnalisées (`utilitaires/exceptions.py`) et utilitaires Tkinter.

---

## 🛠️ Installation

1. **Cloner le projet** :

   ```bash
   git clone https://github.com/votre-repo/luXew.git
   cd luXew/client
   ```

2. **Installer les dépendances** :

   ```bash
   pip install zeep tkinter
   ```

3. **Configurer le client SOAP** :

   - Mettez à jour `services/serviceSoap.py` avec l’URL du WSDL :

     ```python
     from zeep import Client
     client = Client('http://localhost/luXew/backend/public/wsdl/ServicesSoap.wsdl')
     ```

4. **Lancer l’application** :

   ```bash
   python main.py
   ```

---

## 🌐 Tester l’Application

- **Connexion** : Lancez `main.py`, entrez `admin@luxew.com`/`passer123` dans `ecranConnexion.py`.
- **Gestion** : Testez l’ajout, la modification, ou la suppression d’utilisateurs dans `ecranGestionUtilisateurs.py`.
- **SOAP** : Vérifiez les appels SOAP via `serviceSoap.py` (ex. : `client.service.authentifierUtilisateur`).

---

## 🐞 Dépannage

- **Erreur SOAP** : Vérifiez l’URL du WSDL et la disponibilité du backend (`http://localhost/luXew/backend/public/soap`).
- **Erreur Tkinter** : Assurez-vous que `tkinter` est installé (`pip install tk`).
- **Logs** : Ajoutez des prints dans `serviceSoap.py` pour déboguer.

---

## 🎉 Conclusion

L’application client Python de **luXew** est une interface intuitive pour gérer les utilisateurs via SOAP. Testez-la et découvrez sa simplicité ! 🌟 Contactez-nous pour toute question ! 📩