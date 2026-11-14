import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  FileText,
  AlertTriangle,
  Package,
  DollarSign,
  Calendar,
  ClipboardList,
} from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAppStore } from '../stores/appStore';
import { getDevisById, deleteDevis, getCachedPdfBlob } from '../services/database';
import { generateAndOpenDevisPDF, generateDevisPDFBlob, triggerDownload } from '../services/pdf';
import { toFCFA, toFCFAValue } from '../shared/utils/decimal';
import type { Devis, AppSettings } from '../types';

const statutLabels: Record<string, { label: string; color: string; icon: typeof FileText }> = {
  brouillon: {
    label: 'Brouillon',
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    icon: ClipboardList,
  },
  envoye: {
    label: 'Envoyé',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    icon: FileText,
  },
  accepte: {
    label: 'Accepté',
    color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    icon: FileText,
  },
  refuse: {
    label: 'Refusé',
    color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    icon: AlertTriangle,
  },
  expire: {
    label: 'Expiré',
    color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    icon: Calendar,
  },
};

export function DevisDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { settings } = useAppStore();
  const [devis, setDevis] = useState<Devis | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfGenerating, setPdfGenerating] = useState(true); // Start true to disable button until cache check completes

  // Load devis and check PDF cache in a single effect
  useEffect(() => {
    if (!id) return;
    let mounted = true;
    const loadDevis = async () => {
      const devisId = parseInt(id, 10);
      const data = await getDevisById(devisId);
      if (!mounted) return;
      if (!data) {
        setNotFound(true);
        return;
      }
      setDevis(data);

      // Check PDF cache first
      try {
        const cachedBlob = await getCachedPdfBlob(devisId);
        if (cachedBlob) {
          setPdfBlob(cachedBlob);
        } else if (settings) {
          // Not cached - generate and cache in background
          setPdfGenerating(true);
          try {
            const blob = await generateDevisPDFBlob(data, settings);
            setPdfBlob(blob);
            // Cache for future use
            const { setCachedPdfBlob } = await import('../services/database');
            await setCachedPdfBlob(devisId, blob);
          } catch (err) {
            console.warn('PDF generation and caching failed:', err);
          } finally {
            if (mounted) setPdfGenerating(false);
          }
        }
      } finally {
        if (mounted) setPdfGenerating(false);
      }
    };
    loadDevis();
    return () => {
      mounted = false;
    };
  }, [id, settings]);

  const handleDelete = async () => {
    if (!id || !devis) return;
    if (!window.confirm(`Supprimer le devis "${devis.numero}" ? Cette action est irréversible.`)) {
      return;
    }
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteDevis(parseInt(id, 10));
      navigate('/devis');
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  const handleGeneratePDF = async () => {
    if (!devis || generatingPDF) return;
    setGeneratingPDF(true);
    setPdfError(null);
    try {
      let blob: Blob;
      let blobUrl: string;

      if (pdfBlob) {
        // Cached blob ready - use it immediately
        blob = pdfBlob;
      } else {
        // No cached blob - generate on-demand
        blob = await generateDevisPDFBlob(devis, settings);
        // Cache for future use
        if (id) {
          const { setCachedPdfBlob } = await import('../services/database');
          await setCachedPdfBlob(parseInt(id, 10), blob).catch(console.warn);
        }
        // Update local state so subsequent clicks are instant
        setPdfBlob(blob);
      }

      // Open popup directly with blob URL (synchronously after generation)
      blobUrl = URL.createObjectURL(blob);
      const newWindow = window.open(blobUrl, '_blank', 'noopener,noreferrer');

      if (!newWindow) {
        // Popup blocked - fallback to download
        URL.revokeObjectURL(blobUrl);
        triggerDownload(blob, `${devis.numero}.pdf`);
        throw new Error('Popup bloqué — téléchargement déclenché à la place');
      }
      newWindow.focus();
      // Revoke after a short delay to allow loading
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : 'Erreur lors de la génération du PDF');
    } finally {
      setGeneratingPDF(false);
    }
  };

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

  if (!devis) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div
          className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600"
          aria-label="Chargement..."
        />
      </div>
    );
  }

  const statut = statutLabels[devis.statut];
  const StatutIcon = statut.icon;

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
              data-testid="devis-detail-numero"
            >
              {devis.numero}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {settings.entrepriseNom || 'MetalPro SARL'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/devis/${devis.id}/modifier`}
            data-testid="devis-detail-edit"
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
            data-testid="devis-detail-delete"
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
      {pdfError && (
        <div
          className="rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-900/30 dark:text-red-300"
          role="alert"
        >
          {pdfError}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Informations générales
              </h2>
              <span
                className={clsx(
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
                  statut.color
                )}
              >
                <StatutIcon className="h-3 w-3" aria-hidden="true" />
                {statut.label}
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Client</p>
                <p className="text-gray-900 dark:text-white">{devis.clientNom}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Date de création
                </p>
                <p className="text-gray-900 dark:text-white">
                  {format(new Date(devis.dateCreation), 'dd/MM/yyyy', { locale: fr })}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Date de validité
                </p>
                <p className="text-gray-900 dark:text-white">
                  {format(new Date(devis.dateValidite), 'dd/MM/yyyy', { locale: fr })}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Statut</p>
                <span
                  className={clsx(
                    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-medium',
                    statut.color
                  )}
                >
                  <StatutIcon className="h-3 w-3" aria-hidden="true" />
                  {statut.label}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Lignes du devis
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full" role="table">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                      Matériau
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                      Unité
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                      Quantité
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                      Prix unitaire
                    </th>
                    {devis.tvaMode === 'avec' && (
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                        TVA
                      </th>
                    )}
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                      Total HT
                    </th>
                    {devis.tvaMode === 'avec' && (
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                        Total TTC
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {devis.lignes.map((ligne, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-gray-100 p-2 dark:bg-gray-700">
                            <Package
                              className="h-5 w-5 text-gray-600 dark:text-gray-400"
                              aria-hidden="true"
                            />
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {ligne.materiauNom}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-gray-900 dark:text-white">
                        {ligne.unite}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-gray-900 dark:text-white">
                        {toFCFAValue(ligne.quantite)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-gray-900 dark:text-white">
                        {toFCFA(ligne.prixUnitaire)}
                      </td>
                      {devis.tvaMode === 'avec' && (
                        <td className="whitespace-nowrap px-4 py-3">
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                            {(ligne.tvaTaux * 100).toFixed(2)}%
                          </span>
                        </td>
                      )}
                      <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-gray-900 dark:text-white">
                        {toFCFA(ligne.montantHT)}
                      </td>
                      {devis.tvaMode === 'avec' && (
                        <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-gray-900 dark:text-white">
                          {toFCFA(ligne.montantTTC)}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {devis.notes && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Notes</h2>
              <p className="whitespace-pre-wrap text-gray-900 dark:text-white">{devis.notes}</p>
            </div>
          )}

          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Métadonnées
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Créé le</p>
                <p className="text-gray-900 dark:text-white">
                  {format(new Date(devis.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr })}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Modifié le</p>
                <p className="text-gray-900 dark:text-white">
                  {format(new Date(devis.updatedAt), 'dd/MM/yyyy HH:mm', { locale: fr })}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Totaux</h2>
            <div className="space-y-3">
              {devis.tvaMode === 'avec' && (
                <>
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Total HT</span>
                    <span className="font-mono">{toFCFAValue(devis.totaux.totalHT)} FCFA</span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Détail TVA
                    </p>
                    <div className="space-y-1">
                      {devis.tvaDetails.map((tva, index) => (
                        <div
                          key={index}
                          className="flex justify-between text-sm text-gray-600 dark:text-gray-400"
                        >
                          <span>TVA {(tva.taux * 100).toFixed(2)}%</span>
                          <span>{toFCFAValue(tva.montantTva)} FCFA</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
              {devis.tvaMode === 'sans' && (
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Montant total</span>
                  <span className="font-mono">{toFCFAValue(devis.totaux.totalHT)} FCFA</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-3 text-lg font-bold text-gray-900 dark:border-gray-700 dark:text-white">
                <span>{devis.tvaMode === 'avec' ? 'Total TTC' : 'Total à payer'}</span>
                <span className="font-mono">{toFCFA(devis.totaux.totalTTC)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Actions rapides
            </h2>
            <div className="space-y-3">
              <Link
                to={`/devis/${devis.id}/modifier`}
                data-testid="devis-detail-edit-action"
                className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50"
              >
                <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30">
                  <Edit className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">Modifier le devis</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Mettre à jour les informations
                  </p>
                </div>
              </Link>
              <button
                onClick={handleGeneratePDF}
                disabled={generatingPDF || pdfGenerating}
                data-testid="devis-detail-generate-pdf"
                className={clsx(
                  'flex w-full items-center gap-3 rounded-lg border border-gray-200 p-3 transition-colors',
                  generatingPDF || pdfGenerating
                    ? 'cursor-not-allowed opacity-50'
                    : 'hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50'
                )}
              >
                <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900/30">
                  <FileText
                    className="h-5 w-5 text-green-600 dark:text-green-400"
                    aria-hidden="true"
                  />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {generatingPDF || pdfGenerating ? 'Génération...' : 'Générer PDF'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Exporter le devis en PDF
                  </p>
                </div>
              </button>
              <button className="flex w-full items-center gap-3 rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50">
                <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900/30">
                  <DollarSign
                    className="h-5 w-5 text-purple-600 dark:text-purple-400"
                    aria-hidden="true"
                  />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">Envoyer par email</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Envoyer le devis au client
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
