import { renderToStream } from '@react-pdf/renderer';
import { DevisPDF } from '../components/DevisPDF';
import type { Devis, AppSettings } from '../types';
import { useAppStore } from '../stores/appStore';

/**
 * PDF Generation Service
 * Uses @react-pdf/renderer to generate professional PDF documents from Devis data
 * All generation happens client-side, works offline
 */

let blobUrlCache: string | null = null;

/**
 * Revoke any previously created blob URL to prevent memory leaks
 */
function revokePreviousBlobUrl(): void {
  if (blobUrlCache) {
    URL.revokeObjectURL(blobUrlCache);
    blobUrlCache = null;
  }
}

/**
 * Generate a PDF blob from a devis
 * @param devis - The devis data to render
 * @param settings - Optional enterprise settings (defaults to app store settings)
 * @returns Promise resolving to a Blob containing the PDF
 */
export async function generateDevisPDFBlob(devis: Devis, settings?: AppSettings): Promise<Blob> {
  const effectiveSettings = settings || useAppStore.getState().settings;

  const doc = React.createElement(DevisPDF, { devis, settings: effectiveSettings });

  // Use renderToStream for memory efficiency
  const stream = await renderToStream(doc);

  // Collect stream chunks into a blob
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  const blob = new Blob(chunks, { type: 'application/pdf' });
  return blob;
}

/**
 * Generate a PDF and open it in a new browser tab
 * @param devis - The devis data to render
 * @param settings - Optional enterprise settings
 * @returns Promise resolving when PDF is opened
 */
export async function generateAndOpenDevisPDF(devis: Devis, settings?: AppSettings): Promise<void> {
  // Start PDF generation immediately (runs in parallel with popup open)
  const blobPromise = generateDevisPDFBlob(devis, settings);

  // Open popup IMMEDIATELY (synchronously) so Playwright can detect it
  // This must happen before any await to work with Playwright's popup detection
  const newWindow = window.open('about:blank', '_blank', 'noopener,noreferrer');

  if (!newWindow) {
    // Popup blocked - fall back to download
    const blob = await blobPromise;
    triggerDownload(blob, `${devis.numero}.pdf`);
    throw new Error('Popup bloqué — téléchargement déclenché à la place');
  }

  try {
    // Revoke any previous blob URL to avoid memory leaks
    revokePreviousBlobUrl();

    // Wait for PDF generation to complete
    const blob = await blobPromise;

    // Convert blob to data URL for instant loading (works better with Playwright tests)
    const dataUrl = await blobToDataUrl(blob);

    // Navigate the popup to the data URL (instant load)
    newWindow.location.href = dataUrl;
    newWindow.focus();
  } catch (error) {
    // If PDF generation fails, close the popup and clean up
    newWindow.close();
    revokePreviousBlobUrl();
    throw error;
  }
}

/**
 * Convert a Blob to a data URL
 * @param blob - The blob to convert
 * @returns Promise resolving to a data URL string
 */
export async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Generate a PDF and trigger a download
 * @param devis - The devis data to render
 * @param settings - Optional enterprise settings
 * @returns Promise resolving when download starts
 */
export async function generateAndDownloadDevisPDF(
  devis: Devis,
  settings?: AppSettings
): Promise<void> {
  try {
    const blob = await generateDevisPDFBlob(devis, settings);
    triggerDownload(blob, `${devis.numero}.pdf`);
  } catch (error) {
    throw error;
  }
}

/**
 * Trigger a file download from a blob
 * @param blob - The blob to download
 * @param filename - The filename for the download
 */
export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Cleanup after a short delay to allow download to start
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Cleanup function to call on app unmount or when PDF generation is no longer needed
 * Revokes any cached blob URLs
 */
export function cleanupPDFResources(): void {
  revokePreviousBlobUrl();
}

/**
 * Check if PDF generation is supported in current environment
 * @returns true if supported
 */
export function isPDFSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof Blob !== 'undefined' &&
    typeof URL !== 'undefined' &&
    typeof URL.createObjectURL === 'function'
  );
}
