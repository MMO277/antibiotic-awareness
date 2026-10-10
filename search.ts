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

export type SearchMode = 'all' | 'name' | 'ingredient' | 'maker';

/** Search in Arabic or English. mode narrows WHAT is searched; cls filters by drug class text. */
export function searchMeds(list: Medicine[], q: string, mode: SearchMode = 'all', cls = ''): Medicine[] {
  const tokens = norm(q).split(/\s+/).filter(Boolean);
  return list.filter((m) => {
    if (cls && m.drugClass.en !== cls && m.drugClass.ar !== cls) return false;
    if (!tokens.length) return true;
    const brands = m.brands.filter((b) => b.verified);
    const name = [m.genericName.ar, m.genericName.en, ...brands.map((b) => b.name)];
    const ingredient = [m.activeIngredients.ar, m.activeIngredients.en];
    const maker = brands.map((b) => b.manufacturer);
    const fields =
      mode === 'name' ? name
      : mode === 'ingredient' ? ingredient
      : mode === 'maker' ? maker
      : [...name, ...ingredient, ...maker, m.drugClass.ar, m.drugClass.en, m.approvedUses.ar, m.approvedUses.en];
    const hay = norm(fields.join(' '));
    return tokens.every((t) => hay.includes(t));
  });
}
