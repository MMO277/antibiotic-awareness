import { useEffect, useState, useCallback, useRef } from 'react';
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, configured } from './firebase';
import { useAuth } from './authContext';
import { Bi } from './types';
import { ACTIVE_INGREDIENTS, EGYPTIAN_COMMERCIAL_PRODUCTS } from './egyptianDrugDatabase';
import { norm } from './search';

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

export type PregnancyLactationStatus = 'none' | 'pregnant' | 'breastfeeding' | 'unknown';
export type OrganFunctionStatus = 'normal' | 'impaired' | 'unknown';

export interface UserHealthProfile {
  displayName: string;
  age: string;
  gender: string;
  bloodType: string;
  emergencyContact: string;
  notes: string;
  allergies: AllergyRecord[];
  medications: MedicationRecord[];
  pregnancyStatus?: PregnancyLactationStatus;
  renalStatus?: OrganFunctionStatus;
  hepaticStatus?: OrganFunctionStatus;
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
    pregnancyStatus: 'unknown',
    renalStatus: 'unknown',
    hepaticStatus: 'unknown',
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
  const pregnancyStatus: PregnancyLactationStatus = ['none', 'pregnant', 'breastfeeding', 'unknown'].includes(
    raw.pregnancyStatus
  )
    ? raw.pregnancyStatus
    : 'unknown';
  const renalStatus: OrganFunctionStatus = ['normal', 'impaired', 'unknown'].includes(raw.renalStatus)
    ? raw.renalStatus
    : 'unknown';
  const hepaticStatus: OrganFunctionStatus = ['normal', 'impaired', 'unknown'].includes(raw.hepaticStatus)
    ? raw.hepaticStatus
    : 'unknown';

