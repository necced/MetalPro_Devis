import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Plus,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAppStore } from '../stores/appStore';
import { toFCFA } from '../shared/utils/decimal';
import { getAllDevis, searchDevis, deleteDevis } from '../services/database';
import type { Devis } from '../types';

export function DevisList() {
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('');
  const [sortDesc, setSortDesc] = useState(true);
  const [devis, setDevis] = useState<Devis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const statutLabels: Record<string, { label: string; color: string }> = {
    brouillon: {
      label: 'Brouillon',
      color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    },
    envoye: {
      label: 'Envoyé',
      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    },
    accepte: {
      label: 'Accepté',
      color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    },
    refuse: {
      label: 'Refusé',
      color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    },
    expire: {
      label: 'Expiré',
      color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    },
  };

  useEffect(() => {
    loadDevis();
  }, []);

  const loadDevis = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllDevis();
      setDevis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des devis');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearch(query);
    if (!query) {
      loadDevis();
      return;
    }
    setLoading(true);
    try {
      const data = await searchDevis(query);
      setDevis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Supprimer ce devis ? Cette action est irréversible.')) return;
    try {
      await deleteDevis(id);
      setDevis((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    }
  };

  const filteredDevis = devis
    .filter((d) => !statutFilter || d.statut === statutFilter)
    .sort((a, b) =>
      sortDesc
        ? b.dateCreation.localeCompare(a.dateCreation)
        : a.dateCreation.localeCompare(b.dateCreation)
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="page-title">
            Devis
          </h1>
          <p className="text-gray-600 dark:text-gray-400">{filteredDevis.length} devis</p>
        </div>
        <Link
          to="/devis/nouveau"
          data-testid="devis-list-new"
          className={clsx(
            'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors',
            'bg-primary-600 text-white hover:bg-primary-700'
          )}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nouveau devis
        </Link>
      </div>

      {error && (
        <div
          className="rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-900/30 dark:text-red-300"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
              aria-hidden="true"
            />
            <input
              type="text"
              placeholder="Rechercher par numéro, client..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              data-testid="devis-list-search"
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              aria-label="Rechercher un devis"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={statutFilter}
              onChange={(e) => setStatutFilter(e.target.value)}
              data-testid="devis-list-statut-filter"
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              aria-label="Filtrer par statut"
            >
              <option value="">Tous les statuts</option>
              <option value="brouillon">Brouillon</option>
              <option value="envoye">Envoyé</option>
              <option value="accepte">Accepté</option>
              <option value="refuse">Refusé</option>
              <option value="expire">Expiré</option>
            </select>
            <button
              type="button"
              onClick={() => setSortDesc(!sortDesc)}
              data-testid="devis-list-sort"
              className="rounded-lg border border-gray-300 bg-white p-2 text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600"
              aria-label={sortDesc ? 'Trier plus anciens' : 'Trier plus récents'}
            >
              {sortDesc ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        {loading ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            <div
              className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600"
              aria-label="Chargement..."
            />
            <p className="text-lg font-medium">Chargement des devis...</p>
          </div>
        ) : filteredDevis.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            <FileText
              className="mx-auto mb-3 h-12 w-12 text-gray-300 dark:text-gray-600"
              aria-hidden="true"
            />
            <p className="text-lg font-medium">Aucun devis trouvé</p>
            <p className="mt-1">Essayez de modifier vos filtres ou créez un nouveau devis</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" role="table">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                    N° Devis
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                    Date création
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                    Validité
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                    Total TTC
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredDevis.map((devisItem) => (
                  <tr key={devisItem.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <Link
                        to={`/devis/${devisItem.id}`}
                        className="font-medium text-primary-600 hover:text-primary-700"
                      >
                        {devisItem.numero}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-900 dark:text-white">
                      {devisItem.clientNom}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-gray-600 dark:text-gray-400">
                      {new Date(devisItem.dateCreation).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-gray-600 dark:text-gray-400">
                      {new Date(devisItem.dateValidite).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right font-mono text-gray-900 dark:text-white">
                      {toFCFA(devisItem.totaux.totalTTC)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={clsx(
                          'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
                          statutLabels[devisItem.statut]?.color
                        )}
                      >
                        {statutLabels[devisItem.statut]?.label}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/devis/${devisItem.id}`}
                          data-testid={`devis-row-${devisItem.id}-view`}
                          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700"
                          aria-label={`Voir le devis ${devisItem.numero}`}
                        >
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        </Link>
                        <Link
                          to={`/devis/${devisItem.id}/modifier`}
                          data-testid={`devis-row-${devisItem.id}-edit`}
                          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700"
                          aria-label={`Modifier le devis ${devisItem.numero}`}
                        >
                          <Edit className="h-4 w-4" aria-hidden="true" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(devisItem.id!)}
                          data-testid={`devis-row-${devisItem.id}-delete`}
                          className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                          aria-label={`Supprimer le devis ${devisItem.numero}`}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <div className="relative">
                          <button
                            type="button"
                            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700"
                            aria-label="Plus d'actions"
                          >
                            <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
