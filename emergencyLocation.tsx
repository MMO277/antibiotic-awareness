import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { Lang, registerEmergencyTextTransform } from './types';
import { useLang } from './i18n';

export interface EmergencyCountryInfo {
  code: string;
  number: string;
  flag: string;
  name: {
    ar: string;
    en: string;
    fr: string;
    es: string;
    de?: string;
  };
}

const STORAGE_OVERRIDE_KEY = 'aa_emergency_country_override';
const SESSION_IP_KEY = 'aa_emergency_country_ip';

export const FEATURED_EMERGENCY_COUNTRIES: EmergencyCountryInfo[] = [
  // Arab Countries
  { code: 'EG', number: '123', flag: '🇪🇬', name: { ar: 'مصر', en: 'Egypt', fr: 'Égypte', es: 'Egipto' } },
  { code: 'SA', number: '911', flag: '🇸🇦', name: { ar: 'السعودية', en: 'Saudi Arabia', fr: 'Arabie saoudite', es: 'Arabia Saudita' } },
  { code: 'AE', number: '999', flag: '🇦🇪', name: { ar: 'الإمارات', en: 'UAE', fr: 'Émirats arabes unis', es: 'Emiratos Árabes Unidos' } },
  { code: 'KW', number: '112', flag: '🇰🇼', name: { ar: 'الكويت', en: 'Kuwait', fr: 'Koweït', es: 'Kuwait' } },
  { code: 'QA', number: '999', flag: '🇶🇦', name: { ar: 'قطر', en: 'Qatar', fr: 'Qatar', es: 'Catar' } },
  { code: 'BH', number: '999', flag: '🇧🇭', name: { ar: 'البحرين', en: 'Bahrain', fr: 'Bahreïn', es: 'Baréin' } },
  { code: 'OM', number: '9999', flag: '🇴🇲', name: { ar: 'سلطنة عُمان', en: 'Oman', fr: 'Oman', es: 'Omán' } },
  { code: 'JO', number: '911', flag: '🇯🇴', name: { ar: 'الأردن', en: 'Jordan', fr: 'Jordanie', es: 'Jordania' } },
  { code: 'IQ', number: '911', flag: '🇮🇶', name: { ar: 'العراق', en: 'Iraq', fr: 'Irak', es: 'Irak' } },
  { code: 'LB', number: '112', flag: '🇱🇧', name: { ar: 'لبنان', en: 'Lebanon', fr: 'Liban', es: 'Líbano' } },
  { code: 'PS', number: '101', flag: '🇵🇸', name: { ar: 'فلسطين', en: 'Palestine', fr: 'Palestine', es: 'Palestina' } },
  { code: 'SY', number: '110', flag: '🇸🇾', name: { ar: 'سوريا', en: 'Syria', fr: 'Syrie', es: 'Siria' } },
  { code: 'YE', number: '199', flag: '🇾🇪', name: { ar: 'اليمن', en: 'Yemen', fr: 'Yémen', es: 'Yemen' } },
  { code: 'SD', number: '999', flag: '🇸🇩', name: { ar: 'السودان', en: 'Sudan', fr: 'Soudan', es: 'Sudán' } },
  { code: 'LY', number: '1515', flag: '🇱🇾', name: { ar: 'ليبيا', en: 'Libya', fr: 'Libye', es: 'Libia' } },
  { code: 'TN', number: '190', flag: '🇹🇳', name: { ar: 'تونس', en: 'Tunisia', fr: 'Tunisie', es: 'Túnez' } },
  { code: 'DZ', number: '14', flag: '🇩🇿', name: { ar: 'الجزائر', en: 'Algeria', fr: 'Algérie', es: 'Argelia' } },
  { code: 'MA', number: '15', flag: '🇲🇦', name: { ar: 'المغرب', en: 'Morocco', fr: 'Maroc', es: 'Marruecos' } },
  { code: 'MR', number: '101', flag: '🇲🇷', name: { ar: 'موريتانيا', en: 'Mauritania', fr: 'Mauritanie', es: 'Mauritania' } },
  { code: 'SO', number: '888', flag: '🇸🇴', name: { ar: 'الصومال', en: 'Somalia', fr: 'Somalie', es: 'Somalia' } },
  { code: 'DJ', number: '19', flag: '🇩🇯', name: { ar: 'جيبوتي', en: 'Djibouti', fr: 'Djibouti', es: 'Yibuti' } },
  { code: 'KM', number: '17', flag: '🇰🇲', name: { ar: 'جزر القمر', en: 'Comoros', fr: 'Comores', es: 'Comoras' } },

  // Major Global Countries
  { code: 'US', number: '911', flag: '🇺🇸', name: { ar: 'الولايات المتحدة', en: 'United States', fr: 'États-Unis', es: 'Estados Unidos' } },
  { code: 'CA', number: '911', flag: '🇨🇦', name: { ar: 'كندا', en: 'Canada', fr: 'Canada', es: 'Canadá' } },
  { code: 'GB', number: '999', flag: '🇬🇧', name: { ar: 'المملكة المتحدة', en: 'United Kingdom', fr: 'Royaume-Uni', es: 'Reino Unido' } },
  { code: 'IE', number: '112', flag: '🇮🇪', name: { ar: 'أيرلندا', en: 'Ireland', fr: 'Irlande', es: 'Irlanda' } },
  { code: 'FR', number: '112', flag: '🇫🇷', name: { ar: 'فرنسا', en: 'France', fr: 'France', es: 'Francia' } },
  { code: 'DE', number: '112', flag: '🇩🇪', name: { ar: 'ألمانيا', en: 'Germany', fr: 'Allemagne', es: 'Alemania' } },
  { code: 'ES', number: '112', flag: '🇪🇸', name: { ar: 'إسبانيا', en: 'Spain', fr: 'Espagne', es: 'España' } },
  { code: 'IT', number: '112', flag: '🇮🇹', name: { ar: 'إيطاليا', en: 'Italy', fr: 'Italie', es: 'Italia' } },
  { code: 'NL', number: '112', flag: '🇳🇱', name: { ar: 'هولندا', en: 'Netherlands', fr: 'Pays-Bas', es: 'Países Bajos' } },
  { code: 'BE', number: '112', flag: '🇧🇪', name: { ar: 'بلجيكا', en: 'Belgium', fr: 'Belgique', es: 'Bélgica' } },
  { code: 'CH', number: '112', flag: '🇨🇭', name: { ar: 'سويسرا', en: 'Switzerland', fr: 'Suisse', es: 'Suiza' } },
  { code: 'AT', number: '112', flag: '🇦🇹', name: { ar: 'النمسا', en: 'Austria', fr: 'Autriche', es: 'Austria' } },
  { code: 'SE', number: '112', flag: '🇸🇪', name: { ar: 'السويد', en: 'Sweden', fr: 'Suède', es: 'Suecia' } },
  { code: 'NO', number: '113', flag: '🇳🇴', name: { ar: 'النرويج', en: 'Norway', fr: 'Norvège', es: 'Noruega' } },
  { code: 'DK', number: '112', flag: '🇩🇰', name: { ar: 'الدنمارك', en: 'Denmark', fr: 'Danemark', es: 'Dinamarca' } },
  { code: 'FI', number: '112', flag: '🇫🇮', name: { ar: 'فنلندا', en: 'Finland', fr: 'Finlande', es: 'Finlandia' } },
  { code: 'PL', number: '112', flag: '🇵🇱', name: { ar: 'بولندا', en: 'Poland', fr: 'Pologne', es: 'Polonia' } },
  { code: 'PT', number: '112', flag: '🇵🇹', name: { ar: 'البرتغال', en: 'Portugal', fr: 'Portugal', es: 'Portugal' } },
  { code: 'GR', number: '112', flag: '🇬🇷', name: { ar: 'اليونان', en: 'Greece', fr: 'Grèce', es: 'Grecia' } },
  { code: 'TR', number: '112', flag: '🇹🇷', name: { ar: 'تركيا', en: 'Turkey', fr: 'Turquie', es: 'Turquía' } },
  { code: 'RU', number: '112', flag: '🇷🇺', name: { ar: 'روسيا', en: 'Russia', fr: 'Russie', es: 'Rusia' } },
  { code: 'UA', number: '112', flag: '🇺🇦', name: { ar: 'أوكرانيا', en: 'Ukraine', fr: 'Ukraine', es: 'Ucrania' } },
  { code: 'IN', number: '112', flag: '🇮🇳', name: { ar: 'الهند', en: 'India', fr: 'Inde', es: 'India' } },
  { code: 'PK', number: '1122', flag: '🇵🇰', name: { ar: 'باكستان', en: 'Pakistan', fr: 'Pakistan', es: 'Pakistán' } },
  { code: 'BD', number: '999', flag: '🇧🇩', name: { ar: 'بنغلاديش', en: 'Bangladesh', fr: 'Bangladesh', es: 'Bangladés' } },
  { code: 'ID', number: '112', flag: '🇮🇩', name: { ar: 'إندونيسيا', en: 'Indonesia', fr: 'Indonésie', es: 'Indonesia' } },
  { code: 'MY', number: '999', flag: '🇲🇾', name: { ar: 'ماليزيا', en: 'Malaysia', fr: 'Malaisie', es: 'Malasia' } },
  { code: 'SG', number: '995', flag: '🇸🇬', name: { ar: 'سنغافورة', en: 'Singapore', fr: 'Singapour', es: 'Singapur' } },
  { code: 'TH', number: '1669', flag: '🇹🇭', name: { ar: 'تايلاند', en: 'Thailand', fr: 'Thaïlande', es: 'Tailandia' } },
  { code: 'PH', number: '911', flag: '🇵🇭', name: { ar: 'الفلبين', en: 'Philippines', fr: 'Philippines', es: 'Filipinas' } },
  { code: 'CN', number: '120', flag: '🇨🇳', name: { ar: 'الصين', en: 'China', fr: 'Chine', es: 'China' } },
  { code: 'JP', number: '119', flag: '🇯🇵', name: { ar: 'اليابان', en: 'Japan', fr: 'Japon', es: 'Japón' } },
  { code: 'KR', number: '119', flag: '🇰🇷', name: { ar: 'كوريا الجنوبية', en: 'South Korea', fr: 'Corée du Sud', es: 'Corea del Sur' } },
  { code: 'AU', number: '000', flag: '🇦🇺', name: { ar: 'أستراليا', en: 'Australia', fr: 'Australie', es: 'Australia' } },
  { code: 'NZ', number: '111', flag: '🇳🇿', name: { ar: 'نيوزيلندا', en: 'New Zealand', fr: 'Nouvelle-Zélande', es: 'Nueva Zelanda' } },
  { code: 'ZA', number: '112', flag: '🇿🇦', name: { ar: 'جنوب أفريقيا', en: 'South Africa', fr: 'Afrique du Sud', es: 'Sudáfrica' } },
  { code: 'NG', number: '112', flag: '🇳🇬', name: { ar: 'نيجيريا', en: 'Nigeria', fr: 'Nigéria', es: 'Nigeria' } },
  { code: 'KE', number: '999', flag: '🇰🇪', name: { ar: 'كينيا', en: 'Kenya', fr: 'Kenya', es: 'Kenia' } },
  { code: 'ET', number: '907', flag: '🇪🇹', name: { ar: 'إثيوبيا', en: 'Ethiopia', fr: 'Éthiopie', es: 'Etiopía' } },
  { code: 'GH', number: '112', flag: '🇬🇭', name: { ar: 'غانا', en: 'Ghana', fr: 'Ghana', es: 'Ghana' } },
  { code: 'BR', number: '192', flag: '🇧🇷', name: { ar: 'البرازيل', en: 'Brazil', fr: 'Brésil', es: 'Brasil' } },
  { code: 'MX', number: '911', flag: '🇲🇽', name: { ar: 'المكسيك', en: 'Mexico', fr: 'Mexique', es: 'México' } },
  { code: 'AR', number: '911', flag: '🇦🇷', name: { ar: 'الأرجنتين', en: 'Argentina', fr: 'Argentine', es: 'Argentina' } },
  { code: 'CO', number: '123', flag: '🇨🇴', name: { ar: 'كولومبيا', en: 'Colombia', fr: 'Colombie', es: 'Colombia' } },
  { code: 'CL', number: '131', flag: '🇨🇱', name: { ar: 'تشيلي', en: 'Chile', fr: 'Chili', es: 'Chile' } },
  { code: 'GLOBAL', number: '112', flag: '🌍', name: { ar: 'الطوارئ الدولي الموحد', en: 'International Emergency', fr: 'Urgences Internationales', es: 'Emergencia Internacional' } },
];

