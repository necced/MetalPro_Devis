import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
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
import { getAllMateriaux, searchMateriaux, deleteMateriau } from '../services/database';
import type { Materiau } from '../types';

export function MateriauList() {
  const [search, setSearch] = useState('');
  const [sortDesc, setSortDesc] = useState(false);
  const [materiaux, setMateriaux] = useState<Materiau[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMateriaux();
  }, []);

  const loadMateriaux = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllMateriaux();
      setMateriaux(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des matériaux');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearch(query);
    if (!query) {
      loadMateriaux();
      return;
    }
    setLoading(true);
    try {
      const data = await searchMateriaux(query);
      setMateriaux(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Supprimer ce matériau ? Cette action est irréversible.')) return;
    try {
      await deleteMateriau(id);
      setMateriaux((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    }
  };

  const filteredMateriaux = materiaux.sort((a, b) =>
    sortDesc ? b.nom.localeCompare(a.nom) : a.nom.localeCompare(b.nom)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="page-title">
            Matériaux
          </h1>
          <p className="text-gray-600 dark:text-gray-400">{filteredMateriaux.length} matériau(x)</p>
        </div>
        <Link
          to="/materiaux/nouveau"
          data-testid="materiau-list-new"
          className={clsx(
            'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors',
            'bg-primary-600 text-white hover:bg-primary-700'
          )}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nouveau matériau
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
              placeholder="Rechercher par nom, unité, description..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              data-testid="materiau-list-search"
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              aria-label="Rechercher un matériau"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSortDesc(!sortDesc)}
              className="rounded-lg border border-gray-300 bg-white p-2 text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600"
              aria-label={sortDesc ? 'Trier A-Z' : 'Trier Z-A'}
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
            <p className="text-lg font-medium">Chargement des matériaux...</p>
          </div>
        ) : filteredMateriaux.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            <Package
              className="mx-auto mb-3 h-12 w-12 text-gray-300 dark:text-gray-600"
              aria-hidden="true"
            />
            <p className="text-lg font-medium">Aucun matériau trouvé</p>
            <p className="mt-1">
              Essayez de modifier votre recherche ou ajoutez un nouveau matériau
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" role="table">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                    Nom
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                    Unité
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                    Prix unitaire
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                    TVA
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredMateriaux.map((materiau) => (
                  <tr key={materiau.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <Link
                        to={`/materiaux/${materiau.id}`}
                        data-testid={`materiau-row-${materiau.id}-name`}
                        className="font-medium text-primary-600 hover:text-primary-700"
                      >
                        {materiau.nom}
                      </Link>
                    </td>
                    <td className="max-w-xs truncate px-6 py-4 text-gray-600 dark:text-gray-400">
                      {materiau.description || '—'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 font-mono text-gray-900 dark:text-white">
                      {materiau.unite}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right font-mono text-gray-900 dark:text-white">
                      {toFCFA(materiau.prixUnitaire)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                        {(materiau.tvaTaux * 100).toFixed(2)}%
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/materiaux/${materiau.id}`}
                          data-testid={`materiau-row-${materiau.id}-view`}
                          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700"
                          aria-label={`Voir le matériau ${materiau.nom}`}
                        >
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        </Link>
                        <Link
                          to={`/materiaux/${materiau.id}/modifier`}
                          data-testid={`materiau-row-${materiau.id}-edit`}
                          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700"
                          aria-label={`Modifier le matériau ${materiau.nom}`}
                        >
                          <Edit className="h-4 w-4" aria-hidden="true" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(materiau.id!)}
                          data-testid={`materiau-row-${materiau.id}-delete`}
                          className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                          aria-label={`Supprimer le matériau ${materiau.nom}`}
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
