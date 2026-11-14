import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { clsx } from 'clsx';
import { useAppStore } from '../stores/appStore';

export function MainLayout() {
  const { sidebarOpen } = useAppStore();
  const location = useLocation();

  console.log('[MainLayout] Rendering, location:', location.pathname);

  return (
    <div className={clsx('min-h-screen bg-gray-50', 'dark:bg-gray-900')}>
      <Sidebar />
      <div className={clsx('transition-all duration-300', 'lg:ml-64')}>
        <Header />
        <main className="p-4 sm:p-6 lg:p-8" role="main" aria-label="Contenu principal">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