const FEATURED_BY_CODE = new Map<string, EmergencyCountryInfo>(
  FEATURED_EMERGENCY_COUNTRIES.map((c) => [c.code.toUpperCase(), c])
);

// Comprehensive fallback lookup of general emergency numbers for remaining ISO 3166-1 alpha-2 codes
const ISO_EMERGENCY_NUMBERS: Record<string, string> = {
  AF: '112', AL: '112', AD: '112', AO: '112', AG: '911', AM: '911', AZ: '112',
  BS: '911', BB: '911', BY: '112', BZ: '911', BJ: '112', BT: '112', BO: '911',
  BA: '112', BW: '997', BN: '991', BG: '112', BF: '112', BI: '112', CV: '112',
  KH: '119', CM: '112', CF: '117', TD: '2251', KM: '17', CG: '112', CD: '112',
  CR: '911', CI: '185', HR: '112', CU: '104', CY: '112', CZ: '112', DO: '911',
  EC: '911', SV: '911', GQ: '112', ER: '112', EE: '112', SZ: '977', FJ: '911',
  GA: '1300', GM: '116', GE: '112', GT: '128', GN: '112', GW: '112', GY: '913',
  HT: '116', HN: '911', HK: '999', HU: '112', IS: '112', IR: '115', IL: '101',
  JM: '110', KZ: '112', KI: '994', XK: '112', KG: '112', LA: '1195', LV: '112',
  LS: '121', LR: '911', LI: '112', LT: '112', LU: '112', MO: '999', MG: '117',
  MW: '998', MV: '102', ML: '15', MT: '112', MH: '911', MU: '114', FM: '911',
  MD: '112', MC: '112', MN: '103', ME: '112', MZ: '119', MM: '192', NA: '112',
  NR: '111', NP: '102', NI: '128', NE: '15', KP: '119', MK: '112', PW: '911',
  PA: '911', PG: '111', PY: '911', PE: '106', RO: '112', RW: '912', KN: '911',
  LC: '911', VC: '911', WS: '911', SM: '118', ST: '112', SN: '1515', RS: '112',
  SC: '151', SL: '999', SK: '112', SI: '112', SB: '911', LK: '1990', SR: '115',
  TW: '119', TJ: '112', TZ: '112', TL: '112', TG: '118', TO: '911', TT: '811',
  TM: '03', TV: '911', UG: '999', UY: '911', UZ: '103', VU: '112', VA: '112',
  VE: '911', VN: '115', ZM: '999', ZW: '999',
};

