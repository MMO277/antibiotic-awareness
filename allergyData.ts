import { useEffect, useState, useCallback, useRef } from 'react';
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, configured } from './firebase';
import { useAuth } from './authContext';
import { Bi } from './types';

export type AllergySeverity = 'mild' | 'moderate' | 'severe' | 'life_threatening';
export type EvidenceStatus = 'patient_reported' | 'suspected' | 'clinically_verified';
export type MatchLevel = 'exact_match' | 'cross_reactivity' | 'no_match' | 'unverified';

export interface AllergyRecord {
  id: string;
  drugName: string;
  allergenKey: string; // e.g. "penicillin", "cephalosporin", "sulfa", "macrolide", "fluoroquinolone", "other"
  reportedSymptoms: string;
  severity: AllergySeverity;
  reactionDate?: string;
  evidenceStatus: EvidenceStatus;
  notes?: string;
  createdAt: string;
}

export interface MedicationRecord {
  id: string;
  drugName: string;
  activeIngredients: string;
  prescribedDose: string;
  route: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  status: 'active' | 'completed' | 'discontinued';
  notes?: string;
}

export interface UserHealthProfile {
  displayName: string;
  age: string;
  gender: string;
  bloodType: string;
  emergencyContact: string;
  notes: string;
  allergies: AllergyRecord[];
  medications: MedicationRecord[];
}

export const STORAGE_KEY = 'antibiotic_awareness_health_profile';
const MIGRATED_LEGACY_PREFIX = 'aa_migrated_legacy_profile_';
const PROFILE_EVENT = 'aa-health-profile-updated';

export function emptyHealthProfile(): UserHealthProfile {
  return {
    displayName: '',
    age: '',
    gender: '',
    bloodType: '',
    emergencyContact: '',
    notes: '',
    allergies: [],
    medications: [],
  };
}

export function getProfileStorageKey(uid?: string | null): string {
  return uid ? `${STORAGE_KEY}_${uid}` : STORAGE_KEY;
}

/** Strips undefined properties recursively so Firestore setDoc never rejects an object */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item)) as unknown as T;
  }
  if (value !== null && typeof value === 'object') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) {
        out[k] = stripUndefined(v);
      }
    }
    return out as T;
  }
  return value;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeProfile(raw: any): UserHealthProfile {
  if (!raw || typeof raw !== 'object') return emptyHealthProfile();
  return {
    displayName: typeof raw.displayName === 'string' ? raw.displayName : '',
    age: typeof raw.age === 'string' ? raw.age : '',
    gender: typeof raw.gender === 'string' ? raw.gender : '',
    bloodType: typeof raw.bloodType === 'string' ? raw.bloodType : '',
    emergencyContact: typeof raw.emergencyContact === 'string' ? raw.emergencyContact : '',
    notes: typeof raw.notes === 'string' ? raw.notes : '',
    allergies: Array.isArray(raw.allergies)
      ? raw.allergies
          .filter((a: unknown) => a !== null && typeof a === 'object')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((a: any) => ({
            id: typeof a.id === 'string' && a.id ? a.id : `all-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            drugName: typeof a.drugName === 'string' ? a.drugName : '',
            allergenKey: typeof a.allergenKey === 'string' ? a.allergenKey : 'other',
            reportedSymptoms: typeof a.reportedSymptoms === 'string' ? a.reportedSymptoms : '',
            severity: (['mild', 'moderate', 'severe', 'life_threatening'].includes(a.severity)
              ? a.severity
              : 'severe') as AllergySeverity,
            ...(typeof a.reactionDate === 'string' ? { reactionDate: a.reactionDate } : {}),
            evidenceStatus: (['patient_reported', 'suspected', 'clinically_verified'].includes(a.evidenceStatus)
              ? a.evidenceStatus
              : 'patient_reported') as EvidenceStatus,
            ...(typeof a.notes === 'string' ? { notes: a.notes } : {}),
            createdAt: typeof a.createdAt === 'string' ? a.createdAt : new Date().toISOString(),
          }))
      : [],
    medications: Array.isArray(raw.medications)
      ? raw.medications
          .filter((m: unknown) => m !== null && typeof m === 'object')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((m: any) => ({
            id: typeof m.id === 'string' && m.id ? m.id : `med-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            drugName: typeof m.drugName === 'string' ? m.drugName : '',
            activeIngredients: typeof m.activeIngredients === 'string' ? m.activeIngredients : '',
            prescribedDose: typeof m.prescribedDose === 'string' ? m.prescribedDose : '',
            route: typeof m.route === 'string' ? m.route : 'oral',
            frequency: typeof m.frequency === 'string' ? m.frequency : 'twice_daily',
            startDate: typeof m.startDate === 'string' ? m.startDate : new Date().toISOString().split('T')[0],
            ...(typeof m.endDate === 'string' ? { endDate: m.endDate } : {}),
            status: (['active', 'completed', 'discontinued'].includes(m.status) ? m.status : 'active') as
              | 'active'
              | 'completed'
              | 'discontinued',
            ...(typeof m.notes === 'string' ? { notes: m.notes } : {}),
          }))
      : [],
  };
}

