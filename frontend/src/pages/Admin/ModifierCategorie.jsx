import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function ModifierCategorie() {
  const { id } = useParams();
  const [libelle, setLibelle] = useState('');
  const [notification, setNotification] = useState(null);
  const navigate = useNavigate();

  // Notification component
  const Notification = ({ message, type, onClose }) => {
    useEffect(() => {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }, [onClose]);

    const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
    
    return (
      <div className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50`}>
        <div className="flex items-center justify-between">
          <span>{message}</span>
          <button 
            onClick={onClose}
            className="ml-4 text-white hover:text-gray-200"
          >
            ×
          </button>
        </div>
      </div>
    );
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
  };

  const closeNotification = () => {
    setNotification(null);
  };

  // API retry utility
  const apiWithRetry = async (apiCall, retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        return await apiCall();
      } catch (error) {
        if (i === retries - 1) throw error;
        console.log(`Tentative ${i + 1} échouée, retry dans ${1000 * (i + 1)}ms`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  };

  // Handle API errors
  const handleApiError = (error, defaultMessage = 'Une erreur est survenue') => {
    console.error('Erreur API:', error);
    let message = defaultMessage;
    if (error.response) {
      switch (error.response.status) {
        case 401: message = 'Session expirée. Veuillez vous reconnecter.'; break;
        case 403: message = 'Vous n\'avez pas les permissions nécessaires.'; break;
        case 404: message = 'Ressource non trouvée.'; break;
        case 422: message = 'Données invalides. Veuillez vérifier les informations saisies.'; break;
        case 500: message = 'Erreur serveur. Veuillez réessayer plus tard.'; break;
        default: message = error.response.data?.message || defaultMessage;
      }
    } else if (error.request) {
      message = 'Problème de connexion. Vérifiez votre connexion internet.';
    }
    showNotification(message, 'error');
  };

  useEffect(() => {
    const loadCategory = async () => {
      try {
        const response = await apiWithRetry(() => api.get(`/categories/${id}`));
        setLibelle(response.data.libelle);
      } catch (error) {
        handleApiError(error, 'Erreur lors du chargement de la catégorie');
      }
    };
    loadCategory();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!libelle.trim()) {
      showNotification('Le libellé est obligatoire', 'error');
      return;
    }
    try {
      await apiWithRetry(() => api.put(`/categories/${id}`, { libelle }));
      showNotification('Catégorie modifiée avec succès', 'success');
      setTimeout(() => navigate('/admin/categories'), 1000);
    } catch (error) {
      handleApiError(error, 'Erreur lors de la modification de la catégorie');
    }
  };

  return (
    <div className="p-6">
      {notification && (
        <Notification 
          message={notification.message} 
          type={notification.type} 
          onClose={closeNotification}
        />
      )}
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Modifier la catégorie</h1>
      <div className="bg-white rounded-lg shadow p-6 max-w-md">
        <form onSubmit={handleSubmit}>
          <label className="block mb-2">
            Libellé :
            <input
              type="text"
              value={libelle}
              onChange={e => setLibelle(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>
          <div className="mt-4 flex gap-2">
            <button 
              type="submit" 
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Enregistrer
            </button>
            <button 
              type="button" 
              onClick={() => navigate('/admin/categories')}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}