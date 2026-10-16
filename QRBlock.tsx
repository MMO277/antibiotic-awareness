import { useLang } from './i18n';

export default function QRBlock({ id, name }: { id: string; name: string }) {
  const { lang } = useLang();
  const isAr = lang === 'ar';

  const fullUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}#/medicine/${id}`
    : `https://mmo277.github.io/antibiotic-awareness/#/medicine/${id}`;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(fullUrl)}`;

  return (
    <div
      className="card stack center"
      style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '14px',
        maxWidth: '240px',
      }}
    >
      <h4 style={{ margin: '0 0 8px', fontSize: '0.9rem', color: '#0b3c5d' }}>
        📱 {isAr ? 'امسح لفتح النشرة على الموبايل' : 'Scan to open on mobile'}
      </h4>
      <img
        src={qrImageUrl}
        alt={`QR code for ${name}`}
        style={{
          width: '130px',
          height: '130px',
          borderRadius: '8px',
          border: '1px solid #cbd5e1',
          background: '#fff',
          margin: '0 auto',
        }}
        loading="lazy"
      />
      <span className="small muted" style={{ fontSize: '0.78rem', marginTop: '6px', wordBreak: 'break-all' }}>
        #{id}
      </span>
    </div>
  );
}