export function isProfileNonEmpty(p: UserHealthProfile | null | undefined): boolean {
  if (!p) return false;
  return Boolean(
    p.displayName.trim() ||
      p.age.trim() ||
      p.gender.trim() ||
      p.bloodType.trim() ||
      p.emergencyContact.trim() ||
      p.notes.trim() ||
      p.allergies.length > 0 ||
      p.medications.length > 0
  );
}

/**
 * Non-destructively merges a primary (cloud) profile with a secondary (local/guest) profile
 * so neither cloud data nor pre-login local entries are lost during initial migration.
 */
export function mergeProfiles(primary: UserHealthProfile, secondary: UserHealthProfile): UserHealthProfile {
  const allergyMap = new Map<string, AllergyRecord>();
  for (const a of primary.allergies) {
    allergyMap.set(a.id, a);
  }
  for (const a of secondary.allergies) {
    const duplicateByContent = Array.from(allergyMap.values()).some(
      (existing) =>
        existing.id === a.id ||
        (existing.drugName.trim().toLowerCase() === a.drugName.trim().toLowerCase() &&
          existing.allergenKey === a.allergenKey)
    );
    if (!duplicateByContent) {
      allergyMap.set(a.id, a);
    }
  }

  const medMap = new Map<string, MedicationRecord>();
  for (const m of primary.medications) {
    medMap.set(m.id, m);
  }
  for (const m of secondary.medications) {
    const duplicateByContent = Array.from(medMap.values()).some(
      (existing) =>
        existing.id === m.id ||
        (existing.drugName.trim().toLowerCase() === m.drugName.trim().toLowerCase() &&
          existing.prescribedDose.trim().toLowerCase() === m.prescribedDose.trim().toLowerCase() &&
          existing.status === m.status)
    );
    if (!duplicateByContent) {
      medMap.set(m.id, m);
    }
  }

  return normalizeProfile({
    displayName: primary.displayName.trim() || secondary.displayName.trim(),
    age: primary.age.trim() || secondary.age.trim(),
    gender: primary.gender.trim() || secondary.gender.trim(),
    bloodType: primary.bloodType.trim() || secondary.bloodType.trim(),
    emergencyContact: primary.emergencyContact.trim() || secondary.emergencyContact.trim(),
    notes: primary.notes.trim() || secondary.notes.trim(),
    allergies: Array.from(allergyMap.values()),
    medications: Array.from(medMap.values()),
  });
}

