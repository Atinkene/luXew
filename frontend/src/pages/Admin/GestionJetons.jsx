import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listerJetons, genererJeton, supprimerJeton } from '../../services/api';
import { useAuth } from '../../contexte/AuthContexte';

export default function GestionJetons() {
  const [jetons, setJetons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJetons, setSelectedJetons] = useState([]);
  const [notification, setNotification] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [dureeValidite, setDureeValidite] = useState(1);
  const navigate = useNavigate();
  const { utilisateur } = useAuth();

  useEffect(() => {
    if (!utilisateur || !utilisateur.roles.includes('admin')) {
      navigate('/connexion');
    }
  }, [utilisateur, navigate]);

  console.log(utilisateur);
  

  const Notification = ({ message, type, onClose }) => {
    useEffect(() => {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }, [onClose]);

    const bgColor = type === 'success' ? 'bg-orange-500' : 'bg-red-500';
    
    return (
      <div className={`fixed  inset-x-auto top-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50`}>
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

  const handleApiError = (error, defaultMessage = 'Une erreur est survenue') => {
    console.error('Erreur API:', error);
    let message = defaultMessage;
    if (error.response) {
      switch (error.response.status) {
        case 401: 
          message = 'Session expirée. Veuillez vous reconnecter.'; 
          navigate('/connexion');
          break;
        case 403: message = 'Vous n\'avez pas les permissions nécessaires.'; break;
        case 404: message = 'Ressource non trouvée.'; break;
        case 422: message = 'Données invalides. Veuillez vérifier les informations saisies.'; break;
        case 500: message = 'Erreur serveur. Veuillez réessayer plus tard.'; break;
        default: message = error.response.data?.erreur || defaultMessage;
      }
    } else if (error.request) {
      message = 'Problème de connexion. Vérifiez votre connexion internet.';
    }
    showNotification(message, 'error');
  };

  const loadJetons = async () => {
    setLoading(true);
    try {
      const response = await apiWithRetry(() => listerJetons());
      if (response.data && Array.isArray(response.data.jetons)) {
        setJetons(response.data.jetons);
      } else {
        throw new Error('Format de réponse invalide');
      }
    } catch (error) {
      handleApiError(error, 'Erreur lors du chargement des jetons');
      setJetons([]);
    } finally {
      setLoading(false);
    }
  };

  console.log(jetons);
  

  useEffect(() => {
    if (utilisateur?.roles.includes('admin')) {
      loadJetons();
    }
  }, [utilisateur]);

  const supprimerSingleJeton = async (jeton) => {
    // const confirmMessage = `Êtes-vous sûr de vouloir supprimer le jeton pour "${jeton.pseudo || jeton.utilisateurId}" ?\n\nCette action est irréversible.`;
    // if (!window.confirm(confirmMessage)) return;
  
    setJetons(prev => prev.map(j => j.jeton === jeton.jeton ? { ...j, deleting: true } : j));
    try {
      console.log('Deleting token:', jeton.jeton); // Debug log
      await apiWithRetry(() => supprimerJeton({ jeton: jeton.jeton }));
      setJetons(prev => prev.filter(j => j.jeton !== jeton.jeton));
      setSelectedJetons(prev => prev.filter(j => j !== jeton.jeton));
      showNotification(`Jeton pour "${jeton.pseudo || jeton.utilisateurId}" supprimé avec succès`, 'success');
    } catch (error) {
      setJetons(prev => prev.map(j => j.jeton === jeton.jeton ? { ...j, deleting: false } : j));
      handleApiError(error, 'Erreur lors de la suppression du jeton');
    }
  };
  
  const supprimerMultiples = async () => {
    if (selectedJetons.length === 0) return;
    const confirmMessage = `Êtes-vous sûr de vouloir supprimer ${selectedJetons.length} jeton(s) sélectionné(s) ?\n\nCette action est irréversible.`;
    if (!window.confirm(confirmMessage)) return;
  
    try {
      console.log('Deleting multiple tokens:', selectedJetons); // Debug log
      const deletions = selectedJetons.map(jeton => apiWithRetry(() => supprimerJeton({ jeton })));
      await Promise.all(deletions);
      setJetons(prev => prev.filter(j => !selectedJetons.includes(j.jeton)));
      setSelectedJetons([]);
      showNotification(`${selectedJetons.length} jeton(s) supprimé(s) avec succès`, 'success');
    } catch (error) {
      handleApiError(error, 'Erreur lors de la suppression multiple');
      loadJetons();
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!utilisateur?.id) {
      showNotification('Utilisateur non connecté ou ID invalide', 'error');
      navigate('/connexion');
      return;
    }
    if (!dureeValidite || dureeValidite < 1 || dureeValidite > 365) {
      showNotification('Durée de validité invalide (1-365 jours)', 'error');
      return;
    }
    try {
      await apiWithRetry(() => genererJeton({ utilisateurId: utilisateur.id, dureeValidite: parseInt(dureeValidite) }));
      setShowCreateModal(false);
      setDureeValidite(1);
      loadJetons();
      showNotification('Jeton créé avec succès', 'success');
    } catch (error) {
      handleApiError(error, 'Erreur lors de la création du jeton');
    }
  };

  const filteredJetons = jetons.filter(jeton => 
    jeton.pseudo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    jeton.jeton.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSelectJeton = (jeton) => {
    setSelectedJetons(prev => 
      prev.includes(jeton) 
        ? prev.filter(j => j !== jeton)
        : [...prev, jeton]
    );
  };

  const selectAllJetons = () => {
    if (selectedJetons.length === filteredJetons.length) {
      setSelectedJetons([]);
    } else {
      setSelectedJetons(filteredJetons.map(j => j.jeton));
    }
  };

  const handleRefresh = () => {
    setSearchTerm('');
    setSelectedJetons([]);
    loadJetons();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        <span className="ml-2">Chargement des jetons...</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      {notification && (
        <Notification 
          message={notification.message} 
          type={notification.type} 
          onClose={closeNotification}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des jetons</h1>
          <p className="text-gray-600">
            {jetons.length} jeton(s) au total
            {searchTerm && ` • ${filteredJetons.length} résultat(s) pour "${searchTerm}"`}
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleRefresh}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            disabled={loading}
          >
            🔄 Actualiser
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-white hover:text-orange-500 cursor-pointer rounded-2xl"
          >
            + Nouveau jeton
          </button>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-4">
        <input
          type="text"
          placeholder="Rechercher un jeton ou utilisateur..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {selectedJetons.length > 0 && (
          <button 
            onClick={supprimerMultiples}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            🗑️ Supprimer ({selectedJetons.length})
          </button>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-500/50 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Créer un jeton</h2>
            <form onSubmit={handleCreateSubmit}>
              <label className="block mb-2">
                Durée de validité (jours) :
                <input
                  type="number"
                  value={dureeValidite}
                  onChange={e => setDureeValidite(e.target.value)}
                  min="1"
                  max="365"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>
              <div className="mt-4 flex gap-2">
                <button type="submit" className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 cursor-pointer">
                  Créer
                </button>
                <button 
                  type="button" 
                  onClick={() => { setShowCreateModal(false); setDureeValidite(1); }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 cursor-pointer"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedJetons.length === filteredJetons.length && filteredJetons.length > 0}
                  onChange={selectAllJetons}
                  className="rounded border-gray-300"
                />
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Utilisateur ID</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Pseudo</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Jeton</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Date Création</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Date Expiration</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredJetons.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                  {searchTerm ? 'Aucun jeton trouvé pour cette recherche' : 'Aucun jeton disponible'}
                </td>
              </tr>
            ) : (
              filteredJetons.map(jeton => (
                <tr 
                  key={jeton.jeton} 
                  className={`hover:bg-gray-50 ${jeton.deleting ? 'opacity-50' : ''}`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedJetons.includes(jeton.jeton)}
                      onChange={() => toggleSelectJeton(jeton.jeton)}
                      disabled={jeton.deleting}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">#{jeton.utilisateurId}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{jeton.pseudo}</td>
                  <td
                    className="px-4 py-3 text-sm text-gray-600 truncate max-w-xs overflow-x-auto cursor-pointer"
                    title="Cliquer pour copier"
                    onClick={() => {
                      navigator.clipboard.writeText(jeton.jeton);
                      showNotification("Jeton copié !", 'success');
                    }}
                  >
                    {jeton.jeton}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{new Date(jeton.dateCreation).toLocaleString('fr-FR')}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{new Date(jeton.dateExpiration).toLocaleString('fr-FR')}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button 
                      onClick={() => supprimerSingleJeton(jeton)}
                      disabled={jeton.deleting}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
                    >
                      {jeton.deleting ? '⏳' : '🗑️'} Supprimer
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-sm text-gray-600 text-center">
        Dernière mise à jour: {new Date().toLocaleString('fr-FR')}
      </div>
    </div>
  );
}