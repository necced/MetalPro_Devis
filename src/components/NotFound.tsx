import { Link } from 'react-router-dom';
import { Home, Search, FileText, Users, Package, Settings, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';

export function NotFound() {
  return (
    <div className="flex min-h-[400px] items-center justify-center p-8">
      <div className="w-full max-w-md text-center">
        <div
          className={clsx(
            'mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full',
            'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
          )}
        >
          <AlertCircle className="h-8 w-8" aria-hidden="true" />
        </div>
        <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">Page introuvable</h2>
        <p className="mb-6 text-gray-600 dark:text-gray-400">
          La page que vous recherchez n'existe pas ou a été déplacée.
        </p>
        <div className="space-y-3">
          <Link
            to="/"
            className={clsx(
              'inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 font-medium transition-colors',
              'bg-primary-600 text-white hover:bg-primary-700'
            )}
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            Retour à l'accueil
          </Link>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Link
              to="/devis"
              className={clsx(
                'flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
              )}
            >
              <FileText className="h-4 w-4" aria-hidden="true" />
              Devis
            </Link>
            <Link
              to="/clients"
              className={clsx(
                'flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
              )}
            >
              <Users className="h-4 w-4" aria-hidden="true" />
              Clients
            </Link>
            <Link
              to="/materiaux"
              className={clsx(
                'flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
              )}
            >
              <Package className="h-4 w-4" aria-hidden="true" />
              Matériaux
            </Link>
            <Link
              to="/parametres"
              className={clsx(
                'flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
              )}
            >
              <Settings className="h-4 w-4" aria-hidden="true" />
              Paramètres
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
