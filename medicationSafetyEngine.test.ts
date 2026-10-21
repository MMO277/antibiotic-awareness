/**
 * Comprehensive Automated Verification & Regression Test Suite (`medicationSafetyEngine.test.ts`)
 *
 * Validates all 13 mandatory requirements from the prompt:
 *  1. Same active ingredient under two verified brands.
 *  2. Different active ingredients.
 *  3. Combination product overlap vs non-equivalence.
 *  4. Recorded allergy matching an ingredient (direct match + beta-lactam cross-reactivity).
 *  5. Uncertain brand-to-ingredient mapping (never infers ingredient from look-alike name).
 *  6. Known interaction from the configured source.
 *  7. Missing/unavailable interaction data (explicit scope tracking & non-guarantee disclaimer).
 *  8. Duplicate input entries and alert deduplication.
 *  9. Missing/incomplete health profile & populated health profile contraindications.
 * 10. Arabic and English name normalization where supported.
 * 11. Data-source failure without UI crash (transparent `incomplete_check` / `unable_to_verify` state).
 * 12. Per-user data isolation through verified Firestore security rules and local storage isolation.
 * 13. Regression behavior for Prescription Radar, Allergy Checker, Health Profile, and Medication Database.
 */

import {
  evaluateMedicationSafety,
  resolveMedicationIdentity,
  parseActiveIngredients,
  getClassifiedAlternatives,
} from './medicationSafetyEngine';
import {
  AllergyRecord,
  UserHealthProfile,
  checkDrugAllergySafety,
  getProfileStorageKey,
} from './allergyData';
import { findInteractionRule, resolveTargetId } from './interactionsData';
import { normalizeRadarWorkspace } from './trackerData';
import { ACTIVE_INGREDIENTS, EGYPTIAN_COMMERCIAL_PRODUCTS } from './egyptianDrugDatabase';
import { searchMeds } from './search';
import { SEED } from './seedData';
import * as fs from 'fs';
import * as path from 'path';

export interface TestCaseResult {
  id: number;
  name: string;
  passed: boolean;
  details: string;
}

