import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexte/AuthContexte';
import { useState } from 'react';

function Layoutediteur() {
  const { utilisateur, deconnexion } = useAuth();
  const navigate = useNavigate();
  const [menuOuvert, setMenuOuvert] = useState(false);

  const toggleMenu = () => {
    setMenuOuvert(!menuOuvert);
    navigate('/editeur/compte');
  };

  const handleDeconnexion = () => {
    deconnexion();
    navigate('/connexion');
  };

  const isediteur = utilisateur?.roles?.includes('editeur');
  const isEditeur = utilisateur?.roles?.includes('editeur') || isediteur;

  return (
    <div className="flex min-h-screen bg-gray-100 relative">
      <aside className="w-64 bg-white shadow-lg flex flex-col justify-between">
        <div>
          <div className="text-3xl text-center font-bold text-orange-500 p-6">
            <span className="text-black">lu</span>Xew
          </div>
          <nav className="flex flex-col space-y-2 px-4 font-semibold text-gray-700">
            <NavLink
              to="/editeur"
              className={({ isActive }) =>
                `px-3 py-2 rounded font-medium transition duration-300 ${
                  isActive ? 'bg-orange-100 text-orange-600' : 'text-gray-700 hover:bg-orange-100 hover:text-orange-600'
                }`
              }
            >
              Tableau de bord
            </NavLink>
            {isEditeur && (
              <>
                <NavLink
                  to="/editeur/articles"
                  className={({ isActive }) =>
                    `px-3 py-2 rounded font-medium transition duration-300 ${
                      isActive ? 'bg-orange-100 text-orange-600' : 'text-gray-700 hover:bg-orange-100 hover:text-orange-600'
                    }`
                  }
                >
                  Articles
                </NavLink>
                <NavLink
                  to="/editeur/categories"
                  className={({ isActive }) =>
                    `px-3 py-2 rounded font-medium transition duration-300 ${
                      isActive ? 'bg-orange-100 text-orange-600' : 'text-gray-700 hover:bg-orange-100 hover:text-orange-600'
                    }`
                  }
                >
                  Catégories
                </NavLink>
              </>
            )}
            
          </nav>
        </div>

        <div className="p-4 space-y-4">
          <svg
            id="menuBottom"
            width="73"
            height="71"
            viewBox="0 0 73 71"
            fill="none"
            className="cursor-pointer bg-white h-12 fill-orange-500 hover:fill-orange-600 transition duration-300 absolute right-4 shadow-lg rounded-full shadow-orange-500 bottom-4 z-10 animate-bounce hover:animate-none cursor-pointer"
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

          <button onClick={handleDeconnexion} className="w-full bg-orange-600 text-white py-3 rounded-full font-semibold hover:bg-orange-700 transition duration-300 shadow-lg cursor-pointer">
            Déconnexion
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 ">
        <Outlet />
      </main>
    </div>
  );
}

export default Layoutediteur;
