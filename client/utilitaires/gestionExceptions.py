from tkinter import messagebox
from utilitaires.exceptions import ErreurConnexion, TokenExpireException, ErreurAuthentification

def gerer_exception(exception, app):
    if isinstance(exception, TokenExpireException):
        messagebox.showerror("Erreur", "Votre session a expiré. Veuillez vous reconnecter.")
        if hasattr(app, 'afficher_ecran'):
            app.afficher_ecran(EcranConnexion)
    elif isinstance(exception, ErreurAuthentification):
        messagebox.showerror("Erreur d'authentification", str(exception))
    elif isinstance(exception, ErreurConnexion):
        messagebox.showerror("Erreur de connexion", str(exception))
    else:
        messagebox.showerror("Erreur", f"Une erreur inattendue s'est produite : {str(exception)}")