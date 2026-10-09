import { Bi } from './types';

/**
 * Starter list requested for the project. ONLY the generic name and the broad
 * drug class are pre-filled, and they are marked UNVERIFIED (status "draft").
 * No doses, indications, brand names, barcodes or sources are included on purpose:
 * those must come from official references and be checked by a qualified clinician.
 */
interface SeedItem {
  id: string;
  genericName: Bi;
  activeIngredients: Bi;
  drugClass: Bi;
}

const item = (id: string, nameEn: string, nameAr: string, clsEn: string, clsAr: string): SeedItem => ({
  id,
  genericName: { en: nameEn, ar: nameAr },
  activeIngredients: { en: nameEn, ar: nameAr },
  drugClass: { en: clsEn, ar: clsAr },
});

export const SEED: SeedItem[] = [
  item('amoxicillin', 'Amoxicillin', 'أموكسيسيلين', 'Penicillin', 'بنسيلين'),
  item('amoxicillin-clavulanic-acid', 'Amoxicillin / clavulanic acid', 'أموكسيسيلين / حمض الكلافولانيك', 'Penicillin + beta-lactamase inhibitor', 'بنسيلين + مثبّط بيتا-لاكتاماز'),
  item('azithromycin', 'Azithromycin', 'أزيثروميسين', 'Macrolide', 'ماكروليد'),
  item('doxycycline', 'Doxycycline', 'دوكسيسيكلين', 'Tetracycline', 'تتراسيكلين'),
  item('cephalexin', 'Cephalexin', 'سيفالكسين', 'Cephalosporin (1st generation)', 'سيفالوسبورين (الجيل الأول)'),
  item('cefuroxime', 'Cefuroxime', 'سيفوروكسيم', 'Cephalosporin (2nd generation)', 'سيفالوسبورين (الجيل الثاني)'),
  item('ceftriaxone', 'Ceftriaxone', 'سيفترياكسون', 'Cephalosporin (3rd generation)', 'سيفالوسبورين (الجيل الثالث)'),
  item('metronidazole', 'Metronidazole', 'ميترونيدازول', 'Nitroimidazole', 'نيتروإيميدازول'),
  item('nitrofurantoin', 'Nitrofurantoin', 'نيتروفورانتوين', 'Nitrofuran', 'نيتروفوران'),
];

/** Starting points for reviewers. Always paste the EXACT page URL of the monograph you used. */
export const SOURCE_HINTS: { name: string; url: string }[] = [
  { name: 'MedlinePlus (US National Library of Medicine)', url: 'https://medlineplus.gov/' },
  { name: 'DailyMed (official US drug labels)', url: 'https://dailymed.nlm.nih.gov/' },
  { name: 'European Medicines Agency (EMA)', url: 'https://www.ema.europa.eu/' },
  { name: 'CDC – Antibiotic Prescribing and Use', url: 'https://www.cdc.gov/antibiotic-use/' },
];
