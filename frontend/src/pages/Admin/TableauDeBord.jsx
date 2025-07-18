import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listerCategories, listerUtilisateurs } from '../../services/api';
import { useAuth } from '../../contexte/AuthContexte';
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

export default function DashboardAdmin() {
  const [metrics, setMetrics] = useState({ categories: [], users: [] });
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const navigate = useNavigate();
  const { utilisateur } = useAuth();

  useEffect(() => {
    if (!utilisateur || !utilisateur.roles.includes('admin')) {
      navigate('/connexion');
    } else {
      loadMetrics();
    }
  }, [utilisateur, navigate]);

  const Notification = ({ message, type, onClose }) => {
    useEffect(() => {
      const timer = setTimeout(() => onClose(), 5000);
      return () => clearTimeout(timer);
    }, [onClose]);

    const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';

    return (
      <div className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50`}>
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

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const [categoriesRes, usersRes] = await Promise.all([
        apiWithRetry(() => listerCategories()),
        apiWithRetry(() => listerUtilisateurs()).catch(() => ({ data: { users: [] } })),
      ]);

      const categories = Array.isArray(categoriesRes.data.categories) ? categoriesRes.data.categories : [];
      const users = Array.isArray(usersRes.data.utilisateurs) ? usersRes.data.utilisateurs : [];
      console.log("utilisateur",usersRes);
      
      setMetrics({ categories, users });
      console.log('Metrics loaded:', { categories, userCount: users.length });
    } catch (error) {
      handleApiError(error, 'Erreur lors du chargement des métriques');
      setMetrics({ categories: [], users: [] });
    } finally {
      setLoading(false);
    }
  };


  // Chart Data
  const categoryChartData = {
    type: 'bar',
    data: {
      labels: metrics.categories.map(cat => cat.libelle),
      datasets: [{
        label: 'Catégories',
        data: metrics.categories.map(() => 1), // One per category
        backgroundColor: '#f97316', // Orange-500
        borderColor: '#ea580c', // Orange-600
        borderWidth: 1,
      }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: { display: true, text: 'Nombre de catégories' },
      },
      scales: {
        y: { beginAtZero: true, title: { display: true, text: 'Nombre' } },
        x: { title: { display: true, text: 'Catégories' } },
      },
    },
  };

  const userRolesChartData = {
    type: 'pie',
    data: {
      labels: ['Admin', 'Éditeur', 'Utilisateur'],
      datasets: [{
        label: 'Répartition des rôles',
        data: [
          metrics.users.filter(u => u.roles.includes('admin')).length,
          metrics.users.filter(u => u.roles.includes('editeur')).length,
          metrics.users.filter(u => u.roles.includes('utilisateur')).length,
        ],
        backgroundColor: ['#f97316', '#3b82f6', '#10b981'], // Orange-500, Blue-500, Green-500
        borderColor: ['#ea580c', '#2563eb', '#059669'], // Orange-600, Blue-600, Green-600
        borderWidth: 1,
      }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: true, position: 'right' },
        title: { display: true, text: 'Répartition des rôles des utilisateurs' },
      },
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        <span className="ml-2 text-gray-700">Chargement du tableau de bord...</span>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 p-6 h-screen overflow-y-hidden">
      {notification && (
        <Notification message={notification.message} type={notification.type} onClose={closeNotification} />
      )}

      <div className="w-3/4 mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Tableau de bord administrateur</h1>
          <p className="text-gray-600 mt-1">Bienvenue, <span className='text-orange-500 font-semibold text-lg'>{utilisateur.pseudo}</span></p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200">
            <h2 className="text-lg font-semibold text-gray-900">Catégories</h2>
            <p className="text-3xl font-bold text-orange-500">{metrics.categories.length}</p>
            <button
              onClick={() => navigate('/admin/categories')}
              className="mt-4 px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors duration-200"
            >
              Gérer les catégories
            </button>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200">
            <h2 className="text-lg font-semibold text-gray-900">Utilisateurs</h2>
            <p className="text-3xl font-bold text-orange-500">{metrics.users.length}</p>
            <button
              onClick={() => navigate('/admin/utilisateurs')}
              className="mt-4 px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors duration-200"
            >
              Gérer les utilisateurs
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Nombre de catégories</h2>
            <div className="h-80">
              <Bar data={categoryChartData.data} options={categoryChartData.options} />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Répartition des rôles</h2>
            <div className="h-80">
              <Pie data={userRolesChartData.data} options={userRolesChartData.options} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => navigate('/admin/categories')}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors duration-200"
            >
              Gérer les catégories
            </button>
            <button
              onClick={() => navigate('/admin/utilisateurs')}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors duration-200"
            >
              Gérer les utilisateurs
            </button>
          </div>
        </div>

        <div className="mt-6 text-sm text-gray-600 text-center">
          Dernière mise à jour: {new Date().toLocaleString('fr-FR')}
        </div>
      </div>
    </div>
  );
}
