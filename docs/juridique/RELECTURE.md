# Dossier de relecture juridique — Jaspe

Généré depuis le code le 2026-11-26 (`server/relecture-juridique.js`). Chaque ligne est une règle que l’application applique ou un texte qu’elle montre à un client.

**Comment relire :**

1. Cochez une case si la règle et sa référence sont exactes.
2. Sinon, écrivez la correction en dessous.
3. Les lignes marquées ⚠️ sont celles que nous savons incertaines : à traiter en priorité.

Jaspe se présente comme une **aide à la conformité**, pas comme un conseil juridique. Ce dossier sert à vérifier que l’aide ne dit rien de faux.

## France — contrôle du dossier de vente


### Agence

- [ ] **Carte professionnelle T valide et garantie financière en cours** — Loi Hoguet n° 70-9, art. 3

### Mandat

- [ ] **Mandat écrit signé avant toute diffusion** — Loi Hoguet art. 6 · décret 72-678 art. 72
- [ ] **Mandat inscrit au registre des mandats (numéro reporté sur le mandat et les annonces)** — Décret 72-678 art. 72
- [ ] **Identité du vendeur vérifiée (pièce d’identité, Kbis pour une SCI, bénéficiaires effectifs)** — LCB-FT · CMF art. L561-5
- [ ] **Titre de propriété ou attestation notariée obtenu** — Bonne pratique · vérification du pouvoir de vendre

### Commercialisation

- [ ] **DPE valide, classes énergie et climat affichées dans l’annonce** — CCH art. L126-33 · décret 2022-780
- [ ] **Audit énergétique pour une maison ou un immeuble en monopropriété classé E, F ou G** *(recommandé)* — CCH art. L126-28-1 (E depuis le 1er janvier 2025)
- [ ] **État des risques (ERP) remis dès la première visite** — C. env. art. L125-5 (loi Climat et résilience)
- [ ] **Honoraires TTC et partie qui les paie affichés dans l’annonce et en agence** — Arrêté du 10 janvier 2017

### Compromis

- [ ] **Dossier de diagnostic technique complet (amiante, plomb, termites, gaz, électricité, assainissement selon le bien)** — CCH art. L271-4
- [ ] **Documents de copropriété remis à l’acquéreur (règlement, PV d’AG, fiche synthétique, pré-état daté)** *(recommandé)* — CCH art. L721-2

### Offre

- [ ] **Identité de l’acquéreur vérifiée** — LCB-FT · CMF art. L561-5
- [ ] **Origine des fonds documentée (apport, prêt, vente préalable)** — LCB-FT · CMF art. L561-6
- [ ] **Personne politiquement exposée et listes de gel des avoirs vérifiées** — CMF art. L561-10 · registre national des gels

### Compromis

- [ ] **Analyse de risque LCB-FT consignée ; déclaration à Tracfin en cas de soupçon** — CMF art. L561-15

### Agence

- [ ] **Consentements et durées de conservation des données clients tenus à jour** — RGPD art. 6 et 30

## Portugal — controlo do processo de venda


### Agência

- [ ] **Licença AMI válida e seguro de responsabilidade civil em vigor** — Lei n.º 15/2013, art. 5.º e 7.º

### Mandato

- [ ] **Contrato de mediação escrito (modelo IMPIC) : partes, imóvel, preço, remuneração, duração, regime de exclusividade** — Lei n.º 15/2013, art. 16.º · Portaria n.º 228/2018
- [ ] **Identificação do vendedor e dos beneficiários efetivos** — Lei n.º 83/2017 (BCFT), art. 23.º e ss.
- [ ] **Caderneta predial e certidão permanente do registo predial obtidas** — Boas práticas · prova da titularidade

### Comercialização

- [ ] **Certificado energético válido, classe indicada nos anúncios** — Decreto-Lei n.º 101-D/2020
- [ ] **Autorização de utilização e ficha técnica : já não exigidas na escritura, recomendadas para o comprador e o banco** *(recommandé)* — Decreto-Lei n.º 10/2024

### Promessa

