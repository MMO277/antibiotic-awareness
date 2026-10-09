import { useEffect, useState } from 'react';
import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { useLang } from './i18n';
import { QUESTIONS } from './quizData';

export default function ResearchTab() {
  const { t } = useLang();
  const [enabled, setEnabled] = useState(false);
  const [ref, setRef] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    getDoc(doc(db, 'researchConfig', 'main'))
      .then((s) => {
        if (s.exists()) {
          setEnabled(!!s.data().enabled);
          setRef(String(s.data().ethicsApprovalRef ?? ''));
        }
      })
      .catch(() => {});
  }, []);

  async function save() {
    if (enabled && !ref.trim()) {
      setMsg(t('resAdminNote'));
      return;
    }
    try {
      await setDoc(doc(db, 'researchConfig', 'main'), { enabled, ethicsApprovalRef: ref.trim() });
      setMsg(t('resSaved'));
    } catch {
      setMsg(t('actionFailed'));
    }
  }

  async function exportCsv() {
    const snap = await getDocs(collection(db, 'researchResponses'));
    const rows: string[][] = [['code', 'phase', 'lang', 'score', ...QUESTIONS.map((_, i) => `q${i + 1}`)]];
    snap.docs.forEach((d) => {
      const x = d.data();
      const ans: number[] = Array.isArray(x.answers) ? x.answers : [];
      const score = ans.filter((a, i) => QUESTIONS[i] && a === QUESTIONS[i].answer).length;
      rows.push([String(x.code), String(x.phase), String(x.lang), String(score), ...ans.map(String)]);
    });
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'research-responses.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="stack">
      <p className="alert">{t('resAdminNote')}</p>
      <div className="card form">
        <label className="check">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          {t('resEnable')}
        </label>
        <label htmlFor="eth">{t('resEthics')}</label>
        <input id="eth" value={ref} onChange={(e) => setRef(e.target.value)} />
        <div className="row">
          <button className="btn" onClick={save}>{t('save')}</button>
          <button className="btn ghost" onClick={exportCsv}>{t('resExport')}</button>
        </div>
        {msg && <p className="muted">{msg}</p>}
      </div>
    </div>
  );
}
