import { useState } from 'react';
import { useAuth } from '../contexte/AuthContexte';
import { useNavigate, Link } from 'react-router-dom';

function PageConnexion() {
  const [pseudo, setPseudo] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [erreur, setErreur] = useState(null);
  const { connexion } = useAuth();
  const navigate = useNavigate();

  const gererConnexion = async (e) => {
    e.preventDefault();
    try {
      await connexion(pseudo, motDePasse);
      navigate('/');
    } catch (err) {
      setErreur(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center relative">
      <nav className="text-sm text-gray-600 mb-2 absolute left-4 top-4 font-semibold">
        <Link to="/" className="hover:text-orange-600">Accueil</Link>
        <span className="mx-2">&gt;</span>
        <Link to="/connexion" className="hover:text-orange-600">Connexion</Link>
      </nav>
      <div className="relative w-full max-w-4xl mx-auto px-4 py-12">
        <div
          className="absolute inset-0 bg-cover bg-center rounded-3xl filter blur-sm brightness-75"
          style={{ backgroundImage: "url('/img/4.png')", zIndex: -1 }}
        ></div>

        <div className="bg-white/80 backdrop-blur-lg p-10 rounded-3xl shadow-2xl border-4 border-orange-200">
          <h2 className="text-4xl font-bold text-center text-orange-600 mb-10">Connexion</h2>

          {erreur && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-full mb-6">
              {erreur.message}
            </div>
          )}


          <form onSubmit={gererConnexion} className="space-y-6">
            <input
              type="text"
              value={pseudo}
              onChange={(e) => setPseudo(e.target.value)}
              placeholder="Entrer votre pseudo"
              className="w-full px-4 py-3 rounded-full border border-orange-300 shadow-sm text-orange-600 placeholder-orange-400 italic focus:ring-2 focus:ring-orange-500 focus:outline-none transition"
              required
            />

            <input
              type="password"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              placeholder="Entrez votre mot de passe"
              className="w-full px-4 py-3 rounded-full border border-orange-300 shadow-sm text-orange-600 placeholder-orange-400 italic focus:ring-2 focus:ring-orange-500 focus:outline-none transition"
              required
            />

            <button
              type="submit"
              className="w-full bg-orange-600 text-white py-3 rounded-full font-semibold hover:bg-orange-700 transition duration-300 shadow-lg"
            >
              Se connecter
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <Link to="#" className="text-sm text-gray-700 hover:underline">
              Mot de passe oublié ?
            </Link>
            <br />
            <Link
              to="/inscription"
              className="text-sm text-orange-600 font-semibold hover:underline"
            >
              S'inscrire
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PageConnexion;