- [ ] **Declaração de encargos do condomínio** *(recommandé)* — Código Civil, art. 1424.º-A

### Proposta

- [ ] **Identificação do comprador verificada** — Lei n.º 83/2017, art. 24.º
- [ ] **Origem dos fundos documentada** — Lei n.º 83/2017, art. 27.º
- [ ] **Pessoa politicamente exposta e listas de sanções verificadas** — Lei n.º 83/2017, art. 39.º

### Escritura

- [ ] **Transação incluída no reporte trimestral ao IMPIC** — Lei n.º 83/2017 · reporte trimestral IMPIC

### Agência

- [ ] **Consentimentos e prazos de conservação dos dados atualizados** — RGPD, art. 6.º e 30.º

## LCB-FT — grille de risque (FR et PT)

Type de client (points) :

- [ ] Personne physique : 0 pt
- [ ] Personne morale (SCI, société) : 2 pt
- [ ] Structure offshore, trust ou fiducie : 4 pt

Facteurs de risque :

- [ ] Personne politiquement exposée (ou proche) : 4 pt (niveau minimal : eleve) — FR : CMF art. L561-10 · PT : Lei n.º 83/2017, art. 39.º
- [ ] Paiement en espèces, même partiel : 4 pt — FR : CMF art. L561-10-2 · plafond espèces C. mon. fin. D112-3 · PT : Lei n.º 83/2017, art. 36.º (a confirmar) ⚠️
- [ ] Paiement par un tiers sans lien évident : 3 pt — FR : CMF art. L561-6 · PT : Lei n.º 83/2017, art. 27.º
- [ ] Montage complexe, prête-nom, interposition de sociétés : 3 pt — FR : CMF art. L561-10-2 · PT : Lei n.º 83/2017, art. 36.º (a confirmar) ⚠️
- [ ] Prix incohérent avec le marché (± 20 % de l’estimation) : 2 pt — FR : Lignes directrices DGCCRF / Tracfin · PT : Orientações IMPIC
- [ ] Urgence inhabituelle, pression sur le délai : 2 pt — FR : Lignes directrices DGCCRF / Tracfin · PT : Orientações IMPIC

- [ ] Seuils : le score donne le niveau faible / moyen / élevé (voir `evidence.js`, fonction de calcul) — à valider comme proportionné.

Mesures de vigilance affichées selon le niveau :

- [ ] FR · faible — Identifier la partie et vérifier sa pièce d’identité au plus tard à la signature (CMF L561-5)
- [ ] FR · faible — Conserver la copie des pièces 5 ans après la fin de la relation (CMF L561-12)
- [ ] FR · faible — Vigilance simplifiée seulement si le risque faible est justifié (CMF L561-9) ; à défaut, appliquer la vigilance standard
- [ ] FR · moyen — Identifier et vérifier l’identité de la partie et du bénéficiaire effectif (CMF L561-5)
- [ ] FR · moyen — Recueillir l’objet de l’opération et documenter l’origine des fonds (CMF L561-5-1, L561-6)
- [ ] FR · moyen — Vigilance constante jusqu’à l’acte ; conserver les pièces 5 ans (CMF L561-12)
- [ ] FR · eleve — Mesures standard, plus justificatifs détaillés de l’origine des fonds et du patrimoine (relevés, actes)
- [ ] FR · eleve — Examen renforcé de l’opération et validation écrite par le responsable LCB-FT ou la direction (CMF L561-10, L561-10-2)
- [ ] FR · eleve — En cas de soupçon persistant : déclaration à Tracfin avant l’acte (CMF L561-15), sans en informer le client (CMF L561-18)
- [ ] PT · faible — Identificar a parte e verificar o documento de identificação (Lei n.º 83/2017, art. 23.º e 24.º)
- [ ] PT · faible — Medidas simplificadas apenas com risco baixo comprovado (art. 35.º, a confirmar) ⚠️
- [ ] PT · faible — Conservar os documentos durante o prazo legal (art. 51.º)
- [ ] PT · moyen — Identificar a parte e o beneficiário efetivo, com verificação documental (art. 23.º a 32.º)
- [ ] PT · moyen — Documentar a natureza da operação e a origem dos fundos
- [ ] PT · moyen — Acompanhamento contínuo até à escritura ; conservar os documentos (art. 51.º)
- [ ] PT · eleve — Medidas reforçadas : comprovativos detalhados da origem dos fundos e do património (art. 36.º, a confirmar) ⚠️
- [ ] PT · eleve — Aprovação pela direção ou pelo responsável pelo cumprimento normativo
- [ ] PT · eleve — Em caso de suspeita : comunicação ao DCIAP e à UIF (art. 43.º), sem informar o cliente (art. 54.º, a confirmar) ⚠️

