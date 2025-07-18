import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexte/AuthContexte';
import api from '../../src/services/api';

function Header() {

  const [menuOuvert, setMenuOuvert] = useState(false);
  const [boutonConnexionActif, setBoutonConnexionActif] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [articles, setArticles] = useState([]);
  const [resultats, setResultats] = useState([]);
  const [popupOuvert, setPopupOuvert] = useState(false);

  const menuRef = useRef();
  const rechercheRef = useRef();
  const navigate = useNavigate();
  const { deconnexion } = useAuth();

  let utilisateur = null;
  const token = localStorage.getItem('jwt');

  if (token) {
    try {
      utilisateur = JSON.parse(localStorage.getItem('utilisateur'));
    } catch {
      utilisateur = null;
    }
  }

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await api.get('/articles');
        setArticles(response.data.articles);
        console.log('Articles récupérés:', response.data.articles);
      } catch (error) {
        console.error('Erreur lors de la récupération des articles:', error);
      }
    };
    fetchArticles();
  }, []);

  useEffect(() => {
    if (recherche.trim() === '') {
      setResultats([]);
      setPopupOuvert(false);
      return;
    }

    const filtre = recherche.toLowerCase();
    const filtered = articles.filter(
      (article) =>
        article.titre.toLowerCase().includes(filtre) ||
        (article.contenu && article.contenu.toLowerCase().includes(filtre))
    );

    setResultats(filtered);
    setPopupOuvert(filtered.length > 0);
  }, [recherche, articles]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        menuOuvert &&
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setMenuOuvert(false);
      }
      if (
        popupOuvert &&
        rechercheRef.current &&
        !rechercheRef.current.contains(event.target)
      ) {
        setPopupOuvert(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOuvert, popupOuvert]);

  const toggleMenu = () => setMenuOuvert(!menuOuvert);

  const gererDeconnexion = async (e) => {
    e.preventDefault();
    try {
      await deconnexion();
      localStorage.removeItem('jwt');
      localStorage.removeItem('utilisateur');
      navigate('/');
      setMenuOuvert(false);
    } catch (err) {
      setErreur('Erreur lors de la déconnexion');
      console.error(err);
    }
  };

  const gererConnexion = () => {
    setBoutonConnexionActif(true);
    setTimeout(() => {
      navigate('/connexion');
      setBoutonConnexionActif(false);
    }, 300);
  };

  const handleClickResultat = (id) => {
    setRecherche('');
    setPopupOuvert(false);
    navigate(`/articles/${id}`);
  };

  return (
    <header className="fixed top-0 left-0 w-full bg-white  z-50  p-4 font-bold">
      <div className="flex justify-center items-center relative">

        <div className="ml-12 flex justify-start items-start w-1/4">
          <Link to="/" className="text-black text-2xl font-bold">
            <div className="text-3xl font-bold text-orange-500">
              <span className="relative text-black animate-pulse">lu</span>Xew
            </div>
          </Link>
        </div>

        <div
          ref={rechercheRef}
          className="relative w-1/3"
          aria-haspopup="listbox"
          aria-expanded={popupOuvert}
        >
          <input
            type="search"
            className="w-full border-2 border-orange-500 rounded-full px-4 py-1 focus:outline-none focus:ring-2 focus:ring-orange-400"
            placeholder="Rechercher des articles..."
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            aria-label="Recherche des articles"
            onFocus={() => resultats.length > 0 && setPopupOuvert(true)}
            autoComplete="off"
          />

          {popupOuvert && (
            <ul
              role="listbox"
              className="absolute z-50 top-full mt-1 w-full max-h-60 overflow-y-auto bg-white border-2 border-orange-500 rounded-lg shadow-lg"
            >
              {resultats.map((article) => (
                <li
                  key={article.id}
                  role="option"
                  tabIndex={0}
                  className="cursor-pointer px-4 py-2 hover:bg-orange-100"
                  onClick={() => handleClickResultat(article.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleClickResultat(article.id);
                    }
                  }}
                >
                  <span className="font-semibold">{article.titre}</span>
                  <p className="text-sm text-gray-500 truncate">{article.contenu}</p>
                </li>
              ))}
              {resultats.length === 0 && (
                <li className="px-4 py-2 text-gray-500 italic" role="option" aria-disabled="true">
                  Aucun article trouvé.
                </li>
              )}

            </ul>
          )}
        </div>

        <div className="ml-12 w-1/4 flex justify-end items-center">
          {utilisateur ? (
            <>
              <svg
                id="menuBottom"
                width="73"
                height="71"
                viewBox="0 0 73 71"
                fill="none"
                className="mr-4 cursor-pointer h-12 fill-orange-500 hover:fill-orange-600 transition duration-300"
                onClick={toggleMenu}
                aria-haspopup="true"
                aria-expanded={menuOuvert}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleMenu();
                  }
                }}
              >
                <g>
                  <ellipse cx="36.5" cy="31.5" rx="32.5" ry="31.5" fill="white" />
                </g>
                <rect x="21" y="28" width="31" height="7" rx="3.5" fill="#000000" />
                <rect x="6" y="39" width="61" height="7" rx="3.5" fill="#f97316" />
                <rect x="0" y="49" width="71" height="7" rx="3.5" fill="#000000" />
                <ellipse cx="28.5" cy="17.5" rx="7.5" ry="6.5" fill="#f97316" />
              </svg>

              <nav
                ref={menuRef}
                className={`${
                  menuOuvert ? 'block' : 'hidden'
                } px-4 py-6 fixed top-20 right-26 rounded-xl shadow-2xl bg-white border-b-2 border-orange-500 font-bold transition duration-300 z-50`}
              >
                <p className="text-center mb-2 text-gray-600 italic">
                  Bienvenue, {utilisateur.pseudo}
                </p>
                {utilisateur?.roles?.includes('admin') ? (
                  <Link to="/admin/dashboard" className="block h-8 text-center hover:text-orange-500">
                    Dashboard
                  </Link>
                ) : utilisateur?.roles?.includes('editeur') ? (
                  <Link to="/editeur/dashboard" className="block h-8 text-center hover:text-orange-500">
                    Dashboard
                  </Link>
                ) : (
                  <Link to="/profil" className="block h-8 text-center hover:text-orange-500">
                    Profil
                  </Link>
                )}
                
                <Link to="/articles" className="block h-8 text-center hover:text-orange-500">
                  Articles
                </Link>
                <button
                  onClick={gererDeconnexion}
                  className="block h-8 w-full text-center hover:text-orange-500 cursor-pointer"
                >
                  Déconnexion
                </button>
                {erreur && (
                  <p className="mt-2 text-red-600 text-center" role="alert">
                    {erreur}
                  </p>
                )}
              </nav>
            </>
          ) : (
            <div className="flex items-center space-x-4">
              <Link to="/articles" className="hover:text-orange-500">
                Articles
              </Link>
              <Link to="/a-propos" className="hover:text-orange-500">
                À propos
              </Link>
              <Link to="/contact" className="hover:text-orange-500">
                Contact
              </Link>
              <button
                onClick={gererConnexion}
                className="bg-orange-500 text-white px-4 py-1 rounded-full hover:bg-white hover:text-orange-500 hover:border-orange-500 hover:shadow-orange-500/50 cursor-pointer shadow shadow-black/50"
              >
                Se connecter
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-2 bg-orange-100 border-t-2 border-orange-400 py-2 overflow-hidden whitespace-nowrap">
        <div className="inline-block animate-marquee font-semibold text-lg text-orange-700 px-4">
          DERNIÈRE MINUTE :{'  '}
          {articles.slice(0, 2).map((article, index) => (
            <span className='font-normal' key={article.id}>
              {article.titre}
              {index < 9 && <span className="mx-3">-</span>}
            </span>
          ))}
        </div>
      </div>

    </header>
  );
}

export default Header;
