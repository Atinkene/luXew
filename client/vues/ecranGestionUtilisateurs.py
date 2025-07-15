import tkinter as tk
from tkinter import ttk
from utilitaires.utilitairesTkinter import afficherErreur, afficherInfo, demanderConfirmation
from utilitaires.gestionExceptions import gerer_exception
from vues.ecranConnexion import EcranConnexion

class EcranGestionUtilisateurs(ttk.Frame):
    def __init__(self, master, token, serviceSoap):
        super().__init__(master)
        self.master = master
        self.token = token
        self.serviceSoap = serviceSoap
        self.pack(fill='both', expand=True, padx=20, pady=20)
        self.creerInterface()
        self.listerUtilisateurs()

    def creerInterface(self):
        # Titre principal
        titre = ttk.Label(self, text="Gestion des Utilisateurs", style='Header.TLabel')
        titre.pack(pady=10)

        # Treeview pour la liste des utilisateurs
        colonnes = ("id", "pseudo", "email")
        self.treeUtilisateurs = ttk.Treeview(self, columns=colonnes, show="headings", height=10)
        for col in colonnes:
            self.treeUtilisateurs.heading(col, text=col.capitalize())
            self.treeUtilisateurs.column(col, width=150)
        
        # Scrollbar pour le Treeview
        scrollbar = ttk.Scrollbar(self, orient="vertical", command=self.treeUtilisateurs.yview)
        self.treeUtilisateurs.configure(yscrollcommand=scrollbar.set)
        
        # Frame pour contenir le Treeview et la scrollbar
        tree_frame = ttk.Frame(self)
        tree_frame.pack(fill="x", padx=10, pady=10)
        
        self.treeUtilisateurs.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")
        
        # Bouton actualiser
        ttk.Button(self, text="Actualiser la liste", command=self.listerUtilisateurs).pack(pady=5)

        # Cadre ajout utilisateur
        cadreAjout = ttk.LabelFrame(self, text="Ajouter un Utilisateur", padding=10)
        cadreAjout.pack(fill="x", padx=10, pady=10)

        ttk.Label(cadreAjout, text="Pseudo:").grid(row=0, column=0, sticky="w", padx=5, pady=2)
        self.champPseudoAjout = ttk.Entry(cadreAjout, width=30)
        self.champPseudoAjout.grid(row=0, column=1, padx=5, pady=2)

        ttk.Label(cadreAjout, text="Email:").grid(row=1, column=0, sticky="w", padx=5, pady=2)
        self.champEmailAjout = ttk.Entry(cadreAjout, width=30)
        self.champEmailAjout.grid(row=1, column=1, padx=5, pady=2)

        ttk.Label(cadreAjout, text="Mot de passe:").grid(row=2, column=0, sticky="w", padx=5, pady=2)
        self.champMotDePasseAjout = ttk.Entry(cadreAjout, show="*", width=30)
        self.champMotDePasseAjout.grid(row=2, column=1, padx=5, pady=2)

        ttk.Button(cadreAjout, text="Ajouter", command=self.ajouterUtilisateur).grid(row=3, column=0, columnspan=2, pady=10)

        # Cadre modification
        cadreModif = ttk.LabelFrame(self, text="Modifier un Utilisateur", padding=10)
        cadreModif.pack(fill="x", padx=10, pady=10)

        ttk.Label(cadreModif, text="ID Utilisateur:").grid(row=0, column=0, sticky="w", padx=5, pady=2)
        self.champIdModif = ttk.Entry(cadreModif, width=30)
        self.champIdModif.grid(row=0, column=1, padx=5, pady=2)

        ttk.Label(cadreModif, text="Nouveau Pseudo:").grid(row=1, column=0, sticky="w", padx=5, pady=2)
        self.champPseudoModif = ttk.Entry(cadreModif, width=30)
        self.champPseudoModif.grid(row=1, column=1, padx=5, pady=2)

        ttk.Label(cadreModif, text="Nouvel Email:").grid(row=2, column=0, sticky="w", padx=5, pady=2)
        self.champEmailModif = ttk.Entry(cadreModif, width=30)
        self.champEmailModif.grid(row=2, column=1, padx=5, pady=2)

        ttk.Button(cadreModif, text="Modifier", command=self.modifierUtilisateur).grid(row=3, column=0, columnspan=2, pady=10)

        # Cadre suppression
        cadreSupp = ttk.LabelFrame(self, text="Supprimer un Utilisateur", padding=10)
        cadreSupp.pack(fill="x", padx=10, pady=10)

        ttk.Label(cadreSupp, text="ID Utilisateur:").grid(row=0, column=0, sticky="w", padx=5, pady=2)
        self.champIdSupp = ttk.Entry(cadreSupp, width=30)
        self.champIdSupp.grid(row=0, column=1, padx=5, pady=2)

        ttk.Button(cadreSupp, text="Supprimer", command=self.supprimerUtilisateur).grid(row=1, column=0, columnspan=2, pady=10)

        # Bouton de déconnexion
        ttk.Button(self, text="Déconnexion", command=self.deconnecter).pack(pady=10)

    def listerUtilisateurs(self):
        try:
            utilisateurs = self.serviceSoap.listerUtilisateurs(self.token)
            # Vider la liste actuelle
            for item in self.treeUtilisateurs.get_children():
                self.treeUtilisateurs.delete(item)
            
            # Ajouter les nouveaux utilisateurs
            for u in utilisateurs:
                self.treeUtilisateurs.insert("", "end", values=(
                    getattr(u, "id", "N/A"),
                    getattr(u, "pseudo", "N/A"),
                    getattr(u, "email", "N/A")
                ))
        except Exception as e:
            gerer_exception(e, self.master)

    def ajouterUtilisateur(self):
        pseudo = self.champPseudoAjout.get().strip()
        email = self.champEmailAjout.get().strip()
        motDePasse = self.champMotDePasseAjout.get().strip()

        if not pseudo or not email or not motDePasse:
            afficherErreur("Erreur", "Veuillez remplir tous les champs pour l'ajout.")
            return

        try:
            reponse = self.serviceSoap.ajouterUtilisateur(self.token, pseudo, email, motDePasse)
            if getattr(reponse, "succes", False):
                afficherInfo("Succès", f"Utilisateur ajouté (ID: {getattr(reponse, 'utilisateurId', 'N/A')})")
                # Vider les champs
                self.champPseudoAjout.delete(0, "end")
                self.champEmailAjout.delete(0, "end")
                self.champMotDePasseAjout.delete(0, "end")
                self.listerUtilisateurs()
            else:
                afficherErreur("Erreur", getattr(reponse, "message", "Erreur lors de l'ajout."))
        except Exception as e:
            gerer_exception(e, self.master)

    def modifierUtilisateur(self):
        idUtilisateur = self.champIdModif.get().strip()
        nouveauPseudo = self.champPseudoModif.get().strip()
        nouvelEmail = self.champEmailModif.get().strip()

        if not idUtilisateur:
            afficherErreur("Erreur", "Veuillez entrer l'ID utilisateur à modifier.")
            return
        if not nouveauPseudo and not nouvelEmail:
            afficherErreur("Erreur", "Veuillez remplir au moins un champ à modifier.")
            return

        try:
            reponse = self.serviceSoap.modifierUtilisateur(self.token, idUtilisateur, nouveauPseudo, nouvelEmail)
            if getattr(reponse, "succes", False):
                afficherInfo("Succès", "Utilisateur modifié avec succès.")
                # Vider les champs
                self.champIdModif.delete(0, "end")
                self.champPseudoModif.delete(0, "end")
                self.champEmailModif.delete(0, "end")
                self.listerUtilisateurs()
            else:
                afficherErreur("Erreur", getattr(reponse, "message", "Erreur lors de la modification."))
        except Exception as e:
            gerer_exception(e, self.master)

    def supprimerUtilisateur(self):
        idUtilisateur = self.champIdSupp.get().strip()
        if not idUtilisateur:
            afficherErreur("Erreur", "Veuillez entrer l'ID utilisateur à supprimer.")
            return

        if not demanderConfirmation("Confirmation", f"Supprimer l'utilisateur ID {idUtilisateur} ?"):
            return

        try:
            reponse = self.serviceSoap.supprimerUtilisateur(self.token, idUtilisateur)
            if getattr(reponse, "succes", False):
                afficherInfo("Succès", "Utilisateur supprimé avec succès.")
                self.champIdSupp.delete(0, "end")
                self.listerUtilisateurs()
            else:
                afficherErreur("Erreur", getattr(reponse, "message", "Erreur lors de la suppression."))
        except Exception as e:
            gerer_exception(e, self.master)

    def deconnecter(self):
        """Retourne à l'écran de connexion"""
        try:
            # Nettoyer le token
            if hasattr(self.master, 'token'):
                self.master.token = None
            
            # Appeler la méthode de déconnexion du service si elle existe
            if hasattr(self.serviceSoap, 'deconnecter'):
                self.serviceSoap.deconnecter()
            
            # Trouver la fenêtre racine qui contient la méthode afficher_ecran
            widget = self.master
            while widget and not hasattr(widget, 'afficher_ecran'):
                widget = widget.master
            
            if widget and hasattr(widget, 'afficher_ecran'):
                widget.afficher_ecran(EcranConnexion)
            else:
                # Fallback: détruire la fenêtre actuelle et créer une nouvelle
                self.master.destroy()
                # Vous devrez adapter cette partie selon votre architecture
                print("Déconnexion effectuée - veuillez redémarrer l'application")
                
        except Exception as e:
            print(f"Erreur lors de la déconnexion: {e}")
            # En cas d'erreur, au moins nettoyer et fermer
            self.master.destroy()