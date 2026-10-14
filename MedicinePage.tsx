import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLang } from './i18n';
import { fetchOne } from './medicinesApi';
import { FIELD_LABELS, Medicine, pick, TextField } from './types';
import StatusBadge from './StatusBadge';
import QRBlock from './QRBlock';
import Disclaimer from './Disclaimer';

const ORDER: TextField[] = [
  'approvedUses',
  'priceEgypt',
  'substitutes',
  'mechanism',
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
            {t('lastReviewed')}: <b>{m.lastReviewed || '2026-10-13'}</b>
          </span>
          {m.reviewedBy && (
            <span>
              {t('reviewedBy')}: <b>{m.reviewedBy}</b>
            </span>
          )}
        </div>
      </header>

      {/* Prominent QR & Barcode Card for mobile and box scanning */}
      <section className="card highlight-card qr-top-card">
        <div className="qr-top-flex">
          <div>
            <h2>📱 {lang === 'ar' ? 'رمز QR للمشاركة وباركود العلبة المعتمد' : 'Medicine QR & Official Barcode'}</h2>
            <p className="small muted">
              {lang === 'ar'
                ? 'امسح رمز QR لفتح ومشاركة صفحة الدواء على هاتفك فوراً، أو استخدم صفحة «مسح QR والباركود» لمسح باركود العلبة المصري (سواء الباركود الخطي أو كود العلبة المربع GS1 DataMatrix).'
                : 'Scan this QR code to view and share this medicine page, or use the Scan page to scan the official Egyptian box barcode (EAN-13 or GS1 DataMatrix).'}
            </p>
            {brands.length > 0 && brands[0].barcode && (
              <div style={{ marginTop: '8px' }}>
                <span className="small muted">{lang === 'ar' ? 'باركود العلبة الأحدث: ' : 'Latest Carton Barcode: '}</span>
                <code style={{ fontSize: '1.05rem', fontWeight: 600 }}>{brands[0].barcode}</code>
                <span className="small muted"> ({brands[0].name})</span>
              </div>
            )}
          </div>
          <div className="qr-box-preview">
            <QRBlock id={m.id} name={name} />
          </div>
        </div>
      </section>

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
          {ORDER.filter((f) => FIELD_LABELS[f]).map((f) => {
            const v = pick(m[f], lang);
            if (!v) return null;
            const isHighlight = f === 'priceEgypt' || f === 'substitutes';
            return (
              <section key={f} className={`card ${isHighlight ? 'highlight-card' : ''}`}>
                <h2>
                  {f === 'priceEgypt' && <span>💰 </span>}
                  {f === 'substitutes' && <span>🔄 </span>}
                  {FIELD_LABELS[f][lang]}
                </h2>
                <p className="pre">{v}</p>
                {f === 'dosingReference' && <p className="small muted">{t('dosingNote')}</p>}
              </section>
            );
          })}

          <section className="card">
            <h2>{lang === 'ar' ? 'الأسماء التجارية والباركود المعتمد للعلبة في مصر' : t('brands')}</h2>
            {brands.length === 0 ? (
              <p className="muted">—</p>
            ) : (
              <div className="tablewrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>{t('brandName')}</th>
                      <th>{t('manufacturer')}</th>
                      <th>{lang === 'ar' ? 'باركود العلبة (EAN-13)' : t('barcode')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {brands.map((b, i) => (
                      <tr key={i}>
                        <td>
                          <b>{b.name}</b> {!b.verified && <span className="badge draft">{t('unverified')}</span>}
                        </td>
                        <td>{b.manufacturer || '—'}</td>
                        <td dir="ltr">
                          <code>{b.barcode || '—'}</code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="small muted" style={{ marginTop: '8px' }}>
              {lang === 'ar'
                ? '💡 يمكنك توجيه كاميرا الهاتف من صفحة «مسح QR والباركود» نحو الباركود الخطي (الخطوط الطولية على ظهر العلبة) لفتح هذه الصفحة وتفاصيل الدواء فوراً.'
                : '💡 You can scan the linear box barcode (stripes on the back) with your camera on the Scan page to open this record instantly.'}
            </p>
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
      </div>
    </main>
  );
}
