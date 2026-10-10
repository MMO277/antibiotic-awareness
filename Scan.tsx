import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { useLang } from './i18n';
import { useApproved } from './medicinesApi';

export default function Scan() {
  const { t, lang } = useLang();
  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);
  const nav = useNavigate();
  const { items } = useApproved();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [running, setRunning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [manual, setManual] = useState('');

  async function stop() {
    const s = scannerRef.current;
    scannerRef.current = null;
    if (s) {
      try {
        await s.stop();
        s.clear();
      } catch {
        /* already stopped */
      }
    }
    setRunning(false);
  }

  function handle(text: string) {
    const clean = text.trim();
    // 1) our own QR codes: take ONLY the id and navigate inside this app
    const m = clean.match(/#\/medicine\/([a-z0-9-]+)/i);
    if (m) {
      stop();
      nav(`/medicine/${m[1].toLowerCase()}`);
      return;
    }
    // 2) barcodes: match ONLY verified products of approved records
    const hit = items?.find((x) => x.status === 'approved' && x.barcodes.includes(clean));
    if (hit) {
      stop();
      nav(`/medicine/${hit.id}`);
    } else {
      setMsg(t('scanNoMatch'));
    }
  }
  const handleRef = useRef(handle);
  handleRef.current = handle;

  function explain(e: unknown): string {
    const text = String((e as { name?: string; message?: string })?.name ?? '') + ' ' + String((e as { message?: string })?.message ?? e);
    if (!window.isSecureContext)
      return L('الكاميرا تعمل فقط على رابط آمن (https).', 'The camera only works on a secure (https) link.');
    if (/NotAllowed|Permission|denied/i.test(text))
      return L(
        'تم رفض إذن الكاميرا. اسمح للموقع باستخدام الكاميرا من إعدادات المتصفح ثم أعد المحاولة.',
        'Camera permission was denied. Allow the site to use the camera in your browser settings, then try again.',
      );
    if (/NotFound|no camera|Requested device/i.test(text))
      return L('لم يتم العثور على كاميرا في هذا الجهاز.', 'No camera was found on this device.');
    if (/NotReadable|in use|Could not start/i.test(text))
      return L('الكاميرا مستخدمة من تطبيق آخر. أغلق التطبيقات الأخرى وأعد المحاولة.', 'The camera is in use by another app. Close other apps and try again.');
    return t('cameraError');
  }

  async function start() {
    setMsg('');
    const config = {
      fps: 10,
      qrbox: (vw: number, vh: number) => ({
        width: Math.min(300, Math.floor(vw * 0.85)),
        height: Math.min(200, Math.floor(vh * 0.6)),
      }),
    };
    try {
      const s = new Html5Qrcode('reader', { verbose: false, useBarCodeDetectorIfSupported: true });
      scannerRef.current = s;
      try {
        // back camera first
        await s.start({ facingMode: 'environment' }, config, (text) => handleRef.current(text), () => {});
      } catch (first) {
        // some phones refuse the "environment" request: try the first camera in the list
        const cams = await Html5Qrcode.getCameras().catch(() => []);
        if (!cams.length) throw first;
        await s.start(cams[cams.length - 1].id, config, (text) => handleRef.current(text), () => {});
      }
      setRunning(true);
    } catch (e) {
      scannerRef.current = null;
      setMsg(explain(e));
    }
  }

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setMsg('');
    setBusy(true);
    try {
      if (scannerRef.current) await stop();
      const s = new Html5Qrcode('filereader', false);
      const text = await s.scanFile(file, false);
      try {
        s.clear();
      } catch {
        /* nothing to clear */
      }
      handleRef.current(text);
    } catch {
      setMsg(
        L(
          'لم أجد رمزًا في الصورة. صوّر الرمز عن قرب وبإضاءة جيدة وحاول مرة أخرى.',
          'No code was found in the photo. Take a close, well-lit photo of the code and try again.',
        ),
      );
    }
    setBusy(false);
  }

  useEffect(
    () => () => {
      const s = scannerRef.current;
      if (s) s.stop().then(() => s.clear()).catch(() => {});
    },
    [],
  );

  return (
    <main className="wrap narrow stack">
      <h1>{t('scanTitle')}</h1>
      <p className="muted">{t('scanHint')}</p>
      <div id="reader" className="reader" />
      <div id="filereader" style={{ display: 'none' }} />
      <div className="row wrapRow">
        {!running ? (
          <button className="btn" onClick={start}>{t('scanStart')}</button>
        ) : (
          <button className="btn ghost" onClick={stop}>{t('scanStop')}</button>
        )}
        <label className="btn ghost" style={{ cursor: 'pointer' }}>
          {busy ? t('loading') : L('مسح من صورة', 'Scan from a photo')}
          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={onFile} disabled={busy} />
        </label>
      </div>
      <p className="small muted">
        {L(
          'إذا لم تفتح الكاميرا، افتح الموقع في Chrome أو Safari (وليس من داخل تطبيق آخر)، أو استخدم «مسح من صورة».',
          'If the camera does not open, open the site in Chrome or Safari (not inside another app), or use “Scan from a photo”.',
        )}
      </p>
      {msg && <p className="alert">{msg}</p>}
      <div className="card">
        <label htmlFor="bc">{t('scanManual')}</label>
        <div className="row">
          <input id="bc" dir="ltr" inputMode="numeric" value={manual} onChange={(e) => setManual(e.target.value)} />
          <button className="btn" onClick={() => manual.trim() && handle(manual)}>{t('scanGo')}</button>
        </div>
      </div>
    </main>
  );
}
