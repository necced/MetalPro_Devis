import { Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { NotFound } from './components/NotFound';
import { MainLayout } from './components/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { DevisList } from './pages/DevisList';
import { DevisCreate } from './pages/DevisCreate';
import { DevisDetail } from './pages/DevisDetail';
import { DevisEdit } from './pages/DevisEdit';
import { ClientList } from './pages/ClientList';
import { ClientCreate } from './pages/ClientCreate';
import { ClientDetail } from './pages/ClientDetail';
import { ClientEdit } from './pages/ClientEdit';
import { MateriauList } from './pages/MateriauList';
import { MateriauCreate } from './pages/MateriauCreate';
import { MateriauDetail } from './pages/MateriauDetail';
import { MateriauEdit } from './pages/MateriauEdit';
import { Settings } from './pages/Settings';

function App() {
  console.log('[App] Rendering App');
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="devis" element={<DevisList />} />
          <Route path="devis/nouveau" element={<DevisCreate />} />
          <Route path="devis/:id" element={<DevisDetail />} />
          <Route path="devis/:id/modifier" element={<DevisEdit />} />
          <Route path="clients" element={<ClientList />} />
          <Route path="clients/nouveau" element={<ClientCreate />} />
          <Route path="clients/:id" element={<ClientDetail />} />
          <Route path="clients/:id/modifier" element={<ClientEdit />} />
          <Route path="materiaux" element={<MateriauList />} />
          <Route path="materiaux/nouveau" element={<MateriauCreate />} />
          <Route path="materiaux/:id" element={<MateriauDetail />} />
          <Route path="materiaux/:id/modifier" element={<MateriauEdit />} />
          <Route path="parametres" element={<Settings />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
