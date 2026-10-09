import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { useLang } from './i18n';
import { useApproved } from './medicinesApi';

export default function Scan() {
  const { t } = useLang();
  const nav = useNavigate();
  const { items } = useApproved();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [running, setRunning] = useState(false);
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
    const hit = items?.find((x) => x.barcodes.includes(clean));
    if (hit) {
      stop();
      nav(`/medicine/${hit.id}`);
    } else {
      setMsg(t('scanNoMatch'));
    }
  }
  const handleRef = useRef(handle);
  handleRef.current = handle;

  async function start() {
    setMsg('');
    try {
      const s = new Html5Qrcode('reader');
      scannerRef.current = s;
      await s.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 260, height: 160 } },
        (text) => handleRef.current(text),
        () => {},
      );
      setRunning(true);
    } catch {
      scannerRef.current = null;
      setMsg(t('cameraError'));
    }
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
      <div className="row">
        {!running ? (
          <button className="btn" onClick={start}>{t('scanStart')}</button>
        ) : (
          <button className="btn ghost" onClick={stop}>{t('scanStop')}</button>
        )}
      </div>
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
