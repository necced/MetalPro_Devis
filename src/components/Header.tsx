import {
  Menu,
  Sun,
  Moon,
  Monitor,
  Bell,
  ChevronDown,
  LogOut,
  User,
  WifiOff,
  Wifi,
  AlertTriangle,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useState, useEffect } from 'react';
import { useAppStore } from '../stores/appStore';
import { initializeDatabase } from '../db';
import { useNavigate } from 'react-router-dom';

export function Header() {
  const { sidebarOpen, toggleSidebar, theme, setTheme, settings, isOnline, pendingSyncCount } =
    useAppStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [dbReady, setDbReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    initializeDatabase()
      .then(() => {
        if (mounted) setDbReady(true);
      })
      .catch(console.error);
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }
  }, [theme]);

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    setUserMenuOpen(false);
  };

  const handleLogout = () => {
    setUserMenuOpen(false);
    navigate('/');
  };

  return (
    <header className={clsx('sticky top-0 z-30 border-b border-gray-200 bg-white', 'lg:ml-64')}>
      <div className="flex h-16 items-center justify-between px-4">
        {/* Left side - Mobile menu button + Title */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 lg:hidden"
            onClick={toggleSidebar}
            aria-label={sidebarOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={sidebarOpen}
            aria-controls="sidebar"
          >
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>

          <h1 className="hidden text-lg font-semibold text-gray-900 sm:block">
            {settings.entrepriseNom || 'MetalPro Devis'}
          </h1>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          {/* DB Status */}
          <div className="hidden items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" aria-hidden="true" />
            <span>DB prête</span>
          </div>

          {/* Online/Offline status */}
          <div
            className={clsx(
              'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
              isOnline ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            )}
          >
            {isOnline ? (
              <Wifi className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <>
                <WifiOff className="h-3.5 w-3.5" aria-hidden="true" />
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
              </>
            )}
            <span className="hidden sm:inline">{isOnline ? 'En ligne' : 'Hors ligne'}</span>
          </div>

          {/* Pending sync */}
          {pendingSyncCount > 0 && (
            <div className="relative">
              <button
                type="button"
                className="relative rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                aria-label={`${pendingSyncCount} synchronisation(s) en attente`}
              >
                <Bell className="h-5 w-5" aria-hidden="true" />
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
                  {pendingSyncCount > 9 ? '9+' : pendingSyncCount}
                </span>
              </button>
            </div>
          )}

          {/* Theme toggle */}
          <div className="hidden sm:block">
            <button
              type="button"
              className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Moon className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>

          {/* User menu */}
          <div className="relative">
            <button
              type="button"
              className={clsx(
                'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
              )}
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              aria-expanded={userMenuOpen}
              aria-haspopup="true"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100">
                <User className="h-5 w-5 text-primary-700" aria-hidden="true" />
              </div>
              <span className="hidden max-w-[120px] truncate md:inline-block">
                {settings.entrepriseNom || 'MetalPro SARL'}
              </span>
              <ChevronDown className="h-4 w-4 text-gray-500" aria-hidden="true" />
            </button>

            {userMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setUserMenuOpen(false)}
                  aria-hidden="true"
                />
                <div className="fixed right-4 top-full z-50 mt-2 w-56 rounded-md border border-gray-200 bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5">
                  <div className="border-b border-gray-100 px-4 py-2">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {settings.entrepriseNom || 'MetalPro SARL'}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {settings.entrepriseEmail || 'Non configuré'}
                    </p>
                  </div>
                  <button
                    type="button"
                    className={clsx(
                      'flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50',
                      theme === 'system' ? 'bg-primary-50 text-primary-700' : ''
                    )}
                    onClick={() => handleThemeChange('system')}
                  >
                    <Monitor className="h-4 w-4" aria-hidden="true" />
                    Système
                  </button>
                  <button
                    type="button"
                    className={clsx(
                      'flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50',
                      theme === 'light' ? 'bg-primary-50 text-primary-700' : ''
                    )}
                    onClick={() => handleThemeChange('light')}
                  >
                    <Sun className="h-4 w-4" aria-hidden="true" />
                    Clair
                  </button>
                  <button
                    type="button"
                    className={clsx(
                      'flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50',
                      theme === 'dark' ? 'bg-primary-50 text-primary-700' : ''
                    )}
                    onClick={() => handleThemeChange('dark')}
                  >
                    <Moon className="h-4 w-4" aria-hidden="true" />
                    Sombre
                  </button>
                  <hr className="my-1 border-gray-100" />
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    Déconnexion
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