export const ALLERGEN_CATEGORIES: { id: string; name: Bi; examples: Bi }[] = [
  {
    id: 'penicillin',
    name: { ar: 'عائلة البنسلينات (Penicillins)', en: 'Penicillin Family' },
    examples: { ar: 'أموكسيسيلين، أوجمنتين، إي-موكس، أوسبن، أمبيسيلين', en: 'Amoxicillin, Augmentin, E-Mox, Ospen, Ampicillin' },
  },
  {
    id: 'cephalosporin',
    name: { ar: 'عائلة السيفالوسبورينات (Cephalosporins)', en: 'Cephalosporin Family' },
    examples: { ar: 'سيفالكسين (أوسبكسين)، سيفوروكسيم (زينات)، سيفترياكسون، سوبراكس', en: 'Cephalexin, Cefuroxime (Zinnat), Ceftriaxone, Suprax' },
  },
  {
    id: 'sulfa',
    name: { ar: 'عائلة مركبات السلفا (Sulfonamides)', en: 'Sulfa Drugs (Sulfonamides)' },
    examples: { ar: 'كوتريموكسازول، سبتازول، سوتريم', en: 'Co-trimoxazole, Septazole, Sutrim' },
  },
  {
    id: 'macrolide',
    name: { ar: 'عائلة الماكروليد (Macrolides)', en: 'Macrolide Family' },
    examples: { ar: 'أزيثرومايسين (زيثروماكس/زيثرون)، كلاريثرومايسين (كلاسيد)', en: 'Azithromycin, Clarithromycin (Klacid)' },
  },
  {
    id: 'fluoroquinolone',
    name: { ar: 'عائلة الفلوروكينولون (Fluoroquinolones)', en: 'Fluoroquinolones' },
    examples: { ar: 'سيبروفلوكساسين (سيبروفار)، ليفوفلوكساسين (تافانيك)', en: 'Ciprofloxacin, Levofloxacin (Tavanic)' },
  },
  {
    id: 'tetracycline',
    name: { ar: 'عائلة التتراسيكلين (Tetracyclines)', en: 'Tetracyclines' },
    examples: { ar: 'دوكسيسيكلين (تابوسين، فيبراميسين)', en: 'Doxycycline (Tabocin, Vibramycin)' },
  },
  {
    id: 'nitroimidazole',
    name: { ar: 'ميترونيدازول ومشتقاته (Nitroimidazoles)', en: 'Nitroimidazoles' },
    examples: { ar: 'فلاجيل، أمريزول', en: 'Flagyl, Amrizole' },
  },
  {
    id: 'other',
    name: { ar: 'أدوية أخرى غير مصنفة', en: 'Other Medications' },
    examples: { ar: 'أي دواء أو مادة أخرى', en: 'Other drugs or substances' },
  },
];

export function loadProfile(uid?: string | null): UserHealthProfile {
  if (typeof window === 'undefined') {
    return emptyHealthProfile();
  }
  const effectiveUid = uid !== undefined ? uid : auth?.currentUser?.uid ?? null;
  try {
    const scopedRaw = localStorage.getItem(getProfileStorageKey(effectiveUid));
    if (scopedRaw) {
      return normalizeProfile(JSON.parse(scopedRaw));
    }
    // If signed in and no UID-scoped cache exists yet, check if legacy un-scoped local data exists
    if (effectiveUid && !localStorage.getItem(`${MIGRATED_LEGACY_PREFIX}${effectiveUid}`)) {
      const legacyRaw = localStorage.getItem(STORAGE_KEY);
      if (legacyRaw) {
        return normalizeProfile(JSON.parse(legacyRaw));
      }
    }
    return emptyHealthProfile();
  } catch (err) {
    console.error('Failed to load profile:', err);
    return emptyHealthProfile();
  }
}

