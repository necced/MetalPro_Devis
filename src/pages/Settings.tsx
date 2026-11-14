import { useState } from 'react';
import {
  Save,
  RefreshCw,
  AlertTriangle,
  Building,
  Globe,
  Palette,
  Database,
  Download,
  Upload,
  Trash2,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppStore } from '../stores/appStore';

const settingsSchema = z.object({
  entrepriseNom: z.string().min(1, 'Nom requis'),
  entrepriseAdresse: z.string().optional(),
  entrepriseTelephone: z.string().optional(),
  entrepriseEmail: z.string().email('Email invalide').optional().or(z.literal('')),
  entrepriseNif: z.string().optional(),
  entrepriseRc: z.string().optional(),
  numeroDevisPrefix: z.string().min(1, 'Préfixe requis'),
  tvaDefaultRate: z.number().min(0).max(1),
  theme: z.enum(['light', 'dark', 'system']),
});

type SettingsForm = z.infer<typeof settingsSchema>;

export function Settings() {
  const { settings, updateSettings, theme, setTheme } = useAppStore();
  const [saved, setSaved] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      entrepriseNom: settings.entrepriseNom,
      entrepriseAdresse: settings.entrepriseAdresse,
      entrepriseTelephone: settings.entrepriseTelephone,
      entrepriseEmail: settings.entrepriseEmail,
      entrepriseNif: settings.entrepriseNif,
      entrepriseRc: settings.entrepriseRc,
      numeroDevisPrefix: settings.numeroDevisPrefix,
      tvaDefaultRate: settings.tvaDefaultRate,
      theme: settings.theme,
    },
  });

  const onSubmit = (data: SettingsForm) => {
    updateSettings(data);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    if (resetConfirm) {
      updateSettings({
        entrepriseNom: 'MetalPro SARL',
        entrepriseAdresse: '',
        entrepriseTelephone: '',
        entrepriseEmail: '',
        entrepriseNif: '',
        entrepriseRc: '',
        numeroDevisPrefix: 'DEV',
        tvaDefaultRate: 0.1925,
        theme: 'system',
      });
      setResetConfirm(false);
    } else {
      setResetConfirm(true);
      setTimeout(() => setResetConfirm(false), 5000);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Paramètres</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Configuration de l'application et de l'entreprise
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-6 flex items-center gap-3">
            <Building className="h-6 w-6 text-primary-600" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Informations de l'entreprise
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="sm:col-span-2 lg:col-span-3">
              <label
                htmlFor="entrepriseNom"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Nom de l'entreprise *
              </label>
              <input
                id="entrepriseNom"
                type="text"
                {...register('entrepriseNom')}
                className={clsx(
                  'mt-1 w-full rounded-lg border bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white',
                  errors.entrepriseNom ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                )}
                aria-invalid={!!errors.entrepriseNom}
                aria-describedby={errors.entrepriseNom ? 'nom-error' : undefined}
              />
              {errors.entrepriseNom && (
                <p
                  id="nom-error"
                  className="mt-1 text-sm text-red-600 dark:text-red-400"
                  role="alert"
                >
                  {errors.entrepriseNom.message}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="entrepriseTelephone"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Téléphone
              </label>
              <input
                id="entrepriseTelephone"
                type="tel"
                {...register('entrepriseTelephone')}
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="+237 6 XX XX XX XX"
              />
            </div>
            <div>
              <label
                htmlFor="entrepriseEmail"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Email
              </label>
              <input
                id="entrepriseEmail"
                type="email"
                {...register('entrepriseEmail')}
                className={clsx(
                  'mt-1 w-full rounded-lg border bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white',
                  errors.entrepriseEmail ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                )}
                aria-invalid={!!errors.entrepriseEmail}
                aria-describedby={errors.entrepriseEmail ? 'email-error' : undefined}
                placeholder="contact@entreprise.cm"
              />
              {errors.entrepriseEmail && (
                <p
                  id="email-error"
                  className="mt-1 text-sm text-red-600 dark:text-red-400"
                  role="alert"
                >
                  {errors.entrepriseEmail.message}
                </p>
              )}
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label
                htmlFor="entrepriseAdresse"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Adresse
              </label>
              <textarea
                id="entrepriseAdresse"
                {...register('entrepriseAdresse')}
                rows={2}
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="BP 1234, Douala, Cameroun"
              />
            </div>
            <div>
              <label
                htmlFor="entrepriseNif"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                NIF
              </label>
              <input
                id="entrepriseNif"
                type="text"
                {...register('entrepriseNif')}
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="P123456789"
              />
            </div>
            <div>
              <label
                htmlFor="entrepriseRc"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Registre de Commerce
              </label>
              <input
                id="entrepriseRc"
                type="text"
                {...register('entrepriseRc')}
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="RC/DLA/2020/B/1234"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-6 flex items-center gap-3">
            <Globe className="h-6 w-6 text-primary-600" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Configuration des devis
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="numeroDevisPrefix"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Préfixe numéro de devis *
              </label>
              <input
                id="numeroDevisPrefix"
                type="text"
                {...register('numeroDevisPrefix')}
                className={clsx(
                  'mt-1 w-full rounded-lg border bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white',
                  errors.numeroDevisPrefix
                    ? 'border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                )}
                aria-invalid={!!errors.numeroDevisPrefix}
                aria-describedby={errors.numeroDevisPrefix ? 'prefix-error' : undefined}
              />
              {errors.numeroDevisPrefix && (
                <p
                  id="prefix-error"
                  className="mt-1 text-sm text-red-600 dark:text-red-400"
                  role="alert"
                >
                  {errors.numeroDevisPrefix.message}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="tvaDefaultRate"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Taux TVA par défaut
              </label>
              <select
                id="tvaDefaultRate"
                {...register('tvaDefaultRate', { valueAsNumber: true })}
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value={0.1925}>19,25% (Standard Cameroun)</option>
                <option value={0}>0% (Exonéré)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-6 flex items-center gap-3">
            <Palette className="h-6 w-6 text-primary-600" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Apparence</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {(['light', 'dark', 'system'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTheme(t)}
                className={clsx(
                  'relative flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors',
                  theme === t
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500'
                )}
                aria-pressed={theme === t}
              >
                <div
                  className={clsx(
                    'flex h-8 w-8 items-center justify-center rounded-lg',
                    t === 'light'
                      ? 'border border-gray-300 bg-white'
                      : t === 'dark'
                        ? 'border border-gray-700 bg-gray-900'
                        : 'bg-gradient-to-r from-white to-gray-900'
                  )}
                >
                  {t === 'light' && <span className="text-yellow-500">☀</span>}
                  {t === 'dark' && <span className="text-blue-400">🌙</span>}
                  {t === 'system' && <span className="text-gray-600 dark:text-gray-400">💻</span>}
                </div>
                <span className="text-sm font-medium capitalize text-gray-900 dark:text-white">
                  {t}
                </span>
                {theme === t && (
                  <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-xs text-white">
                    ✓
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-6 flex items-center gap-3">
            <Database className="h-6 w-6 text-primary-600" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Gestion des données
            </h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30">
                  <Download
                    className="h-5 w-5 text-blue-600 dark:text-blue-400"
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Exporter la base de données
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Télécharger une sauvegarde complète (JSON)
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                Exporter
              </button>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900/30">
                  <Upload
                    className="h-5 w-5 text-green-600 dark:text-green-400"
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Importer une sauvegarde
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Restaurer depuis un fichier JSON
                  </p>
                </div>
              </div>
              <input type="file" accept=".json" className="sr-only" id="import-file" />
              <label
                htmlFor="import-file"
                className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                Choisir un fichier
              </label>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-red-100 p-2 dark:bg-red-900/30">
                  <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-medium text-red-900 dark:text-red-200">
                    Réinitialiser les paramètres
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    Restaurer les valeurs par défaut (irréversible)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className={clsx(
                  'rounded-lg px-4 py-2 font-medium transition-colors',
                  resetConfirm
                    ? 'bg-red-600 text-white'
                    : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50'
                )}
              >
                {resetConfirm ? 'Confirmer la réinitialisation' : 'Réinitialiser'}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
          <button
            type="button"
            onClick={handleReset}
            className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={clsx(
              'inline-flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors',
              'bg-primary-600 text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50'
            )}
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>

        {saved && (
          <div className="animate-slide-in fixed bottom-4 right-4 z-50">
            <div className="flex items-center gap-2 rounded-lg bg-green-500 px-4 py-3 text-white shadow-lg">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              Paramètres enregistrés avec succès
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
