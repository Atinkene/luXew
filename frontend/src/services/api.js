// api.js - Version corrigée
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost/luXew/backend/public',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur de requête
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwt');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur de réponse
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Gérer les erreurs 401 (non autorisé)
    console.log(response);
    
    // if (error.response?.status === 401) {
    //   // Nettoyer les données d'auth
    //   localStorage.removeItem('jwt');
    //   localStorage.removeItem('utilisateur');
      
    //   // Rediriger vers la page de connexion seulement si on n'y est pas déjà
    //   // if (window.location.pathname !== '/connexion') {
    //   //   window.location.href = '/connexion';
    //   // }
    // }
    
    return Promise.reject(error);
  }
);

// Fonctions d'API existantes...
export const connecter = (donnees) => api.post('/connexion', donnees);
export const inscrire = (donnees) => api.post('/inscription', donnees);
export const deconnecter = () => api.post('/deconnexion');
export const listerJetons = () => api.get('/jetons');
export const genererJeton = (data) => api.post('/jetons/creer', data);
export const supprimerJeton = (data) => api.post('/jetons/supprimer', data);

// Articles
export const listerArticles = () => api.get('/articles');
export const afficherArticle = (id) => api.get(`/articles/${id}`);
export const creerArticle = (donnees) => {
  console.log("Données envoyées pour création article :", donnees);
  return api.post('/articles/creer', donnees, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const modifierArticle = (id, donnees) => {
  console.log("Données envoyées pour modification article :", donnees);
  return api.post(`/articles/${id}/modifier`, donnees, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};
export const supprimerArticle = (id) => api.post(`/articles/${id}/supprimer`);

// Catégories
export const listerCategories = () => api.get('/categories');
export const obtenirArticlesParCategorie = (id) => api.get(`/categories/${id}/articles`);
export const creerCategorie = (donnees) => api.post('/categories/creer', donnees);
export const modifierCategorie = (donnees) => api.post(`/categories/modifier`, donnees);
export const supprimerCategorie = (id) => api.delete(`/categories/${id}/supprimer`);

// Commentaires
export const obtenirCommentaires = (articleId) => api.get(`/commentaires/${articleId}`);
export const ajouterCommentaire = (donnees) => api.post('/commentaires/creer', donnees);
export const modifierCommentaire = (id, donnees) => api.post(`/commentaires/${id}/modifier`, donnees);
export const supprimerCommentaire = (id) => api.delete(`/commentaires/${id}/supprimer`);

// Réactions
export const obtenirStatistiquesReactions = (articleId, commentaireId) =>
  api.get(`/reactions/${articleId ? `article/${articleId}` : `commentaire/${commentaireId}`}`);
export const obtenirReactionUtilisateur = (articleId, commentaireId) =>
  api.get(`/reactions/utilisateur/${articleId ? `article/${articleId}` : `commentaire/${commentaireId}`}`);
export const ajouterReaction = (donnees) => api.post('/reactions/creer', donnees);
export const supprimerReaction = (id) => api.delete(`/reactions/${id}/supprimer`);

// Utilisateurs
export const listerUtilisateurs = () => api.get('/utilisateurs');
export const ajouterUtilisateur = (donnees) => api.post('/utilisateurs/creer', donnees);
export const modifierUtilisateur = (donnees) => {
  console.log("Données envoyées pour modifier l'utilisateur :", donnees);
  return api.post('/utilisateurs/modifier', donnees);
};

export const supprimerUtilisateur = (donnees) => api.post('/utilisateurs/supprimer', donnees);
export const listerRoles = () => api.get('/roles');

export default api;