export function saveProfile(profile: UserHealthProfile, uid?: string | null): void {
  if (typeof window === 'undefined') return;
  const effectiveUid = uid !== undefined ? uid : auth?.currentUser?.uid ?? null;
  const clean = stripUndefined(normalizeProfile(profile));
  try {
    localStorage.setItem(getProfileStorageKey(effectiveUid), JSON.stringify(clean));
    window.dispatchEvent(new CustomEvent(PROFILE_EVENT, { detail: { uid: effectiveUid, profile: clean } }));
  } catch (err) {
    console.error('Failed to save profile locally:', err);
  }
  if (effectiveUid && configured && db) {
    setDoc(
      doc(db, 'users', effectiveUid),
      {
        healthProfile: clean,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    ).catch((err) => {
      console.error('Failed to sync health profile to Cloud Firestore:', err);
    });
  }
}

/**
 * Reactive hook that synchronizes the user's Health Profile & Allergies across devices
 * via Cloud Firestore (`users/{uid}`) when signed in, while preserving Guest Mode offline storage.
 */
export function useSyncedHealthProfile() {
  const { user, loading: authLoading } = useAuth();
  const uid = user?.uid ?? null;

  const [profile, setProfileState] = useState<UserHealthProfile>(() => loadProfile(uid));
  const [syncing, setSyncing] = useState<boolean>(false);
  const hydratedUidRef = useRef<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    // Guest / Logged-out mode: load from guest localStorage
    if (!uid) {
      hydratedUidRef.current = null;
      setProfileState(loadProfile(null));
      setSyncing(false);
      return;
    }

    // Immediate local cache display while cloud fetch is in flight
    const cachedScopedRaw = localStorage.getItem(getProfileStorageKey(uid));
    const cachedScoped = cachedScopedRaw ? normalizeProfile(JSON.parse(cachedScopedRaw)) : null;
    if (cachedScoped) {
      setProfileState(cachedScoped);
    }

    if (!configured || !db) {
      hydratedUidRef.current = uid;
      setSyncing(false);
      return;
    }

    let cancelled = false;
    setSyncing(true);
    const userDocRef = doc(db, 'users', uid);

    // 1. Initial hydration & non-destructive migration of any pre-existing local/guest profile
    getDoc(userDocRef)
      .then(async (snap) => {
        if (cancelled) return;
        const cloudRaw = snap.exists() ? snap.data()?.healthProfile : undefined;
        const hasCloudProfile = cloudRaw !== undefined && cloudRaw !== null;
        const cloudProfile = hasCloudProfile ? normalizeProfile(cloudRaw) : emptyHealthProfile();

        // Check if there is un-migrated guest/legacy local data on this device
        const migrationKey = `${MIGRATED_LEGACY_PREFIX}${uid}`;
        const alreadyMigrated = localStorage.getItem(migrationKey) === '1';
        let legacyProfile = emptyHealthProfile();
        if (!alreadyMigrated) {
          try {
            const rawLegacy = localStorage.getItem(STORAGE_KEY);
            if (rawLegacy) {
              legacyProfile = normalizeProfile(JSON.parse(rawLegacy));
            }
          } catch {}
        }

        const localCandidate = cachedScoped
          ? isProfileNonEmpty(legacyProfile) && !alreadyMigrated
            ? mergeProfiles(cachedScoped, legacyProfile)
            : cachedScoped
          : legacyProfile;

        let resolved: UserHealthProfile;
        let shouldWriteToCloud = false;

        if (hasCloudProfile) {
          if (!alreadyMigrated && isProfileNonEmpty(localCandidate)) {
            resolved = mergeProfiles(cloudProfile, localCandidate);
            if (JSON.stringify(resolved) !== JSON.stringify(cloudProfile)) {
              shouldWriteToCloud = true;
            }
          } else {
            resolved = cloudProfile;
          }
        } else {
          // No cloud profile exists yet: seed from local candidate or Google account displayName
          resolved = isProfileNonEmpty(localCandidate)
            ? localCandidate
            : normalizeProfile({ displayName: user?.displayName || '' });
          if (isProfileNonEmpty(resolved)) {
            shouldWriteToCloud = true;
          }
        }

        if (!resolved.displayName.trim() && user?.displayName) {
          resolved = { ...resolved, displayName: user.displayName };
        }

        try {
          localStorage.setItem(getProfileStorageKey(uid), JSON.stringify(stripUndefined(resolved)));
          if (!alreadyMigrated && isProfileNonEmpty(legacyProfile)) {
            localStorage.setItem(migrationKey, '1');
            // Clear un-scoped legacy key after migrating to user's UID-scoped storage for shared-device privacy
            localStorage.removeItem(STORAGE_KEY);
          }
        } catch {}

        hydratedUidRef.current = uid;
        setProfileState(resolved);
        setSyncing(false);

        if (shouldWriteToCloud) {
          await setDoc(
            userDocRef,
            {
              healthProfile: stripUndefined(resolved),
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        }
      })
      .catch((err) => {
        console.error('Error hydrating health profile from Firestore:', err);
        if (!cancelled) {
          hydratedUidRef.current = uid;
          setSyncing(false);
        }
      });

    // 2. Real-time cross-device listener
    const unsubscribe = onSnapshot(
      userDocRef,
      (snap) => {
        if (cancelled || hydratedUidRef.current !== uid) return;
        if (snap.exists() && snap.data()?.healthProfile) {
          const remoteProfile = normalizeProfile(snap.data()?.healthProfile);
          try {
            localStorage.setItem(getProfileStorageKey(uid), JSON.stringify(stripUndefined(remoteProfile)));
          } catch {}
          setProfileState((prev) =>
            JSON.stringify(prev) === JSON.stringify(remoteProfile) ? prev : remoteProfile
          );
        }
      },
      (err) => {
        console.warn('Firestore profile listener warning:', err);
      }
    );

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [uid, authLoading, user?.displayName]);

  // Listen for same-tab updates from other components
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.uid === uid && detail.profile) {
        setProfileState((prev) =>
          JSON.stringify(prev) === JSON.stringify(detail.profile) ? prev : detail.profile
        );
      }
    };
    window.addEventListener(PROFILE_EVENT, handler);
    return () => window.removeEventListener(PROFILE_EVENT, handler);
  }, [uid]);

  const updateProfile = useCallback(
    (updater: UserHealthProfile | ((prev: UserHealthProfile) => UserHealthProfile)) => {
      setProfileState((prev) => {
        const nextRaw = typeof updater === 'function' ? updater(prev) : updater;
        const next = stripUndefined(normalizeProfile(nextRaw));
        try {
          localStorage.setItem(getProfileStorageKey(uid), JSON.stringify(next));
          window.dispatchEvent(new CustomEvent(PROFILE_EVENT, { detail: { uid, profile: next } }));
        } catch (err) {
          console.error('Failed to save profile locally:', err);
        }
        if (uid && configured && db) {
          setDoc(
            doc(db, 'users', uid),
            {
              healthProfile: next,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          ).catch((err) => {
            console.error('Failed to save health profile to Firestore:', err);
          });
        }
        return next;
      });
    },
    [uid]
  );

  return { profile, setProfile: updateProfile, syncing, isAuthenticated: Boolean(uid) };
}

