// App.jsx - Version avec gestion du chargement
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexte/AuthContexte';
import AppRoutes from './AppRoutes';

function AppContent() {
  const { estCharge } = useAuth();

  if (!estCharge) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <main className="">
        <AppRoutes />
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;