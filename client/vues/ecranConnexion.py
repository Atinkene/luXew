import tkinter as tk
from tkinter import ttk
from utilitaires.gestionExceptions import gerer_exception
from utilitaires.utilitairesTkinter import afficherErreur
from utilitaires.exceptions import TokenExpireException

class EcranConnexion(ttk.Frame):
    def __init__(self, parent, app):
        super().__init__(parent)
        self.app = app
        self.serviceSoap = app.serviceSoap
        self.pack(fill='both', expand=True)
        self.creer_widgets()
    
    def creer_widgets(self):
        # Create a container frame to center content
        container = ttk.Frame(self)
        container.pack(expand=True)  # Center the container in the parent frame

        # Add widgets to the container
        ttk.Label(container, text="Connexion", style='Header.TLabel').pack(pady=20)

        ttk.Label(container, text="Pseudo:").pack(pady=5)
        self.entryPseudo = ttk.Entry(container, width=30)
        self.entryPseudo.pack(ipady=5)

        ttk.Label(container, text="Mot de passe:").pack(pady=5)
        self.entryMotDePasse = ttk.Entry(container, show="*", width=30)
        self.entryMotDePasse.pack(ipady=5)

        ttk.Button(container, text="Se connecter", command=self.se_connecter).pack(pady=20)
    
    def se_connecter(self):
        pseudo = self.entryPseudo.get().strip()
        mdp = self.entryMotDePasse.get().strip()
        
        if not pseudo or not mdp:
            afficherErreur("Erreur", "Veuillez remplir tous les champs")
            return
        
        try:
            token = self.serviceSoap.authentifier(pseudo, mdp)
            if token:
                self.app.naviguer_vers_gestion_utilisateur(token)
        except Exception as e:
            gerer_exception(e, self.app)