export interface DrugProfileCheckResult {
  matchLevel: MatchLevel;
  matchedAllergy?: AllergyRecord;
  title: Bi;
  explanation: Bi;
  clinicalAction: Bi;
  nursingWarning: Bi;
}

// Maps medicine IDs from site catalog to allergen family and bilingual labels
export const DRUG_ALLERGEN_MAP: Record<string, { family: string; ingredients: string[]; nameAr: string; nameEn: string }> = {
  'amoxicillin': { family: 'penicillin', ingredients: ['amoxicillin'], nameAr: 'أموكسيسيلين', nameEn: 'Amoxicillin (E-Mox / Amoxil)' },
  'amoxicillin-clavulanic-acid': { family: 'penicillin', ingredients: ['amoxicillin', 'clavulanic_acid'], nameAr: 'أموكسيسيلين + كلافولانات (أوجمنتين)', nameEn: 'Amoxicillin + Clavulanic Acid (Augmentin / Hibiotic)' },
  'penicillin-v-potassium': { family: 'penicillin', ingredients: ['penicillin_v'], nameAr: 'بنسلين V (أوسبن)', nameEn: 'Penicillin V Potassium (Ospen)' },
  'cephalexin': { family: 'cephalosporin', ingredients: ['cephalexin'], nameAr: 'سيفالكسين (أوسبكسين)', nameEn: 'Cephalexin (Ceporex / Ospexin)' },
  'cefuroxime': { family: 'cephalosporin', ingredients: ['cefuroxime'], nameAr: 'سيفوروكسيم (زينات)', nameEn: 'Cefuroxime (Zinnat)' },
  'ceftriaxone': { family: 'cephalosporin', ingredients: ['ceftriaxone'], nameAr: 'سيفترياكسون', nameEn: 'Ceftriaxone (Rocephin / Epicephin)' },
  'cefixime': { family: 'cephalosporin', ingredients: ['cefixime'], nameAr: 'سيفيكسيم (سوبراكس)', nameEn: 'Cefixime (Suprax / Magnacef)' },
  'co-trimoxazole': { family: 'sulfa', ingredients: ['sulfamethoxazole', 'trimethoprim'], nameAr: 'كوتريموكسازول (سبتازول)', nameEn: 'Co-trimoxazole (Septazole / Sutrim)' },
  'azithromycin': { family: 'macrolide', ingredients: ['azithromycin'], nameAr: 'أزيثرومايسين (زيثروماكس)', nameEn: 'Azithromycin (Zithromax / Xithrone)' },
  'clarithromycin': { family: 'macrolide', ingredients: ['clarithromycin'], nameAr: 'كلاريثرومايسين (كلاسيد)', nameEn: 'Clarithromycin (Klacid)' },
  'ciprofloxacin': { family: 'fluoroquinolone', ingredients: ['ciprofloxacin'], nameAr: 'سيبروفلوكساسين (سيبروفار)', nameEn: 'Ciprofloxacin (Ciprofar / Ciprobay)' },
  'levofloxacin': { family: 'fluoroquinolone', ingredients: ['levofloxacin'], nameAr: 'ليفوفلوكساسين (تافانيك)', nameEn: 'Levofloxacin (Tavanic / Levoxin)' },
  'doxycycline': { family: 'tetracycline', ingredients: ['doxycycline'], nameAr: 'دوكسيسيكلين (تابوسين)', nameEn: 'Doxycycline (Vibramycin / Tabocin)' },
  'metronidazole': { family: 'nitroimidazole', ingredients: ['metronidazole'], nameAr: 'ميترونيدازول (فلاجيل)', nameEn: 'Metronidazole (Flagyl / Amrizole)' },
  'nitrofurantoin': { family: 'nitrofuran', ingredients: ['nitrofurantoin'], nameAr: 'نيتروفورانتوين (ماكروفيوران)', nameEn: 'Nitrofurantoin (Macrofuran / Uvamin)' },
  'clindamycin': { family: 'lincosamide', ingredients: ['clindamycin'], nameAr: 'كليندامايسين (دالاسين)', nameEn: 'Clindamycin (Dalacin C)' },
  'cefotaxime': { family: 'cephalosporin', ingredients: ['cefotaxime'], nameAr: 'سيفوتاكسيم (سيفوتاكس)', nameEn: 'Cefotaxime (Cefotax / Claforan)' },
  'flucloxacillin': { family: 'penicillin', ingredients: ['flucloxacillin'], nameAr: 'فلوكلوكساسيللين (فلوكسامو)', nameEn: 'Flucloxacillin (Floxamo / Flucil)' },
  'amikacin': { family: 'aminoglycoside', ingredients: ['amikacin'], nameAr: 'أميكاسين (أميكين)', nameEn: 'Amikacin (Amikin)' },
  'gentamicin': { family: 'aminoglycoside', ingredients: ['gentamicin'], nameAr: 'جنتامايسين (جاراميسين)', nameEn: 'Gentamicin (Garamycin)' },
  'moxifloxacin': { family: 'fluoroquinolone', ingredients: ['moxifloxacin'], nameAr: 'موكسيفلوكساسين (أفيلوكس)', nameEn: 'Moxifloxacin (Avelox)' },
  'cefoperazone-sulbactam': { family: 'cephalosporin', ingredients: ['cefoperazone', 'sulbactam'], nameAr: 'سيفوبيرازون + سولباكتام (سيلبيرازون)', nameEn: 'Cefoperazone + Sulbactam (Sulperazon)' },
  'linezolid': { family: 'oxazolidinone', ingredients: ['linezolid'], nameAr: 'لينيزوليد (أفيروزوليد)', nameEn: 'Linezolid (Zyvox / Averozolid)' },
  'vancomycin': { family: 'glycopeptide', ingredients: ['vancomycin'], nameAr: 'فانكومايسين (فانكوسين)', nameEn: 'Vancomycin (Vancocin / Vancomix)' },
  'meropenem': { family: 'carbapenem', ingredients: ['meropenem'], nameAr: 'ميروبينيم (ميرونيم)', nameEn: 'Meropenem (Meronem)' },
  'cefepime': { family: 'cephalosporin', ingredients: ['cefepime'], nameAr: 'سيفيبيم (ماكسيبيم)', nameEn: 'Cefepime (Maxipime)' },
  'cefdinir': { family: 'cephalosporin', ingredients: ['cefdinir'], nameAr: 'سيفدينير (أومنيسيف / دينار)', nameEn: 'Cefdinir (Omnicef / Dinar)' },
  'cefadroxil': { family: 'cephalosporin', ingredients: ['cefadroxil'], nameAr: 'سيفادروكسيل (ديوريسيف / بيودروكسيل)', nameEn: 'Cefadroxil (Duricef / Biodroxil)' },
  'ampicillin-sulbactam': { family: 'penicillin', ingredients: ['ampicillin', 'sulbactam'], nameAr: 'أمبيسيلين + سولباكتام (يوناسين)', nameEn: 'Ampicillin + Sulbactam (Unasyn)' },
  'erythromycin': { family: 'macrolide', ingredients: ['erythromycin'], nameAr: 'إريثرومايسين (إريثروسين)', nameEn: 'Erythromycin (Erythrocin)' },
  'fusidic-acid': { family: 'fusidane', ingredients: ['fusidic_acid'], nameAr: 'حمض الفيوسيديك (فيوسيدين)', nameEn: 'Fusidic Acid (Fucidin)' },
  'rifaximin': { family: 'rifamycin', ingredients: ['rifaximin'], nameAr: 'ريفاكسيمين (تراسيد / جاستروبيوتك)', nameEn: 'Rifaximin (Trcid / Gastrobiotic)' },
};

