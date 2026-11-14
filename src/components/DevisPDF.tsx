import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { toFCFAValue, toFCFA } from '../shared/utils/decimal';
import type { Devis, AppSettings } from '../types';

// Register fonts for proper FCFA symbol and French characters
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/npm/@react-pdf/fonts@3.0.0/Helvetica/Helvetica-Regular.ttf' },
    {
      src: 'https://cdn.jsdelivr.net/npm/@react-pdf/fonts@3.0.0/Helvetica/Helvetica-Bold.ttf',
      fontWeight: 'bold',
    },
    {
      src: 'https://cdn.jsdelivr.net/npm/@react-pdf/fonts@3.0.0/Helvetica/Helvetica-Oblique.ttf',
      fontStyle: 'italic',
    },
    {
      src: 'https://cdn.jsdelivr.net/npm/@react-pdf/fonts@3.0.0/Helvetica/Helvetica-BoldOblique.ttf',
      fontWeight: 'bold',
      fontStyle: 'italic',
    },
  ],
});

interface DevisPDFProps {
  devis: Devis;
  settings: AppSettings;
}

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
  },
  companyBlock: {
    flex: 1,
  },
  companyName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4,
  },
  companyDetails: {
    fontSize: 9,
    color: '#4b5563',
    lineHeight: 1.4,
  },
  devisBlock: {
    alignItems: 'flex-end',
    textAlign: 'right',
  },
  devisTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 4,
  },
  devisMeta: {
    fontSize: 9,
    color: '#4b5563',
    lineHeight: 1.5,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#2563eb',
    marginTop: 18,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 3,
  },
  clientBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  clientColumn: {
    width: '48%',
  },
  clientLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#6b7280',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  clientValue: {
    fontSize: 10,
    color: '#1a1a2e',
    lineHeight: 1.5,
  },
  tableContainer: {
    marginTop: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2563eb',
    padding: 8,
    borderRadius: 4,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 7,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
  },
  tableCell: {
    fontSize: 8.5,
    color: '#1a1a2e',
    textAlign: 'center',
    paddingHorizontal: 2,
  },
  cellDescription: {
    textAlign: 'left',
    width: '35%',
  },
  cellUnit: {
    width: '8%',
  },
  cellQty: {
    width: '10%',
  },
  cellPrice: {
    width: '15%',
  },
  cellLineTotal: {
    width: '16%',
  },
  totalsBlock: {
    marginTop: 20,
    alignItems: 'flex-end',
    width: '100%',
  },
  totalsRow: {
    flexDirection: 'row',
    width: '320px',
    justifyContent: 'space-between',
    paddingVertical: 4,
    fontSize: 9.5,
  },
  totalsLabel: {
    color: '#4b5563',
  },
  totalsValue: {
    fontWeight: 'bold',
    color: '#1a1a2e',
    fontFamily: 'Helvetica',
  },
  totalsSeparator: {
    borderTopWidth: 1,
    borderTopColor: '#d1d5db',
    marginVertical: 6,
    width: '320px',
  },
  totalsFinal: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  tvaBreakdown: {
    marginTop: 10,
    width: '320px',
  },
  tvaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
    fontSize: 9,
  },
  notesBlock: {
    marginTop: 25,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  notesTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 6,
  },
  notesContent: {
    fontSize: 9,
    color: '#4b5563',
    lineHeight: 1.5,
    whiteSpace: 'pre-wrap',
  },
  signatureBlock: {
    marginTop: 35,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureColumn: {
    width: '45%',
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#9ca3af',
    height: 40,
    marginBottom: 4,
  },
  signatureLabel: {
    fontSize: 8,
    color: '#6b7280',
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7.5,
    color: '#9ca3af',
    borderTopWidth: 0.5,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
  },
});

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function Header({ devis, settings }: { devis: Devis; settings: AppSettings }) {
  return (
    <View style={styles.header}>
      <View style={styles.companyBlock}>
        <Text style={styles.companyName}>{settings.entrepriseNom || 'MetalPro SARL'}</Text>
        <View style={styles.companyDetails}>
          {settings.entrepriseAdresse && <Text>{settings.entrepriseAdresse}</Text>}
          {settings.entrepriseTelephone && <Text>Tél: {settings.entrepriseTelephone}</Text>}
          {settings.entrepriseEmail && <Text>Email: {settings.entrepriseEmail}</Text>}
          {settings.entrepriseNif && <Text>NIF: {settings.entrepriseNif}</Text>}
          {settings.entrepriseRc && <Text>RC: {settings.entrepriseRc}</Text>}
        </View>
      </View>
      <View style={styles.devisBlock}>
        <Text style={styles.devisTitle}>DEVIS</Text>
        <View style={styles.devisMeta}>
          <Text>
            <strong>N°:</strong> {devis.numero}
          </Text>
          <Text>
            <strong>Date:</strong> {formatDate(devis.dateCreation)}
          </Text>
          <Text>
            <strong>Validité:</strong> {formatDate(devis.dateValidite)}
          </Text>
          <Text>
            <strong>Statut:</strong> {devis.statut}
          </Text>
        </View>
      </View>
    </View>
  );
}

