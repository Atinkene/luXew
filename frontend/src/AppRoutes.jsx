import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexte/AuthContexte';

import LayoutAdmin from './layouts/LayoutAdmin';
import LayoutEditeur from './layouts/LayoutEditeur';

import Accueil from './pages/PageAccueil';
import Connexion from './pages/PageConnexion';
import Inscription from './pages/PageInscription';
import ArticleDetail from './pages/ArticleDetail';
import PageNonTrouvee from './pages/PageNonTrouvee';

import TableauDeBordAdmin from './pages/Admin/TableauDeBord';
import CreerCategorie from './pages/Admin/CreerCategorie';
import ModifierCategorie from './pages/Admin/ModifierCategorie';
import GestionUtilisateurs from './pages/Admin/GestionUtilisateurs';
import ModifierUtilisateur from './pages/Admin/ModifierUtilisateur';
import GestionCategorie from './pages/Admin/GestionCategories'
import GestionJetons from './pages/Admin/GestionJetons'
import GestionArticlesAdmin from './pages/Admin/GestionArticles'
import GestionArticlesEditeurs from './pages/Admin/TousLesArticles'


import TableauDeBordEditeur from './pages/Editeur/TableauDeBord';
import GestionCategorieEditeur from './pages/Editeur/GestionCategories'
import GestionArticles from './pages/Editeur/GestionArticles'

import ListeArticles from './pages/ListeArticles';


const ProtectedRoute = ({ rolesAutorises, children }) => {
  const { utilisateur, token } = useAuth();
  
  if (!token || !utilisateur) {
    return <Navigate to="/connexion" replace />;
  }

  const autorise = rolesAutorises.some(role => utilisateur.roles.includes(role));
  if (!autorise) {
    return <Navigate to="/non-autorise" replace />;
  }
  return children;
};

export default function AppRoutes() {
  return (
    <Routes>
      {/* Routes publiques */}
      <Route path="/" element={<Accueil />} />
      <Route path="/connexion" element={<Connexion />} />
      <Route path="/inscription" element={<Inscription />} />
      <Route path="/articles/:id" element={<ArticleDetail />} />
      <Route path="/articles" element={<ListeArticles />} />

      {/* Routes admin */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute rolesAutorises={['admin']}>
            <LayoutAdmin />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<TableauDeBordAdmin />} />
        <Route path="categories/creer" element={<CreerCategorie />} />
        <Route path="categories/" element={<GestionCategorie />} />
        <Route path="articles/" element={<GestionArticlesAdmin />} />
        <Route path="articles/editeurs" element={<GestionArticlesEditeurs />} />
        <Route path="jetons/" element={<GestionJetons />} />
        <Route path="categories/:id/modifier" element={<ModifierCategorie />} />
        <Route path="utilisateurs" element={<GestionUtilisateurs />} />
        <Route path="utilisateurs/:id/modifier" element={<ModifierUtilisateur />} />
      </Route>

      {/* Routes éditeur */}
      <Route
        path="/editeur/*"
        element={
          <ProtectedRoute rolesAutorises={['editeur']}>
            <LayoutEditeur />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<TableauDeBordEditeur />} />
        <Route path="categories/" element={<GestionCategorieEditeur />} />
        <Route path="articles/" element={<GestionArticles />} />
        {/* <Route path="articles/creer" element={<CreerArticle />} /> */}
        {/* <Route path="articles/:id/modifier" element={<ModifierArticle />} /> */}
      </Route>

      {/* Routes visiteur */}
      {/* <Route
        path="/visiteur/*"
        element={
          <ProtectedRoute rolesAutorises={['visiteur']}>
            <LayoutVisiteur />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<TableauDeBordVisiteur />} />
      </Route> */}

      {/* Routes erreurs */}
      <Route path="/non-autorise" element={<PageNonTrouvee />} />
      <Route path="*" element={<PageNonTrouvee />} />
    </Routes>
  );
}
