import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Users } from 'lucide-react';
import { clsx } from 'clsx';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { clientSchema, type ClientForm } from '../shared/validation';
import { useAppStore } from '../stores/appStore';
import { createClient } from '../services/database';

export function ClientCreate() {
  const navigate = useNavigate();
  const { settings } = useAppStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientForm>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      nom: '',
      telephone: '',
      email: '',
      adresse: '',
      nif: '',
      rc: '',
      regimeTva: 'normal',
    },
    mode: 'onChange',
  });

  const onSubmit = async (data: ClientForm) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await createClient(data);
      navigate('/clients');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création du client');
    } finally {
      setIsSubmitting(false);
    }
  };

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
              data-testid="page-title"
            >
              Nouveau client
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Créer un client pour {settings.entrepriseNom || 'MetalPro SARL'}
            </p>
          </div>
        </div>
        <Link
          to="/clients"
          className={clsx(
            'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors',
            'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
          )}
        >
          <Users className="h-4 w-4" aria-hidden="true" />
          Retour à la liste
        </Link>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div
            className="rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-900/30 dark:text-red-300"
            role="alert"
          >
            {error}
          </div>
        )}

        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-lg bg-primary-100 p-2 dark:bg-primary-900/30">
              <Users
                className="h-5 w-5 text-primary-600 dark:text-primary-400"
                aria-hidden="true"
              />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Informations du client
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="sm:col-span-2 lg:col-span-3">
              <label
                htmlFor="nom"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Nom / Raison sociale *
              </label>
              <input
                id="nom"
                type="text"
                {...register('nom')}
                data-testid="client-nom-input"
                className={clsx(
                  'mt-1 w-full rounded-lg border bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white',
                  errors.nom ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                )}
                aria-invalid={!!errors.nom}
                aria-describedby={errors.nom ? 'nom-error' : undefined}
                placeholder="Ex: Entreprise Bâtiment SARL"
              />
              {errors.nom && (
                <p
                  id="nom-error"
                  className="mt-1 text-sm text-red-600 dark:text-red-400"
                  role="alert"
                >
                  {errors.nom.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="telephone"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Téléphone *
              </label>
              <input
                id="telephone"
                type="tel"
                {...register('telephone')}
                data-testid="client-telephone-input"
                className={clsx(
                  'mt-1 w-full rounded-lg border bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white',
                  errors.telephone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                )}
                aria-invalid={!!errors.telephone}
                aria-describedby={errors.telephone ? 'telephone-error' : undefined}
                placeholder="+237 6 XX XX XX XX"
              />
              {errors.telephone && (
                <p
                  id="telephone-error"
                  className="mt-1 text-sm text-red-600 dark:text-red-400"
                  role="alert"
                >
                  {errors.telephone.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                {...register('email')}
                data-testid="client-email-input"
                className={clsx(
                  'mt-1 w-full rounded-lg border bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white',
                  errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                )}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
                placeholder="contact@entreprise.cm"
              />
              {errors.email && (
                <p
                  id="email-error"
                  className="mt-1 text-sm text-red-600 dark:text-red-400"
                  role="alert"
                >
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label
                htmlFor="adresse"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Adresse
              </label>
              <textarea
                id="adresse"
                {...register('adresse')}
                rows={2}
                data-testid="client-adresse-input"
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="BP 1234, Douala, Cameroun"
              />
            </div>

            <div>
              <label
                htmlFor="nif"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                NIF
              </label>
              <input
                id="nif"
                type="text"
                {...register('nif')}
                data-testid="client-nif-input"
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="P123456789"
              />
            </div>

            <div>
              <label
                htmlFor="rc"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Registre de Commerce
              </label>
              <input
                id="rc"
                type="text"
                {...register('rc')}
                data-testid="client-rc-input"
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="RC/DLA/2020/B/1234"
              />
            </div>

            <div>
              <label
                htmlFor="regimeTva"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Régime TVA *
              </label>
              <select
                id="regimeTva"
                {...register('regimeTva')}
                data-testid="client-regimeTva-select"
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="normal">Normal (19,25%)</option>
                <option value="simplifie">Simplifié (19,25%)</option>
                <option value="exonere">Exonéré (0%)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
          <Link
            to="/clients"
            data-testid="client-create-cancel"
            className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Annuler
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            data-testid="client-create-submit"
            className={clsx(
              'inline-flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors',
              'bg-primary-600 text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50'
            )}
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            {isSubmitting ? 'Création...' : 'Créer le client'}
          </button>
        </div>
      </form>
    </div>
  );
}
