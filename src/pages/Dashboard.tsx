import {
  FileText,
  Users,
  Package,
  Plus,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';
import { useAppStore } from '../stores/appStore';

const stats = [
  { name: 'Devis total', value: '0', icon: FileText, color: 'bg-blue-500', href: '/devis' },
  { name: 'Clients', value: '0', icon: Users, color: 'bg-green-500', href: '/clients' },
  { name: 'Matériaux', value: '0', icon: Package, color: 'bg-purple-500', href: '/materiaux' },
  {
    name: 'En attente',
    value: '0',
    icon: Clock,
    color: 'bg-yellow-500',
    href: '/devis?statut=brouillon',
  },
] as const;

const recentActions = [
  { label: 'Nouveau devis', href: '/devis/nouveau', icon: Plus, primary: true },
  { label: 'Ajouter un client', href: '/clients', icon: Users, primary: false },
  { label: 'Ajouter un matériau', href: '/materiaux', icon: Package, primary: false },
] as const;

export function Dashboard() {
  const { settings } = useAppStore();

  console.log('[Dashboard] Rendering');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tableau de bord</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Bienvenue dans {settings.entrepriseNom || 'MetalPro Devis'}
          </p>
        </div>
        <Link
          to="/devis/nouveau"
          className={clsx(
            'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors',
            'bg-primary-600 text-white hover:bg-primary-700'
          )}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nouveau devis
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.name}
            to={stat.href}
            className={clsx(
              'rounded-xl border border-gray-200 p-6 dark:border-gray-700',
              'bg-white transition-colors hover:border-primary-300 dark:bg-gray-800 dark:hover:border-primary-700'
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.name}</p>
                <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
              </div>
              <div className={clsx('rounded-lg p-3', stat.color)}>
                <stat.icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Actions rapides
        </h2>
        <div className="flex flex-wrap gap-3">
          {recentActions.map((action) => (
            <Link
              key={action.label}
              to={action.href}
              className={clsx(
                'inline-flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors',
                action.primary
                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
              )}
            >
              <action.icon className="h-4 w-4" aria-hidden="true" />
              {action.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Devis - placeholder */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Derniers devis</h2>
          <Link to="/devis" className="text-sm font-medium text-primary-600 hover:text-primary-700">
            Voir tout
          </Link>
        </div>
        <div className="p-6 text-center text-gray-500 dark:text-gray-400">
          <FileText
            className="mx-auto mb-3 h-12 w-12 text-gray-300 dark:text-gray-600"
            aria-hidden="true"
          />
          <p className="text-lg font-medium">Aucun devis pour le moment</p>
          <p className="mt-1">Commencez par créer votre premier devis</p>
          <Link
            to="/devis/nouveau"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 font-medium text-white hover:bg-primary-700"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Créer un devis
          </Link>
        </div>
      </div>
    </div>
  );
}
