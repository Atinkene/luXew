import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listerUtilisateurs, ajouterUtilisateur, modifierUtilisateur, supprimerUtilisateur, listerRoles } from '../../services/api';
import { useAuth } from '../../contexte/AuthContexte';

export default function GestionUtilisateurs() {
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [roles, setRoles] = useState(['utilisateur', 'editeur', 'admin']);
  const [loading, setLoading] = useState(true);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [notification, setNotification] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [formData, setFormData] = useState({ pseudo: '', email: '', motDePasse: '', role: 'utilisateur' });
  const [formLoading, setFormLoading] = useState(false);
  const navigate = useNavigate();
  const { utilisateur } = useAuth();

  useEffect(() => {
    if (!utilisateur || !utilisateur.roles.includes('admin')) {
      navigate('/connexion');
    } else {
      loadRoles();
      loadUsers();
    }
  }, [utilisateur, navigate]);

  const Notification = ({ message, type, onClose }) => {
    useEffect(() => {
      const timer = setTimeout(() => onClose(), 5000);
      return () => clearTimeout(timer);
    }, [onClose]);

    const bgColor = type === 'success' ? 'bg-orange-500' : 'bg-red-500';
    
    return (
      <div className={`fixed inset-x-auto top-2  ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50`}>
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
          localStorage.removeItem('jwt');
          localStorage.removeItem('utilisateur');
          navigate('/connexion');
          break;
        case 403: message = 'Vous n\'avez pas les permissions nécessaires.'; break;
        case 404: message = 'Ressource non trouvée.'; break;
        case 422: message = error.response.data?.erreur || 'Données invalides. Veuillez vérifier les informations saisies.'; break;
        case 500: message = 'Erreur serveur. Veuillez réessayer plus tard.'; break;
        default: message = error.response.data?.erreur || defaultMessage;
      }
    } else if (error.request) {
      message = 'Problème de connexion. Vérifiez votre connexion internet.';
    }
    showNotification(message, 'error');
    return false;
  };

  const validateForm = (data, isEdit = false) => {
    const trimmedPseudo = data.pseudo.trim();
    const trimmedEmail = data.email.trim();
    if (!trimmedPseudo || trimmedPseudo.length < 3) {
      showNotification('Le pseudo doit contenir au moins 3 caractères (sans espaces inutiles)', 'error');
      return false;
    }
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      showNotification('Email invalide', 'error');
      return false;
    }
    if (!isEdit && (!data.motDePasse || data.motDePasse.length < 6)) {
      showNotification('Le mot de passe doit contenir au moins 6 caractères', 'error');
      return false;
    }
    if (!roles.includes(data.role)) {
      showNotification('Rôle invalide', 'error');
      return false;
    }
    const pseudoExists = utilisateurs.some(u => u.pseudo.toLowerCase() === trimmedPseudo.toLowerCase() && (!isEdit || u.id !== editUser?.id));
    if (pseudoExists) {
      showNotification('Ce pseudo est déjà utilisé', 'error');
      return false;
    }
    const emailExists = utilisateurs.some(u => u.email.toLowerCase() === trimmedEmail.toLowerCase() && (!isEdit || u.id !== editUser?.id));
    if (emailExists) {
      showNotification('Cet email est déjà utilisé', 'error');
      return false;
    }
    return true;
  };

  const loadRoles = async () => {
    setLoadingRoles(true);
    try {
      const response = await apiWithRetry(() => listerRoles());
      if (response.data.succes && Array.isArray(response.data.roles)) {
        setRoles(response.data.roles);
        console.log('Roles loaded:', response.data.roles);
      } else {
        throw new Error('Format de réponse invalide');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des rôles:', error);
      showNotification('Impossible de charger les rôles. Utilisation des rôles par défaut.', 'error');
    } finally {
      setLoadingRoles(false);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await apiWithRetry(() => listerUtilisateurs());
      if (response.data && Array.isArray(response.data.utilisateurs)) {
        setUtilisateurs(response.data.utilisateurs);
        console.log('Utilisateurs chargés:', response.data.utilisateurs);
      } else {
        throw new Error('Format de réponse invalide');
      }
    } catch (error) {
      handleApiError(error, 'Erreur lors du chargement des utilisateurs');
      setUtilisateurs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm(formData)) return;
    setFormLoading(true);
    try {
      console.log('Creating user with data:', formData);
      await apiWithRetry(() => ajouterUtilisateur({ 
        pseudo: formData.pseudo.trim(), 
        email: formData.email.trim(), 
        motDePasse: formData.motDePasse, 
        role: formData.role 
      }));
      setShowCreateModal(false);
      setFormData({ pseudo: '', email: '', motDePasse: '', role: roles[0] || 'utilisateur' });
      loadUsers();
      showNotification('Utilisateur créé avec succès', 'success');
    } catch (error) {
      handleApiError(error, 'Erreur lors de la création de l\'utilisateur');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editUser?.id || !validateForm(formData, true)) return;
    setFormLoading(true);
    try {
      console.log('Updating user with data:', { utilisateurId: editUser.id, ...formData });
      await apiWithRetry(() => modifierUtilisateur({ 
        utilisateurId: editUser.id, 
        pseudo: formData.pseudo.trim(), 
        email: formData.email.trim(), 
        motDePasse: formData.motDePasse || undefined, 
        role: formData.role 
      }));
      setShowEditModal(false);
      setFormData({ pseudo: '', email: '', motDePasse: '', role: roles[0] || 'utilisateur' });
      setEditUser(null);
      loadUsers();
      showNotification('Utilisateur modifié avec succès', 'success');

    } catch (error) {
      handleApiError(error, 'Erreur lors de la modification de l\'utilisateur');
    } finally {
      setFormLoading(false);
    }
  };

  const supprimerUtilisateurSingle = async (id) => {
    if (id === utilisateur?.id) {
      showNotification('Impossible de supprimer votre propre compte', 'error');
      return;
    }
    const user = utilisateurs.find(u => u.id === id);
    // const confirmMessage = `Êtes-vous sûr de vouloir supprimer l'utilisateur "${user?.pseudo || id}" ?\n\nCette action est irréversible.`;
    // if (!window.confirm(confirmMessage)) return;

    setUtilisateurs(prev => prev.map(u => u.id === id ? { ...u, deleting: true } : u));
    try {
      console.log('Deleting user:', id);
      await apiWithRetry(() => supprimerUtilisateur({ utilisateurId: id }));
      setUtilisateurs(prev => prev.filter(u => u.id !== id));
      setSelectedUsers(prev => prev.filter(userId => userId !== id));
      showNotification(`Utilisateur "${user?.pseudo || id}" supprimé avec succès`, 'success');
    } catch (error) {
      setUtilisateurs(prev => prev.map(u => u.id === id ? { ...u, deleting: false } : u));
      handleApiError(error, 'Erreur lors de la suppression');
    }
  };

  const supprimerMultiples = async () => {
    if (selectedUsers.length === 0) return;
    if (selectedUsers.includes(utilisateur?.id)) {
      showNotification('Impossible de supprimer votre propre compte', 'error');
      return;
    }
    // const confirmMessage = `Êtes-vous sûr de vouloir supprimer ${selectedUsers.length} utilisateur(s) sélectionné(s) ?\n\nCette action est irréversible.`;
    // if (!window.confirm(confirmMessage)) return;

    try {
      console.log('Deleting multiple users:', selectedUsers);
      const deletions = selectedUsers.map(id => apiWithRetry(() => supprimerUtilisateur({ utilisateurId: id })));
      await Promise.all(deletions);
      setUtilisateurs(prev => prev.filter(u => !selectedUsers.includes(u.id)));
      setSelectedUsers([]);
      showNotification(`${selectedUsers.length} utilisateur(s) supprimé(s) avec succès`, 'success');
    } catch (error) {
      handleApiError(error, 'Erreur lors de la suppression multiple');
      loadUsers();
    }
  };

  const filteredUsers = utilisateurs.filter(user => 
    user.pseudo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSelectUser = (id) => {
    setSelectedUsers(prev => 
      prev.includes(id) ? prev.filter(userId => userId !== id) : [...prev, id]
    );
  };

  const selectAllUsers = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(u => u.id));
    }
  };

  const handleRefresh = () => {
    setSearchTerm('');
    setSelectedUsers([]);
    loadUsers();
  };

  const afficherRoles = (roles) => {
    if (!roles || !Array.isArray(roles) || roles.length === 0) return 'Aucun rôle';
    return roles.map(r => r.charAt(0).toUpperCase() + r.slice(1)).join(', ');
  };

  if (loading || loadingRoles) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        <span className="ml-2">Chargement {loading ? 'des utilisateurs' : 'des rôles'}...</span>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-100">
      {notification && (
        <Notification 
          message={notification.message} 
          type={notification.type} 
          onClose={closeNotification}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des utilisateurs</h1>
          <p className="text-gray-600">
            {utilisateurs.length} utilisateur(s) au total
            {searchTerm && ` • ${filteredUsers.length} résultat(s) pour "${searchTerm}"`}
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleRefresh}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            disabled={formLoading}
          >
            🔄 Actualiser
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 cursor-pointer rounded-2xl"
            disabled={formLoading}
          >
            + Nouvel utilisateur
          </button>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-4">
        <input
          type="text"
          placeholder="Rechercher un utilisateur..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
          disabled={formLoading}
        />
        {selectedUsers.length > 0 && (
          <button 
            onClick={supprimerMultiples}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            disabled={formLoading}
          >
            🗑️ Supprimer ({selectedUsers.length})
          </button>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-500/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-orange-600">Créer un utilisateur</h2>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <label className="block">
                Pseudo :
                <input
                  type="text"
                  value={formData.pseudo}
                  placeholder='Saisir le pseudo'
                  onChange={e => setFormData({ ...formData, pseudo: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-full border border-orange-300 shadow-sm text-orange-600 placeholder-orange-400 italic focus:ring-2 focus:ring-orange-500 focus:outline-none transition"
                  disabled={formLoading}
                />
              </label>
              <label className="block">
                Email :
                <input
                  type="email"
                  placeholder="Saisir l'adresse email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-full border border-orange-300 shadow-sm text-orange-600 placeholder-orange-400 italic focus:ring-2 focus:ring-orange-500 focus:outline-none transition"
                  disabled={formLoading}
                />
              </label>
              <label className="block">
                Mot de passe :
                <input
                  type="password"
                  value={formData.motDePasse}
                  onChange={e => setFormData({ ...formData, motDePasse: e.target.value })}
                  required
                  placeholder='Saisir le mot de passe'
                  className="w-full px-4 py-3 rounded-full border border-orange-300 shadow-sm text-orange-600 placeholder-orange-400 italic focus:ring-2 focus:ring-orange-500 focus:outline-none transition"
                  disabled={formLoading}
                />
              </label>
              <label className="block">
                Rôle :
                <select
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-3 rounded-full border border-orange-300 shadow-sm text-orange-600 focus:ring-2 focus:ring-orange-500 focus:outline-none transition"
                  required
                  disabled={formLoading || loadingRoles}
                >
                  <option value="">Sélectionnez un rôle</option>
                  {roles.map(r => (
                    <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                  ))}
                </select>
              </label>
              <div className="mt-4 flex gap-8 justify-center items-center">
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 cursor-pointer disabled:opacity-50"
                  disabled={formLoading || loadingRoles}
                >
                  {formLoading ? '⏳ Création...' : 'Créer'}
                </button>
                <button 
                  type="button" 
                  onClick={() => { setShowCreateModal(false); setFormData({ pseudo: '', email: '', motDePasse: '', role: roles[0] || 'utilisateur' }); }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-full hover:bg-gray-400 cursor-pointer"
                  disabled={formLoading}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && editUser && (
        <div className="fixed inset-0 bg-gray-500/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-orange-600">Modifier l'utilisateur #{editUser.id}</h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <label className="block">
                Pseudo :
                <input
                  type="text"
                  value={formData.pseudo}
                  onChange={e => setFormData({ ...formData, pseudo: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-full border border-orange-300 shadow-sm text-orange-600 placeholder-orange-400 italic focus:ring-2 focus:ring-orange-500 focus:outline-none transition"
                  disabled={formLoading}
                />
              </label>
              <label className="block">
                Email :
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-full border border-orange-300 shadow-sm text-orange-600 placeholder-orange-400 italic focus:ring-2 focus:ring-orange-500 focus:outline-none transition"
                  disabled={formLoading}
                />
              </label>
              <label className="block">
                Rôle :
                <select
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-3 rounded-full border border-orange-300 shadow-sm text-orange-600 focus:ring-2 focus:ring-orange-500 focus:outline-none transition"
                  required
                  disabled={formLoading || loadingRoles}
                >
                  <option value="">Sélectionnez un profil</option>
                  {roles.map(r => (
                    <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                  ))}
                </select>
              </label>
              <div className="mt-4 flex gap-2">
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 cursor-pointer disabled:opacity-50"
                  disabled={formLoading || loadingRoles}
                >
                  {formLoading ? '⏳ Modification...' : 'Modifier'}
                </button>
                <button 
                  type="button" 
                  onClick={() => { setShowEditModal(false); setFormData({ pseudo: '', email: '', motDePasse: '', role: roles[0] || 'utilisateur' }); setEditUser(null); }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-full hover:bg-gray-400 cursor-pointer"
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
                  checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                  onChange={selectAllUsers}
                  className="rounded border-gray-300"
                  disabled={formLoading}
                />
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">ID</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Pseudo</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Email</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Rôles</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-gray-600">
                  {searchTerm ? 'Aucun utilisateur trouvé pour cette recherche' : 'Aucun utilisateur disponible'}
                </td>
              </tr>
            ) : (
              filteredUsers.map(user => (
                <tr 
                  key={user.id} 
                  className={`hover:bg-gray-50 ${user.deleting ? 'opacity-50' : ''}`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => toggleSelectUser(user.id)}
                      disabled={user.deleting || formLoading || user.id === utilisateur?.id}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">#{user.id}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{user.pseudo}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{afficherRoles(user.roles)}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button 
                      onClick={() => {
                        setEditUser(user);
                        setFormData({ pseudo: user.pseudo, email: user.email, motDePasse: '', role: user.roles[0] || roles[0] || 'utilisateur' });
                        setShowEditModal(true);
                      }}
                      disabled={user.deleting || formLoading}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
                    >
                      ✏️ Modifier
                    </button>
                    <button 
                      onClick={() => supprimerUtilisateurSingle(user.id)}
                      disabled={user.deleting || formLoading || user.id === utilisateur?.id}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
                    >
                      {user.deleting ? '⏳' : '🗑️'} Supprimer
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
