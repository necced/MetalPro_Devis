# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: pdf-generation.spec.ts >> PDF Download >> should download PDF when popup is blocked
- Location: e2e\pdf-generation.spec.ts:247:3

# Error details

```
TimeoutError: page.waitForEvent: Timeout 10000ms exceeded while waiting for event "download"
=========================== logs ===========================
waiting for event "download"
============================================================
```

# Page snapshot

```yaml
- generic [ref=f6e3]:
  - navigation "Navigation principale" [ref=f6e4]:
    - generic [ref=f6e5]:
      - generic [ref=f6e6]: MetalPro
      - navigation "Menu principal" [ref=f6e15]:
        - link "Tableau de bord" [ref=f6e16] [cursor=pointer]:
          - /url: /
        - link "Devis" [ref=f6e23] [cursor=pointer]:
          - /url: /devis
        - link "Nouveau devis" [ref=f6e28] [cursor=pointer]:
          - /url: /devis/nouveau
        - link "Clients" [ref=f6e31] [cursor=pointer]:
          - /url: /clients
        - link "Matériaux" [ref=f6e38] [cursor=pointer]:
          - /url: /materiaux
        - link "Paramètres" [ref=f6e44] [cursor=pointer]:
          - /url: /parametres
      - button "Étendre la barre latérale" [ref=f6e50] [cursor=pointer]
  - generic [ref=f6e53]:
    - banner [ref=f6e54]:
      - generic [ref=f6e55]:
        - heading "MetalPro SARL" [level=1] [ref=f6e57]
        - generic [ref=f6e58]:
          - generic [ref=f6e59]: DB prête
          - generic [ref=f6e62]: En ligne
          - button "Passer en mode sombre" [ref=f6e69] [cursor=pointer]
          - button "MetalPro SARL" [ref=f6e73] [cursor=pointer]
    - main "Contenu principal" [ref=f6e81]:
      - generic [ref=f6e82]:
        - generic [ref=f6e83]:
          - generic [ref=f6e84]:
            - link [ref=f6e85] [cursor=pointer]:
              - /url: /devis
            - generic [ref=f6e88]:
              - heading "DEV-2026-001" [level=1] [ref=f6e89]
              - paragraph [ref=f6e90]: MetalPro SARL
          - generic [ref=f6e91]:
            - link "Modifier" [ref=f6e92] [cursor=pointer]:
              - /url: /devis/1/modifier
            - button "Supprimer" [ref=f6e96] [cursor=pointer]
        - alert [ref=f6e100]: React is not defined
        - generic [ref=f6e101]:
          - generic [ref=f6e102]:
            - generic [ref=f6e103]:
              - generic [ref=f6e104]:
                - heading "Informations générales" [level=2] [ref=f6e105]
                - generic [ref=f6e106]: Brouillon
              - generic [ref=f6e110]:
                - generic [ref=f6e111]:
                  - paragraph [ref=f6e112]: Client
                  - paragraph [ref=f6e113]: Entreprise Test CI
                - generic [ref=f6e114]:
                  - paragraph [ref=f6e115]: Date de création
                  - paragraph [ref=f6e116]: 13/11/2026
                - generic [ref=f6e117]:
                  - paragraph [ref=f6e118]: Date de validité
                  - paragraph [ref=f6e119]: 13/12/2026
                - generic [ref=f6e120]:
                  - paragraph [ref=f6e121]: Statut
                  - generic [ref=f6e122]: Brouillon
            - generic [ref=f6e126]:
              - heading "Lignes du devis" [level=2] [ref=f6e127]
              - table [ref=f6e129]:
                - rowgroup [ref=f6e130]:
                  - row [ref=f6e131]:
                    - columnheader "Matériau" [ref=f6e132]
                    - columnheader "Unité" [ref=f6e133]
                    - columnheader "Quantité" [ref=f6e134]
                    - columnheader "Prix unitaire" [ref=f6e135]
                    - columnheader "TVA" [ref=f6e136]
                    - columnheader "Total HT" [ref=f6e137]
                    - columnheader "Total TTC" [ref=f6e138]
                - rowgroup [ref=f6e139]:
                  - row [ref=f6e140]:
                    - cell "Profilé acier UPN 80" [ref=f6e141]
                    - cell "m" [ref=f6e149]
                    - cell "10" [ref=f6e150]
                    - cell "35 000 FCFA" [ref=f6e151]
                    - cell "19.25%" [ref=f6e152]
                    - cell "350 000 FCFA" [ref=f6e154]
                    - cell "417 375 FCFA" [ref=f6e155]
                  - row [ref=f6e156]:
                    - cell "Tôle ondulée 0.5mm" [ref=f6e157]
                    - cell "m²" [ref=f6e165]
                    - cell "50" [ref=f6e166]
                    - cell "8 500 FCFA" [ref=f6e167]
                    - cell "19.25%" [ref=f6e168]
                    - cell "425 000 FCFA" [ref=f6e170]
                    - cell "506 813 FCFA" [ref=f6e171]
            - generic [ref=f6e172]:
              - heading "Métadonnées" [level=2] [ref=f6e173]
              - generic [ref=f6e174]:
                - generic [ref=f6e175]:
                  - paragraph [ref=f6e176]: Créé le
                  - paragraph [ref=f6e177]: 13/11/2026 15:26
                - generic [ref=f6e178]:
                  - paragraph [ref=f6e179]: Modifié le
                  - paragraph [ref=f6e180]: 13/11/2026 15:26
          - generic [ref=f6e181]:
            - generic [ref=f6e182]:
              - heading "Totaux" [level=2] [ref=f6e183]
              - generic [ref=f6e184]:
                - generic [ref=f6e185]:
                  - generic [ref=f6e186]: Total HT
                  - generic [ref=f6e187]: 775 000 FCFA
                - generic [ref=f6e188]:
                  - paragraph [ref=f6e189]: Détail TVA
                  - generic [ref=f6e191]:
                    - generic [ref=f6e192]: TVA 19.25%
                    - generic [ref=f6e193]: 149 188 FCFA
                - generic [ref=f6e194]:
                  - generic [ref=f6e195]: Total TTC
                  - generic [ref=f6e196]: 924 188 FCFA
            - generic [ref=f6e197]:
              - heading "Actions rapides" [level=2] [ref=f6e198]
              - generic [ref=f6e199]:
                - link [ref=f6e200] [cursor=pointer]:
                  - /url: /devis/1/modifier
                  - generic [ref=f6e205]:
                    - paragraph [ref=f6e206]: Modifier le devis
                    - paragraph [ref=f6e207]: Mettre à jour les informations
                - button [active] [ref=f6e208] [cursor=pointer]:
                  - generic [ref=f6e213]:
                    - paragraph [ref=f6e214]: Générer PDF
                    - paragraph [ref=f6e215]: Exporter le devis en PDF
                - button [ref=f6e216] [cursor=pointer]:
                  - generic [ref=f6e220]:
                    - paragraph [ref=f6e221]: Envoyer par email
                    - paragraph [ref=f6e222]: Envoyer le devis au client
```

