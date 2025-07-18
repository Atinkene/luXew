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
        self.roles = []
        self.pack(fill='both', expand=True, padx=20, pady=20)
        self.creerInterface()
        self.chargerRoles()
        self.listerUtilisateurs()

    def creerInterface(self):
        # Titre principal
        ttk.Label(self, text="Gestion des Utilisateurs", style='Header.TLabel').pack(pady=10)

        # Treeview pour la liste des utilisateurs
        colonnes = ("id", "pseudo", "email", "roles")
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

        ttk.Label(cadreAjout, text="Rôle:").grid(row=3, column=0, sticky="w", padx=5, pady=2)
        self.comboRoleAjout = ttk.Combobox(cadreAjout, values=self.roles, state="readonly", width=27)
        self.comboRoleAjout.grid(row=3, column=1, padx=5, pady=2)
        self.comboRoleAjout.set("visiteur")  # Default role

        ttk.Button(cadreAjout, text="Ajouter", command=self.ajouterUtilisateur).grid(row=4, column=0, columnspan=2, pady=10)

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

        ttk.Label(cadreModif, text="Nouveau Rôle:").grid(row=3, column=0, sticky="w", padx=5, pady=2)
        self.comboRoleModif = ttk.Combobox(cadreModif, values=self.roles, state="readonly", width=27)
        self.comboRoleModif.grid(row=3, column=1, padx=5, pady=2)

        ttk.Button(cadreModif, text="Modifier", command=self.modifierUtilisateur).grid(row=4, column=0, columnspan=2, pady=10)

        # Cadre suppression
        cadreSupp = ttk.LabelFrame(self, text="Supprimer un Utilisateur", padding=10)
        cadreSupp.pack(fill="x", padx=10, pady=10)

        ttk.Label(cadreSupp, text="ID Utilisateur:").grid(row=0, column=0, sticky="w", padx=5, pady=2)
        self.champIdSupp = ttk.Entry(cadreSupp, width=30)
        self.champIdSupp.grid(row=0, column=1, padx=5, pady=2)

        ttk.Button(cadreSupp, text="Supprimer", command=self.supprimerUtilisateur).grid(row=1, column=0, columnspan=2, pady=10)

        # Bouton de déconnexion
        ttk.Button(self, text="Déconnexion", command=self.deconnecter).pack(pady=10)

    def chargerRoles(self):
        try:
            self.roles = self.serviceSoap.listerRoles(self.token)
            self.comboRoleAjout['values'] = self.roles
            self.comboRoleModif['values'] = self.roles
            if self.roles:
                self.comboRoleAjout.set(self.roles[0] if 'visiteur' not in self.roles else 'visiteur')
        except Exception as e:
            gerer_exception(e, self.master)
            self.roles = ['visiteur']  

    def listerUtilisateurs(self):
        try:
            utilisateurs = self.serviceSoap.listerUtilisateurs(self.token)
            for item in self.treeUtilisateurs.get_children():
                self.treeUtilisateurs.delete(item)
            
            for u in utilisateurs:
                roles = ", ".join(u.roles.item) if hasattr(u.roles, 'item') and u.roles.item else "Aucun"
                self.treeUtilisateurs.insert("", "end", values=(
                    getattr(u, "id", "N/A"),
                    getattr(u, "pseudo", "N/A"),
                    getattr(u, "email", "N/A"),
                    roles
                ))
        except Exception as e:
            gerer_exception(e, self.master)

    def ajouterUtilisateur(self):
        pseudo = self.champPseudoAjout.get().strip()
        email = self.champEmailAjout.get().strip()
        motDePasse = self.champMotDePasseAjout.get().strip()
        role = self.comboRoleAjout.get().strip()

        if not pseudo or not email or not motDePasse or not role:
            afficherErreur("Erreur", "Veuillez remplir tous les champs pour l'ajout.")
            return

        try:
            reponse = self.serviceSoap.ajouterUtilisateur(self.token, pseudo, email, motDePasse, role)
            if getattr(reponse, "succes", False):
                afficherInfo("Succès", f"Utilisateur ajouté (ID: {getattr(reponse, 'utilisateurId', 'N/A')})")
                self.champPseudoAjout.delete(0, "end")
                self.champEmailAjout.delete(0, "end")
                self.champMotDePasseAjout.delete(0, "end")
                self.comboRoleAjout.set(self.roles[0] if 'visiteur' not in self.roles else 'visiteur')
                self.listerUtilisateurs()
            else:
                afficherErreur("Erreur", getattr(reponse, "message", "Erreur lors de l'ajout."))
        except Exception as e:
            gerer_exception(e, self.master)

    def modifierUtilisateur(self):
        idUtilisateur = self.champIdModif.get().strip()
        nouveauPseudo = self.champPseudoModif.get().strip()
        nouvelEmail = self.champEmailModif.get().strip()
        nouveauRole = self.comboRoleModif.get().strip()

        if not idUtilisateur:
            afficherErreur("Erreur", "Veuillez entrer l'ID utilisateur à modifier.")
            return
        if not nouveauPseudo and not nouvelEmail and not nouveauRole:
            afficherErreur("Erreur", "Veuillez remplir au moins un champ à modifier.")
            return

        try:
            reponse = self.serviceSoap.modifierUtilisateur(self.token, idUtilisateur, nouveauPseudo, nouvelEmail, nouveauRole)
            if getattr(reponse, "succes", False):
                afficherInfo("Succès", "Utilisateur modifié avec succès.")
                self.champIdModif.delete(0, "end")
                self.champPseudoModif.delete(0, "end")
                self.champEmailModif.delete(0, "end")
                self.comboRoleModif.set("")
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
        try:
            if hasattr(self.master, 'token'):
                self.master.token = None
            if hasattr(self.serviceSoap, 'deconnecter'):
                self.serviceSoap.deconnecter()
            
            widget = self.master
            while widget and not hasattr(widget, 'afficher_ecran'):
                widget = widget.master
            
            if widget and hasattr(widget, 'afficher_ecran'):
                widget.afficher_ecran(EcranConnexion)
            else:
                self.master.destroy()
                print("Déconnexion effectuée - veuillez redémarrer l'application")
                
        except Exception as e:
            print(f"Erreur lors de la déconnexion: {e}")
            self.master.destroy()