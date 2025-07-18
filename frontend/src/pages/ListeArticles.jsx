import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listerArticles, listerCategories } from '../services/api'; // Import named exports
import Header from '../components/Header';

function ListeArticles() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [sortField, setSortField] = useState('dateCreation');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch all articles and categories using named exports
        const articlesResponse = await listerArticles();
        setArticles(articlesResponse.data.articles || []);
        const categoriesResponse = await listerCategories();
        setCategories(categoriesResponse.data.categories || []);
        
        // If categorieId is in URL, set it as selected (optional, for initial state)
        const urlCategory = new URLSearchParams(window.location.search).get('cat');
        if (urlCategory) {
          const category = categoriesResponse.data.categories.find(cat => cat.id === parseInt(urlCategory));
          setSelectedCategory(category);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
        setError('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSort = (field) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleCategoryFilter = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId) || null;
    setSelectedCategory(categoryId === 'all' ? null : category);
  };

  const filteredArticles = articles
    .filter((article) =>
      (!selectedCategory || article.categories?.some(cat => cat.id === selectedCategory?.id)) &&
      (article.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
       article.contenu.toLowerCase().includes(searchTerm.toLowerCase()) ||
       (article.auteurPseudo && article.auteurPseudo.toLowerCase().includes(searchTerm.toLowerCase())))
    )
    .sort((a, b) => {
      let valA, valB;
      
      switch (sortField) {
        case 'titre':
          valA = a.titre?.toLowerCase() || '';
          valB = b.titre?.toLowerCase() || '';
          break;
        case 'auteur':
          valA = a.auteurPseudo?.toLowerCase() || '';
          valB = b.auteurPseudo?.toLowerCase() || '';
          break;
        case 'dateCreation':
          valA = new Date(a.dateCreation);
          valB = new Date(b.dateCreation);
          break;
        default:
          return 0;
      }
      
      if (sortField === 'dateCreation') {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      } else {
        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      }
    });

  const getSortIcon = (field) => {
    if (sortField !== field) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const articleDate = new Date(dateString);
    const diffInHours = Math.floor((now - articleDate) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Il y a moins d\'une heure';
    if (diffInHours < 24) return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `Il y a ${diffInWeeks} semaine${diffInWeeks > 1 ? 's' : ''}`;
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto mt-36 px-4">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto mt-36 px-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen">
      <Header />
      <main className="container mx-auto mt-36 px-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <nav className="text-sm text-gray-600 mb-2">
              <Link to="/" className="hover:text-orange-600">Accueil</Link>
              <span className="mx-2">&gt;</span>
              <Link to="/articles" className="hover:text-orange-600">Articles</Link>
              {selectedCategory && (
                <>
                  <span className="mx-2">&gt;</span>
                  <span className="text-orange-600">{selectedCategory.libelle}</span>
                </>
              )}
            </nav>
            <h1 className="text-3xl font-bold text-gray-800">
              {selectedCategory ? `Articles - ${selectedCategory.libelle}` : 'Articles par catégories'}
            </h1>
            <p className="text-gray-600 mt-2">
              {filteredArticles.length} article{filteredArticles.length > 1 ? 's' : ''} trouvé{filteredArticles.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3 text-gray-700">Filtrer par catégorie :</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleCategoryFilter('all')}
              className={`px-4 py-2 rounded-full border transition-colors ${
                !selectedCategory ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Toutes les catégories
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryFilter(category.id)}
                className={`px-4 py-2 rounded-full border transition-colors ${
                  selectedCategory && selectedCategory.id === category.id ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {category.libelle}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex-1 md:mr-4">
              <input
                type="text"
                placeholder="Rechercher par titre, contenu ou auteur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center space-x-4">
              <span className="font-medium text-gray-700">Trier par :</span>
              <button onClick={() => handleSort('titre')} className="flex items-center space-x-1 text-orange-500 hover:text-orange-600 font-medium">
                <span>Titre</span><span className="text-sm">{getSortIcon('titre')}</span>
              </button>
              <button onClick={() => handleSort('dateCreation')} className="flex items-center space-x-1 text-orange-500 hover:text-orange-600 font-medium">
                <span>Date</span><span className="text-sm">{getSortIcon('dateCreation')}</span>
              </button>
              <button onClick={() => handleSort('auteur')} className="flex items-center space-x-1 text-orange-500 hover:text-orange-600 font-medium">
                <span>Auteur</span><span className="text-sm">{getSortIcon('auteur')}</span>
              </button>
            </div>
          </div>
        </div>

        {filteredArticles.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">
              {searchTerm ? 'Aucun article trouvé pour cette recherche' : 'Aucun article disponible dans cette catégorie'}
            </div>
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="mt-4 text-orange-600 hover:text-orange-700 font-medium">Effacer la recherche</button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article) => (
              <div key={article.id} className="bg-white shadow-md rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <div className="h-48 bg-cover bg-center bg-gray-200" style={{ backgroundImage: article.medias?.[0]?.url ? `url(${article.medias[0].url})` : 'none' }}>
                  {!article.medias?.[0]?.url && (
                    <div className="h-full flex items-center justify-center text-gray-400">
                      <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h2 className="text-lg font-bold mb-2 text-gray-800 line-clamp-2 hover:text-orange-600 transition-colors cursor-pointer" onClick={() => { navigate(`/articles/${article.id}`) }}>
                    {article.titre}
                  </h2>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                    {article.contenu.length > 150 ? `${article.contenu.substring(0, 150)}...` : article.contenu}
                  </p>
                  <div className="flex justify-between items-center text-xs text-gray-400 mb-4">
                    <span>{formatTimeAgo(article.dateCreation)}</span>
                    {article.auteurPseudo && <span className="italic">par {article.auteurPseudo}</span>}
                  </div>
                  {article.categories && article.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {article.categories.map((category) => (
                        <span key={category.id} className="px-2 py-1 bg-orange-100 text-orange-600 text-xs rounded-full cursor-pointer hover:bg-orange-200 transition-colors" onClick={() => handleCategoryFilter(category.id)}>
                          {category.libelle}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <button onClick={() => { navigate(`/articles/${article.id}`) }} className="text-orange-500 font-semibold hover:text-orange-600 transition-colors cursor-pointer">Lire l'article →</button>
                    {article.reactions && article.reactions.length > 0 && (
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        {article.reactions.map((reaction) => (
                          <span key={reaction.type} className="flex items-center">
                            {reaction.type === 'like' && '👍'}{reaction.type === 'dislike' && '👎'}
                            <span className="ml-1">{reaction.nombre}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredArticles.length > 6 && (
          <div className="flex justify-center mt-8">
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors">Retour en haut ↑</button>
          </div>
        )}
      </main>
    </div>
  );
}

export default ListeArticles;