// Fast synchronous IANA Timezone -> ISO Country Code map
const TIMEZONE_TO_COUNTRY: Record<string, string> = {
  'Africa/Cairo': 'EG',
  'Asia/Riyadh': 'SA',
  'Asia/Dubai': 'AE',
  'Asia/Kuwait': 'KW',
  'Asia/Qatar': 'QA',
  'Asia/Bahrain': 'BH',
  'Asia/Muscat': 'OM',
  'Asia/Amman': 'JO',
  'Asia/Baghdad': 'IQ',
  'Asia/Beirut': 'LB',
  'Asia/Gaza': 'PS',
  'Asia/Hebron': 'PS',
  'Asia/Damascus': 'SY',
  'Asia/Aden': 'YE',
  'Africa/Khartoum': 'SD',
  'Africa/Juba': 'SS',
  'Africa/Tripoli': 'LY',
  'Africa/Tunis': 'TN',
  'Africa/Algiers': 'DZ',
  'Africa/Casablanca': 'MA',
  'Africa/El_Aaiun': 'MA',
  'Africa/Nouakchott': 'MR',
  'Africa/Mogadishu': 'SO',
  'Africa/Djibouti': 'DJ',
  'Indian/Comoro': 'KM',
  'Europe/London': 'GB',
  'Europe/Dublin': 'IE',
  'Europe/Paris': 'FR',
  'Europe/Berlin': 'DE',
  'Europe/Busingen': 'DE',
  'Europe/Madrid': 'ES',
  'Africa/Ceuta': 'ES',
  'Atlantic/Canary': 'ES',
  'Europe/Rome': 'IT',
  'Europe/Amsterdam': 'NL',
  'Europe/Brussels': 'BE',
  'Europe/Zurich': 'CH',
  'Europe/Vienna': 'AT',
  'Europe/Stockholm': 'SE',
  'Europe/Oslo': 'NO',
  'Europe/Copenhagen': 'DK',
  'Europe/Helsinki': 'FI',
  'Europe/Warsaw': 'PL',
  'Europe/Lisbon': 'PT',
  'Atlantic/Madeira': 'PT',
  'Atlantic/Azores': 'PT',
  'Europe/Athens': 'GR',
  'Europe/Istanbul': 'TR',
  'Asia/Istanbul': 'TR',
  'Europe/Moscow': 'RU',
  'Europe/Kyiv': 'UA',
  'Europe/Kiev': 'UA',
  'Europe/Bucharest': 'RO',
  'Europe/Budapest': 'HU',
  'Europe/Prague': 'CZ',
  'Europe/Sofia': 'BG',
  'Europe/Belgrade': 'RS',
  'Europe/Zagreb': 'HR',
  'Europe/Ljubljana': 'SI',
  'Europe/Bratislava': 'SK',
  'Asia/Kolkata': 'IN',
  'Asia/Calcutta': 'IN',
  'Asia/Karachi': 'PK',
  'Asia/Dhaka': 'BD',
  'Asia/Jakarta': 'ID',
  'Asia/Makassar': 'ID',
  'Asia/Jayapura': 'ID',
  'Asia/Kuala_Lumpur': 'MY',
  'Asia/Kuching': 'MY',
  'Asia/Singapore': 'SG',
  'Asia/Bangkok': 'TH',
  'Asia/Manila': 'PH',
  'Asia/Ho_Chi_Minh': 'VN',
  'Asia/Saigon': 'VN',
  'Asia/Shanghai': 'CN',
  'Asia/Urumqi': 'CN',
  'Asia/Hong_Kong': 'HK',
  'Asia/Taipei': 'TW',
  'Asia/Tokyo': 'JP',
  'Asia/Seoul': 'KR',
  'Australia/Sydney': 'AU',
  'Australia/Melbourne': 'AU',
  'Australia/Brisbane': 'AU',
  'Australia/Perth': 'AU',
  'Australia/Adelaide': 'AU',
  'Australia/Darwin': 'AU',
  'Australia/Hobart': 'AU',
  'Pacific/Auckland': 'NZ',
  'Africa/Johannesburg': 'ZA',
  'Africa/Lagos': 'NG',
  'Africa/Nairobi': 'KE',
  'Africa/Addis_Ababa': 'ET',
  'Africa/Accra': 'GH',
  'Africa/Dakar': 'SN',
  'America/New_York': 'US',
  'America/Chicago': 'US',
  'America/Denver': 'US',
  'America/Los_Angeles': 'US',
  'America/Phoenix': 'US',
  'America/Anchorage': 'US',
  'Pacific/Honolulu': 'US',
  'America/Detroit': 'US',
  'America/Indiana/Indianapolis': 'US',
  'America/Toronto': 'CA',
  'America/Vancouver': 'CA',
  'America/Montreal': 'CA',
  'America/Edmonton': 'CA',
  'America/Winnipeg': 'CA',
  'America/Halifax': 'CA',
  'America/St_Johns': 'CA',
  'America/Mexico_City': 'MX',
  'America/Cancun': 'MX',
  'America/Monterrey': 'MX',
  'America/Tijuana': 'MX',
  'America/Sao_Paulo': 'BR',
  'America/Fortaleza': 'BR',
  'America/Manaus': 'BR',
  'America/Buenos_Aires': 'AR',
  'America/Argentina/Buenos_Aires': 'AR',
  'America/Bogota': 'CO',
  'America/Santiago': 'CL',
  'America/Lima': 'PE',
};

