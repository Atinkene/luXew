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
                return self.token
            else:
                raise ErreurAuthentification(reponse.message)
        except ErreurAuthentification:
            raise
        except Exception as e:
            if 'token expiré' in str(e).lower():
                raise TokenExpireException("Token expiré")
            raise ErreurConnexion(f"Erreur lors de l'authentification: {str(e)}")
    
    def listerRoles(self, jeton=None):
        """Lister tous les rôles disponibles"""
        if not self.client:
            self.connecter()
        
        token_to_use = jeton or self.token
        if not token_to_use:
            raise ErreurAuthentification("Non authentifié - token manquant")
        
        try:
            response = self.client.service.listerRoles(jeton=token_to_use)
            
            # Gestion flexible de la structure de réponse
            if hasattr(response, 'roles'):
                if hasattr(response.roles, 'item'):
                    # Structure attendue: response.roles.item
                    return response.roles.item if response.roles.item else []
                elif isinstance(response.roles, list):
                    # Si roles est directement une liste
                    return response.roles
                else:
                    # Si roles contient un seul élément
                    return [response.roles] if response.roles else []
            elif hasattr(response, 'item'):
                # Si response a directement un attribut item
                return response.item if response.item else []
            elif isinstance(response, list):
                # Si response est directement une liste
                return response
            else:
                # Dernière tentative - convertir en liste
                return [response] if response else []
                
        except Exception as e:
            if 'token expiré' in str(e).lower() or 'expired' in str(e).lower():
                raise TokenExpireException("Token expiré")
            raise ErreurConnexion(f"Erreur lors de la récupération des rôles: {str(e)}")
    
    def listerUtilisateurs(self, jeton=None):
        """Lister tous les utilisateurs"""
        if not self.client:
            self.connecter()
        
        token_to_use = jeton or self.token
        if not token_to_use:
            raise ErreurAuthentification("Non authentifié - token manquant")
        
        try:
            response = self.client.service.listerUtilisateurs(token_to_use)
            
            # Vérification du type de réponse
            if isinstance(response, str):
                raise ErreurConnexion(f"Réponse SOAP inattendue : {response}")
            
            # Gestion flexible de la structure de réponse
            if hasattr(response, 'utilisateurs'):
                if hasattr(response.utilisateurs, 'item'):
                    # Structure attendue: response.utilisateurs.item
                    return response.utilisateurs.item if response.utilisateurs.item else []
                elif isinstance(response.utilisateurs, list):
                    # Si utilisateurs est directement une liste
                    return response.utilisateurs
                else:
                    # Si utilisateurs contient un seul élément
                    return [response.utilisateurs] if response.utilisateurs else []
            elif hasattr(response, 'item'):
                # Si response a directement un attribut item
                return response.item if response.item else []
            elif isinstance(response, list):
                # Si response est directement une liste
                return response
            else:
                # Aucune structure reconnue
                print(f"Warning: Structure de réponse non reconnue: {type(response)}")
                return []
                
        except Exception as e:
            if 'token expiré' in str(e).lower() or 'expired' in str(e).lower():
                raise TokenExpireException("Token expiré")
            raise ErreurConnexion(f"Erreur lors de la récupération des utilisateurs: {str(e)}")
    
    def ajouterUtilisateur(self, jeton, pseudo, email, motDePasse, role='visiteur'):
        if not self.client:
            self.connecter()
        
        if not jeton:
            raise ErreurAuthentification("Non authentifié - token manquant")
        
        try:
            return self.client.service.ajouterUtilisateur(jeton, pseudo, email, motDePasse, role)
        except Exception as e:
            if 'token expiré' in str(e).lower() or 'expired' in str(e).lower():
                raise TokenExpireException("Token expiré")
            raise ErreurConnexion(f"Erreur lors de l'ajout de l'utilisateur: {str(e)}")
    
    def modifierUtilisateur(self, jeton, idUtilisateur, nouveauPseudo, nouvelEmail, role=''):
        if not self.client:
            self.connecter()
        
        if not jeton:
            raise ErreurAuthentification("Non authentifié - token manquant")
        
        try:
            return self.client.service.modifierUtilisateur(jeton, idUtilisateur, nouveauPseudo, nouvelEmail, role)
        except Exception as e:
            if 'token expiré' in str(e).lower() or 'expired' in str(e).lower():
                raise TokenExpireException("Token expiré")
            raise ErreurConnexion(f"Erreur lors de la modification de l'utilisateur: {str(e)}")
    
    def supprimerUtilisateur(self, jeton, idUtilisateur):
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
        self.token = None
        self.client = None