import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listerCategories, creerCategorie, modifierCategorie, supprimerCategorie as supprimerCategorieAPI } from '../../services/api';
import { useAuth } from '../../contexte/AuthContexte';

export default function GestionCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [notification, setNotification] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [formData, setFormData] = useState({ libelle: '' });
  const [formLoading, setFormLoading] = useState(false);
  const navigate = useNavigate();
  const { utilisateur } = useAuth();
  const [categorieASupprimer, setCategorieASupprimer] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

const confirmerSuppressionCategorie = (categorie) => {
  setCategorieASupprimer(categorie);
  setShowConfirmModal(true);
};

  useEffect(() => {
    if (!utilisateur || !utilisateur.roles.some(role => ['admin', 'editeur'].includes(role))) {
      navigate('/connexion');
    } else {
      loadCategories();
    }
  }, [utilisateur, navigate]);

  const Notification = ({ message, type, onClose }) => {
    useEffect(() => {
      const timer = setTimeout(() => onClose(), 5000);
      return () => clearTimeout(timer);
    }, [onClose]);

    const bgColor = type === 'success' ? 'bg-orange-500' : 'bg-red-500';
    
    return (
      <div className={`fixed inset-x-auto top-0 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50`}>
        <div className="flex items-center justify-between">
          <span>{message}</span>
          <button onClick={onClose} className="ml-4 text-white hover:text-gray-200">×</button>
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
        const response = await apiCall();
        console.log('API response:', response.data);
        return response;
      } catch (error) {
        if (i === retries - 1) throw error;
        console.log(`Tentative ${i + 1} échouée, retry dans ${1000 * (i + 1)}ms`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  };

  const effectuerSuppression = async () => {
    if (!categorieASupprimer) return;
    const id = categorieASupprimer.id;
    setShowConfirmModal(false);
    setCategories(prev => prev.map(cat => cat.id === id ? { ...cat, deleting: true } : cat));

    try {
      const response = await apiWithRetry(() => supprimerCategorieAPI(id));
      if (response.data.succes) {
        setCategories(prev => prev.filter(c => c.id !== id));
        setSelectedCategories(prev => prev.filter(catId => catId !== id));
        showNotification(`Catégorie "${categorieASupprimer.libelle}" supprimée avec succès`, 'success');
      } else {
        throw new Error(response.data.erreur || 'Erreur lors de la suppression');
      }
    } catch (error) {
      setCategories(prev => prev.map(cat => cat.id === id ? { ...cat, deleting: false } : cat));
      handleApiError(error, 'Erreur lors de la suppression de la catégorie');
    } finally {
      setCategorieASupprimer(null);
    }
  };


  const handleApiError = (error, defaultMessage = 'Une erreur est survenue') => {
    console.error('Erreur API:', error);
    let message = defaultMessage;
    if (error.response) {
      switch (error.response.status) {
        case 401:
          message = 'Session expirée. Veuillez vous reconnecter.';
          localStorage.removeItem('jwt');
          localStorage.removeItem('utilisateur');
          navigate('/connexion');
          break;
        case 403:
          message = 'Vous n\'avez pas les permissions nécessaires.';
          break;
        case 404:
          message = 'Ressource non trouvée.';
          break;
        case 422:
          message = error.response.data?.erreur || 'Données invalides. Veuillez vérifier les informations saisies.';
          break;
        case 500:
          message = 'Erreur serveur. Veuillez réessayer plus tard.';
          break;
        default:
          message = error.response.data?.erreur || defaultMessage;
      }
    } else if (error.request) {
      message = 'Problème de connexion. Vérifiez votre connexion internet.';
    }
    showNotification(message, 'error');
    return false;
  };

  const validateForm = (data, isEdit = false) => {
    const trimmedLibelle = data.libelle.trim();
    if (!trimmedLibelle || trimmedLibelle.length < 2) {
      showNotification('Le libellé doit contenir au moins 2 caractères (sans espaces inutiles)', 'error');
      return false;
    }
    const libelleExists = categories.some(c => c.libelle.toLowerCase() === trimmedLibelle.toLowerCase() && (!isEdit || c.id !== editCategory?.id));
    if (libelleExists) {
      showNotification('Ce libellé est déjà utilisé', 'error');
      return false;
    }
    return true;
  };

  const loadCategories = async () => {
    setLoading(true);
    try {
      const response = await apiWithRetry(() => listerCategories());
      if (response.data && Array.isArray(response.data.categories)) {
        setCategories(response.data.categories);
        console.log('Catégories chargées:', response.data.categories);
      } else {
        throw new Error('Format de réponse invalide');
      }
    } catch (error) {
      handleApiError(error, 'Erreur lors du chargement des catégories');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm(formData)) return;
    setFormLoading(true);
    try {
      console.log('Creating category with data:', formData);
      const response = await apiWithRetry(() => creerCategorie({ libelle: formData.libelle.trim() }));
      if (response.data.succes) {
        setShowCreateModal(false);
        setFormData({ libelle: '' });
        loadCategories();
        showNotification('Catégorie créée avec succès', 'success');
      } else {
        throw new Error(response.data.erreur || 'Erreur lors de la création');
      }
    } catch (error) {
      handleApiError(error, 'Erreur lors de la création de la catégorie');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editCategory?.id || !validateForm(formData, true)) return;
    setFormLoading(true);
    try {
      console.log('Updating category with data:', { categorieId: editCategory.id, libelle: formData.libelle.trim() });
      const response = await apiWithRetry(() => modifierCategorie({ categorieId: editCategory.id, libelle: formData.libelle.trim() }));
      if (response.data.succes) {
        setShowEditModal(false);
        setFormData({ libelle: '' });
        setEditCategory(null);
        loadCategories();
        showNotification('Catégorie modifiée avec succès', 'success');
      } else {
        throw new Error(response.data.erreur || 'Erreur lors de la modification');
      }
    } catch (error) {
      handleApiError(error, 'Erreur lors de la modification de la catégorie');
    } finally {
      setFormLoading(false);
    }
  };

 

  const supprimerMultiples = async () => {
    if (selectedCategories.length === 0) return;
    // const confirmMessage = `Êtes-vous sûr de vouloir supprimer ${selectedCategories.length} catégorie(s) sélectionnée(s) ?\n\nCette action est irréversible.`;
    // if (!window.confirm(confirmMessage)) return;

    try {
      console.log('Deleting multiple categories:', selectedCategories);
      const deletions = selectedCategories.map(id => apiWithRetry(() => supprimerCategorieAPI(id)));
      const responses = await Promise.all(deletions);
      responses.forEach(response => {
        if (!response.data.succes) {
          throw new Error(response.data.erreur || 'Erreur lors de la suppression multiple');
        }
      });
      setCategories(prev => prev.filter(c => !selectedCategories.includes(c.id)));
      setSelectedCategories([]);
      showNotification(`${selectedCategories.length} catégorie(s) supprimée(s) avec succès`, 'success');
    } catch (error) {
      handleApiError(error, 'Erreur lors de la suppression multiple');
      loadCategories();
    }
  };

  const filteredCategories = categories.filter(cat => 
    cat.libelle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSelectCategory = (id) => {
    setSelectedCategories(prev => 
      prev.includes(id) ? prev.filter(catId => catId !== id) : [...prev, id]
    );
  };

  const selectAllCategories = () => {
    if (selectedCategories.length === filteredCategories.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(filteredCategories.map(c => c.id));
    }
  };

  const handleRefresh = () => {
    setSearchTerm('');
    setSelectedCategories([]);
    loadCategories();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        <span className="ml-2">Chargement des catégories...</span>
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
          <h1 className="text-2xl font-bold text-gray-900">Gestion des catégories</h1>
          <p className="text-gray-600">
            {categories.length} catégorie(s) au total
            {searchTerm && ` • ${filteredCategories.length} résultat(s) pour "${searchTerm}"`}
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleRefresh}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            disabled={loading || formLoading}
          >
            🔄 Actualiser
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-white hover:text-orange-500 cursor-pointer rounded-2xl"
            disabled={formLoading}
          >
            + Nouvelle catégorie
          </button>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-4">
        <input
          type="text"
          placeholder="Rechercher une catégorie..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={formLoading}
        />
        {selectedCategories.length > 0 && (
          <button 
            onClick={supprimerMultiples}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            disabled={formLoading}
          >
            🗑️ Supprimer ({selectedCategories.length})
          </button>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-500/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Créer une catégorie</h2>
            <form onSubmit={handleCreateSubmit}>
              <label className="block mb-2">
                Libellé :
                <input
                  type="text"
                  value={formData.libelle}
                  onChange={e => setFormData({ ...formData, libelle: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={formLoading}
                />
              </label>
              <div className="mt-4 flex gap-2">
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 cursor-pointer disabled:opacity-50"
                  disabled={formLoading}
                >
                  {formLoading ? '⏳ Création...' : 'Créer'}
                </button>
                <button 
                  type="button" 
                  onClick={() => { setShowCreateModal(false); setFormData({ libelle: '' }); }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 cursor-pointer"
                  disabled={formLoading}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && editCategory && (
        <div className="fixed inset-0 bg-gray-500/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Modifier la catégorie #{editCategory.id}</h2>
            <form onSubmit={handleEditSubmit}>
              <label className="block mb-2">
                Libellé :
                <input
                  type="text"
                  value={formData.libelle}
                  onChange={e => setFormData({ ...formData, libelle: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={formLoading}
                />
              </label>
              <div className="mt-4 flex gap-2">
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 cursor-pointer disabled:opacity-50"
                  disabled={formLoading}
                >
                  {formLoading ? '⏳ Modification...' : 'Modifier'}
                </button>
                <button 
                  type="button" 
                  onClick={() => { setShowEditModal(false); setFormData({ libelle: '' }); setEditCategory(null); }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 cursor-pointer"
                  disabled={formLoading}
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
                  checked={selectedCategories.length === filteredCategories.length && filteredCategories.length > 0}
                  onChange={selectAllCategories}
                  className="rounded border-gray-300"
                  disabled={formLoading}
                />
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">ID</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Libellé</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredCategories.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                  {searchTerm ? 'Aucune catégorie trouvée pour cette recherche' : 'Aucune catégorie disponible'}
                </td>
              </tr>
            ) : (
              filteredCategories.map(cat => (
                <tr 
                  key={cat.id} 
                  className={`hover:bg-gray-50 ${cat.deleting ? 'opacity-50' : ''}`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat.id)}
                      onChange={() => toggleSelectCategory(cat.id)}
                      disabled={cat.deleting || formLoading}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">#{cat.id}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{cat.libelle}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button 
                      onClick={() => {
                        setEditCategory(cat);
                        setFormData({ libelle: cat.libelle });
                        setShowEditModal(true);
                      }}
                      disabled={cat.deleting || formLoading}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
                    >
                      ✏️ Modifier
                    </button>
                    <button 
                      onClick={() => confirmerSuppressionCategorie(cat)}
                      disabled={cat.deleting || formLoading}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 cursor-pointer disabled:opacity-50"
                    >
                      {cat.deleting ? '⏳' : '🗑️'} Supprimer
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {showConfirmModal && categorieASupprimer && (
          <div className="fixed inset-0 bg-gray-500/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                Confirmer la suppression
              </h3>
              <p className="text-gray-600 mb-6">
                Êtes-vous sûr de vouloir supprimer la catégorie <strong>"{categorieASupprimer.libelle}"</strong> ?
                <br />
                Cette action est irréversible.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Annuler
                </button>
                <button
                  onClick={effectuerSuppression}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 text-sm text-gray-600 text-center">
        Dernière mise à jour: {new Date().toLocaleString('fr-FR')}
      </div>
    </div>

  );
}
