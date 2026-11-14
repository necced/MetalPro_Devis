import { NavLink, useLocation } from 'react-router-dom';
import {
  X,
  Menu,
  LayoutDashboard,
  FileText,
  Plus,
  Users,
  Package,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAppStore } from '../stores/appStore';

const navigation = [
  { name: 'Tableau de bord', href: '/', icon: LayoutDashboard },
  { name: 'Devis', href: '/devis', icon: FileText },
  { name: 'Nouveau devis', href: '/devis/nouveau', icon: Plus },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Matériaux', href: '/materiaux', icon: Package },
  { name: 'Paramètres', href: '/parametres', icon: Settings },
] as const;

export function Sidebar() {
  const location = useLocation();
  const { sidebarOpen, toggleSidebar } = useAppStore();

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={clsx(
          'fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden',
          sidebarOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={toggleSidebar}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed left-0 top-0 z-50 h-full border-r border-gray-200 bg-white transition-all duration-300 ease-in-out lg:relative lg:z-auto lg:translate-x-0',
          sidebarOpen ? 'w-64 translate-x-0' : '-w-64 -translate-x-full lg:w-64 lg:translate-x-0'
        )}
        role="navigation"
        aria-label="Navigation principale"
      >
        <div className="flex h-full flex-col">
          {/* Logo / Brand */}
          <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
                <LayoutDashboard className="h-5 w-5 text-white" aria-hidden="true" />
              </div>
              <span className="font-semibold text-gray-900">MetalPro</span>
            </div>
            <button
              type="button"
              className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 lg:hidden"
              onClick={toggleSidebar}
              aria-label="Fermer le menu"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Menu principal">
            {navigation.map((item) => {
              const isActive =
                location.pathname === item.href ||
                (item.href !== '/' && location.pathname.startsWith(item.href));
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    )
                  }
                  onClick={toggleSidebar}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Collapse toggle (desktop only) */}
          <div className="hidden border-t border-gray-200 p-3 lg:flex">
            <button
              type="button"
              className={clsx(
                'flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900',
                sidebarOpen ? '' : 'justify-end'
              )}
              onClick={toggleSidebar}
              aria-label={sidebarOpen ? 'Réduire la barre latérale' : 'Étendre la barre latérale'}
            >
              {sidebarOpen ? (
                <>
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  <span>Réduire</span>
                </>
              ) : (
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
