import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexte/AuthContexte';
import { listerArticles, listerCategories, creerArticle, modifierArticle, supprimerArticle } from '../../services/api';

export default function GestionArticles() {
  const { utilisateur } = useAuth();
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArticles, setSelectedArticles] = useState([]);
  const [notification, setNotification] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editArticle, setEditArticle] = useState(null);
  const [viewArticle, setViewArticle] = useState(null);
  const [formData, setFormData] = useState({ titre: '', contenu: '', categories: [], medias: [] });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    if (!utilisateur) {
      navigate('/connexion');
    } else {
      loadData();
    }
  }, [utilisateur, navigate]);

  const Notification = ({ message, type, onClose }) => {
    useEffect(() => {
      const timer = setTimeout(() => onClose(), 5000);
      return () => clearTimeout(timer);
    }, [onClose]);

    const bgColor = type === 'success' ? 'bg-orange-500' : 'bg-red-500';

    return (
      <div className={`fixed tinset-x-auto top-4 ${bgColor} text-white px-6 py-2 rounded-lg shadow-lg z-50-lg cursor-pointer`}>
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

  const handleApiError = (error, defaultMessage = 'Une erreur est survenue') => {
    console.error('Erreur API:', error);
    let message = defaultMessage;
    if (error.response) {
      switch (error.response.status) {
        case 401:
          message = 'Session expirée. Veuillez vous reconnecter.';
          break;
        case 403:
          message = 'Vous n\'avez pas les permissions nécessaires.';
          break;
        case 404:
          message = 'Ressource non trouvée.';
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

  const loadData = async () => {
    setLoading(true);
    try {
      const [articlesRes, categoriesRes] = await Promise.all([
        apiWithRetry(() => listerArticles()),
        apiWithRetry(() => listerCategories()),
      ]);

      const allArticles = Array.isArray(articlesRes.data.articles) ? articlesRes.data.articles : [];
      const categories = Array.isArray(categoriesRes.data.categories) ? categoriesRes.data.categories : [];
      console.log("All",allArticles);
      console.log("Cat",categories);
      console.log("utilisateur : ",utilisateur);
      
      
      // Filtrer les articles de l'utilisateur actuel
      const userArticles = allArticles.filter(article => 
        article.auteurId && article.auteurId === utilisateur.id
        
      );
      console.log("userArticles : ",userArticles);

      setArticles(userArticles);
      setCategories(categories);
      console.log('Articles de l\'utilisateur:', userArticles);
      console.log('Catégories chargées:', categories);
    } catch (error) {
      handleApiError(error, 'Erreur lors du chargement des données');
      setArticles([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSelectArticle = (articleId) => {
    setSelectedArticles(prev =>
      prev.includes(articleId) ? prev.filter(id => id !== articleId) : [...prev, articleId]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedArticles.length === 0) {
      showNotification('Aucun article sélectionné', 'error');
      return;
    }
    
    // if (!window.confirm(`Êtes-vous sûr de vouloir supprimer ${selectedArticles.length} article(s) ?`)) {
    //   return;
    // }

    try {
      await Promise.all(selectedArticles.map(id => apiWithRetry(() => supprimerArticle(id))));
      showNotification('Articles supprimés avec succès');
      setSelectedArticles([]);
      loadData();
    } catch (error) {
      handleApiError(error, 'Erreur lors de la suppression des articles');
    }
  };

  const handleCreateArticle = async () => {
    if (!formData.titre.trim() || !formData.contenu.trim()) {
      showNotification('Titre et contenu sont requis', 'error');
      return;
    }

    setFormLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('titre', formData.titre.trim());
      formDataToSend.append('contenu', formData.contenu.trim());

      if (formData.categories && formData.categories.length > 0) {
        formData.categories.forEach(catId => {
          formDataToSend.append('categories', catId);
        });
      }

      if (formData.medias && formData.medias.length > 0) {
        formData.medias.forEach((media, index) => {
          formDataToSend.append(`media[${index}]`, media);
        });
      }

      console.log('FormData entries:');
      for (let [key, value] of formDataToSend.entries()) {
        console.log(`${key}: ${value instanceof File ? value.name : value}`);
      }

      await apiWithRetry(() => creerArticle(formDataToSend));

      showNotification('Article créé avec succès');
      setShowCreateModal(false);
      setFormData({ titre: '', contenu: '', categories: [], medias: [] });
      loadData();
    } catch (error) {
      handleApiError(error, 'Erreur lors de la création de l\'article');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditArticle = async () => {
    if (!formData.titre.trim() || !formData.contenu.trim()) {
      showNotification('Titre et contenu sont requis', 'error');
      return;
    }

    setFormLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('titre', formData.titre.trim());
      formDataToSend.append('contenu', formData.contenu.trim());

      if (formData.categories && formData.categories.length > 0) {
        formData.categories.forEach(catId => {
          formDataToSend.append('categories', catId);
        });
      }

      if (formData.medias && formData.medias.length > 0) {
        formData.medias.forEach((media, index) => {
          formDataToSend.append(`media[${index}]`, media);
        });
      }

      console.log('FormData entries (modification):');
      for (let [key, value] of formDataToSend.entries()) {
        console.log(`${key}: ${value instanceof File ? value.name : value}`);
      }
      console.log("editArticle.id ", editArticle.id);
      console.log("formDataToSend ", formDataToSend);
      await apiWithRetry(() => modifierArticle(editArticle.id, formDataToSend));

      showNotification('Article modifié avec succès');
      setShowEditModal(false);
      setFormData({ titre: '', contenu: '', categories: [], medias: [] });
      setEditArticle(null);
      loadData();
    } catch (error) {
      handleApiError(error, 'Erreur lors de la modification de l\'article');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteArticle = async (id) => {
    // if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
    //   return;
    // }

    try {
      await apiWithRetry(() => supprimerArticle(id));
      showNotification('Article supprimé avec succès');
      setSelectedArticles(prev => prev.filter(articleId => articleId !== id));
      loadData();
    } catch (error) {
      handleApiError(error, 'Erreur lors de la suppression de l\'article');
    }
  };

  const openViewModal = (article) => {
    setViewArticle(article);
    setShowViewModal(true);
  };

  const openEditModal = (article) => {
    setEditArticle(article);
    setFormData({
      titre: article.titre,
      contenu: article.contenu,
      categories: article.categories.map(cat => cat.id),
      medias: [],
    });
    setShowEditModal(true);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData({ ...formData, medias: files });
  };

  const filteredArticles = articles.filter(article =>
    article.titre.toLowerCase().includes(searchTerm.toLowerCase())
  );
  console.log("ArticleFiltres ",filteredArticles)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        <span className="ml-2 text-gray-700">Chargement de vos articles...</span>
      </div>
    );
  }

  return (
    <div className="w mx-auto p-6 bg-gray-100 h-screen overflow-y-scroll pb-16">
      {notification && (
        <Notification message={notification.message} type={notification.type} onClose={closeNotification} />
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Mes Articles</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg cursor-pointer-lg hover:bg-orange-600 transition-colors duration-200"
        >
          Créer un article
        </button>
      </div>

      <div className="mb-4 flex justify-between items-center">
        <input
          type="text"
          placeholder="Rechercher dans mes articles..."
          value={searchTerm}
          onChange={handleSearch}
          className="flex-1 px-4 py-2 border border-orange-300 rounded-lg-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500 mr-4"
        />
        <div className="text-gray-600">
          {filteredArticles.length} article(s) trouvé(s)
        </div>
      </div>

      {selectedArticles.length > 0 && (
        <div className="mb-6">
          <button
            onClick={handleBulkDelete}
            className="px-4 py-2 bg-red-500 text-white rounded-lg cursor-pointer-lg hover:bg-red-600 transition-colors duration-200"
          >
            Supprimer {selectedArticles.length} article(s)
          </button>
        </div>
      )}

      {filteredArticles.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-4">
            {searchTerm ? 'Aucun article trouvé avec ce terme de recherche' : 'Vous n\'avez pas encore créé d\'articles'}
          </div>
          {!searchTerm && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2 bg-orange-500 text-white rounded-lg cursor-pointer-lg hover:bg-orange-600 transition-colors duration-200"
            >
              Créer votre premier article
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredArticles.map(article => (
            <div
              key={article.id}
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden flex flex-col"
            >
              {/* Image ou fallback */}
              <div
                className="h-40 bg-cover bg-center bg-gray-200"
                style={{
                  backgroundImage: article.medias?.[0]?.url ? `url(${article.medias[0].url})` : 'none',
                }}
              >
                {!article.medias?.[0]?.url && (
                  <div className="h-full flex items-center justify-center text-gray-400">
                    <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </div>
              
              {/* Contenu */}
              <div className="p-4 flex flex-col justify-between flex-grow bg-gray-50">
                <div>
                  <h2 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2">
                    {article.titre || "Sans titre"}
                  </h2>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                    {article.contenu ? `${article.contenu.substring(0, 150)}...` : "Pas de contenu"}
                  </p>
              
                  {article.categories?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {article.categories.map((cat) => (
                        <span key={cat.id} className="px-2 py-2 bg-orange-100 text-orange-600-lg cursor-pointer text-xs rounded-full">
                          {cat.libelle}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Actions */}
                <div className="flex items-center justify-between mt-4">
                  <input
                    type="checkbox"
                    checked={selectedArticles.includes(article.id)}
                    onChange={() => handleSelectArticle(article.id)}
                    className="h-5 w-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <div className="space-x-2">
                    <button
                      onClick={() => openViewModal(article)}
                      className="px-2 py-2 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600 text-sm"
                    >
                      Voir
                    </button>
                    <button
                      onClick={() => openEditModal(article)}
                      className="px-2 py-2 bg-orange-500 text-white rounded-lg cursor-pointer hover:bg-orange-600 text-sm"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDeleteArticle(article.id)}
                      className="px-2 py-2 bg-red-500 text-white rounded-lg cursor-pointer hover:bg-red-600 text-sm"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>


      )}

      {/* View Modal */}
      {showViewModal && viewArticle && (
        <div className="fixed inset-0 bg-gray-500/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-3/4 h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">{viewArticle.titre}</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {viewArticle.categories && viewArticle.categories.map(cat => (
                  <span key={cat.id} className="px-2 py-2 bg-orange-500 text-white text-lg cursor-pointer-sm rounded-full">
                    {cat.libelle}
                  </span>
                ))}
              </div>
            </div>

            <div className="prose max-w-none mb-6">
              <p className="text-gray-700 whitespace-pre-wrap text-xl">{viewArticle.contenu}</p>
            </div>

            {viewArticle.medias && viewArticle.medias.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Médias</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {viewArticle.medias.map((media, index) => (
                    <div key={index} className="border rounded-lg overflow-hidden">
                      {media.type && media.type.startsWith('image') ? (
                        <img src={media.url} alt={`Media ${index + 1}`} className="w-full size-auto object-cover" />
                      ) : (
                        <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                          <span className="text-gray-500">Média {index + 1}</span>
                          <video >
                            <source src={media.url} type="video/mp4" />
                          </video>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  openEditModal(viewArticle);
                }}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg cursor-pointer-lg hover:bg-orange-600 transition-colors duration-200"
              >
                Modifier
              </button>
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700-lg cursor-pointer rounded-lg hover:bg-gray-400 transition-colors duration-200"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-500/50 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-3/4  max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Créer un article</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Titre</label>
                <input
                  type="text"
                  value={formData.titre}
                  onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                  className="w-full px-4 py-2  border border-orange-300 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Titre de l'article"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Contenu</label>
                <textarea
                  value={formData.contenu}
                  onChange={(e) => setFormData({ ...formData, contenu: e.target.value })}
                  className="w-full px-4 py-2  border border-orange-300 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500 h-32"
                  placeholder="Contenu de l'article"
                ></textarea>
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Catégories</label>
                <select
                  multiple
                  value={formData.categories}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      categories: Array.from(e.target.selectedOptions, option => parseInt(option.value)),
                    })
                  }
                  className="w-full px-4 py-2  border border-orange-300 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500 h-32"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.libelle}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">Maintenez Ctrl/Cmd pour sélectionner plusieurs catégories</p>
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Médias</label>
                <input
                  type="file"
                  multiple
                  accept="image/*,audio/*,video/*"
                  onChange={handleFileChange}
                  className="w-full px-4 py-2  border border-orange-300 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                {formData.medias.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-700">Fichiers sélectionnés :</p>
                    <ul className="list-disc pl-5 text-sm text-gray-600">
                      {formData.medias.map((file, index) => (
                        <li key={index}>{file.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({ titre: '', contenu: '', categories: [], medias: [] });
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700-lg cursor-pointer rounded-lg hover:bg-gray-400 transition-colors duration-200"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateArticle}
                disabled={formLoading}
                className={`px-4 py-2 bg-orange-500 text-white rounded-lg cursor-pointer-lg hover:bg-orange-600 transition-colors duration-200 ${
                  formLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {formLoading ? 'Création...' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-500/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6  w-3/4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Modifier l'article</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Titre</label>
                <input
                  type="text"
                  value={formData.titre}
                  onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                  className="w-full px-4 py-2  border border-orange-300 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Contenu</label>
                <textarea
                  value={formData.contenu}
                  onChange={(e) => setFormData({ ...formData, contenu: e.target.value })}
                  className="w-full px-4 py-2  border border-orange-300 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500 h-32"
                ></textarea>
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Catégories</label>
                <select
                  multiple
                  value={formData.categories}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      categories: Array.from(e.target.selectedOptions, option => parseInt(option.value)),
                    })
                  }
                  className="w-full px-4 py-2  border border-orange-300 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500 h-32"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.libelle}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">Maintenez Ctrl/Cmd pour sélectionner plusieurs catégories</p>
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Médias</label>
                <input
                  type="file"
                  multiple
                  accept="image/*,audio/*,video/*"
                  onChange={handleFileChange}
                  className="w-full px-4 py-2  border border-orange-300 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                {formData.medias.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-700">Nouveaux fichiers sélectionnés :</p>
                    <ul className="list-disc pl-5 text-sm text-gray-600">
                      {formData.medias.map((file, index) => (
                        <li key={index}>{file.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setFormData({ titre: '', contenu: '', categories: [], medias: [] });
                  setEditArticle(null);
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700-lg cursor-pointer rounded-lg hover:bg-gray-400 transition-colors duration-200"
              >
                Annuler
              </button>
              <button
                onClick={handleEditArticle}
                disabled={formLoading}
                className={`px-4 py-2 bg-orange-500 text-white rounded-lg cursor-pointer-lg hover:bg-orange-600 transition-colors duration-200 ${
                  formLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {formLoading ? 'Modification...' : 'Modifier'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}