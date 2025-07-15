import zeep
import requests
from zeep import Client, Settings
from zeep.transports import Transport
from utilitaires.exceptions import ErreurConnexion, TokenExpireException, ErreurAuthentification

class ServiceSoap:
    def __init__(self, url):
        self.service_url = url
        self.client = None
        self.token = None
    
    def tester_endpoint(self):
        try:
            response = requests.get(self.service_url, timeout=5)
            return response.status_code == 200
        except requests.exceptions.RequestException as e:
            raise ErreurConnexion(f"Erreur de connexion: {str(e)}")
    
    def connecter(self):
        settings = Settings(strict=False, xml_huge_tree=True)
        transport = Transport(timeout=10)
        
        if not self.tester_endpoint():
            raise ErreurConnexion(f"Le service SOAP n'est pas accessible à l'adresse {self.service_url}")
        
        self.client = Client(wsdl=self.service_url, transport=transport, settings=settings)
    
    def authentifier(self, pseudo, motDePasse):
        if not self.client:
            self.connecter()
        
        try:
            reponse = self.client.service.authentifierUtilisateur(pseudo=pseudo, motDePasse=motDePasse)
            if reponse.succes:
                self.token = reponse.jeton
                return self.token  # Retourner le token au lieu de True
            else:
                raise ErreurAuthentification(reponse.message)
        except ErreurAuthentification:
            raise  # Re-lancer l'exception d'authentification
        except Exception as e:
            if 'token expiré' in str(e).lower():
                raise TokenExpireException("Token expiré")
            raise ErreurConnexion(f"Erreur lors de l'authentification: {str(e)}")
    
    def listerUtilisateurs(self, jeton=None):
        """Lister tous les utilisateurs"""
        if not self.client:
            self.connecter()
        
        token_to_use = jeton or self.token
        if not token_to_use:
            raise ErreurAuthentification("Non authentifié - token manquant")
        
        try:
            return self.client.service.listerUtilisateurs(token_to_use)
        except Exception as e:
            if 'token expiré' in str(e).lower() or 'expired' in str(e).lower():
                raise TokenExpireException("Token expiré")
            raise ErreurConnexion(f"Erreur lors de la récupération des utilisateurs: {str(e)}")
    
    def ajouterUtilisateur(self, jeton, pseudo, email, motDePasse):
        """Ajouter un nouvel utilisateur"""
        if not self.client:
            self.connecter()
        
        if not jeton:
            raise ErreurAuthentification("Non authentifié - token manquant")
        
        try:
            return self.client.service.ajouterUtilisateur(jeton, pseudo, email, motDePasse)
        except Exception as e:
            if 'token expiré' in str(e).lower() or 'expired' in str(e).lower():
                raise TokenExpireException("Token expiré")
            raise ErreurConnexion(f"Erreur lors de l'ajout de l'utilisateur: {str(e)}")
    
    def modifierUtilisateur(self, jeton, idUtilisateur, nouveauPseudo, nouvelEmail):
        """Modifier un utilisateur existant"""
        if not self.client:
            self.connecter()
        
        if not jeton:
            raise ErreurAuthentification("Non authentifié - token manquant")
        
        try:
            return self.client.service.modifierUtilisateur(jeton, idUtilisateur, nouveauPseudo, nouvelEmail)
        except Exception as e:
            if 'token expiré' in str(e).lower() or 'expired' in str(e).lower():
                raise TokenExpireException("Token expiré")
            raise ErreurConnexion(f"Erreur lors de la modification de l'utilisateur: {str(e)}")
    
    def supprimerUtilisateur(self, jeton, idUtilisateur):
        """Supprimer un utilisateur"""
        if not self.client:
            self.connecter()
        
        if not jeton:
            raise ErreurAuthentification("Non authentifié - token manquant")
        
        try:
            return self.client.service.supprimerUtilisateur(jeton, idUtilisateur)
        except Exception as e:
            if 'token expiré' in str(e).lower() or 'expired' in str(e).lower():
                raise TokenExpireException("Token expiré")
            raise ErreurConnexion(f"Erreur lors de la suppression de l'utilisateur: {str(e)}")
    
    def deconnecter(self):
        """Réinitialiser le token et la connexion"""
        self.token = None
        self.client = None