/** Evaluates allergy match level and bidirectional beta-lactam cross-reactivity for a selected drug */
export function checkDrugAllergySafety(
  drugId: string,
  userAllergies: AllergyRecord[]
): DrugProfileCheckResult {
  const drugInfo = DRUG_ALLERGEN_MAP[drugId.toLowerCase().trim()];
  if (!drugInfo) {
    return {
      matchLevel: 'unverified',
      title: { ar: 'معلومات غير مكتملة عن الدواء', en: 'Inconclusive Drug Information' },
      explanation: {
        ar: 'لم نتمكن من مطابقة المادة الفعالة لهذا الدواء في قاعدة البيانات بدقة؛ لا يمكن تأكيد أمان الدواء.',
        en: 'Unable to conclusively resolve the active ingredient against the database.',
      },
      clinicalAction: {
        ar: 'استشر الصيدلي أو الطبيب وأبلغه بتاريخ حساسيتك الدوائية قبل تناول هذا الدواء.',
        en: 'Consult a pharmacist or physician before taking this medication.',
      },
      nursingWarning: {
        ar: 'تحذير تمريضي: فحص الاسم العلمي المطبوع على علبة الدواء يدوياً قبل الإعطاء.',
        en: 'Nursing Note: Manually inspect active ingredient on drug package.',
      },
    };
  }

  // 1. Check Exact Match (Same active ingredient or exact family match)
  const exactMatch = userAllergies.find(
    (a) =>
      a.allergenKey === drugInfo.family ||
      drugInfo.ingredients.some((ing) => a.drugName.toLowerCase().includes(ing)) ||
      a.drugName.toLowerCase().includes(drugId.toLowerCase()),
  );

  if (exactMatch) {
    return {
      matchLevel: 'exact_match',
      matchedAllergy: exactMatch,
      title: { ar: 'خطر حاد! تطابق تام في مادة الحساسية المسجلة', en: 'Severe Warning: Exact Active Ingredient / Family Match' },
      explanation: {
        ar: `هذا الدواء ينتمي إلى «${exactMatch.drugName}» أو يحتوي على نفس المادة الفعالة التي سجلت لديك حساسية مسبقة منها (الأعراض المسجلة: ${exactMatch.reportedSymptoms || 'حساسية مفرطة'}). تناول هذا الدواء قد يحفز صدمة تحسسية حادة.`,
        en: `This drug contains active ingredients from the same family as your recorded allergy (${exactMatch.drugName}). Ingestion risks severe anaphylaxis.`,
      },
      clinicalAction: {
        ar: 'ممنوع تناول هذا الدواء! أبلغ طبيبك المعالج بوجود حساسية مسجلة لاستبداله بمضاد من عائلة كيميائية مختلفة تماماً.',
        en: 'Do NOT take this medication! Notify your doctor to switch to a safe alternative class.',
      },
      nursingWarning: {
        ar: 'تنبيه تمريضي حرج: وضع شريط تنبيه أحمر في ملف المريض وتجنب إعطاء الدواء، والتأكد من توفر حقن الإبينفرين (الأدرينالين).',
        en: 'Critical Nursing Alert: Red allergy band required; withhold dose and ensure epinephrine availability.',
      },
    };
  }

  // 2. Check Bidirectional Beta-Lactam Cross-Reactivity (Penicillins ↔ Cephalosporins ↔ Carbapenems)
  const betaLactamAllergy = userAllergies.find(
    (a) => a.allergenKey === 'penicillin' || a.allergenKey === 'cephalosporin'
  );
  const isBetaLactamDrug =
    drugInfo.family === 'penicillin' ||
    drugInfo.family === 'cephalosporin' ||
    drugInfo.family === 'carbapenem';

  if (betaLactamAllergy && isBetaLactamDrug) {
    return {
      matchLevel: 'cross_reactivity',
      matchedAllergy: betaLactamAllergy,
      title: { ar: 'تحذير سريري: احتمالية حساسية متصالبة (Cross-Reactivity)', en: 'Clinical Concern: Potential Cross-Reactivity' },
      explanation: {
        ar: `لديك حساسية مسجلة من «${betaLactamAllergy.drugName}»، وهذا الدواء ينتمي لمضادات بيتا-لاكتام (${drugInfo.nameAr}). توجد نسبة حساسية متصالبة سريرية (نحو 1% إلى 5%) بسبب التشابه في حلقة بيتا-لاكتام الكيميائية، خاصة إذا كانت حساسيتك السابقة شديدة.`,
        en: `You have a documented beta-lactam allergy (${betaLactamAllergy.drugName}), and ${drugInfo.nameEn} shares a beta-lactam ring structure with a documented 1–5% cross-reactivity risk.`,
      },
      clinicalAction: {
        ar: 'يلزم تقييم طبي دقيق قبل التناول! قد ينصح الطبيب بإجراء اختبار حساسية جلدي، أو اختيار مضاد آمن من خارج عائلة بيتا-لاكتام (كالماكروليد).',
        en: 'Requires medical assessment prior to use. Skin testing or alternative non-beta-lactam class may be advised.',
      },
      nursingWarning: {
        ar: 'تقييم تمريضي سريري: التحقق من شدة الحساسية السابقة لبيتا-لاكتام (هل كانت طفحاً خفيفاً أم صعوبة تنفس؟) ومراقبة المريض 30 دقيقة بعد أول جرعة.',
        en: 'Nursing Assessment: Differentiate mild cutaneous rash vs true IgE-mediated anaphylaxis history.',
      },
    };
  }

  // 3. No match found in available recorded data
  return {
    matchLevel: 'no_match',
    title: { ar: 'لم يُعثر على تطابق مع سجلات الحساسية المسجلة', en: 'No Match Found with Documented Allergies' },
    explanation: {
      ar: `هذا الدواء لا يتطابق مع أي من الأدوية أو العائلات المسجلة في سجل حساسيتك الحالي.`,
      en: `This medication does not match any drug family currently documented in your profile.`,
    },
    clinicalAction: {
      ar: 'يمكن تناوله وفق الوصفة الطبية المعتمدة. احرص دائماً على إبلاغ الطبيب والصيدلي بأي أعراض جديدة تظهر لأول مرة.',
      en: 'Take as prescribed. Always report any unexpected symptoms to your healthcare provider.',
    },
    nursingWarning: {
      ar: 'تنبيه تمريضي: عدم وجود تطابق مسجل لا يضمن عدم حدوث حساسية جديدة لأول مرة؛ راقب علامات التحسس المبكرة.',
      en: 'Nursing Note: Absence of recorded allergy does not guarantee immunity from de novo reactions.',
    },
  };
}