function ClientInfo({ devis }: { devis: Devis }) {
  return (
    <View style={styles.clientBlock}>
      <View style={styles.clientColumn}>
        <Text style={styles.clientLabel}>Client</Text>
        <Text style={styles.clientValue}>
          <Text style={{ fontWeight: 'bold' }}>{devis.clientNom}</Text>
        </Text>
      </View>
      <View style={styles.clientColumn}>
        <Text style={styles.clientLabel}>Date d'émission</Text>
        <Text style={styles.clientValue}>{formatDate(devis.dateCreation)}</Text>
      </View>
    </View>
  );
}

function TableHeader({ tvaMode }: { tvaMode: 'avec' | 'sans' }) {
  return (
    <View style={styles.tableHeader}>
      <Text style={[styles.tableHeaderCell, { width: '35%' }]}>Désignation</Text>
      <Text style={[styles.tableHeaderCell, { width: '8%', textAlign: 'center' }]}>Unité</Text>
      <Text style={[styles.tableHeaderCell, { width: '10%', textAlign: 'center' }]}>Quantité</Text>
      <Text style={[styles.tableHeaderCell, { width: '15%', textAlign: 'center' }]}>
        Prix unitaire
      </Text>
      {tvaMode === 'avec' && (
        <Text style={[styles.tableHeaderCell, { width: '16%', textAlign: 'center' }]}>TVA</Text>
      )}
      <Text style={[styles.tableHeaderCell, { width: '16%', textAlign: 'center' }]}>
        Montant HT
      </Text>
      {tvaMode === 'avec' && (
        <Text style={[styles.tableHeaderCell, { width: '16%', textAlign: 'center' }]}>
          Montant TTC
        </Text>
      )}
    </View>
  );
}

function TableRow({
  ligne,
  index,
  tvaMode,
}: {
  ligne: Devis['lignes'][0];
  index: number;
  tvaMode: 'avec' | 'sans';
}) {
  const bgColor = index % 2 === 0 ? '#ffffff' : '#f9fafb';
  return (
    <View style={[styles.tableRow, { backgroundColor: bgColor }]}>
      <Text style={[styles.tableCell, { textAlign: 'left', width: '35%' }]}>
        {ligne.materiauNom}
      </Text>
      <Text style={[styles.tableCell, { width: '8%', textAlign: 'center' }]}>{ligne.unite}</Text>
      <Text style={[styles.tableCell, { width: '10%', textAlign: 'right' }]}>
        {toFCFAValue(ligne.quantite)}
      </Text>
      <Text style={[styles.tableCell, { width: '15%', textAlign: 'right' }]}>
        {toFCFA(ligne.prixUnitaire)} FCFA
      </Text>
      {tvaMode === 'avec' && (
        <Text style={[styles.tableCell, { width: '16%', textAlign: 'center' }]}>
          {(ligne.tvaTaux * 100).toFixed(2)}%
        </Text>
      )}
      <Text style={[styles.tableCell, { width: '16%', textAlign: 'right' }]}>
        {toFCFA(ligne.montantHT)} FCFA
      </Text>
      {tvaMode === 'avec' && (
        <Text style={[styles.tableCell, { width: '16%', textAlign: 'right' }]}>
          {toFCFA(ligne.montantTTC)} FCFA
        </Text>
      )}
    </View>
  );
}

function Table({ lignes, tvaMode }: { lignes: Devis['lignes']; tvaMode: 'avec' | 'sans' }) {
  return (
    <View style={styles.tableContainer}>
      <TableHeader tvaMode={tvaMode} />
      {lignes.map((ligne, index) => (
        <TableRow key={index} ligne={ligne} index={index} tvaMode={tvaMode} />
      ))}
    </View>
  );
}

