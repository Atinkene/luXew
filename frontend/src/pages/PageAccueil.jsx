import { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import Header from '../components/Header';
import { useNavigate } from 'react-router-dom';

function PageAccueil() {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const carouselRef = useRef(null);
  const navigate = useNavigate();
  const articlesPerPage = 6;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Récupération des catégories
        const catResponse = await api.get('/categories');
        const categoriesData = catResponse.data.categories;
        setCategories(categoriesData);
        
        // Récupération de tous les articles
        const allArticles = [];
        for (const cat of categoriesData) {
          const catArticles = await api.get(`/categories/${cat.id}/articles`);
          const articlesWithCategory = catArticles.data.articles.map(article => ({
            ...article,
            categoryName: cat.libelle
          }));
          allArticles.push(...articlesWithCategory);
        }
        
        // Tri des articles par date de création (plus récent en premier)
        const sortedArticles = allArticles.sort((a, b) => 
          new Date(b.dateCreation) - new Date(a.dateCreation)
        );
        
        setArticles(sortedArticles);
        setLoading(false);
      } catch (error) {
        console.error('Erreur:', error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Carrousel auto-scroll
  useEffect(() => {
    if (articles.length > 0) {
      const interval = setInterval(() => {
        setCarouselIndex((prevIndex) => (prevIndex + 1) % Math.min(articles.length, 10));
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [articles]);

  // Carrousel scroll effect
  useEffect(() => {
    if (carouselRef.current) {
      carouselRef.current.scrollTo({
        left: carouselIndex * carouselRef.current.offsetWidth,
        behavior: 'smooth',
      });
    }
  }, [carouselIndex]);

  const totalPages = Math.ceil(articles.length / articlesPerPage);
  const currentArticles = articles.slice(
    currentPage * articlesPerPage,
    (currentPage + 1) * articlesPerPage
  );
  const carouselArticles = articles.slice(0, 10);

  const handlePrevious = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
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
            <div className="text-xl">Chargement des articles...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto mt-36 px-4">
        {/* Carrousel */}
        <section className="mb-8">
          <div className="overflow-hidden rounded-lg relative h-full bg-gray-200">
            <div
              ref={carouselRef}
              className="flex w-full h-96 overflow-hidden scroll-smooth transition-all duration-700"
              style={{ scrollSnapType: 'x mandatory' }}
            >
              {carouselArticles.map((article, index) => (
                <div
                  key={article.id}
                  className="flex-shrink-0 w-full h-full bg-cover bg-center rounded-lg relative cursor-pointer"
                  style={{
                    backgroundImage: `url(${article.medias?.[0]?.url || ''})`,
                    scrollSnapAlign: 'start',
                  }}
                  onClick={() => navigate(`/articles/${article.id}`)}
                >
                  <div className="absolute inset-0 bg-black/40"></div>
                  <div className="absolute bottom-0 w-full bg-black/60 text-white p-4">
                    <div className="mb-2">
                      <span className="text-xs bg-orange-500 px-2 py-1 rounded">
                        {article.categoryName}
                      </span>
                      <span className="text-xs ml-2 text-gray-200">
                        {formatTimeAgo(article.dateCreation)}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold mb-2 hover:text-yellow-300 transition-colors">
                      {article.titre}
                    </h3>
                    <p className="text-sm line-clamp-2 mb-3">
                      {article.contenu ? article.contenu.substring(0, 120) + '...' : 'Aucun contenu disponible'}
                    </p>
                    <button
                      className="bg-white p-2 cursor-pointer text-lg font-semibold rounded-lg text-orange-500 hover:text-white hover:bg-orange-500 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/articles/${article.id}`);
                      }}
                    >
                      Voir plus
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Indicateurs du carrousel */}
            <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {carouselArticles.map((_, idx) => (
                <button
                  key={idx}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    idx === carouselIndex ? 'bg-white' : 'bg-white/60'
                  }`}
                  onClick={() => setCarouselIndex(idx)}
                ></button>
              ))}
            </div>
            
            {/* Boutons de navigation du carrousel */}
            <button
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
              onClick={() => setCarouselIndex(prev => prev === 0 ? carouselArticles.length - 1 : prev - 1)}
            >
              ←
            </button>
            <button
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
              onClick={() => setCarouselIndex(prev => (prev + 1) % carouselArticles.length)}
            >
              →
            </button>
          </div>
        </section>

        {/* Titre principal */}
        <section className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Derniers Articles</h1>
          <p className="text-gray-600">Découvrez les actualités les plus récentes</p>
        </section>

        {/* Liste des articles */}
        <section className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentArticles.map((article) => (
              <div key={article.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                
                {/* Image de l'article */}
                {article.medias?.[0]?.url && (
                  <div className="h-48 bg-gray-200 overflow-hidden">
                    <img 
                      src={article.medias[0].url} 
                      alt={article.titre}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                {/* Contenu de l'article */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded">
                      {article.categoryName}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTimeAgo(article.dateCreation)}
                    </span>
                  </div>
                  
                  <h3 
                    className="text-lg font-semibold mb-2 cursor-pointer hover:text-orange-600 transition-colors"
                    onClick={() => navigate(`/articles/${article.id}`)}
                  >
                    {article.titre}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                    {article.contenu ? article.contenu.substring(0, 150) + '...' : 'Aucun contenu disponible'}
                  </p>
                  
                  <button
                    className="text-orange-500 hover:text-orange-600 text-md font-medium hover:underline"
                    onClick={() => navigate(`/articles/${article.id}`)}
                  >
                    Lire la suite →
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {/* Message si aucun article */}
          {articles.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Aucun article disponible pour le moment.</p>
            </div>
          )}
        </section>

        {/* Navigation */}
        {totalPages > 1 && (
          <section className="flex justify-center items-center mb-8">
            <div className="flex items-center space-x-4">
              <button
                onClick={handlePrevious}
                disabled={currentPage === 0}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  currentPage === 0
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-orange-500 text-white hover:bg-orange-600'
                }`}
              >
                ← Précédent
              </button>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  Page {currentPage + 1} sur {totalPages}
                </span>
                <span className="text-sm text-gray-400">
                  ({articles.length} articles au total)
                </span>
              </div>
              
              <button
                onClick={handleNext}
                disabled={currentPage === totalPages - 1}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  currentPage === totalPages - 1
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-orange-500 text-white hover:bg-orange-600'
                }`}
              >
                Suivant →
              </button>
            </div>
          </section>
        )}

        {/* Liste des catégories */}
        <section className="mt-12 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Catégories</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {categories.map((cat) => (
              <div 
                key={cat.id} 
                className="bg-white p-3 rounded shadow text-center hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/categories/${cat.id}`)}
              >
                <h3 className="text-md font-bold text-orange-600">{cat.libelle}</h3>
              </div>
            ))}
          </div>
        </section>

        {/* Newsletter */}
        <section className="bg-orange-500 text-white p-6 mt-12 text-center rounded-lg">
          <p className="font-bold text-2xl mb-2">Reste informé</p>
          <p>Inscrivez-vous à notre newsletter quotidienne et recevez les actualités importantes directement dans votre boîte mail.</p>
          <div className="flex justify-center mt-4">
            <input
              type="email"
              placeholder="Votre adresse email"
              className="rounded py-2 w-1/2 rounded-l border-none text-black  placeholder-gray-400 placeholder:bg-white"
            />
            <button className="bg-orange-500 px-6 py-2 text-white text-lg font-bold rounded-r cursor-pointer hover:bg-yellow-500 transition">
              S'inscrire
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default PageAccueil;