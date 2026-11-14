#!/usr/bin/env node
/**
 * Générateur QR Code — MetalPro Devis
 *
 * Génère un QR Code SVG/PNG pour l'URL publique de la PWA.
 * Usage : node generate-qrcode.js [URL] [options]
 *
 * Dépendances : qrcode (npm install qrcode)
 * Profil : Technique - DocProductionSystem
 */

import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration par défaut
const DEFAULT_URL = 'https://metalpro-devis.pages.dev'; // À remplacer par l'URL finale
const OUTPUT_DIR = path.resolve(__dirname, 'docs/assets');
const DEFAULT_FILENAME = 'qrcode-metalpro-devis';

// Options QR Code
const QR_OPTIONS = {
  width: 512,
  margin: 4,
  color: {
    dark: '#1B3A4B', // Couleur primaire charte (bleu foncé)
    light: '#FFFFFF', // Fond blanc
  },
  errorCorrectionLevel: 'M', // L, M, Q, H - M = 15% correction
};

async function generateQRCode(url, options = {}) {
  const opts = { ...QR_OPTIONS, ...options };
  const filename = options.filename || DEFAULT_FILENAME;

  // Créer le dossier de sortie
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const svgPath = path.join(OUTPUT_DIR, `${filename}.svg`);
  const pngPath = path.join(OUTPUT_DIR, `${filename}.png`);
  const png2xPath = path.join(OUTPUT_DIR, `${filename}@2x.png`);

  try {
    // Générer SVG (vectoriel, idéal pour impression)
    const svgString = await QRCode.toString(url, {
      ...opts,
      type: 'svg',
      width: undefined, // SVG utilise viewBox
    });
    fs.writeFileSync(svgPath, svgString);
    console.log(`✅ SVG généré : ${svgPath}`);

    // Générer PNG (512px)
    await QRCode.toFile(pngPath, url, {
      ...opts,
      type: 'png',
      width: 512,
    });
    console.log(`✅ PNG 512px généré : ${pngPath}`);

    // Générer PNG @2x (1024px) pour haute résolution
    await QRCode.toFile(png2xPath, url, {
      ...opts,
      type: 'png',
      width: 1024,
    });
    console.log(`✅ PNG 1024px (@2x) généré : ${png2xPath}`);

    return {
      svg: svgPath,
      png: pngPath,
      png2x: png2xPath,
      url,
    };
  } catch (error) {
    console.error('❌ Erreur génération QR Code :', error);
    throw error;
  }
}

// CLI
async function main() {
  const args = process.argv.slice(2);

  // Aide
  if (args.includes('-h') || args.includes('--help')) {
    console.log(`
Générateur QR Code MetalPro Devis

Usage:
  node generate-qrcode.js [URL] [options]

Arguments:
  URL                 URL publique de la PWA (défaut: ${DEFAULT_URL})

Options:
  -o, --output <dir>  Dossier de sortie (défaut: distribution/docs/assets)
  -n, --name <name>   Nom de base fichier (défaut: qrcode-metalpro-devis)
  -s, --size <px>     Taille PNG en pixels (défaut: 512)
  -e, --ecc <level>   Correction d'erreur: L|M|Q|H (défaut: M)
  -h, --help          Aide

Exemples:
  node generate-qrcode.js
  node generate-qrcode.js https://mon-domaine.cm
  node generate-qrcode.js https://metalpro-devis.pages.dev -n qrcode-prod -s 1024
    `);
    process.exit(0);
  }

  // Parser arguments
  let url = DEFAULT_URL;
  let outputDir = OUTPUT_DIR;
  let filename = DEFAULT_FILENAME;
  let size = 512;
  let eccLevel = 'M';

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '-o' || arg === '--output') {
      outputDir = path.resolve(args[++i]);
    } else if (arg === '-n' || arg === '--name') {
      filename = args[++i];
    } else if (arg === '-s' || arg === '--size') {
      size = parseInt(args[++i], 10);
    } else if (arg === '-e' || arg === '--ecc') {
      eccLevel = args[++i].toUpperCase();
    } else if (!arg.startsWith('-')) {
      url = arg;
    }
  }

  // Valider URL
  try {
    new URL(url);
  } catch {
    console.error('❌ URL invalide :', url);
    process.exit(1);
  }

  // Valider ECC
  if (!['L', 'M', 'Q', 'H'].includes(eccLevel)) {
    console.error('❌ Niveau ECC invalide :', eccLevel, '(L|M|Q|H)');
    process.exit(1);
  }

  console.log(`🔗 Génération QR Code pour : ${url}`);
  console.log(`📁 Sortie : ${outputDir}`);
  console.log(`📐 Taille : ${size}px, ECC: ${eccLevel}`);

  const customOptions = {
    ...QR_OPTIONS,
    width: size,
    errorCorrectionLevel: eccLevel,
    filename,
  };

  // Override output dir if specified via CLI
  if (outputDir !== OUTPUT_DIR) {
    const svgPath = path.join(outputDir, `${filename}.svg`);
    const pngPath = path.join(outputDir, `${filename}.png`);
    const png2xPath = path.join(outputDir, `${filename}@2x.png`);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const svgString = await QRCode.toString(url, {
      ...customOptions,
      type: 'svg',
      width: undefined,
    });
    fs.writeFileSync(svgPath, svgString);
    console.log(`✅ SVG généré : ${svgPath}`);

    await QRCode.toFile(pngPath, url, { ...customOptions, type: 'png', width: size });
    console.log(`✅ PNG ${size}px généré : ${pngPath}`);

    await QRCode.toFile(png2xPath, url, { ...customOptions, type: 'png', width: size * 2 });
    console.log(`✅ PNG ${size * 2}px (@2x) généré : ${png2xPath}`);
  } else {
    await generateQRCode(url, customOptions);
  }

  console.log('\n🎉 QR Code généré avec succès !');
  console.log(`   Scannez avec l'appareil photo Android pour installer la PWA.`);
}

main().catch((err) => {
  console.error('Erreur fatale :', err);
  process.exit(1);
});