function TVABreakdown({ tvaDetails }: { tvaDetails: Devis['tvaDetails'] }) {
  if (!tvaDetails || tvaDetails.length === 0) return null;

  return (
    <View style={styles.tvaBreakdown}>
      <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#4b5563', marginBottom: 4 }}>
        Détail TVA
      </Text>
      {tvaDetails.map((tva, index) => (
        <View key={index} style={styles.tvaRow}>
          <Text style={{ ...styles.totalsLabel, width: '55%' }}>
            TVA {(tva.taux * 100).toFixed(2)}% (Base HT: {toFCFA(tva.baseHT)} FCFA)
          </Text>
          <Text style={{ ...styles.totalsValue, width: '45%', textAlign: 'right' }}>
            {toFCFA(tva.montantTva)} FCFA
          </Text>
        </View>
      ))}
    </View>
  );
}

function Totals({
  totaux,
  tvaDetails,
  tvaMode,
}: {
  totaux: Devis['totaux'];
  tvaDetails: Devis['tvaDetails'];
  tvaMode: 'avec' | 'sans';
}) {
  return (
    <View style={styles.totalsBlock}>
      {tvaMode === 'avec' && <TVABreakdown tvaDetails={tvaDetails} />}
      <View style={styles.totalsSeparator} />
      {tvaMode === 'avec' && (
        <>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Total HT</Text>
            <Text style={styles.totalsValue}>{toFCFA(totaux.totalHT)} FCFA</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Total TVA</Text>
            <Text style={styles.totalsValue}>{toFCFA(totaux.totalTva)} FCFA</Text>
          </View>
        </>
      )}
      {tvaMode === 'sans' && (
        <View style={styles.totalsRow}>
          <Text style={styles.totalsLabel}>Montant total</Text>
          <Text style={styles.totalsValue}>{toFCFA(totaux.totalHT)} FCFA</Text>
        </View>
      )}
      <View style={styles.totalsRow}>
        <Text style={[styles.totalsLabel, styles.totalsFinal]}>
          {tvaMode === 'avec' ? 'Total TTC' : 'Total à payer'}
        </Text>
        <Text style={[styles.totalsValue, styles.totalsFinal]}>{toFCFA(totaux.totalTTC)} FCFA</Text>
      </View>
    </View>
  );
}

function Notes({ notes }: { notes?: string }) {
  const content = notes || 'Aucune observation particulière.';
  return (
    <View style={styles.notesBlock}>
      <Text style={styles.notesTitle}>Observations et conditions</Text>
      <Text style={styles.notesContent}>{content}</Text>
    </View>
  );
}

function Signature() {
  return (
    <View style={styles.signatureBlock}>
      <View style={styles.signatureColumn}>
        <View style={styles.signatureLine} />
        <Text style={styles.signatureLabel}>Signature client</Text>
        <Text style={{ ...styles.signatureLabel, fontSize: 7 }}>Date: _______________</Text>
      </View>
      <View style={styles.signatureColumn}>
        <View style={styles.signatureLine} />
        <Text style={styles.signatureLabel}>Signature MetalPro</Text>
        <Text style={{ ...styles.signatureLabel, fontSize: 7 }}>Date: _______________</Text>
      </View>
    </View>
  );
}

function Footer({ devis }: { devis: Devis }) {
  return (
    <View style={styles.footer}>
      <Text>MetalPro Devis — {devis.numero}</Text>
      <Text
        render={({ pageNumber, totalPages }) => (
          <>
            Page {pageNumber} / {totalPages}
          </>
        )}
      />
      <Text>Généré le {formatDate(new Date().toISOString())}</Text>
    </View>
  );
}

function DevisContent({ devis, settings }: DevisPDFProps) {
  return (
    <>
      <Header devis={devis} settings={settings} />
      <ClientInfo devis={devis} />
      <Text style={styles.sectionTitle}>Détail des prestations</Text>
      <Table lignes={devis.lignes} tvaMode={devis.tvaMode} />
      <Totals totaux={devis.totaux} tvaDetails={devis.tvaDetails} tvaMode={devis.tvaMode} />
      <Notes notes={devis.notes} />
      <Signature />
      <Footer devis={devis} />
    </>
  );
}

export function DevisPDF({ devis, settings }: DevisPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <DevisContent devis={devis} settings={settings} />
      </Page>
    </Document>
  );
}

export { Document } from '@react-pdf/renderer';