  return {
    displayName: typeof raw.displayName === 'string' ? raw.displayName : '',
    age: typeof raw.age === 'string' ? raw.age : typeof raw.age === 'number' ? String(raw.age) : '',
    gender: typeof raw.gender === 'string' ? raw.gender : '',
    bloodType: typeof raw.bloodType === 'string' ? raw.bloodType : '',
    emergencyContact: typeof raw.emergencyContact === 'string' ? raw.emergencyContact : '',
    notes: typeof raw.notes === 'string' ? raw.notes : '',
    pregnancyStatus,
    renalStatus,
    hepaticStatus,
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
      p.medications.length > 0 ||
      (p.pregnancyStatus && p.pregnancyStatus !== 'unknown') ||
      (p.renalStatus && p.renalStatus !== 'unknown') ||
      (p.hepaticStatus && p.hepaticStatus !== 'unknown')
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
    pregnancyStatus:
      primary.pregnancyStatus && primary.pregnancyStatus !== 'unknown'
        ? primary.pregnancyStatus
        : secondary.pregnancyStatus || 'unknown',
    renalStatus:
      primary.renalStatus && primary.renalStatus !== 'unknown'
        ? primary.renalStatus
        : secondary.renalStatus || 'unknown',
    hepaticStatus:
      primary.hepaticStatus && primary.hepaticStatus !== 'unknown'
        ? primary.hepaticStatus
        : secondary.hepaticStatus || 'unknown',
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
    id: 'carbapenem',
    name: { ar: 'عائلة الكاربابينيم (Carbapenems)', en: 'Carbapenem Family' },
    examples: { ar: 'ميروبينيم (ميرونيم)', en: 'Meropenem (Meronem)' },
  },
  {
    id: 'lincosamide',
    name: { ar: 'عائلة اللينكوساميد (Lincosamides)', en: 'Lincosamide Family' },
    examples: { ar: 'كليندامايسين (دالاسين سي)', en: 'Clindamycin (Dalacin C)' },
  },
  {
    id: 'aminoglycoside',
    name: { ar: 'عائلة الأمينوجليكوزيد (Aminoglycosides)', en: 'Aminoglycoside Family' },
    examples: { ar: 'جنتامايسين (جاراميسين)، أميكاسين (أميكين)', en: 'Gentamicin (Garamycin), Amikacin (Amikin)' },
  },
  {
    id: 'glycopeptide',
    name: { ar: 'عائلة الجليكوببتيد (Glycopeptides)', en: 'Glycopeptide Family' },
    examples: { ar: 'فانكومايسين (فانكوسين)', en: 'Vancomycin (Vancocin)' },
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
  matchedIngredient?: string;
  resolvedDrugId?: string;
  title: Bi;
  explanation: Bi;
  clinicalAction: Bi;
  nursingWarning: Bi;
}

// Maps medicine IDs from site catalog to allergen family and bilingual labels
export const DRUG_ALLERGEN_MAP: Record<
  string,
  { family: string; ingredients: string[]; ingredientsAr: string[]; nameAr: string; nameEn: string }
> = {
  amoxicillin: {
    family: 'penicillin',
    ingredients: ['amoxicillin'],
    ingredientsAr: ['أموكسيسيلين', 'اموكسيسيلين'],
    nameAr: 'أموكسيسيلين',
    nameEn: 'Amoxicillin (E-Mox / Amoxil)',
  },
  'amoxicillin-clavulanic-acid': {
    family: 'penicillin',
    ingredients: ['amoxicillin', 'clavulanic_acid', 'clavulanic acid', 'clavulanate'],
    ingredientsAr: ['أموكسيسيلين', 'اموكسيسيلين', 'كلافولانيك', 'كلافولانات'],
    nameAr: 'أموكسيسيلين + كلافولانات (أوجمنتين)',
    nameEn: 'Amoxicillin + Clavulanic Acid (Augmentin / Hibiotic)',
  },
  'penicillin-v-potassium': {
    family: 'penicillin',
    ingredients: ['penicillin_v', 'phenoxymethylpenicillin', 'penicillin'],
    ingredientsAr: ['بنسلين', 'فينوكسي ميثيل بنسلين'],
    nameAr: 'بنسلين V (أوسبن)',
    nameEn: 'Penicillin V Potassium (Ospen)',
  },
  cephalexin: {
    family: 'cephalosporin',
    ingredients: ['cephalexin'],
    ingredientsAr: ['سيفالكسين'],
    nameAr: 'سيفالكسين (أوسبكسين)',
    nameEn: 'Cephalexin (Ceporex / Ospexin)',
  },
  cefuroxime: {
    family: 'cephalosporin',
    ingredients: ['cefuroxime'],
    ingredientsAr: ['سيفوروكسيم'],
    nameAr: 'سيفوروكسيم (زينات)',
    nameEn: 'Cefuroxime (Zinnat)',
  },
  ceftriaxone: {
    family: 'cephalosporin',
    ingredients: ['ceftriaxone'],
    ingredientsAr: ['سيفترياكسون'],
    nameAr: 'سيفترياكسون',
    nameEn: 'Ceftriaxone (Rocephin / Epicephin)',
  },
  cefixime: {
    family: 'cephalosporin',
    ingredients: ['cefixime'],
    ingredientsAr: ['سيفيكسيم'],
    nameAr: 'سيفيكسيم (سوبراكس)',
    nameEn: 'Cefixime (Suprax / Magnacef)',
  },
  'co-trimoxazole': {
    family: 'sulfa',
    ingredients: ['sulfamethoxazole', 'trimethoprim', 'co-trimoxazole', 'cotrimoxazole'],
    ingredientsAr: ['سلفاميثوكسازول', 'تريميثوبريم', 'كوتريموكسازول', 'سلفا'],
    nameAr: 'كوتريموكسازول (سبتازول)',
    nameEn: 'Co-trimoxazole (Septazole / Sutrim)',
  },
  azithromycin: {
    family: 'macrolide',
    ingredients: ['azithromycin'],
    ingredientsAr: ['أزيثرومايسين', 'ازيثرومايسين'],
    nameAr: 'أزيثرومايسين (زيثروماكس)',
    nameEn: 'Azithromycin (Zithromax / Xithrone)',
  },
  clarithromycin: {
    family: 'macrolide',
    ingredients: ['clarithromycin'],
    ingredientsAr: ['كلاريثرومايسين'],
    nameAr: 'كلاريثرومايسين (كلاسيد)',
    nameEn: 'Clarithromycin (Klacid)',
  },
  ciprofloxacin: {
    family: 'fluoroquinolone',
    ingredients: ['ciprofloxacin'],
    ingredientsAr: ['سيبروفلوكساسين'],
    nameAr: 'سيبروفلوكساسين (سيبروفار)',
    nameEn: 'Ciprofloxacin (Ciprofar / Ciprobay)',
  },
  levofloxacin: {
    family: 'fluoroquinolone',
    ingredients: ['levofloxacin'],
    ingredientsAr: ['ليفوفلوكساسين'],
    nameAr: 'ليفوفلوكساسين (تافانيك)',
    nameEn: 'Levofloxacin (Tavanic / Levoxin)',
  },
  doxycycline: {
    family: 'tetracycline',
    ingredients: ['doxycycline'],
    ingredientsAr: ['دوكسيسيكلين'],
    nameAr: 'دوكسيسيكلين (تابوسين)',
    nameEn: 'Doxycycline (Vibramycin / Tabocin)',
  },
  metronidazole: {
    family: 'nitroimidazole',
    ingredients: ['metronidazole'],
    ingredientsAr: ['ميترونيدازول'],
    nameAr: 'ميترونيدازول (فلاجيل)',
    nameEn: 'Metronidazole (Flagyl / Amrizole)',
  },
  nitrofurantoin: {
    family: 'nitrofuran',
    ingredients: ['nitrofurantoin'],
    ingredientsAr: ['نيتروفورانتوين'],
    nameAr: 'نيتروفورانتوين (ماكروفيوران)',
    nameEn: 'Nitrofurantoin (Macrofuran / Uvamin)',
  },
  clindamycin: {
    family: 'lincosamide',
    ingredients: ['clindamycin'],
    ingredientsAr: ['كليندامايسين'],
    nameAr: 'كليندامايسين (دالاسين)',
    nameEn: 'Clindamycin (Dalacin C)',
  },
  cefotaxime: {
    family: 'cephalosporin',
    ingredients: ['cefotaxime'],
    ingredientsAr: ['سيفوتاكسيم'],
    nameAr: 'سيفوتاكسيم (سيفوتاكس)',
    nameEn: 'Cefotaxime (Cefotax / Claforan)',
  },
  flucloxacillin: {
    family: 'penicillin',
    ingredients: ['flucloxacillin'],
    ingredientsAr: ['فلوكلوكساسيللين'],
    nameAr: 'فلوكلوكساسيللين (فلوكسامو)',
    nameEn: 'Flucloxacillin (Floxamo / Flucil)',
  },
  amikacin: {
    family: 'aminoglycoside',
    ingredients: ['amikacin'],
    ingredientsAr: ['أميكاسين', 'اميكاسين'],
    nameAr: 'أميكاسين (أميكين)',
    nameEn: 'Amikacin (Amikin)',
  },
  gentamicin: {
    family: 'aminoglycoside',
    ingredients: ['gentamicin'],
    ingredientsAr: ['جنتامايسين'],
    nameAr: 'جنتامايسين (جاراميسين)',
    nameEn: 'Gentamicin (Garamycin)',
  },
  moxifloxacin: {
    family: 'fluoroquinolone',
    ingredients: ['moxifloxacin'],
    ingredientsAr: ['موكسيفلوكساسين'],
    nameAr: 'موكسيفلوكساسين (أفيلوكس)',
    nameEn: 'Moxifloxacin (Avelox)',
  },
  'cefoperazone-sulbactam': {
    family: 'cephalosporin',
    ingredients: ['cefoperazone', 'sulbactam'],
    ingredientsAr: ['سيفوبيرازون', 'سولباكتام'],
    nameAr: 'سيفوبيرازون + سولباكتام (سيلبيرازون)',
    nameEn: 'Cefoperazone + Sulbactam (Sulperazon)',
  },
  linezolid: {
    family: 'oxazolidinone',
    ingredients: ['linezolid'],
    ingredientsAr: ['لينيزوليد'],
    nameAr: 'لينيزوليد (أفيروزوليد)',
    nameEn: 'Linezolid (Zyvox / Averozolid)',
  },
  vancomycin: {
    family: 'glycopeptide',
    ingredients: ['vancomycin'],
    ingredientsAr: ['فانكومايسين'],
    nameAr: 'فانكومايسين (فانكوسين)',
    nameEn: 'Vancomycin (Vancocin / Vancomix)',
  },
  meropenem: {
    family: 'carbapenem',
    ingredients: ['meropenem'],
    ingredientsAr: ['ميروبينيم'],
    nameAr: 'ميروبينيم (ميرونيم)',
    nameEn: 'Meropenem (Meronem)',
  },
  cefepime: {
    family: 'cephalosporin',
    ingredients: ['cefepime'],
    ingredientsAr: ['سيفيبيم'],
    nameAr: 'سيفيبيم (ماكسيبيم)',
    nameEn: 'Cefepime (Maxipime)',
  },
  cefdinir: {
    family: 'cephalosporin',
    ingredients: ['cefdinir'],
    ingredientsAr: ['سيفدينير'],
    nameAr: 'سيفدينير (أومنيسيف / دينار)',
    nameEn: 'Cefdinir (Omnicef / Dinar)',
  },
  cefadroxil: {
    family: 'cephalosporin',
    ingredients: ['cefadroxil'],
    ingredientsAr: ['سيفادروكسيل'],
    nameAr: 'سيفادروكسيل (ديوريسيف / بيودروكسيل)',
    nameEn: 'Cefadroxil (Duricef / Biodroxil)',
  },
  'ampicillin-sulbactam': {
    family: 'penicillin',
    ingredients: ['ampicillin', 'sulbactam'],
    ingredientsAr: ['أمبيسيلين', 'امبيسيلين', 'سولباكتام'],
    nameAr: 'أمبيسيلين + سولباكتام (يوناسين)',
    nameEn: 'Ampicillin + Sulbactam (Unasyn)',
  },
  erythromycin: {
    family: 'macrolide',
    ingredients: ['erythromycin'],
    ingredientsAr: ['إريثرومايسين', 'اريثرومايسين'],
    nameAr: 'إريثرومايسين (إريثروسين)',
    nameEn: 'Erythromycin (Erythrocin)',
  },
  'fusidic-acid': {
    family: 'fusidane',
    ingredients: ['fusidic_acid', 'fusidic acid'],
    ingredientsAr: ['فيوسيديك', 'حمض الفيوسيديك'],
    nameAr: 'حمض الفيوسيديك (فيوسيدين)',
    nameEn: 'Fusidic Acid (Fucidin)',
  },
  rifaximin: {
    family: 'rifamycin',
    ingredients: ['rifaximin'],
    ingredientsAr: ['ريفاكسيمين'],
    nameAr: 'ريفاكسيمين (تراسيد / جاستروبيوتك)',
    nameEn: 'Rifaximin (Trcid / Gastrobiotic)',
  },
};

/**
 * Deterministically resolves a drug ID, commercial productId, barcode, or verified Arabic/English trade name
 * to a canonical activeIngredientId without unsafe fuzzy guessing.
 */
export function resolveCanonicalAllergenDrugId(input: string): string | null {
  const raw = (input || '').trim();
  if (!raw) return null;
  const cleanLower = raw.toLowerCase();

  // 1. Direct activeIngredientId match
  if (DRUG_ALLERGEN_MAP[cleanLower]) return cleanLower;
  if (cleanLower === 'sulfamethoxazole-trimethoprim') return 'co-trimoxazole';

  // 2. Commercial productId or barcode match
  const byProdOrBc = EGYPTIAN_COMMERCIAL_PRODUCTS.find(
    (p) => p.productId.toLowerCase() === cleanLower || (p.barcode && p.barcode === cleanLower)
  );
  if (byProdOrBc) return byProdOrBc.activeIngredientId;

  // 3. Normalized generic or brand name match (only when unambiguous to a single activeIngredientId)
  const normQuery = norm(raw);
  if (!normQuery || normQuery.length < 3) return null;

  const matchedIngredientIds = new Set<string>();

  for (const ing of ACTIVE_INGREDIENTS) {
    const nAr = norm(ing.nameAr);
    const nEn = norm(ing.nameEn);
    if (normQuery === nAr || normQuery === nEn) {
      return ing.id;
    }
  }

  for (const p of EGYPTIAN_COMMERCIAL_PRODUCTS) {
    const tAr = norm(p.tradeNameAr);
    const tEn = norm(p.tradeNameEn);
    const brandWordAr = tAr.split(/\s+/)[0] || '';
    const brandWordEn = tEn.split(/\s+/)[0] || '';

    if (
      normQuery === tAr ||
      normQuery === tEn ||
      (brandWordEn.length >= 4 && (normQuery === brandWordEn || normQuery.startsWith(brandWordEn + ' '))) ||
      (brandWordAr.length >= 3 && (normQuery === brandWordAr || normQuery.startsWith(brandWordAr + ' ')))
    ) {
      matchedIngredientIds.add(p.activeIngredientId);
    }
  }

  if (matchedIngredientIds.size === 1) {
    return Array.from(matchedIngredientIds)[0];
  }

  return null;
}

/** Evaluates allergy match level and bidirectional beta-lactam cross-reactivity for a selected drug */
export function checkDrugAllergySafety(
  drugIdOrName: string,
  userAllergies: AllergyRecord[]
): DrugProfileCheckResult {
  const resolvedId = resolveCanonicalAllergenDrugId(drugIdOrName);
  const drugInfo = resolvedId ? DRUG_ALLERGEN_MAP[resolvedId] : undefined;

  if (!drugInfo || !resolvedId) {
    return {
      matchLevel: 'unverified',
      title: { ar: 'معلومات غير مكتملة عن الدواء — تعذر التحقق من الحساسية', en: 'Inconclusive Drug Identity — Unable to Verify Allergy Safety' },
      explanation: {
        ar: 'لم نتمكن من مطابقة المادة الفعالة لهذا الدواء في قاعدة البيانات الموثقة بدقة؛ لذلك لا يمكن تأكيد خلوه من مسببات الحساسية المسجلة لديك.',
        en: 'Unable to conclusively resolve the active ingredient of this medication against the verified database; allergy safety cannot be confirmed.',
      },
      clinicalAction: {
        ar: 'لا تتناول هذا الدواء قبل مراجعة الصيدلي أو الطبيب وفحص الاسم العلمي المطبوع على العبوة ومقارنته بسجل حساسيتك.',
        en: 'Do not take this medication until a pharmacist or physician verifies its active ingredients against your allergy record.',
      },
      nursingWarning: {
        ar: 'تحذير تمريضي: فحص الاسم العلمي المطبوع على علبة الدواء يدوياً قبل الإعطاء وعدم الاعتماد على تشابه الأسماء التجارية.',
        en: 'Nursing Note: Manually inspect active ingredients on the drug package prior to administration.',
      },
    };
  }

  // 1. Check Exact Match (Same allergen family, same active ingredient, or shared chemical component in combination product)
  let matchedComponentName = '';
  const exactMatch = userAllergies.find((a) => {
    if (a.allergenKey === drugInfo.family) {
      matchedComponentName = drugInfo.nameEn;
      return true;
    }
    const resolvedAllergyDrugId = resolveCanonicalAllergenDrugId(a.drugName);
    if (resolvedAllergyDrugId) {
      if (resolvedAllergyDrugId === resolvedId) {
        matchedComponentName = drugInfo.nameEn;
        return true;
      }
      const allergyDrugInfo = DRUG_ALLERGEN_MAP[resolvedAllergyDrugId];
      if (allergyDrugInfo) {
        if (allergyDrugInfo.family === drugInfo.family) {
          matchedComponentName = drugInfo.nameEn;
          return true;
        }
        const sharedComp = drugInfo.ingredients.find((ing) =>
          allergyDrugInfo.ingredients.includes(ing)
        );
        if (sharedComp) {
          matchedComponentName = sharedComp;
          return true;
        }
      }
    }

    const normAllergyName = norm(a.drugName);
    if (!normAllergyName) return false;

    const ingEnHit = drugInfo.ingredients.find((ing) =>
      normAllergyName.includes(norm(ing.replace(/_/g, ' ')))
    );
    if (ingEnHit) {
      matchedComponentName = ingEnHit;
      return true;
    }
    const ingArHit = drugInfo.ingredientsAr.find((ingAr) =>
      normAllergyName.includes(norm(ingAr))
    );
    if (ingArHit) {
      matchedComponentName = ingArHit;
      return true;
    }

    return normAllergyName.includes(norm(resolvedId));
  });

  if (exactMatch) {
    return {
      matchLevel: 'exact_match',
      matchedAllergy: exactMatch,
      matchedIngredient: matchedComponentName || drugInfo.nameEn,
      resolvedDrugId: resolvedId,
      title: {
        ar: 'خطر حاد! تطابق مباشر مع سجل الحساسية الدوائية',
        en: 'Severe Warning: Direct Active Ingredient / Family Allergy Match',
      },
      explanation: {
        ar: `هذا الدواء (${drugInfo.nameAr}) ينتمي لنفس العائلة الدوائية أو يشترك في المادة الفعالة مع حساسيتك المسجلة تجاه «${exactMatch.drugName}» (الأعراض المسجلة: ${exactMatch.reportedSymptoms || 'تفاعل تحسسي'}). تناول هذا الدواء قد يحفز تفاعلاً تحسسياً خطيراً أو صدمة تحسسية.`,
        en: `This medication (${drugInfo.nameEn}) matches the active ingredient or chemical family of your documented allergy to "${exactMatch.drugName}" (${exactMatch.reportedSymptoms || 'allergic reaction'}). Ingestion carries a high risk of severe allergic reaction or anaphylaxis.`,
      },
      clinicalAction: {
        ar: 'تجنب تناول هذا الدواء! راجع الطبيب المعالج أو الصيدلي فوراً لإبلاغه بسجل حساسيتك وتحديد بديل آمن من عائلة كيميائية مختلفة تماماً.',
        en: 'Do NOT take this medication! Consult your prescribing physician or pharmacist immediately for a safe alternative from a non-cross-reactive class.',
      },
      nursingWarning: {
        ar: 'تنبيه تمريضي حرج: وضع شريط تنبيه الحساسية الأحمر في ملف المريض، إيقاف إعطاء الجرعة، والتأكد من جاهزية بروتوكول الطوارئ (الإبينفرين).',
        en: 'Critical Nursing Alert: Apply red allergy wristband, withhold dose, notify prescriber, and ensure emergency epinephrine readiness.',
      },
    };
  }

  // 2. Check Bidirectional Beta-Lactam Cross-Reactivity (Penicillins ↔ Cephalosporins ↔ Carbapenems)
  const betaLactamFamilies = new Set(['penicillin', 'cephalosporin', 'carbapenem']);
  const isBetaLactamDrug = betaLactamFamilies.has(drugInfo.family);

  const betaLactamAllergy = userAllergies.find((a) => {
    if (betaLactamFamilies.has(a.allergenKey)) return true;
    const resolvedAllergyId = resolveCanonicalAllergenDrugId(a.drugName);
    if (resolvedAllergyId && DRUG_ALLERGEN_MAP[resolvedAllergyId]) {
      return betaLactamFamilies.has(DRUG_ALLERGEN_MAP[resolvedAllergyId].family);
    }
    return false;
  });

  if (betaLactamAllergy && isBetaLactamDrug) {
    return {
      matchLevel: 'cross_reactivity',
      matchedAllergy: betaLactamAllergy,
      matchedIngredient: drugInfo.nameEn,
      resolvedDrugId: resolvedId,
      title: {
        ar: 'تحذير سريري: احتمالية حساسية متصالبة (Beta-Lactam Cross-Reactivity)',
        en: 'Clinical Concern: Potential Beta-Lactam Cross-Reactivity',
      },
      explanation: {
        ar: `لديك حساسية مسجلة من «${betaLactamAllergy.drugName}»، وهذا الدواء (${drugInfo.nameAr}) ينتمي لمضادات بيتا-لاكتام. توجد احتمالية حساسية متصالبة موثقة سريرياً بسبب التشابه في حلقة بيتا-لاكتام الكيميائية أو السلاسل الجانبية، وتزداد الخطورة إذا كانت حساسيتك السابقة شديدة أو فورية.`,
        en: `You have a documented beta-lactam allergy ("${betaLactamAllergy.drugName}"), and ${drugInfo.nameEn} shares a beta-lactam ring structure with a documented clinical cross-reactivity risk, particularly if the prior reaction was severe or IgE-mediated.`,
      },
      clinicalAction: {
        ar: 'يلزم تقييم طبي أو صيدلاني دقيق قبل تناول هذا الدواء! لا تتناوله دون مراجعة الطبيب لتحديد مدى الأمان أو اختيار عائلة بديلة.',
        en: 'Requires physician or pharmacist evaluation prior to use! Do not start this medication without clinical verification.',
      },
      nursingWarning: {
        ar: 'تقييم تمريضي سريري: التحقق من طبيعة وشدة تفاعل بيتا-لاكتام السابق (طفح جلدي متأخر مقابل صدمة تحسسية فورية) ومراقبة المريض عن كثب.',
        en: 'Nursing Assessment: Verify prior beta-lactam reaction severity (delayed rash vs immediate IgE-mediated anaphylaxis) before administration.',
      },
    };
  }

  // 3. Check if user has an unclassified ("other") allergy whose ingredient relationship cannot be verified
  const unmappedOtherAllergy = userAllergies.find(
    (a) => a.allergenKey === 'other' && !resolveCanonicalAllergenDrugId(a.drugName)
  );
  if (unmappedOtherAllergy) {
    return {
      matchLevel: 'unverified',
      matchedAllergy: unmappedOtherAllergy,
      resolvedDrugId: resolvedId,
      title: {
        ar: 'يتطلب التحقق: يوجد سجل حساسية غير مصنف في ملفك',
        en: 'Verification Required: Unclassified Allergy Record in Profile',
      },
      explanation: {
        ar: `لم يُعثر على تطابق مباشر بين (${drugInfo.nameAr}) والحساسيات المصنفة، ولكن لديك حساسية مسجلة باسم «${unmappedOtherAllergy.drugName}» تحت بند (أدوية أخرى) لا يمكن التحقق من علاقتها الكيميائية آلياً.`,
        en: `No match was found with classified antibiotic families for ${drugInfo.nameEn}, but you have a recorded allergy ("${unmappedOtherAllergy.drugName}") under "Other Medications" whose chemical relationship cannot be automatically verified.`,
      },
      clinicalAction: {
        ar: 'أطلع الصيدلي أو الطبيب على حساسيتك المسجلة من «' + unmappedOtherAllergy.drugName + '» قبل تناول هذا الدواء للتأكد من عدم وجود أي تقاطع.',
        en: `Show your recorded allergy ("${unmappedOtherAllergy.drugName}") to your pharmacist or doctor to confirm safety before taking this medicine.`,
      },
      nursingWarning: {
        ar: 'تنبيه تمريضي: مراجعة المادة الفعالة للدواء غير المصنف في سجل حساسية المريض يدوياً مع الصيدلي الإكلينيكي.',
        en: 'Nursing Note: Manually reconcile unclassified patient allergy records with clinical pharmacy prior to administration.',
      },
    };
  }

  // 4. No match found in available recorded data
  return {
    matchLevel: 'no_match',
    resolvedDrugId: resolvedId,
    title: { ar: 'لم يُعثر على تطابق مع سجلات الحساسية المسجلة حالياً', en: 'No Match Found with Currently Documented Allergies' },
    explanation: {
      ar: `هذا الدواء (${drugInfo.nameAr}) لا يتطابق مع أي من الأدوية أو العائلات المسجلة حالياً في سجل حساسيتك الشخصي.`,
      en: `This medication (${drugInfo.nameEn}) does not match any drug family or active ingredient currently documented in your allergy profile.`,
    },
    clinicalAction: {
      ar: 'عدم وجود تطابق في السجل لا يعني ضمان عدم حدوث حساسية لأول مرة. التزم بالوصفة الطبية وراجع الطبيب أو الطوارئ فوراً إذا ظهر طفح جلدي أو ضيق تنفس.',
      en: 'Absence of a recorded match does not guarantee immunity from first-time reactions. Take as prescribed and seek prompt care if any rash or breathing difficulty occurs.',
    },
    nursingWarning: {
      ar: 'تنبيه تمريضي: عدم وجود تطابق مسجل لا يغني عن سؤال المريض شفهياً ومراقبة علامات التحسس المبكرة بعد الجرعة الأولى.',
      en: 'Nursing Note: Absence of recorded allergy does not replace verbal verification and post-dose observation.',
    },
  };
}