function getFlagEmoji(countryCode: string): string {
  const clean = countryCode.trim().toUpperCase();
  if (clean.length !== 2 || !/^[A-Z]{2}$/.test(clean)) return '🌍';
  return String.fromCodePoint(
    127397 + clean.charCodeAt(0),
    127397 + clean.charCodeAt(1)
  );
}

function getDynamicCountryName(code: string, lang: Lang): string {
  try {
    if (typeof Intl !== 'undefined' && typeof Intl.DisplayNames === 'function') {
      const dn = new Intl.DisplayNames([lang], { type: 'region' });
      const resolved = dn.of(code.toUpperCase());
      if (resolved) return resolved;
    }
  } catch {
    /* ignore */
  }
  return code.toUpperCase();
}

export function resolveEmergencyCountryInfo(codeRaw: string | null | undefined): EmergencyCountryInfo {
  const code = (codeRaw || '').trim().toUpperCase();
  if (!code) return FEATURED_BY_CODE.get('EG')!;

  const featured = FEATURED_BY_CODE.get(code);
  if (featured) return featured;

  if (/^[A-Z]{2}$/.test(code)) {
    const number = ISO_EMERGENCY_NUMBERS[code] || '112';
    return {
      code,
      number,
      flag: getFlagEmoji(code),
      name: {
        ar: getDynamicCountryName(code, 'ar'),
        en: getDynamicCountryName(code, 'en'),
        fr: getDynamicCountryName(code, 'fr'),
        es: getDynamicCountryName(code, 'es'),
        de: getDynamicCountryName(code, 'de'),
      },
    };
  }

  return FEATURED_BY_CODE.get('EG')!;
}