# Test source

```ts
  160 |     await testPage.waitForURL(/\/devis\/\d+/);
  161 | 
  162 |     const [popup] = await Promise.all([
  163 |       testPage.waitForEvent('popup', { timeout: 15000 }),
  164 |       testPage.click('button:has-text("Générer PDF")'),
  165 |     ]);
  166 | 
  167 |     await popup.waitForLoadState();
  168 | 
  169 |     const content = await popup.evaluate(() => document.body.innerText);
  170 |     expect(content).toContain('Signature client');
  171 |     expect(content).toContain('Signature MetalPro');
  172 | 
  173 |     await popup.close();
  174 |   });
  175 | 
  176 |   test('should include pagination in PDF footer', async ({ testPage }) => {
  177 |     // Create a devis with many lines to force pagination
  178 |     const manyLines = Array.from({ length: 20 }, (_, i) => ({
  179 |       materiauNom: `Article ${i + 1}`,
  180 |       unite: 'unité',
  181 |       quantite: '1',
  182 |       prixUnitaire: '1000',
  183 |       tvaTaux: 0.1925,
  184 |     }));
  185 | 
  186 |     // Create materials for each line
  187 |     for (let i = 0; i < 20; i++) {
  188 |       await createMateriauUI(testPage, {
  189 |         nom: `Article ${i + 1}`,
  190 |         unite: 'unité',
  191 |         prixUnitaire: '1000',
  192 |         tvaTaux: 0.1925,
  193 |       });
  194 |     }
  195 | 
  196 |     const devisNumber = await createDevisUI(testPage, {
  197 |       clientNom: TEST_CLIENT.nom,
  198 |       lignes: manyLines,
  199 |     });
  200 | 
  201 |     await testPage.click(`text=${devisNumber}`);
  202 |     await testPage.waitForURL(/\/devis\/\d+/);
  203 | 
  204 |     const [popup] = await Promise.all([
  205 |       testPage.waitForEvent('popup', { timeout: 15000 }),
  206 |       testPage.click('button:has-text("Générer PDF")'),
  207 |     ]);
  208 | 
  209 |     await popup.waitForLoadState();
  210 | 
  211 |     const content = await popup.evaluate(() => document.body.innerText);
  212 |     // Check for page numbers
  213 |     expect(content).toMatch(/Page \d+ \/ \d+/);
  214 | 
  215 |     await popup.close();
  216 |   });
  217 | 
  218 |   test('should handle PDF generation error gracefully', async ({ testPage }) => {
  219 |     // Create a devis
  220 |     const devisNumber = await createDevisUI(testPage, {
  221 |       clientNom: TEST_CLIENT.nom,
  222 |       lignes: [TEST_DEVIS_LIGNES[0]],
  223 |     });
  224 | 
  225 |     await testPage.click(`text=${devisNumber}`);
  226 |     await testPage.waitForURL(/\/devis\/\d+/);
  227 | 
  228 |     // Mock a failure by blocking blob URLs
  229 |     await testPage.route('blob:**', (route) => route.abort());
  230 | 
  231 |     await testPage.click('button:has-text("Générer PDF")');
  232 | 
  233 |     // Should show error message
  234 |     await expect(testPage.locator('text=Popup bloqué')).toBeVisible({ timeout: 5000 });
  235 |   });
  236 | });
  237 | 
  238 | test.describe('PDF Download', () => {
  239 |   test.beforeEach(async ({ testPage }) => {
  240 |     await createClientUI(testPage, TEST_CLIENT);
  241 |     for (const materiau of TEST_MATERIAUX) {
  242 |       await createMateriauUI(testPage, materiau);
  243 |     }
  244 |     await navigateAndWait(testPage, '/devis');
  245 |   });
  246 | 
  247 |   test('should download PDF when popup is blocked', async ({ testPage }) => {
  248 |     const devisNumber = await createDevisUI(testPage, {
  249 |       clientNom: TEST_CLIENT.nom,
  250 |       lignes: TEST_DEVIS_LIGNES,
  251 |     });
  252 | 
  253 |     await testPage.click(`text=${devisNumber}`);
  254 |     await testPage.waitForURL(/\/devis\/\d+/);
  255 | 
  256 |     // Block popups
  257 |     testPage.on('popup', (popup) => popup.close());
  258 | 
  259 |     // Click generate PDF
> 260 |     const downloadPromise = testPage.waitForEvent('download', { timeout: 10000 });
      |                                      ^ TimeoutError: page.waitForEvent: Timeout 10000ms exceeded while waiting for event "download"
  261 |     await testPage.click('button:has-text("Générer PDF")');
  262 | 
  263 |     const download = await downloadPromise;
  264 |     expect(download.suggestedFilename()).toContain(devisNumber);
  265 |     expect(download.suggestedFilename()).toContain('.pdf');
  266 |   });
  267 | });
  268 | 
```