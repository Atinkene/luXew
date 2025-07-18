// AuthContexte.jsx - Version corrigée
import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [utilisateur, setUtilisateur] = useState(null);
  const [token, setToken] = useState(null);
  const [estCharge, setEstCharge] = useState(false);

  useEffect(() => {
    const initAuth = () => {
      const jwt = localStorage.getItem('jwt');
      const userData = localStorage.getItem('utilisateur');
      
      if (jwt && userData) {
        try {
          const parsedUser = JSON.parse(userData);
          api.defaults.headers.common['Authorization'] = `Bearer ${jwt}`;
          setToken(jwt);
          setUtilisateur(parsedUser);
        } catch (error) {
          console.error('Erreur lors de la lecture des données utilisateur:', error);
          // Nettoyer les données corrompues
          localStorage.removeItem('jwt');
          localStorage.removeItem('utilisateur');
        }
      }
      setEstCharge(true);
    };

    initAuth();
  }, []);

  const connexion = async (pseudo, motDePasse) => {
    try {
      const response = await api.post('/connexion', { pseudo, motDePasse });
      const { jwt, utilisateurId, pseudo: nom, roles } = response.data;
      
      const utilisateur = {
        id: utilisateurId,
        pseudo: nom,
        roles,
      };
      
      console.log('Connexion réussie:', utilisateur);
      console.log('Jeton reçu:', jwt);
      
      localStorage.setItem('jwt', jwt);
      localStorage.setItem('utilisateur', JSON.stringify(utilisateur));
      
      setToken(jwt);
      setUtilisateur(utilisateur);
      
      api.defaults.headers.common['Authorization'] = `Bearer ${jwt}`;
      
      return true;
    } catch (error) {
      throw new Error(error.response?.data?.erreur || 'Erreur de connexion');
    }
  };

  const inscription = async (pseudo, email, motDePasse, role) => {
    try {
      const response = await api.post('/inscription', { 
        pseudo, 
        email, 
        motDePasse,
        role
      });
      
      console.log('Réponse de l\'inscription:', response.data);
      const { jwt, utilisateurId } = response.data;
      
      const utilisateur = {
        id: utilisateurId,
        pseudo,
        roles: ['visiteur'],
      };
      
      console.log('Inscription réussie:', utilisateur);
      console.log('Jeton reçu:', jwt);
      
      localStorage.setItem('jwt', jwt);
      localStorage.setItem('utilisateur', JSON.stringify(utilisateur));
      
      setToken(jwt);
      setUtilisateur(utilisateur);
      
      api.defaults.headers.common['Authorization'] = `Bearer ${jwt}`;
      
      return true;
    } catch (error) {
      // Tentative avec 'password' si 'motDePasse' ne fonctionne pas
      if (error.response?.data?.erreur?.includes('manquant')) {
        try {
          const response = await api.post('/inscription', { 
            pseudo, 
            email, 
            password: motDePasse
          });
          
          console.log('Réponse de l\'inscription (avec password):', response.data);
          const { jwt, utilisateurId } = response.data;
          
          const utilisateur = {
            id: utilisateurId,
            pseudo,
            roles: ['visiteur'],
          };
          
          localStorage.setItem('jwt', jwt);
          localStorage.setItem('utilisateur', JSON.stringify(utilisateur));
          
          setToken(jwt);
          setUtilisateur(utilisateur);
          
          api.defaults.headers.common['Authorization'] = `Bearer ${jwt}`;
          
          return true;
        } catch (secondError) {
          throw new Error(secondError.response?.data?.erreur || 'Erreur d\'inscription');
        }
      }
      throw new Error(error.response?.data?.erreur || 'Erreur d\'inscription');
    }
  };

  const deconnexion = async () => {
    try {
      await api.post('/deconnexion');
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
    } finally {
      // Nettoyer même si la requête échoue
      localStorage.removeItem('jwt');
      localStorage.removeItem('utilisateur');
      setToken(null);
      setUtilisateur(null);
      delete api.defaults.headers.common['Authorization'];
    }
  };

  return (
    <AuthContext.Provider value={{ 
      utilisateur, 
      token, 
      estCharge, 
      connexion, 
      inscription, 
      deconnexion 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};