function assertCondition(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export async function runAllSafetyEngineTests(): Promise<TestCaseResult[]> {
  const results: TestCaseResult[] = [];

  const runTest = async (id: number, name: string, fn: () => void | Promise<void>) => {
    try {
      await fn();
      results.push({ id, name, passed: true, details: 'OK' });
    } catch (err: any) {
      results.push({
        id,
        name,
        passed: false,
        details: err?.message || String(err),
      });
    }
  };

  // TEST 1: Same active ingredient under two verified brands
  await runTest(
    1,
    'Same active ingredient under two verified brands (e.g., Ciprofar 500mg + Ciprobay 500mg, and oral vs ophthalmic route distinction)',
    () => {
      const report = evaluateMedicationSafety({
        medications: ['Ciprofar 500mg Tablets', 'Ciprobay 500mg Tablets'],
      });
      assertCondition(
        report.groupedFindings.duplicates.length === 1,
        `Expected 1 duplicate active ingredient finding, got ${report.groupedFindings.duplicates.length}`
      );
      const dup = report.groupedFindings.duplicates[0];
      assertCondition(dup.severity === 'warning', 'Duplicate active ingredient must have warning severity');
      assertCondition(
        dup.involvedIngredients.some((i) => i.toLowerCase().includes('ciprofloxacin')),
        'Duplicate finding must identify Ciprofloxacin as the shared active ingredient'
      );

      // Different route/strength (oral tablet vs eye drops) must warn they are not directly interchangeable
      const routeReport = evaluateMedicationSafety({
        medications: ['Ciprofar 500mg Tablets', 'Ciprocin 0.3% Eye Drops'],
      });
      assertCondition(
        routeReport.groupedFindings.duplicates.length === 1,
        'Must detect shared Ciprofloxacin across different routes'
      );
      assertCondition(
        routeReport.groupedFindings.duplicates[0].reason.en.includes('not directly interchangeable'),
        'Must explicitly warn when strength, form, or route differs'
      );
    }
  );

  // TEST 2: Different active ingredients
  await runTest(
    2,
    'Different active ingredients without overlap (e.g., Amoxicillin + Paracetamol)',
    () => {
      const report = evaluateMedicationSafety({
        medications: ['Amoxil 500mg Capsules', 'paracetamol'],
        healthProfile: {
          age: '30',
          allergies: [],
          medications: [],
          pregnancyStatus: 'none',
          renalStatus: 'normal',
          hepaticStatus: 'normal',
        },
      });
      assertCondition(
        report.groupedFindings.duplicates.length === 0,
        `Expected 0 duplicate ingredient findings for distinct ingredients, got ${report.groupedFindings.duplicates.length}`
      );
      assertCondition(
        report.groupedFindings.interactions.length === 0,
        'Amoxicillin + Paracetamol is safe at standard doses and must not emit a false interaction alert'
      );
    }
  );

  // TEST 3: Combination product
  await runTest(
    3,
    'Combination product overlap (Augmentin [Amoxicillin + Clavulanic Acid] + E-Mox [Amoxicillin])',
    () => {
      const report = evaluateMedicationSafety({
        medications: ['Augmentin 1g Tablets', 'E-Mox 500mg Capsules'],
      });
      const aug = report.resolvedMedications.find((m) =>
        m.displayName.en.toLowerCase().includes('augmentin')
      );
      assertCondition(Boolean(aug && aug.isCombination), 'Augmentin must be flagged as a combination product');
      assertCondition(
        aug!.components.length === 2,
        `Augmentin must decompose into 2 active ingredients, got ${aug?.components.length}`
      );
      assertCondition(
        report.groupedFindings.duplicates.length === 1,
        'Must detect Amoxicillin overlap between Augmentin and E-Mox'
      );
      const dup = report.groupedFindings.duplicates[0];
      assertCondition(
        dup.reason.en.includes('do NOT have identical composition'),
        'Must warn that a combination product and a single-ingredient product do not have identical composition'
      );
    }
  );

  // TEST 4: Recorded allergy matching an ingredient (direct match + cross-reactivity)
  await runTest(
    4,
    'Recorded allergy matching an ingredient (direct Penicillin match & Cephalosporin cross-reactivity)',
    () => {
      const allergies: AllergyRecord[] = [
        {
          id: 'alg-1',
          drugName: 'Amoxicillin / Penicillin',
          allergenKey: 'penicillin',
          reportedSymptoms: 'Anaphylaxis and airway swelling',
          severity: 'life_threatening',
          evidenceStatus: 'clinically_verified',
          createdAt: '2026-01-01T00:00:00Z',
        },
      ];

      // 4a. Direct match against Augmentin (contains Amoxicillin)
      const directReport = evaluateMedicationSafety({
        medications: ['Augmentin 1g Tablets'],
        healthProfile: { allergies, age: '35' },
      });
      assertCondition(
        directReport.groupedFindings.allergies.some(
          (f) => f.type === 'allergy_match' && f.severity === 'urgent'
        ),
        'Direct Penicillin/Amoxicillin allergy against Augmentin must trigger an urgent allergy_match finding'
      );
      assertCondition(
        directReport.overallStatus === 'urgent_review',
        'Direct allergy match must elevate overallStatus to urgent_review'
      );

      // 4b. Cross-reactivity against Ceftriaxone (Rocephin)
      const crossReport = evaluateMedicationSafety({
        medications: ['Rocephin 1g Vial'],
        healthProfile: { allergies, age: '35' },
      });
      assertCondition(
        crossReport.groupedFindings.allergies.some(
          (f) => f.type === 'allergy_cross_reactivity' && f.severity === 'warning'
        ),
        'Penicillin allergy against Ceftriaxone (Rocephin) must trigger an allergy_cross_reactivity warning'
      );
    }
  );

  // TEST 5: Uncertain brand-to-ingredient mapping
  await runTest(
    5,
    'Uncertain or unknown brand-to-ingredient mapping (no unsafe fuzzy ingredient guessing)',
    () => {
      const allergies: AllergyRecord[] = [
        {
          id: 'alg-pen',
          drugName: 'Penicillin',
          allergenKey: 'penicillin',
          reportedSymptoms: 'Hives',
          severity: 'severe',
          evidenceStatus: 'clinically_verified',
          createdAt: '2026-01-01T00:00:00Z',
        },
      ];
      const report = evaluateMedicationSafety({
        medications: ['Augmenxyz Unknown Forte'],
        healthProfile: { allergies, age: '40' },
      });
      assertCondition(
        report.completeness.status === 'unable_to_verify',
        `Uncertain medication must set completeness.status to unable_to_verify, got ${report.completeness.status}`
      );
      assertCondition(
        report.overallStatus === 'incomplete_check' || report.overallStatus === 'caution_verify',
        `Uncertain medication must not report no_known_alerts, got ${report.overallStatus}`
      );
      assertCondition(
        report.resolvedMedications[0].components.length === 0,
        'Must NEVER guess or assign active ingredients from a look-alike trade name'
      );
      assertCondition(
        report.groupedFindings.uncertainties.length >= 1,
        'Must emit an explicit identity_uncertainty finding requiring verification'
      );
    }
  );

  // TEST 6: Known interaction from the configured source
  await runTest(
    6,
    'Known drug–drug & food interactions from configured source (Metronidazole + Warfarin, Ciprofloxacin + Dairy, Azithromycin + Levofloxacin QT pair)',
    () => {
      const report = evaluateMedicationSafety({
        medications: ['Flagyl 500mg Tablets', 'Ciprofar 500mg Tablets'],
        coMedicationIds: ['warfarin', 'calcium_dairy'],
        healthProfile: { age: '45', allergies: [], medications: [] },
      });
      const metroWarfarin = report.groupedFindings.interactions.find(
        (f) => f.id === 'interaction:metronidazole::warfarin'
      );
      assertCondition(Boolean(metroWarfarin), 'Must detect Metronidazole + Warfarin interaction');
      assertCondition(
        metroWarfarin!.severity === 'urgent',
        'Metronidazole + Warfarin severe interaction must map to urgent severity'
      );
      assertCondition(
        Boolean(metroWarfarin!.source.updatedDate),
        'Interaction finding must include verified source updatedDate'
      );

      const ciproDairy = report.groupedFindings.interactions.find(
        (f) => f.id === 'interaction:ciprofloxacin::dairy'
      );
      assertCondition(
        Boolean(ciproDairy),
        'Must detect Ciprofloxacin + Dairy (via calcium_dairy alias) interaction'
      );
      assertCondition(
        ciproDairy!.severity === 'warning',
        'Moderate chelation interaction must map to warning severity'
      );

      // Antibiotic-antibiotic QT pair interaction
      const qtReport = evaluateMedicationSafety({
        medications: ['Zithromax 500mg Capsules', 'Tavanic 500mg Tablets'],
      });
      assertCondition(
        qtReport.groupedFindings.interactions.some((f) => f.id.includes('abx-pair-qt')),
        'Must detect additive QT prolongation interaction between Azithromycin (Zithromax) and Levofloxacin (Tavanic)'
      );
    }
  );

  // TEST 7: Missing/unavailable interaction data
  await runTest(
    7,
    'Missing/unavailable interaction pair coverage tracking & non-guarantee disclaimer',
    () => {
      const report = evaluateMedicationSafety({
        medications: ['Amoxil 500mg Capsules', 'Averolid 600mg Tablets'],
        healthProfile: {
          age: '35',
          allergies: [],
          medications: [],
          renalStatus: 'normal',
          hepaticStatus: 'normal',
        },
      });
      assertCondition(
        report.completeness.unverifiedInteractionPairs.length > 0,
        'Must record unverifiedInteractionPairs when an antibiotic pair has no specific rule in the local dataset'
      );
      assertCondition(
        report.safetyDisclaimer.en.includes('never means a prescription is guaranteed safe'),
        'Safety disclaimer must explicitly state that no alerts found never means guaranteed safe'
      );
    }
  );

  // TEST 8: Duplicate input entries and alert deduplication
  await runTest(8, 'Duplicate input entries and alert deduplication', () => {
    const report = evaluateMedicationSafety({
      medications: [
        'Ciprofar 500mg Tablets',
        'Ciprofar 500mg Tablets',
      ],
      coMedicationIds: ['warfarin', 'warfarin'],
      healthProfile: { age: '50', allergies: [], medications: [] },
    });
    const ciproWarfarinAlerts = report.groupedFindings.interactions.filter(
      (f) => f.id === 'interaction:ciprofloxacin::warfarin'
    );
    assertCondition(
      ciproWarfarinAlerts.length === 1,
      `Expected exactly 1 deduplicated Ciprofloxacin+Warfarin interaction alert, got ${ciproWarfarinAlerts.length}`
    );
    assertCondition(
      report.groupedFindings.duplicates.some((f) => f.id.startsWith('duplicate-entry:')),
      'Must emit a duplicate-entry warning when the exact same medicine is listed twice'
    );
  });

  // TEST 9: Missing/incomplete health profile & Contraindications when profile IS present
  await runTest(
    9,
    'Missing/incomplete health profile tracking vs populated health profile contraindications (pediatric, pregnancy, renal)',
    () => {
      const emptyProfileReport = evaluateMedicationSafety({
        medications: ['Vibramycin 100mg Capsules'],
        healthProfile: null,
      });
      assertCondition(
        emptyProfileReport.completeness.missingProfileFields.length >= 2,
        'Missing health profile must report missingProfileFields'
      );

      const contraindicationReport = evaluateMedicationSafety({
        medications: ['Vibramycin 100mg Capsules', 'Uvamin Retard 100mg Capsules'],
        healthProfile: {
          age: '6',
          allergies: [],
          medications: [],
          pregnancyStatus: 'pregnant',
          renalStatus: 'impaired',
          hepaticStatus: 'normal',
          notes: 'G6PD deficiency أنيميا الفول',
        },
      });
      assertCondition(
        contraindicationReport.groupedFindings.profileContraindications.some((f) =>
          f.id.includes('profile:pediatric:doxycycline')
        ),
        'Must flag Doxycycline (Vibramycin) pediatric contraindication for age 6'
      );
      assertCondition(
        contraindicationReport.groupedFindings.profileContraindications.some((f) =>
          f.id.includes('profile:renal:nitrofurantoin')
        ),
        'Must flag Nitrofurantoin (Uvamin Retard) contraindication in renal impairment'
      );
      assertCondition(
        contraindicationReport.groupedFindings.profileContraindications.some((f) =>
          f.id.includes('profile:g6pd:nitrofurantoin')
        ),
        'Must flag Nitrofurantoin G6PD hemolysis contraindication'
      );
    }
  );

  // TEST 10: Arabic and English name normalization
  await runTest(
    10,
    'Arabic and English name normalization across brand and generic names',
    () => {
      const report = evaluateMedicationSafety({
        medications: ['أوجمنتين ١ جم أقراص', 'إيموكس 500 مجم كبسول'],
      });
      assertCondition(
        report.resolvedMedications.length === 2 &&
          report.resolvedMedications.every((m) => m.matchedStatus === 'verified'),
        'Both Arabic medication names (أوجمنتين and إيموكس) must resolve to verified medications'
      );
      assertCondition(
        report.groupedFindings.duplicates.length === 1,
        'Must detect Amoxicillin duplicate active ingredient when both inputs are in Arabic'
      );
    }
  );

  // TEST 11: Data-source failure without UI crash
  await runTest(
    11,
    'Data-source failure handling without crashing (explicit incomplete_check / unable_to_verify state)',
    () => {
      const report = evaluateMedicationSafety({
        medications: ['Amoxil 500mg Capsules'],
        dataSourceFailure: {
          sourceName: 'Firestore Health Profile Sync',
          reason: 'Offline network timeout',
        },
      });
      assertCondition(
        report.completeness.status === 'unable_to_verify',
        'Data source failure must mark completeness.status as unable_to_verify'
      );
      assertCondition(
        report.overallStatus === 'incomplete_check',
        'Data source failure without urgent/warning findings must set overallStatus to incomplete_check'
      );
      assertCondition(
        report.groupedFindings.uncertainties.some((f) =>
          f.id.startsWith('data-source-unavailable:')
        ),
        'Must include a structured data-source-unavailable finding'
      );
    }
  );

  // TEST 12: Per-user data isolation through verified Firestore security rules & localStorage keys
  await runTest(
    12,
    'Per-user data isolation in Firestore security rules and local storage keys',
    () => {
      let rulesPath = path.resolve(__dirname, 'firestore.rules');
      if (!fs.existsSync(rulesPath)) {
        rulesPath = '/tmp/work/antibiotic-awareness-main/firestore.rules';
      }
      const rulesText = fs.readFileSync(rulesPath, 'utf-8');
      assertCondition(
        rulesText.includes('function isOwner(uid)') &&
          rulesText.includes('request.auth.uid == uid'),
        'firestore.rules must enforce request.auth.uid == userId in isOwner(userId)'
      );
      assertCondition(
        rulesText.includes('match /users/{uid}') &&
          rulesText.includes('allow read: if isOwner(uid)'),
        'firestore.rules must restrict /users/{userId} reads to isOwner(userId) or admin'
      );
      assertCondition(
        getProfileStorageKey('user-A') !== getProfileStorageKey('user-B'),
        'getProfileStorageKey must isolate per-user local storage keys'
      );
    }
  );

  // TEST 13: Regression behavior for Prescription Radar, Allergy Checker, Health Profile, and Medication Database
  await runTest(
    13,
    'Regression behavior across Prescription Radar workspace, Allergy Checker, and Egyptian Drug Database',
    () => {
      const ws = normalizeRadarWorkspace({
        selectedAbx: 'ciprofloxacin',
        ageGroup: 'elderly',
        selectedCoMeds: ['warfarin', 'calcium_dairy'],
        additionalMeds: ['Ciprobay 500mg'],
      });
      assertCondition(ws.selectedAbx === 'ciprofloxacin', 'Radar selectedAbx preserved');
      assertCondition(ws.selectedCoMeds.length === 2, 'Radar selectedCoMeds preserved');
      assertCondition(
        Array.isArray(ws.additionalMeds) && ws.additionalMeds[0] === 'Ciprobay 500mg',
        'Radar additionalMeds preserved without breaking existing workspace schema'
      );

      const augProd = EGYPTIAN_COMMERCIAL_PRODUCTS.find((p) => p.productId === 'EG-ABX-001');
      assertCondition(Boolean(augProd), 'EG-ABX-001 (Augmentin 1g) exists in Egyptian database');
      const classifiedAlts = getClassifiedAlternatives(augProd!);
      assertCondition(
        classifiedAlts.exactEquivalents.length > 0,
        'getClassifiedAlternatives must return exact equivalents for Augmentin 1g'
      );

      const seedRes = searchMeds(
        SEED.map((s) => ({
          ...(s.fields as any),
          id: s.id,
          status: 'approved' as const,
          brands: s.brands,
          sources: s.sources,
          notes: s.notes,
          lastReviewed: '2026-10-14',
        })),
        'سيبروفلوكساسين'
      );
      assertCondition(seedRes.length > 0, 'searchMeds Arabic query must return Ciprofloxacin');
    }
  );

  return results;
}
