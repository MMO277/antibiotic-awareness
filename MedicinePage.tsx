import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLang } from './i18n';
import { fetchOne } from './medicinesApi';
import { FIELD_LABELS, Medicine, pick, TextField } from './types';
import StatusBadge from './StatusBadge';
import QRBlock from './QRBlock';
import Disclaimer from './Disclaimer';

// patient-friendly order: what it is for, how often, side effects, guidance, then the details
const ORDER: TextField[] = [
  'approvedUses',
  'dosingReference',
  'sideEffects',
  'patientEducation',
  'contraindications',
  'interactions',
  'pregnancyBreastfeeding',
  'renalHepatic',
  'ageRestrictions',
  'strengths',
  'activeIngredients',
];

export default function MedicinePage() {
  const { id = '' } = useParams();
  const { t, lang } = useLang();
  const [m, setM] = useState<Medicine | null | undefined>(undefined);

  useEffect(() => {
    setM(undefined);
    fetchOne(id).then(setM);
  }, [id]);

  if (m === undefined) return <main className="wrap"><p>{t('loading')}</p></main>;
  if (m === null)
    return (
      <main className="wrap narrow">
        <p>{t('notFound')}</p>
        <Link to="/medicines">{t('navMedicines')}</Link>
      </main>
    );

  const approved = m.status === 'approved';
  const brands = approved ? m.brands.filter((b) => b.verified) : m.brands;
  const name = pick(m.genericName, lang);
  const uses = pick(m.approvedUses, lang).split('\n')[0];

  return (
    <main className="wrap stack">
      <Link to="/medicines">← {t('navMedicines')}</Link>
      <header className="med-head">
        <h1>{name}</h1>
        <p className="muted">{pick(m.drugClass, lang)}</p>
        <div className="meta">
          <StatusBadge status={m.status} />
          <span>
            {t('lastReviewed')}: <b>{m.lastReviewed || '—'}</b>
          </span>
          {m.reviewedBy && (
            <span>
              {t('reviewedBy')}: <b>{m.reviewedBy}</b>
            </span>
          )}
        </div>
      </header>

      {!approved && <p className="alert">{t('previewWarn')}</p>}

      {uses && (
        <section className="notice quick">
          <strong>{t('quickSummary')}: </strong>
          {uses}
        </section>
      )}

      <section className="alert urgent">
        <strong>{t('urgentTitle')} </strong>
        {t('urgentText')}
      </section>

      <div className="med-grid">
        <div className="stack">
          {ORDER.map((f) => {
            const v = pick(m[f], lang);
            return (
              <section key={f} className="card">
                <h2>{FIELD_LABELS[f][lang]}</h2>
                {v ? <p className="pre">{v}</p> : <p className="muted">{approved ? '—' : t('notEntered')}</p>}
                {f === 'dosingReference' && <p className="small muted">{t('dosingNote')}</p>}
              </section>
            );
          })}

          <section className="card">
            <h2>{t('brands')}</h2>
            {brands.length === 0 ? (
              <p className="muted">—</p>
            ) : (
              <div className="tablewrap">
                <table>
                  <thead>
                    <tr>
                      <th>{t('brandName')}</th>
                      <th>{t('manufacturer')}</th>
                      <th>{t('barcode')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {brands.map((b, i) => (
                      <tr key={i}>
                        <td>
                          {b.name} {!b.verified && <span className="badge draft">{t('unverified')}</span>}
                        </td>
                        <td>{b.manufacturer || '—'}</td>
                        <td dir="ltr">{b.barcode || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="card">
            <h2>{t('sources')}</h2>
            {m.sources.length === 0 ? (
              <p className="muted">{t('notEntered')}</p>
            ) : (
              <ul className="srclist">
                {m.sources.map((s, i) => (
                  <li key={i}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer">
                      {s.title}
                    </a>
                    <div className="small muted">
                      {[s.publisher, s.updated && `${t('updated')}: ${s.updated}`, s.accessed && `${t('accessed')}: ${s.accessed}`]
                        .filter(Boolean)
                        .join(' · ')}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <Disclaimer />
        </div>

        <aside>
          <QRBlock id={m.id} name={name} />
        </aside>
      </div>
    </main>
  );
}