Décisions proposées au conseiller :

- [ ] Accepter la relation (vigilance du niveau)
- [ ] Accepter sous vigilance renforcée
- [ ] Suspendre en attente de pièces
- [ ] Refuser ou mettre fin à la relation
- [ ] Analyse de soupçon : déclaration à la cellule de renseignement financier

## Pays à risque (listes GAFI)

- [ ] Listes intégrées au 2025-10-24 (GAFI / FATF — « High-risk jurisdictions subject to a call for action » et « Jurisdictions under increased monitoring »). à vérifier sur le site du GAFI (dernière plénière non intégrée) ⚠️
- Liste noire : Corée du Nord, Iran, Myanmar
- Liste grise : Algérie, Angola, Bolivie, Bulgarie, Cameroun, Côte d’Ivoire, République démocratique du Congo, Haïti, Kenya, Laos, Liban, Monaco, Namibie, Népal, Soudan du Sud, Syrie, Venezuela, Vietnam, Îles Vierges britanniques, Yémen
- Source : https://www.fatf-gafi.org/en/countries/black-and-grey-lists.html

## Textes montrés au client (lien de dépôt des pièces)

Le lien est valable 14 jours.

### Français — « Pourquoi ces documents vous sont demandés »

- [ ] En tant qu’agent immobilier, nous sommes soumis aux obligations de lutte contre le blanchiment de capitaux et le financement du terrorisme (articles L561-2 et suivants du Code monétaire et financier).
- [ ] La loi nous impose d’identifier chaque partie à la vente et de vérifier son identité (art. L561-5), de connaître l’objet de l’opération et l’origine des fonds (art. L561-5-1 et L561-6). Cette demande est la même pour tous nos clients ; elle ne présume rien de votre situation.
- [ ] Finalité : respect de nos obligations légales LCB-FT (base légale : obligation légale, RGPD art. 6.1.c). Les documents sont consultés uniquement par l’agence et, sur demande, par les autorités de contrôle.
- [ ] Durée de conservation : 5 ans à compter de la fin de notre relation (art. L561-12 du Code monétaire et financier).
- [ ] Ne transmettez que les documents demandés : aucune donnée de santé, d’opinion ou de religion n’est nécessaire. Vous disposez d’un droit d’accès (art. L561-45 : accès indirect via la CNIL pour certaines données).
- [ ] Attestation acquéreur : Je déclare sur l’honneur que les informations et documents transmis sont exacts et que les fonds utilisés ont l’origine indiquée.
- [ ] Attestation vendeur : Je déclare sur l’honneur que les informations et documents transmis sont exacts.
- [ ] Question PPE : Exercez-vous, ou avez-vous exercé depuis moins d’un an, une fonction politique, juridictionnelle ou administrative importante (ou êtes-vous un proche d’une telle personne) ?

### Português — « Porque lhe pedimos estes documentos »

