import { Medicine } from './types';

/** Arabic-friendly normalisation: removes diacritics/tatweel and unifies alef/yaa/taa-marbuta. */
export const norm = (s: string) =>
  (s || '')
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[إأآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ة/g, 'ه')
    .trim();

/** Normalizes medication/brand strings by stripping punctuation while preserving Arabic & Latin tokens. */
export const normalizeMedToken = (s: string): string =>
  norm(s)
    .replace(/[^a-z0-9\u0600-\u06FF\s+-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export type SearchMode = 'all' | 'name' | 'ingredient' | 'maker' | 'barcode';

/** Search in Arabic, English, or by linear Barcode/GTIN. */
export function searchMeds(list: Medicine[], q: string, mode: SearchMode = 'all', cls = ''): Medicine[] {
  const tokens = norm(q).split(/\s+/).filter(Boolean);
  return list.filter((m) => {
    if (cls && m.drugClass.en !== cls && m.drugClass.ar !== cls) return false;
    if (!tokens.length) return true;
    const brands = m.brands || [];
    const barcodes = [
      ...(m.barcodes || []),
      ...brands.map((b) => b.barcode || '').filter(Boolean),
    ];
    const name = [
      m.genericName.ar,
      m.genericName.en,
      ...brands.map((b) => b.name),
      m.substitutes?.ar || '',
      m.substitutes?.en || '',
    ];
    const ingredient = [m.activeIngredients.ar, m.activeIngredients.en];
    const maker = brands.map((b) => b.manufacturer);
    const fields =
      mode === 'name'
        ? name
        : mode === 'ingredient'
        ? ingredient
        : mode === 'maker'
        ? maker
        : mode === 'barcode'
        ? barcodes
        : [
            ...name,
            ...ingredient,
            ...maker,
            ...barcodes,
            m.drugClass.ar,
            m.drugClass.en,
            m.approvedUses.ar,
            m.approvedUses.en,
            m.strengths?.ar || '',
            m.strengths?.en || '',
          ];
    const hay = norm(fields.join(' '));
    return tokens.every((t) => hay.includes(t));
  });
}
