from utilitaires.exceptions import TokenExpireException, ErreurAuthentification, ErreurConnexion
from utilitaires.utilitairesTkinter import afficherErreur

def gerer_exception(exception, app):
    
    if isinstance(exception, TokenExpireException):
        afficherErreur("Session expirée", "Votre session a expiré, veuillez vous reconnecter.")
        # Réinitialiser le token
        app.token = None
        # Retourner à l'écran de connexion
        app.afficher_ecran(EcranConnexion)
    
    elif isinstance(exception, ErreurAuthentification):
        afficherErreur("Erreur d'authentification", str(exception))
    
    elif isinstance(exception, ErreurConnexion):
        afficherErreur("Erreur de connexion", str(exception))
    
    else:
        # Pour toutes les autres exceptions
        afficherErreur("Erreur", f"Une erreur inattendue s'est produite: {str(exception)}")
        print(f"Exception non gérée: {type(exception).__name__}: {str(exception)}")  # Pour le debug