- [ ] Enquanto mediadora imobiliária, a agência está sujeita às obrigações de prevenção do branqueamento de capitais e do financiamento do terrorismo (Lei n.º 83/2017, de 18 de agosto).
- [ ] A lei obriga-nos a identificar cada parte na transação e a verificar a sua identidade (art. 23.º e 24.º), bem como a conhecer a natureza da operação e a origem dos fundos. Este pedido é igual para todos os clientes e não pressupõe nada sobre a sua situação.
- [ ] Finalidade : cumprimento das obrigações legais de prevenção do branqueamento (fundamento : obrigação legal, RGPD art. 6.º, n.º 1, al. c)). Os documentos são consultados apenas pela agência e, a pedido, pelas autoridades de supervisão (IMPIC).
- [ ] Prazo de conservação : 7 anos após o termo da relação de negócio (Lei n.º 83/2017, art. 51.º — prazo a confirmar por um jurista). ⚠️
- [ ] Envie apenas os documentos pedidos : não são necessários dados de saúde, opiniões ou religião. Pode exercer os seus direitos de acesso e retificação junto da agência.
- [ ] Attestation acquéreur : Declaro sob compromisso de honra que as informações e documentos enviados são verdadeiros e que os fundos utilizados têm a origem indicada.
- [ ] Attestation vendeur : Declaro sob compromisso de honra que as informações e documentos enviados são verdadeiros.
- [ ] Question PPE : Exerce, ou exerceu há menos de um ano, um cargo político ou público relevante (ou é familiar ou pessoa próxima de alguém nessa situação) ?

## Portugal — communication trimestrielle à l’IMPIC

- [ ] Délai appliqué : Até ao fim do trimestre seguinte ao trimestre de referência (statut : a confirmar) ⚠️ — rappels à J-15 et J-3
- À vérifier sur : https://www.impic.pt · Regulamento n.º 603/2021 (Diário da República, 2.ª série, 2 de julho de 2021)
- Source secondaire : https://www.plmj.com/xms/files/03_Novidades_legislativas/2020/09_setembro/NI_Change_in_the_frequency_of_mandatory_communications_to_the_IMPIC.pdf
- Source secondaire : https://www.imovirtual.com/noticias/imobiliario/imobiliarias-obrigadas-comunicar-transacoes-impic
- Source secondaire : https://imojuris.vidaimobiliaria.com/actualidade/noticias/Reporte-de-transacoes-imobiliarias-ao-IMPIC-I-P-pa/

Champs de l’export (anexo B) :

- [ ] Período (trimestre)
- [ ] Referência interna
- [ ] Data da escritura
- [ ] Tipo de operação
- [ ] Valor (EUR)
- [ ] Meio de pagamento ⚠️ (format à confirmer)
- [ ] Morada do imóvel
- [ ] Tipo de imóvel
- [ ] Artigo matricial ⚠️ (format à confirmer)
- [ ] Descrição predial ⚠️ (format à confirmer)
- [ ] Concelho
- [ ] Vendedor — nome
- [ ] Vendedor — NIF ⚠️ (format à confirmer)
- [ ] Vendedor — país de residência ⚠️ (format à confirmer)
- [ ] Comprador — nome
- [ ] Comprador — NIF ⚠️ (format à confirmer)
- [ ] Comprador — país de residência ⚠️ (format à confirmer)
- [ ] Contrato de mediação n.º
- [ ] Grau de risco (interno) ⚠️ (format à confirmer)
- [ ] Campos em falta

## Factures de commission

- [ ] Portugal : TVA 23 % (IVA23) ou exonération art. 53.º CIVA (code M10) ; retenue IRS art. 101.º CIRS (taux selon la situation du consultor) ⚠️
- [ ] France : franchise en base de TVA par défaut (mention art. 293 B du CGI) ; code VATEX-FR-FRANCHISE pour la facture électronique non émis ⚠️
- [ ] Les factures sont émises par le logiciel certifié de l’agence (InvoiceXpress au Portugal) ; Jaspe prépare, ne certifie pas.

## Questions ouvertes pour le juriste

1. Durée de conservation des pièces LCB-FT au Portugal : 7 ans (art. 51.º Lei 83/2017) — confirmé ?
2. Délai IMPIC : fin du trimestre suivant — confirmé par le Regulamento n.º 603/2021 ?
3. Le calcul de score (points et seuils) est-il défendable lors d’un contrôle DGCCRF / ASAE-IMPIC ?
4. Une agence peut-elle s’appuyer sur une attestation sur l’honneur pour l’origine des fonds en vigilance standard ?
5. Mentions obligatoires manquantes sur les factures FR (pénalités de retard, indemnité de 40 €) pour un mandataire ?
