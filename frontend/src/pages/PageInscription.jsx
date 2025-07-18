import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexte/AuthContexte';
import { listerRoles } from '../services/api';

function PageInscription() {
  const [pseudo, setPseudo] = useState('');
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [confirmerMotDePasse, setConfirmerMotDePasse] = useState('');
  const [role, setRole] = useState('utilisateur');
  const [roles, setRoles] = useState(['utilisateur', 'editeur']);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [erreur, setErreur] = useState(null);
  const { inscription } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await listerRoles();
        if (response.data.succes && Array.isArray(response.data.roles)) {
          setRoles(response.data.roles.filter(r => r !== 'admin'));
          console.log('Roles loaded:', response.data.roles);
        } else {
          throw new Error('Format de réponse invalide');
        }
      } catch (error) {
        console.error('Erreur lors du chargement des rôles:', error);
        setErreur('Impossible de charger les rôles. Utilisation des rôles par défaut.');
      } finally {
        setLoadingRoles(false);
      }
    };
    fetchRoles();
  }, []);

  const gererInscription = async (e) => {
    e.preventDefault();
    if (motDePasse !== confirmerMotDePasse) {
      setErreur('Les mots de passe ne correspondent pas');
      return;
    }

    console.log(role);
    if (!roles.includes(role) || role === 'admin') {
      setErreur('Rôle invalide');
      return;
    }
    try {
      await inscription(pseudo, email, motDePasse, role);
      navigate('/connexion');
    } catch (err) {
      setErreur(err.response?.data?.erreur || 'Erreur d\'inscription');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center relative">
      <nav className="text-sm text-gray-600 mb-2 absolute left-4 top-4 font-semibold">
        <Link to="/" className="hover:text-orange-600">Accueil</Link>
        <span className="mx-2">&gt;</span>
        <Link to="/inscription" className="hover:text-orange-600">Inscription</Link>
      </nav>
      <div className="relative w-full max-w-4xl mx-auto px-4 py-12">
        <div
          className="absolute inset-0 bg-cover bg-center rounded-3xl filter blur-sm brightness-75"
          style={{ backgroundImage: "url('/img/4.png')", zIndex: -1 }}
        ></div>

        <div className="bg-white/80 backdrop-blur-lg p-10 rounded-3xl shadow-2xl border-4 border-orange-200">
          <h2 className="text-4xl font-bold text-center text-orange-600 mb-10">Inscription</h2>

          {erreur && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-full mb-6">
              {erreur}
            </div>
          )}

          {loadingRoles && (
            <div className="flex items-center justify-center mb-6">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
              <span className="ml-2 text-gray-600">Chargement des rôles...</span>
            </div>
          )}

          <form onSubmit={gererInscription} className="space-y-6">
            <input
              type="text"
              value={pseudo}
              onChange={(e) => setPseudo(e.target.value)}
              placeholder="Pseudo"
              className="w-full px-4 py-3 rounded-full border border-orange-300 shadow-sm text-orange-600 placeholder-orange-400 italic focus:ring-2 focus:ring-orange-500 focus:outline-none transition"
              required
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Adresse email"
              className="w-full px-4 py-3 rounded-full border border-orange-300 shadow-sm text-orange-600 placeholder-orange-400 italic focus:ring-2 focus:ring-orange-500 focus:outline-none transition"
              required
            />
            <input
              type="password"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              placeholder="Mot de passe"
              className="w-full px-4 py-3 rounded-full border border-orange-300 shadow-sm text-orange-600 placeholder-orange-400 italic focus:ring-2 focus:ring-orange-500 focus:outline-none transition"
              required
            />
            <input
              type="password"
              value={confirmerMotDePasse}
              onChange={(e) => setConfirmerMotDePasse(e.target.value)}
              placeholder="Confirmer le mot de passe"
              className="w-full px-4 py-3 rounded-full border border-orange-300 shadow-sm text-orange-600 placeholder-orange-400 italic focus:ring-2 focus:ring-orange-500 focus:outline-none transition"
              required
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-3 rounded-full border border-orange-300 shadow-sm text-orange-600 focus:ring-2 focus:ring-orange-500 focus:outline-none transition"
              required
              disabled={loadingRoles}
            >
              <option> Sélectionnez un profil</option>
              {roles.map(r => (
                <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
              ))}
            </select>
            <button
              type="submit"
              className="w-full bg-orange-600 text-white py-3 rounded-full font-semibold hover:bg-orange-700 transition duration-300 shadow-lg"
              disabled={loadingRoles}
            >
              S'inscrire
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/connexion"
              className="text-sm text-orange-600 font-semibold hover:underline"
            >
              Se connecter
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PageInscription;
