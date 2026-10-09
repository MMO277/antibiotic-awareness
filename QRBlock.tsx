import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { useLang } from './i18n';
import { medicineUrl } from './medicinesApi';

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

export default function QRBlock({ id, name }: { id: string; name: string }) {
  const { t } = useLang();
  const url = medicineUrl(id);
  const [img, setImg] = useState('');

  useEffect(() => {
    QRCode.toDataURL(url, {
      width: 640,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#0B3C5D', light: '#FFFFFF' },
    })
      .then(setImg)
      .catch(() => setImg(''));
  }, [url]);

  function print() {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(
      `<html><head><title>${esc(name)}</title><style>body{font-family:sans-serif;text-align:center;padding:40px}img{width:320px;height:320px}p{word-break:break-all}</style></head>` +
        `<body><h2>${esc(name)}</h2><img src="${img}" alt="QR"/><p>${esc(url)}</p><p>Antibiotic Awareness – educational use only</p>` +
        `<script>window.onload=function(){window.print()}<\/script></body></html>`,
    );
    w.document.close();
  }

  if (!img) return null;
  return (
    <section className="card qr">
      <h2>{t('qrTitle')}</h2>
      <img src={img} alt={`QR ${name}`} width={220} height={220} />
      <div className="row">
        <a className="btn" href={img} download={`qr-${id}.png`}>
          {t('qrDownload')}
        </a>
        <button className="btn ghost" onClick={print}>
          {t('qrPrint')}
        </button>
      </div>
    </section>
  );
}
