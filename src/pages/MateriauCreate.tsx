import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Package } from 'lucide-react';
import { clsx } from 'clsx';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { materiauSchema, type MateriauForm } from '../shared/validation';
import { useAppStore } from '../stores/appStore';
import { createMateriau } from '../services/database';

export function MateriauCreate() {
  const navigate = useNavigate();
  const { settings } = useAppStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MateriauForm>({
    resolver: zodResolver(materiauSchema),
    defaultValues: {
      nom: '',
      unite: '',
      prixUnitaire: '',
      tvaTaux: 0.1925,
      description: '',
    },
    mode: 'onChange',
  });

  const onSubmit = async (data: MateriauForm) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await createMateriau(data);
      navigate('/materiaux');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création du matériau');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/materiaux"
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </Link>
          <div>
            <h1
              className="text-2xl font-bold text-gray-900 dark:text-white"
              data-testid="page-title"
            >
              Nouveau matériau
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Créer un matériau pour {settings.entrepriseNom || 'MetalPro SARL'}
            </p>
          </div>
        </div>
        <Link
          to="/materiaux"
          className={clsx(
            'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors',
            'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
          )}
        >
          <Package className="h-4 w-4" aria-hidden="true" />
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
              <Package
                className="h-5 w-5 text-primary-600 dark:text-primary-400"
                aria-hidden="true"
              />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Informations du matériau
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="sm:col-span-2 lg:col-span-3">
              <label
                htmlFor="nom"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Nom *
              </label>
              <input
                id="nom"
                type="text"
                {...register('nom')}
                data-testid="materiau-nom-input"
                className={clsx(
                  'mt-1 w-full rounded-lg border bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white',
                  errors.nom ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                )}
                aria-invalid={!!errors.nom}
                aria-describedby={errors.nom ? 'nom-error' : undefined}
                placeholder="Ex: Tube acier galvanisé Ø 48mm"
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
                htmlFor="unite"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Unité *
              </label>
              <input
                id="unite"
                type="text"
                {...register('unite')}
                data-testid="materiau-unite-input"
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="Ex: m, kg, m², unité, L"
              />
            </div>

            <div>
              <label
                htmlFor="prixUnitaire"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Prix unitaire (FCFA) *
              </label>
              <input
                id="prixUnitaire"
                type="number"
                min="0"
                step="1"
                {...register('prixUnitaire')}
                data-testid="materiau-prixUnitaire-input"
                className={clsx(
                  'mt-1 w-full rounded-lg border bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white',
                  errors.prixUnitaire ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                )}
                aria-invalid={!!errors.prixUnitaire}
                aria-describedby={errors.prixUnitaire ? 'prixUnitaire-error' : undefined}
                placeholder="Ex: 25000"
              />
              {errors.prixUnitaire && (
                <p
                  id="prixUnitaire-error"
                  className="mt-1 text-sm text-red-600 dark:text-red-400"
                  role="alert"
                >
                  {errors.prixUnitaire.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="tvaTaux"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Taux TVA
              </label>
              <select
                id="tvaTaux"
                {...register('tvaTaux', { valueAsNumber: true })}
                data-testid="materiau-tvaTaux-select"
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value={0}>Exonéré (0%)</option>
                <option value={0.1925}>Normal (19,25%)</option>
              </select>
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Description
              </label>
              <textarea
                id="description"
                {...register('description')}
                rows={3}
                data-testid="materiau-description-input"
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="Description détaillée du matériau..."
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
          <Link
            to="/materiaux"
            data-testid="materiau-create-cancel"
            className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Annuler
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            data-testid="materiau-create-submit"
            className={clsx(
              'inline-flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors',
              'bg-primary-600 text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50'
            )}
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            {isSubmitting ? 'Création...' : 'Créer le matériau'}
          </button>
        </div>
      </form>
    </div>
  );
}
