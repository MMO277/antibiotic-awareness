import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLang } from './i18n';
import { fetchOne, findLocalMedicine } from './medicinesApi';
import { FIELD_LABELS, Medicine, pick, TextField } from './types';
import StatusBadge from './StatusBadge';
import QRBlock from './QRBlock';
import Disclaimer from './Disclaimer';
import { ACTIVE_INGREDIENTS, EGYPTIAN_COMMERCIAL_PRODUCTS } from './egyptianDrugDatabase';

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
  const isAr = lang === 'ar';

  // Initialize synchronously from local verified database so it opens in 0ms and never fails
  const [m, setM] = useState<Medicine | null | undefined>(() => findLocalMedicine(id) ?? undefined);

  useEffect(() => {
    const localMed = findLocalMedicine(id);
    if (localMed) {
      setM(localMed);
    } else {
      setM(undefined);
    }
    fetchOne(id)
      .then((res) => {
        if (res) setM(res);
        else if (!localMed) setM(null);
      })
      .catch(() => {
        if (!localMed) setM(null);
      });
  }, [id]);

  const commercialPackages = useMemo(
    () => (m ? EGYPTIAN_COMMERCIAL_PRODUCTS.filter((p) => p.activeIngredientId === m.id) : []),
    [m]
  );

  const ingMeta = useMemo(
    () => (m ? ACTIVE_INGREDIENTS.find((a) => a.id === m.id) : undefined),
    [m]
  );

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
      <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/medicines">← {t('navMedicines')}</Link>
        <div className="row" style={{ gap: '8px' }}>
          <Link to="/allergy-checker" className="btn ghost small">
            🛡️ {isAr ? 'فحص الحساسية الدوائية' : 'Allergy Safety Check'}
          </Link>
          <Link to="/interactions" className="btn ghost small">
            ⚡ {isAr ? 'فحص التفاعلات' : 'Interactions Check'}
          </Link>
        </div>
      </div>

      <header className="med-head">
        <div className="row wrapRow" style={{ alignItems: 'center', gap: '10px' }}>
          <h1 style={{ margin: 0 }}>{name}</h1>
          {ingMeta && (
            <span
              className="badge"
              style={{
                background:
                  ingMeta.whoAccessGroup === 'Access'
                    ? '#dcfce7'
                    : ingMeta.whoAccessGroup === 'Reserve'
                    ? '#fee2e2'
                    : '#fef3c7',
                color:
                  ingMeta.whoAccessGroup === 'Access'
                    ? '#166534'
                    : ingMeta.whoAccessGroup === 'Reserve'
                    ? '#991b1b'
                    : '#92400e',
                fontWeight: 700,
              }}
            >
              WHO AWaRe: {ingMeta.whoAccessGroup} ({ingMeta.atcCode})
            </span>
          )}
        </div>
        <p className="muted">{pick(m.drugClass, lang)}</p>
        <div className="meta">
          <StatusBadge status={m.status} />
          <span>
            {t('lastReviewed')}: <b>{m.lastReviewed || '2026-10-14'}</b>
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
            <h2>📱 {isAr ? 'رمز QR للمشاركة وباركود العلبة المعتمد' : 'Medicine QR & Official Barcode'}</h2>
            <p className="small muted">
              {isAr
                ? 'امسح رمز QR لفتح ومشاركة صفحة الدواء على هاتفك فوراً، أو استخدم صفحة «مسح QR والباركود» لمسح الباركود الخطي المطبوع على ظهر العلبة المصرية.'
                : 'Scan this QR code to view and share this medicine page, or use the Scan page to scan the official Egyptian linear box barcode.'}
            </p>
            {brands.length > 0 && brands[0].barcode && (
              <div style={{ marginTop: '8px' }}>
                <span className="small muted">{isAr ? 'باركود العلبة الأحدث: ' : 'Latest Carton Barcode: '}</span>
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
          {/* Commercial Packages & Alternatives Table in Egyptian Market */}
          {commercialPackages.length > 0 && (
            <section className="card highlight-card">
              <h2>
                🇪🇬{' '}
                {isAr
                  ? `جميع العبوات والمستحضرات والبدائل المسجلة في السوق المصري (${commercialPackages.length} عبوة)`
                  : `Registered Commercial Packages & Alternatives in Egypt (${commercialPackages.length})`}
              </h2>
              <p className="small muted">
                {isAr
                  ? 'قائمة تفصيلية بجميع التركيزات والأشكال الصيدلانية والشركات المصنعة والأسعار الرسمية والباركود الخطي لكل عبوة:'
                  : 'Detailed breakdown of all strengths, dosage forms, manufacturers, official EGP prices, and linear barcodes:'}
              </p>
              <div className="tablewrap" style={{ marginTop: '10px' }}>
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>{isAr ? 'الاسم التجاري' : 'Trade Name'}</th>
                      <th>{isAr ? 'التركيز والشكل' : 'Strength & Form'}</th>
                      <th>{isAr ? 'العبوة والشركة' : 'Package & Maker'}</th>
                      <th>{isAr ? 'السعر الرسمي' : 'Price (EGP)'}</th>
                      <th>{isAr ? 'الباركود الخطي (EAN-13)' : 'Linear Barcode'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commercialPackages.map((pkg) => (
                      <tr key={pkg.productId}>
                        <td>
                          <b>{isAr ? pkg.tradeNameAr : pkg.tradeNameEn}</b>
                          <div className="small muted">{isAr ? pkg.tradeNameEn : pkg.tradeNameAr}</div>
                        </td>
                        <td>
                          <span dir="ltr"><b>{pkg.strength}</b></span>
                          <div className="small muted">{pkg.dosageFormLabel[lang]}</div>
                        </td>
                        <td>
                          <div>{pkg.packDetails[lang]}</div>
                          <div className="small muted">{pkg.manufacturer} ({pkg.countryOfOrigin})</div>
                        </td>
                        <td>
                          <b style={{ color: '#15803d' }}>
                            {pkg.priceEgp ? `${pkg.priceEgp.toFixed(2)} ${isAr ? 'ج.م' : 'EGP'}` : '—'}
                          </b>
                          <div className="small muted">{pkg.unitPriceNote[lang]}</div>
                        </td>
                        <td dir="ltr">
                          {pkg.barcode ? (
                            <code
                              style={{
                                background: '#f0fdf4',
                                color: '#15803d',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontWeight: 700,
                              }}
                            >
                              {pkg.barcode}
                            </code>
                          ) : (
                            <span className="small muted" dir="rtl">
                              {isAr ? 'قيد التحقق الميداني' : 'Pending field check'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="small muted" style={{ marginTop: '8px' }}>
                {isAr
                  ? '💡 يمكنك توجيه كاميرا الهاتف من صفحة «مسح QR والباركود» نحو الباركود الخطي (الخطوط الطولية على ظهر العلبة) لفتح هذه الصفحة وتفاصيل الدواء فوراً.'
                  : '💡 You can scan the linear box barcode (stripes on the back) with your camera on the Scan page to open this record instantly.'}
              </p>
            </section>
          )}

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
