import { Link, useSearchParams } from 'react-router-dom';
import { useLang } from './i18n';
import { useApproved } from './medicinesApi';
import { searchMeds } from './search';
import { pick } from './types';

export default function Medicines() {
  const { t, lang } = useLang();
  const [sp, setSp] = useSearchParams();
  const q = sp.get('q') ?? '';
  const { items, error } = useApproved();
  const results = items ? searchMeds(items, q) : [];

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
      {error && <p className="alert">{t('loadError')}</p>}
      {items === null && <p>{t('loading')}</p>}
      {items && items.length === 0 && !error && <p className="muted">{t('noApproved')}</p>}
      {items && items.length > 0 && results.length === 0 && <p className="muted">{t('noResults')}</p>}
      <div className="grid">
        {results.map((m) => (
          <Link key={m.id} to={`/medicine/${m.id}`} className="card link">
            <h3>{pick(m.genericName, lang)}</h3>
            <p className="muted">{pick(m.drugClass, lang)}</p>
            {m.brands.some((b) => b.verified) && (
              <p className="small">{m.brands.filter((b) => b.verified).map((b) => b.name).join('، ')}</p>
            )}
          </Link>
        ))}
      </div>
    </main>
  );
}
