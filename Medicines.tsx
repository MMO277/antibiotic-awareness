import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLang } from './i18n';
import { useApproved } from './medicinesApi';
import { searchMeds, SearchMode } from './search';
import { pick } from './types';

const MODES: [SearchMode, string][] = [
  ['all', 'all'],
  ['name', 'byName'],
  ['ingredient', 'byIngredient'],
  ['maker', 'byMaker'],
];

export default function Medicines() {
  const { t, lang } = useLang();
  const [sp, setSp] = useSearchParams();
  const q = sp.get('q') ?? '';
  const [mode, setMode] = useState<SearchMode>('all');
  const [cls, setCls] = useState('');
  const { items, error } = useApproved();
  const results = items ? searchMeds(items, q, mode, cls) : [];
  const classes = items ? Array.from(new Set(items.map((m) => pick(m.drugClass, lang)).filter(Boolean))) : [];

  return (
    <main className="wrap stack">
      <h1>{t('medsTitle')}</h1>
      <div className="search light-search">
        <input
          value={q}
          onChange={(e) => setSp(e.target.value ? { q: e.target.value } : {}, { replace: true })}
          placeholder={t('searchPh')}
          aria-label={t('search')}
        />
      </div>
      <div className="chips" role="group" aria-label={t('searchBy')}>
        {MODES.map(([m, key]) => (
          <button key={m} className={`chip ${mode === m ? 'on' : ''}`} onClick={() => setMode(m)} aria-pressed={mode === m}>
            {t(key)}
          </button>
        ))}
      </div>
      {classes.length > 1 && (
        <select value={cls} onChange={(e) => setCls(e.target.value)} aria-label={t('classFilter')}>
          <option value="">{t('classFilter')}</option>
          {classes.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      )}
      {mode === 'maker' && <p className="small muted">{t('makerHint')}</p>}
      {error && <p className="alert">{t('loadError')}</p>}
      {items === null && <p>{t('loading')}</p>}
      {items && items.length === 0 && !error && <p className="muted">{t('noApproved')}</p>}
      {items && items.length > 0 && results.length === 0 && <p className="muted">{t('noResults')}</p>}
      <div className="grid">
        {results.map((m) => {
          const uses = pick(m.approvedUses, lang).split('\n')[0];
          const brands = m.brands.filter((b) => b.verified).map((b) => b.name);
          return (
            <Link key={m.id} to={`/medicine/${m.id}`} className="card link">
              <h3>{pick(m.genericName, lang)}</h3>
              {m.status !== 'approved' && <span className="badge pending_review">{t('unreviewed')}</span>}
              <p className="muted small">{pick(m.drugClass, lang)}</p>
              {uses && <p className="small">{uses.length > 150 ? uses.slice(0, 150) + '…' : uses}</p>}
              {brands.length > 0 && <p className="small muted">{brands.join(' · ')}</p>}
              <span className="more">{t('read')}</span>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
