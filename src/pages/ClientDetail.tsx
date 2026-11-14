import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAppStore } from '../stores/appStore';
import { getClientById, deleteClient } from '../services/database';
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

export function ClientDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { settings } = useAppStore();
  const [client, setClient] = useState<Client | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const loadClient = async () => {
      const data = await getClientById(parseInt(id, 10));
      if (!data) {
        setNotFound(true);
        return;
      }
      setClient(data);
    };
    loadClient();
  }, [id]);

  const handleDelete = async () => {
    if (!id || !client) return;
    if (!window.confirm(`Supprimer le client "${client.nom}" ? Cette action est irréversible.`)) {
      return;
    }
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteClient(parseInt(id, 10));
      navigate('/clients');
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  if (notFound) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/clients" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Client introuvable</h1>
            <p className="text-gray-600 dark:text-gray-400">Le client demandé n'existe pas.</p>
          </div>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <p className="text-red-900 dark:text-red-200">
              Client non trouvé. Il a peut-être été supprimé.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div
          className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600"
          aria-label="Chargement..."
        />
      </div>
    );
  }

  const regime = regimeLabels[client.regimeTva];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/clients"
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </Link>
          <div>
            <h1
              className="text-2xl font-bold text-gray-900 dark:text-white"
              data-testid="client-detail-name"
            >
              {client.nom}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {settings.entrepriseNom || 'MetalPro SARL'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/clients/${client.id}/modifier`}
            data-testid="client-detail-edit"
            className={clsx(
              'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors',
              'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
            )}
          >
            <Edit className="h-4 w-4" aria-hidden="true" />
            Modifier
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            data-testid="client-detail-delete"
            className={clsx(
              'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors',
              deleting
                ? 'cursor-not-allowed bg-red-100 text-red-700 opacity-50 dark:bg-red-900/30 dark:text-red-300'
                : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50'
            )}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Supprimer
          </button>
        </div>
      </div>

      {deleteError && (
        <div
          className="rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-900/30 dark:text-red-300"
          role="alert"
        >
          {deleteError}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Informations de contact
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3" data-testid="client-detail-telephone">
                <div className="flex-shrink-0 rounded-lg bg-gray-100 p-2 dark:bg-gray-700">
                  <Phone className="h-5 w-5 text-gray-600 dark:text-gray-400" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Téléphone</p>
                  <p className="text-gray-900 dark:text-white">{client.telephone}</p>
                </div>
              </div>
              {client.email && (
                <div className="flex items-start gap-3" data-testid="client-detail-email">
                  <div className="flex-shrink-0 rounded-lg bg-gray-100 p-2 dark:bg-gray-700">
                    <Mail className="h-5 w-5 text-gray-600 dark:text-gray-400" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</p>
                    <p className="text-gray-900 dark:text-white">{client.email}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3" data-testid="client-detail-adresse">
                <div className="flex-shrink-0 rounded-lg bg-gray-100 p-2 dark:bg-gray-700">
                  <MapPin className="h-5 w-5 text-gray-600 dark:text-gray-400" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Adresse</p>
                  <p className="text-gray-900 dark:text-white">{client.adresse || '—'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Identifiants fiscaux
            </h2>
            <div className="space-y-4">
              <div data-testid="client-detail-nif">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">NIF</p>
                <p className="font-mono text-gray-900 dark:text-white">{client.nif || '—'}</p>
              </div>
              <div data-testid="client-detail-rc">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Registre de Commerce
                </p>
                <p className="font-mono text-gray-900 dark:text-white">{client.rc || '—'}</p>
              </div>
              <div data-testid="client-detail-regimeTva">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Régime TVA</p>
                <span
                  className={clsx(
                    'inline-flex items-center rounded-full px-2.5 py-1 text-sm font-medium',
                    regime.color
                  )}
                >
                  {regime.label}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Métadonnées
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Créé le</p>
                <p className="text-gray-900 dark:text-white">
                  {format(new Date(client.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr })}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Modifié le</p>
                <p className="text-gray-900 dark:text-white">
                  {format(new Date(client.updatedAt), 'dd/MM/yyyy HH:mm', { locale: fr })}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Actions rapides
            </h2>
            <div className="space-y-3">
              <Link
                to={`/devis/nouveau?clientId=${client.id}`}
                data-testid="client-detail-create-devis"
                className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50"
              >
                <div className="rounded-lg bg-primary-100 p-2 dark:bg-primary-900/30">
                  <FileText
                    className="h-5 w-5 text-primary-600 dark:text-primary-400"
                    aria-hidden="true"
                  />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">Créer un devis</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Nouveau devis pour ce client
                  </p>
                </div>
              </Link>
              <Link
                to={`/clients/${client.id}/modifier`}
                className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50"
              >
                <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30">
                  <Edit className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">Modifier le client</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Mettre à jour les informations
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
