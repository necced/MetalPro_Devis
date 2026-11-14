import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Plus,
  Minus,
  Trash2,
  FileText,
  AlertTriangle,
  Users,
  Package,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  parseFCFA,
  calculerLigneHT,
  calculerTTC,
  toFCFA,
  toFCFAValue,
  D,
} from '../shared/utils/decimal';
import { useAppStore } from '../stores/appStore';
import { getDevisById, updateDevis, getAllClients, getAllMateriaux } from '../services/database';
import {
  devisSchema,
  devisLigneSchema,
  type DevisForm,
  type DevisLigneForm,
} from '../shared/validation';
import type { Client, Materiau, TvaMode } from '../types';

export function DevisEdit() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { settings } = useAppStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [materiaux, setMateriaux] = useState<Materiau[]>([]);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<DevisForm>({
    resolver: zodResolver(devisSchema),
    defaultValues: {
      clientId: null,
      clientNom: '',
      lignes: [{ materiauNom: '', unite: '', quantite: '1', prixUnitaire: '', tvaTaux: 0.1925 }],
      dateValidite: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      notes: '',
      statut: 'brouillon',
    },
    mode: 'onChange',
  });

  const {
    fields: ligneFields,
    append: appendLigne,
    remove: removeLigne,
  } = useFieldArray({
    control,
    name: 'lignes',
  });

  const watchedLignes = watch('lignes');

  useEffect(() => {
    if (!id) return;
    const loadData = async () => {
      try {
        const [devisData, clientsData, materiauxData] = await Promise.all([
          getDevisById(parseInt(id, 10)),
          getAllClients(),
          getAllMateriaux(),
        ]);
        if (!devisData) {
          setNotFound(true);
          return;
        }
        setClients(clientsData);
        setMateriaux(materiauxData);

        const formData: DevisForm = {
          clientId: devisData.clientId,
          clientNom: devisData.clientNom,
          lignes: devisData.lignes.map((l) => ({
            materiauId: l.materiauId,
            materiauNom: l.materiauNom,
            unite: l.unite,
            quantite: l.quantite,
            prixUnitaire: l.prixUnitaire,
            tvaTaux: l.tvaTaux,
          })),
          dateValidite: devisData.dateValidite,
          notes: devisData.notes || '',
          statut: devisData.statut,
          tvaMode: devisData.tvaMode || 'avec',
        };
        Object.keys(formData).forEach((key) => {
          if (key !== 'lignes') {
            setValue(key as keyof DevisForm, formData[key as keyof DevisForm]);
          }
        });
        // Set lignes via field array using useForm's setValue
        if (formData.lignes.length > 0) {
          setValue('lignes', formData.lignes, { shouldDirty: true, shouldTouch: true });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement du devis');
      } finally {
        setLoadingData(false);
      }
    };
    loadData();
  }, [id, control, setValue]);

  const calculateTotals = () => {
    const tvaMode = watch('tvaMode') || 'avec';
    let totalHT = D(0);
    let totalTVA = D(0);

    watchedLignes.forEach((ligne) => {
      const qte = parseFCFA(ligne.quantite);
      const pu = parseFCFA(ligne.prixUnitaire);
      const ligneHT = calculerLigneHT(qte, pu);

      if (tvaMode === 'avec') {
        const ligneTVA = D(ligneHT).mul(ligne.tvaTaux);
        totalHT = totalHT.add(ligneHT);
        totalTVA = totalTVA.add(ligneTVA);
      } else {
        totalHT = totalHT.add(ligneHT);
      }
    });

    const totalTTC = totalHT.add(totalTVA);
    return { totalHT, totalTVA, totalTTC, tvaMode };
  };

  const totals = calculateTotals();

  const onSubmit = async (data: DevisForm) => {
    if (!id) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await updateDevis(parseInt(id, 10), {
        clientId: data.clientId!,
        lignes: data.lignes.map((l) => ({
          materiauId: l.materiauId || 0,
          materiauNom: l.materiauNom,
          unite: l.unite,
          quantite: l.quantite,
          prixUnitaire: l.prixUnitaire,
          tvaTaux: l.tvaTaux,
        })),
        dateValidite: data.dateValidite,
        notes: data.notes,
        statut: data.statut,
        tvaMode: data.tvaMode,
      });
      navigate(`/devis/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la modification du devis');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div
          className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600"
          aria-label="Chargement..."
        />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/devis" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Devis introuvable</h1>
            <p className="text-gray-600 dark:text-gray-400">Le devis demandé n'existe pas.</p>
          </div>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <p className="text-red-900 dark:text-red-200">
              Devis non trouvé. Il a peut-être été supprimé.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link
            to={`/devis/${id}`}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </Link>
          <div>
            <h1
              className="text-2xl font-bold text-gray-900 dark:text-white"
              data-testid="page-title"
            >
              Modifier le devis
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {settings.entrepriseNom || 'MetalPro SARL'}
            </p>
          </div>
        </div>
        <Link
          to={`/devis/${id}`}
          className={clsx(
            'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors',
            'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
          )}
        >
          <FileText className="h-4 w-4" aria-hidden="true" />
          Voir le devis
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
              <FileText
                className="h-5 w-5 text-primary-600 dark:text-primary-400"
                aria-hidden="true"
              />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Informations du devis
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label
                htmlFor="clientId"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Client *
              </label>
              <select
                id="clientId"
                {...register('clientId', { valueAsNumber: true })}
                data-testid="devis-edit-clientId"
                className={clsx(
                  'mt-1 w-full rounded-lg border bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white',
                  errors.clientId ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                )}
                aria-invalid={!!errors.clientId}
                aria-describedby={errors.clientId ? 'client-error' : undefined}
              >
                <option value="">Sélectionner un client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom}
                  </option>
                ))}
              </select>
              {errors.clientId && (
                <p
                  id="client-error"
                  className="mt-1 text-sm text-red-600 dark:text-red-400"
                  role="alert"
                >
                  {errors.clientId.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="dateValidite"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Date de validité *
              </label>
              <input
                id="dateValidite"
                type="date"
                {...register('dateValidite')}
                data-testid="devis-edit-dateValidite"
                className={clsx(
                  'mt-1 w-full rounded-lg border bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white',
                  errors.dateValidite ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                )}
                aria-invalid={!!errors.dateValidite}
                aria-describedby={errors.dateValidite ? 'dateValidite-error' : undefined}
              />
              {errors.dateValidite && (
                <p
                  id="dateValidite-error"
                  className="mt-1 text-sm text-red-600 dark:text-red-400"
                  role="alert"
                >
                  {errors.dateValidite.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="statut"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Statut
              </label>
              <select
                id="statut"
                {...register('statut')}
                data-testid="devis-edit-statut"
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="brouillon">Brouillon</option>
                <option value="envoye">Envoyé</option>
                <option value="accepte">Accepté</option>
                <option value="refuse">Refusé</option>
                <option value="expire">Expiré</option>
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Mode de calcul TVA
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <input
                type="radio"
                {...register('tvaMode')}
                value="sans"
                className="h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Devis sans TVA</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Montant total simple, sans détail de TVA
                </p>
              </div>
            </label>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <input
                type="radio"
                {...register('tvaMode')}
                value="avec"
                className="h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Devis avec TVA</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Calcul HT, TVA (19,25%) et TTC détaillés
                </p>
              </div>
            </label>
          </div>
          {errors.tvaMode && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
              {errors.tvaMode.message}
            </p>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Lignes du devis</h2>
            <button
              type="button"
              onClick={() =>
                appendLigne({
                  materiauNom: '',
                  unite: '',
                  quantite: '1',
                  prixUnitaire: '',
                  tvaTaux: 0.1925,
                })
              }
              data-testid="devis-edit-add-line"
              className={clsx(
                'inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
              )}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Ajouter une ligne
            </button>
          </div>

          <div className="space-y-4">
            {ligneFields.map((field, index) => (
              <div
                key={field.id}
                className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/50"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Matériau / Description
                    </label>
                    <div className="relative mt-1">
                      <input
                        type="text"
                        {...register(`lignes.${index}.materiauNom`)}
                        placeholder="Sélectionner ou saisir un matériau"
                        data-testid={`devis-edit-line-${index}-materiau`}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        list={`materiaux-${index}`}
                      />
                      <datalist id={`materiaux-${index}`}>
                        {materiaux.map((m) => (
                          <option key={m.id} value={m.nom} />
                        ))}
                      </datalist>
                    </div>
                  </div>
                  {ligneFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLigne(index)}
                      className="flex-shrink-0 rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                      aria-label="Supprimer cette ligne"
                    >
                      <Trash2 className="h-5 w-5" aria-hidden="true" />
                    </button>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Unité
                    </label>
                    <input
                      type="text"
                      {...register(`lignes.${index}.unite`)}
                      data-testid={`devis-edit-line-${index}-unite`}
                      className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      placeholder="m, m², kg..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Quantité
                    </label>
                    <input
                      type="text"
                      {...register(`lignes.${index}.quantite`)}
                      data-testid={`devis-edit-line-${index}-quantite`}
                      className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-right font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Prix unitaire
                    </label>
                    <input
                      type="text"
                      {...register(`lignes.${index}.prixUnitaire`)}
                      data-testid={`devis-edit-line-${index}-prixUnitaire`}
                      className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-right font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Total HT ligne
                    </label>
                    <div className="mt-1 rounded-lg bg-gray-100 px-3 py-2 text-right font-mono text-gray-900 dark:bg-gray-700 dark:text-white">
                      {(() => {
                        const qte = parseFCFA(watchedLignes[index]?.quantite || '0');
                        const pu = parseFCFA(watchedLignes[index]?.prixUnitaire || '0');
                        return toFCFA(calculerLigneHT(qte, pu));
                      })()}
                    </div>
                  </div>
                  {totals.tvaMode === 'avec' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          TVA
                        </label>
                        <select
                          {...register(`lignes.${index}.tvaTaux`, { valueAsNumber: true })}
                          data-testid={`devis-edit-line-${index}-tvaTaux`}
                          className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        >
                          <option value={0.1925}>Normal (19,25%)</option>
                          <option value={0.1925}>Simplifié (19,25%)</option>
                          <option value={0}>Exonéré (0%)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Total TTC ligne
                        </label>
                        <div className="mt-1 rounded-lg bg-gray-100 px-3 py-2 text-right font-mono text-gray-900 dark:bg-gray-700 dark:text-white">
                          {(() => {
                            const qte = parseFCFA(watchedLignes[index]?.quantite || '0');
                            const pu = parseFCFA(watchedLignes[index]?.prixUnitaire || '0');
                            const ht = calculerLigneHT(qte, pu);
                            const tvaTaux = watchedLignes[index]?.tvaTaux || 0.1925;
                            return toFCFA(calculerTTC(ht, tvaTaux));
                          })()}
                        </div>
                      </div>
                    </>
                  )}
                  {totals.tvaMode === 'sans' && (
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Total ligne
                      </label>
                      <div className="mt-1 rounded-lg bg-gray-100 px-3 py-2 text-right font-mono text-gray-900 dark:bg-gray-700 dark:text-white">
                        {(() => {
                          const qte = parseFCFA(watchedLignes[index]?.quantite || '0');
                          const pu = parseFCFA(watchedLignes[index]?.prixUnitaire || '0');
                          return toFCFA(calculerLigneHT(qte, pu));
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Totaux</h2>
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <div className="sm:col-span-3 lg:col-span-4">
              <div className="space-y-3">
                {totals.tvaMode === 'avec' && (
                  <>
                    <div className="flex justify-between text-gray-600 dark:text-gray-400">
                      <span>Total HT</span>
                      <span className="font-mono">
                        {toFCFAValue(totals.totalHT.toString())} FCFA
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-600 dark:text-gray-400">
                      <span>TVA (19,25%)</span>
                      <span className="font-mono">
                        {toFCFAValue(totals.totalTVA.toString())} FCFA
                      </span>
                    </div>
                  </>
                )}
                {totals.tvaMode === 'sans' && (
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Montant total</span>
                    <span className="font-mono">{toFCFAValue(totals.totalHT.toString())} FCFA</span>
                  </div>
                )}
              </div>
            </div>
            <div className="border-t pt-4 sm:col-span-3 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0 lg:col-span-2 dark:border-gray-700">
              <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white">
                <span>{totals.tvaMode === 'avec' ? 'Total TTC' : 'Total à payer'}</span>
                <span className="font-mono">{toFCFA(totals.totalTTC.toString())}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Notes</h2>
          <textarea
            id="notes"
            {...register('notes')}
            rows={3}
            data-testid="devis-edit-notes"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            placeholder="Ex: Paiement à 30 jours, validité 30 jours, etc."
          />
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
          <Link
            to={`/devis/${id}`}
            data-testid="devis-edit-cancel"
            className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Annuler
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            data-testid="devis-edit-submit"
            className={clsx(
              'inline-flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors',
              'bg-primary-600 text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50'
            )}
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </div>
      </form>
    </div>
  );
}
