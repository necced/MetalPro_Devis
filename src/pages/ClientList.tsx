import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Plus,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAppStore } from '../stores/appStore';
import { getAllClients, searchClients, deleteClient } from '../services/database';
import type { Client } from '../types';

const regimeLabels: Record<string, { label: string; color: string }> = {
  normal: {
    label: 'Normal',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  },
  simplifie: {
    label: 'Simplifié',
    color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  },
  exonere: {
    label: 'Exonéré',
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  },
};

export function ClientList() {
  const [search, setSearch] = useState('');
  const [regimeFilter, setRegimeFilter] = useState('');
  const [sortDesc, setSortDesc] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllClients();
      setClients(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des clients');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearch(query);
    if (!query) {
      loadClients();
      return;
    }
    setLoading(true);
    try {
      const data = await searchClients(query);
      setClients(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Supprimer ce client ? Cette action est irréversible.')) return;
    try {
      await deleteClient(id);
      setClients((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    }
  };

  const filteredClients = clients
    .filter((c) => !regimeFilter || c.regimeTva === regimeFilter)
    .sort((a, b) => (sortDesc ? b.nom.localeCompare(a.nom) : a.nom.localeCompare(b.nom)));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="page-title">
            Clients
          </h1>
          <p className="text-gray-600 dark:text-gray-400">{filteredClients.length} client(s)</p>
        </div>
        <Link
          to="/clients/nouveau"
          data-testid="client-list-new"
          className={clsx(
            'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors',
            'bg-primary-600 text-white hover:bg-primary-700'
          )}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nouveau client
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
              placeholder="Rechercher par nom, téléphone, email..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              data-testid="client-list-search"
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              aria-label="Rechercher un client"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={regimeFilter}
              onChange={(e) => setRegimeFilter(e.target.value)}
              data-testid="client-list-filter"
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              aria-label="Filtrer par régime TVA"
            >
              <option value="">Tous les régimes</option>
              <option value="normal">Normal</option>
              <option value="simplifie">Simplifié</option>
              <option value="exonere">Exonéré</option>
            </select>
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
            <p className="text-lg font-medium">Chargement des clients...</p>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            <Users
              className="mx-auto mb-3 h-12 w-12 text-gray-300 dark:text-gray-600"
              aria-hidden="true"
            />
            <p className="text-lg font-medium">Aucun client trouvé</p>
            <p className="mt-1">Essayez de modifier vos filtres ou ajoutez un nouveau client</p>
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
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                    Adresse
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                    Régime TVA
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                    Identifiants
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredClients.map((client) => {
                  const regime = regimeLabels[client.regimeTva];
                  return (
                    <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td
                        className="whitespace-nowrap px-6 py-4"
                        data-testid={`client-row-${client.id}-name`}
                      >
                        <Link
                          to={`/clients/${client.id}`}
                          className="font-medium text-primary-600 hover:text-primary-700"
                        >
                          {client.nom}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 text-sm">
                          <div className="flex items-center gap-1.5 text-gray-900 dark:text-white">
                            <Phone className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
                            {client.telephone}
                          </div>
                          {client.email && (
                            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                              <Mail className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
                              {client.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
                          {client.adresse}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={clsx(
                            'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
                            regime.color
                          )}
                        >
                          {regime.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-sm text-gray-600 dark:text-gray-400">
                        <div>NIF: {client.nif || '—'}</div>
                        <div>RC: {client.rc || '—'}</div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/clients/${client.id}`}
                            data-testid={`client-row-${client.id}-view`}
                            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700"
                            aria-label={`Voir le client ${client.nom}`}
                          >
                            <Eye className="h-4 w-4" aria-hidden="true" />
                          </Link>
                          <Link
                            to={`/clients/${client.id}/modifier`}
                            data-testid={`client-row-${client.id}-edit`}
                            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700"
                            aria-label={`Modifier le client ${client.nom}`}
                          >
                            <Edit className="h-4 w-4" aria-hidden="true" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(client.id!)}
                            data-testid={`client-row-${client.id}-delete`}
                            className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                            aria-label={`Supprimer le client ${client.nom}`}
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
