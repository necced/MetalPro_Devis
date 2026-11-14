import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Minus, Trash2, Save, FileText, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  parseFCFA,
  calculerTTC,
  calculerTVA,
  calculerLigneHT,
  toFCFA,
  toFCFAValue,
  D,
} from '../shared/utils/decimal';
import { useAppStore } from '../stores/appStore';
import {
  getAllClients,
  getAllMateriaux,
  createDevis,
  peekNextDevisNumber,
} from '../services/database';
import {
  devisSchema,
  devisLigneSchema,
  type DevisForm,
  type DevisLigneForm,
} from '../shared/validation';
import type { Client, Materiau, TvaMode } from '../types';

export function DevisCreate() {
  const navigate = useNavigate();
  const { settings } = useAppStore();
  const [showClientSelect, setShowClientSelect] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [materiaux, setMateriaux] = useState<Materiau[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingMateriaux, setLoadingMateriaux] = useState(true);
  const [loadingNumber, setLoadingNumber] = useState(true);
  const [nextNumber, setNextNumber] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      tvaMode: (settings.tvaDefaultMode as TvaMode) || 'avec',
    },
    mode: 'onChange',
  });

  const {
    fields: lignesFields,
    append,
    remove,
  } = useFieldArray({
    control,
    name: 'lignes',
  });

  const watchedLignes = watch('lignes');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [clientsData, materiauxData, number] = await Promise.all([
          getAllClients(),
          getAllMateriaux(),
          peekNextDevisNumber(),
        ]);
        setClients(clientsData);
        setMateriaux(materiauxData);
        setNextNumber(number);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement des données');
      } finally {
        setLoadingClients(false);
        setLoadingMateriaux(false);
        setLoadingNumber(false);
      }
    };
    loadData();
  }, []);

  const calculateTotals = () => {
    const tvaMode = watch('tvaMode') || 'avec';
    let totalHT = D(0);
    let totalTVA = D(0);

    watchedLignes.forEach((ligne) => {
      const qte = parseFCFA(ligne.quantite);
      const pu = parseFCFA(ligne.prixUnitaire);
      const ligneHT = calculerLigneHT(qte, pu);

      if (tvaMode === 'avec') {
        const ligneTVA = calculerTVA(ligneHT, ligne.tvaTaux);
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

  const handleAddLigne = () => {
    append({ materiauNom: '', unite: '', quantite: '1', prixUnitaire: '', tvaTaux: 0.1925 });
  };

  const handleRemoveLigne = (index: number) => {
    if (lignesFields.length <= 1) return;
    remove(index);
  };

  const handleMateriauSelect = (index: number, materiau: Materiau) => {
    setValue(`lignes.${index}.materiauId`, materiau.id);
    setValue(`lignes.${index}.materiauNom`, materiau.nom);
    setValue(`lignes.${index}.unite`, materiau.unite);
    setValue(`lignes.${index}.prixUnitaire`, materiau.prixUnitaire);
    setValue(`lignes.${index}.tvaTaux`, materiau.tvaTaux);
    setShowMateriauSelect(null);
  };

  const handleClientSelect = (client: Client) => {
    setValue('clientId', client.id);
    setValue('clientNom', client.nom);
    setShowClientSelect(false);
  };

  const onSubmit = async (data: DevisForm) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await createDevis({
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
      navigate('/devis');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création du devis');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/devis"
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </Link>
          <div>
            <h1
              className="text-2xl font-bold text-gray-900 dark:text-white"
              data-testid="page-title"
            >
              Nouveau devis
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Créer un devis pour {settings.entrepriseNom || 'MetalPro SARL'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
            aria-label="Enregistrer comme modèle"
          >
            <FileText className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="submit"
            form="devis-form"
            disabled={isSubmitting}
            data-testid="devis-create-submit"
            className={clsx(
              'inline-flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors',
              isSubmitting
                ? 'cursor-not-allowed opacity-50'
                : 'bg-primary-600 text-white hover:bg-primary-700'
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" aria-hidden="true" />
                Enregistrer
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div
          className="rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-900/30 dark:text-red-300"
          role="alert"
        >
          {error}
        </div>
      )}

      <form id="devis-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Informations client
            </h2>
            {loadingNumber ? (
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" aria-hidden="true" />
            ) : (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                N° {nextNumber}
              </span>
            )}
          </div>
          <div className="relative">
            <select
              {...register('clientId', { valueAsNumber: true })}
              onChange={(e) => {
                const clientId = e.target.value ? parseInt(e.target.value, 10) : null;
                const selectedClient = clients.find((c) => c.id === clientId);
                if (selectedClient) {
                  setValue('clientNom', selectedClient.nom);
                } else {
                  setValue('clientNom', '');
                }
              }}
              disabled={loadingClients}
              data-testid="devis-create-client-select"
              className={clsx(
                'w-full rounded-lg border bg-white px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white',
                errors.clientId ? 'border-red-500' : 'border-gray-300 dark:border-gray-600',
                loadingClients && 'cursor-wait opacity-50'
              )}
              aria-invalid={!!errors.clientId}
              aria-describedby={errors.clientId ? 'client-error' : undefined}
            >
              <option value="">Sélectionner un client existant</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom}
                </option>
              ))}
              <option value="new">+ Nouveau client</option>
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
              onClick={handleAddLigne}
              disabled={loadingMateriaux}
              data-testid="devis-create-add-line"
              className={clsx(
                'inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                loadingMateriaux
                  ? 'cursor-not-allowed opacity-50'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
              )}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Ajouter une ligne
            </button>
          </div>

          <div className="space-y-4">
            {lignesFields.map((field, index) => {
              const ligne = watchedLignes[index];
              return (
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
                          data-testid={`devis-create-line-${index}-materiau`}
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          list={`materiaux-${index}`}
                        />
                        <datalist id={`materiaux-${index}`}>
                          {materiaux.map((m) => (
                            <option key={m.id} value={m.nom} />
                          ))}
                        </datalist>
                        {errors.lignes?.[index]?.materiauNom && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                            {errors.lignes[index].materiauNom.message}
                          </p>
                        )}
                      </div>
                    </div>
                    {lignesFields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLigne(index)}
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
                        data-testid={`devis-create-line-${index}-unite`}
                        className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        placeholder="m, m², kg..."
                      />
                      {errors.lignes?.[index]?.unite && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                          {errors.lignes[index].unite.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Quantité
                      </label>
                      <input
                        type="text"
                        {...register(`lignes.${index}.quantite`)}
                        data-testid={`devis-create-line-${index}-quantite`}
                        className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-right font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        placeholder="0"
                      />
                      {errors.lignes?.[index]?.quantite && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                          {errors.lignes[index].quantite.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Prix unitaire
                      </label>
                      <input
                        type="text"
                        {...register(`lignes.${index}.prixUnitaire`)}
                        data-testid={`devis-create-line-${index}-prixUnitaire`}
                        className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-right font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        placeholder="0"
                      />
                      {errors.lignes?.[index]?.prixUnitaire && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                          {errors.lignes[index].prixUnitaire.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-4">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Total HT ligne
                      </label>
                      <div className="mt-1 rounded-lg bg-gray-100 px-3 py-2 text-right font-mono text-gray-900 dark:bg-gray-700 dark:text-white">
                        {(() => {
                          const qte = parseFCFA(ligne?.quantite || '0');
                          const pu = parseFCFA(ligne?.prixUnitaire || '0');
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
                            data-testid={`devis-create-line-${index}-tvaTaux`}
                            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          >
                            <option value={0.1925}>Normal (19,25%)</option>
                            <option value={0.1925}>Simplifié (19,25%)</option>
                            <option value={0}>Exonéré (0%)</option>
                          </select>
                          {errors.lignes?.[index]?.tvaTaux && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                              {errors.lignes[index].tvaTaux.message}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Total TTC ligne
                          </label>
                          <div className="mt-1 rounded-lg bg-gray-100 px-3 py-2 text-right font-mono text-gray-900 dark:bg-gray-700 dark:text-white">
                            {(() => {
                              const qte = parseFCFA(ligne?.quantite || '0');
                              const pu = parseFCFA(ligne?.prixUnitaire || '0');
                              const ht = calculerLigneHT(qte, pu);
                              return toFCFA(calculerTTC(ht, ligne?.tvaTaux || 0.1925));
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
                            const qte = parseFCFA(ligne?.quantite || '0');
                            const pu = parseFCFA(ligne?.prixUnitaire || '0');
                            return toFCFA(calculerLigneHT(qte, pu));
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
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
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Dates et notes
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="dateValidite"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Date de validité
              </label>
              <input
                id="dateValidite"
                type="date"
                {...register('dateValidite')}
                data-testid="devis-create-dateValidite"
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label
                htmlFor="notes"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Notes (conditions, mentions légales...)
              </label>
              <textarea
                id="notes"
                {...register('notes')}
                rows={3}
                data-testid="devis-create-notes"
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="Ex: Paiement à 30 jours, validité 30 jours, etc."
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
