import { Medicine } from './types';

/** Arabic-friendly normalisation: removes diacritics/tatweel and unifies alef/yaa/taa-marbuta. */
export const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[إأآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .trim();

export function searchMeds(list: Medicine[], q: string): Medicine[] {
  const tokens = norm(q).split(/\s+/).filter(Boolean);
  if (!tokens.length) return list;
  return list.filter((m) => {
    const hay = norm(
      [
        m.genericName.ar, m.genericName.en,
        m.activeIngredients.ar, m.activeIngredients.en,
        m.drugClass.ar, m.drugClass.en,
        m.strengths.en, m.strengths.ar,
        ...m.brands.filter((b) => b.verified).map((b) => b.name),
      ].join(' '),
    );
    return tokens.every((t) => hay.includes(t));
  });
}