function detectSyncCountryCode(): string {
  if (typeof window === 'undefined') return 'EG';

  // 1) Check sessionStorage IP cache first
  try {
    const cachedIp = sessionStorage.getItem(SESSION_IP_KEY);
    if (cachedIp && /^[A-Z]{2}$/i.test(cachedIp.trim())) {
      return cachedIp.trim().toUpperCase();
    }
  } catch {
    /* ignore */
  }

  // 2) Check IANA Timezone (instant, accurate, zero network wait)
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && TIMEZONE_TO_COUNTRY[tz]) {
      return TIMEZONE_TO_COUNTRY[tz];
    }
  } catch {
    /* ignore */
  }

  // 3) Check navigator.languages / navigator.language region tag (e.g., ar-SA -> SA)
  try {
    const langs = navigator.languages?.length ? navigator.languages : [navigator.language];
    for (const l of langs) {
      if (!l) continue;
      const parts = l.replace('_', '-').split('-');
      if (parts.length >= 2) {
        const region = parts[parts.length - 1].toUpperCase();
        if (/^[A-Z]{2}$/.test(region)) {
          return region;
        }
      }
    }
  } catch {
    /* ignore */
  }

  return 'EG';
}

async function fetchCountryWithTimeout(url: string, extractor: (data: any) => string | null, timeoutMs = 3500): Promise<string | null> {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller ? window.setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    const res = await fetch(url, {
      signal: controller?.signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const code = extractor(json);
    if (code && /^[A-Z]{2}$/i.test(code.trim())) {
      return code.trim().toUpperCase();
    }
  } catch {
    /* ignore network / CORS / offline errors */
  } finally {
    if (timer !== null) window.clearTimeout(timer);
  }
  return null;
}

async function detectCountryViaIp(): Promise<string | null> {
  // Endpoint 1: api.country.is (fast, lightweight, CORS-enabled)
  const c1 = await fetchCountryWithTimeout('https://api.country.is/', (d) => d?.country || null);
  if (c1) return c1;

  // Endpoint 2: ipwho.is (free, no key, CORS-enabled)
  const c2 = await fetchCountryWithTimeout('https://ipwho.is/', (d) => (d?.success !== false ? d?.country_code : null));
  if (c2) return c2;

  // Endpoint 3: ipapi.co/json
  const c3 = await fetchCountryWithTimeout('https://ipapi.co/json/', (d) => d?.country_code || null);
  if (c3) return c3;

  return null;
}

let latestActiveEmergencyInfo: EmergencyCountryInfo = resolveEmergencyCountryInfo(
  typeof window !== 'undefined' ? detectSyncCountryCode() : 'EG'
);

export function getCurrentEmergencyInfo(): EmergencyCountryInfo {
  return latestActiveEmergencyInfo;
}

export function pickCountryName(info: EmergencyCountryInfo, lang: Lang): string {
  return info.name[lang] || info.name.en || info.name.ar;
}

/**
 * Replaces hardcoded Egyptian emergency references (123 / في مصر / in Egypt)
 * inside static clinical data strings with the visitor's detected country & emergency number.
 */
export function formatEmergencyText(text: string, info: EmergencyCountryInfo, lang: Lang): string {
  if (!text) return text;
  if (info.code === 'EG') return text;

  const cName = pickCountryName(info, lang);
  const num = info.number;

  return text
    .replace(/\(123\s*في\s*مصر\)/g, `(${num} في ${cName})`)
    .replace(/بالإسعاف\s*المصري\s*\(123\)/g, `بالطوارئ في ${cName} (${num})`)
    .replace(/الإسعاف\s*المصري\s*\(123\)/g, `طوارئ ${cName} (${num})`)
    .replace(/رقم\s*123/g, `رقم ${num}`)
    .replace(/طوارئ\s*123/g, `طوارئ ${num}`)
    .replace(/\(123\s*in\s*Egypt\)/gi, `(${num} in ${cName})`)
    .replace(/\(123\s*en\s*Égypte\s*\/\s*112\)/gi, `(${num} — ${cName})`)
    .replace(/\(123\s*en\s*Egipto\s*\/\s*112\)/gi, `(${num} — ${cName})`)
    .replace(/\(123\)/g, `(${num})`);
}

interface EmergencyContextValue {
  emergency: EmergencyCountryInfo;
  countryName: string;
  selectedOverride: string;
  isAutoDetected: boolean;
  setCountryOverride: (codeOrAuto: string) => void;
  countriesList: EmergencyCountryInfo[];
}

const EmergencyLocationContext = createContext<EmergencyContextValue>({
  emergency: FEATURED_BY_CODE.get('EG')!,
  countryName: 'مصر',
  selectedOverride: 'AUTO',
  isAutoDetected: true,
  setCountryOverride: () => {},
  countriesList: FEATURED_EMERGENCY_COUNTRIES,
});

export function useEmergencyLocation(): EmergencyContextValue {
  return useContext(EmergencyLocationContext);
}

export function EmergencyLocationProvider({ children }: { children: ReactNode }) {
  const { lang } = useLang();

  const [selectedOverride, setSelectedOverrideState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_OVERRIDE_KEY);
      if (saved && saved.trim()) return saved.trim().toUpperCase();
    } catch {
      /* ignore */
    }
    return 'AUTO';
  });

  const [autoCode, setAutoCode] = useState<string>(() => detectSyncCountryCode());

  useEffect(() => {
    let cancelled = false;

    // Check if IP was already cached in sessionStorage
    try {
      const cached = sessionStorage.getItem(SESSION_IP_KEY);
      if (cached && /^[A-Z]{2}$/i.test(cached.trim())) {
        setAutoCode(cached.trim().toUpperCase());
        return;
      }
    } catch {
      /* ignore */
    }

    detectCountryViaIp().then((ipCode) => {
      if (cancelled || !ipCode) return;
      try {
        sessionStorage.setItem(SESSION_IP_KEY, ipCode);
      } catch {
        /* ignore */
      }
      setAutoCode(ipCode);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const setCountryOverride = (codeOrAuto: string) => {
    const normalized = (codeOrAuto || 'AUTO').trim().toUpperCase();
    setSelectedOverrideState(normalized);
    try {
      if (normalized === 'AUTO') {
        localStorage.removeItem(STORAGE_OVERRIDE_KEY);
      } else {
        localStorage.setItem(STORAGE_OVERRIDE_KEY, normalized);
      }
    } catch {
      /* ignore */
    }
  };

  const activeCode = selectedOverride === 'AUTO' ? autoCode : selectedOverride;
  const emergency = useMemo(() => resolveEmergencyCountryInfo(activeCode), [activeCode]);
  const countryName = useMemo(() => pickCountryName(emergency, lang), [emergency, lang]);

  // Keep module-level reference in sync synchronously during render & register with pick()
  latestActiveEmergencyInfo = emergency;
  registerEmergencyTextTransform((txt, l) => formatEmergencyText(txt, latestActiveEmergencyInfo, l));

  useEffect(() => {
    latestActiveEmergencyInfo = emergency;
  }, [emergency]);

  // Include auto-detected country in dropdown list even if it's not one of the featured ones
  const countriesList = useMemo(() => {
    const autoInfo = resolveEmergencyCountryInfo(autoCode);
    if (FEATURED_BY_CODE.has(autoInfo.code)) {
      return FEATURED_EMERGENCY_COUNTRIES;
    }
    return [autoInfo, ...FEATURED_EMERGENCY_COUNTRIES];
  }, [autoCode]);

  const value = useMemo<EmergencyContextValue>(
    () => ({
      emergency,
      countryName,
      selectedOverride,
      isAutoDetected: selectedOverride === 'AUTO',
      setCountryOverride,
      countriesList,
    }),
    [emergency, countryName, selectedOverride, countriesList]
  );

  return (
    <EmergencyLocationContext.Provider value={value}>
      {children}
    </EmergencyLocationContext.Provider>
  );
}

registerEmergencyTextTransform((txt, l) => formatEmergencyText(txt, latestActiveEmergencyInfo, l));
