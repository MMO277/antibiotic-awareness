import { useEffect, useState } from 'react';
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { useLang } from './i18n';
import { QUESTIONS } from './quizData';
import { byAge, Dist, distribution, perQuestion, Resp, Row, toRow } from './researchStats';

function Bars({ d }: { d: Dist }) {
  const { t } = useLang();
  return (
    <div>
      <div className="pbar" role="img" aria-label={`${t('lvlKnow')} ${d.know}%, ${t('lvlPartial')} ${d.partial}%, ${t('lvlDont')} ${d.dont}%`}>
        <span className="know" style={{ width: `${d.know}%` }} />
        <span className="partial" style={{ width: `${d.partial}%` }} />
        <span className="dont" style={{ width: `${d.dont}%` }} />
      </div>
      <div className="legend">
        <span><i className="dot know" />{t('lvlKnow')}: <b>{d.know}%</b></span>
        <span><i className="dot partial" />{t('lvlPartial')}: <b>{d.partial}%</b></span>
        <span><i className="dot dont" />{t('lvlDont')}: <b>{d.dont}%</b></span>
      </div>
    </div>
  );
}

const safeCell = (v: string) => (/^[=+\-@\t\r]/.test(v) ? `'${v}` : v); // stop spreadsheet formula injection

export default function ResearchTab() {
  const { t, lang } = useLang();
  const [enabled, setEnabled] = useState(false);
  const [ref, setRef] = useState('');
  const [msg, setMsg] = useState('');
  const [rows, setRows] = useState<Row[] | null>(null);
  const [phase, setPhase] = useState<'all' | 'pre' | 'post'>('all');

  async function loadRows() {
    try {
      const snap = await getDocs(collection(db, 'researchResponses'));
      setRows(
        snap.docs.map((d) => {
          const x = d.data();
          const age = typeof x.age === 'number' ? x.age : null;
          const r: Resp = {
            id: d.id,
            name: String(x.name ?? x.code ?? ''), // older responses only have a random code
            age,
            phase: String(x.phase ?? ''),
            answers: Array.isArray(x.answers) ? x.answers : [],
            lang: String(x.lang ?? ''),
          };
          return toRow(r);
        }),
      );
    } catch {
      setRows([]);
      setMsg(t('loadError'));
    }
  }

  useEffect(() => {
    getDoc(doc(db, 'researchConfig', 'main'))
      .then((s) => {
        if (s.exists()) {
          setEnabled(!!s.data().enabled);
          setRef(String(s.data().ethicsApprovalRef ?? ''));
        }
      })
      .catch(() => {});
    loadRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  async function remove(r: Row) {
    if (!confirm(`${t('resDelete')}: ${r.name}`)) return;
    try {
      await deleteDoc(doc(db, 'researchResponses', r.id));
      await loadRows();
    } catch {
      setMsg(t('actionFailed'));
    }
  }

  const shown = (rows ?? []).filter((r) => phase === 'all' || r.phase === phase);
  const level = (r: Row) => t(r.level === 'know' ? 'lvlKnow' : r.level === 'partial' ? 'lvlPartial' : 'lvlDont');

  function exportCsv() {
    const head = ['name', 'age', 'phase', 'lang', 'score', 'total', 'percent', 'level', ...QUESTIONS.map((_, i) => `q${i + 1}`)];
    const body = shown.map((r) => [safeCell(r.name), r.age ?? '', r.phase, r.lang, r.score, r.total, r.pct, r.level, ...r.answers].map(String));
    const csv = [head, ...body].map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'research-responses.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  const dist = distribution(shown);
  const pq = perQuestion(shown);

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

      <div className="row" role="group" aria-label={t('resPhase')}>
        {(['all', 'pre', 'post'] as const).map((p) => (
          <button key={p} className={`btn small ${phase === p ? '' : 'ghost'}`} onClick={() => setPhase(p)}>
            {p === 'all' ? t('resAll') : t(p)}
          </button>
        ))}
      </div>

      {rows === null ? (
        <p>{t('loading')}</p>
      ) : shown.length === 0 ? (
        <p className="muted">{t('resNoData')}</p>
      ) : (
        <>
          <div className="card">
            <h2>{t('resStats')}</h2>
            <p>{t('resRespondents')}: <b>{dist.n}</b> · {t('resAvg')}: <b>{dist.avg}%</b></p>
            <Bars d={dist} />
            <p className="muted small">{t('resMethodNote')}</p>
          </div>

          <div className="card">
            <h2>{t('resByAge')}</h2>
            {byAge(shown).map(({ g, d }) => (
              <div key={g.key}>
                <p><b>{lang === 'ar' ? g.ar : g.en}</b> ({d.n})</p>
                <Bars d={d} />
              </div>
            ))}
            {shown.some((r) => r.age === null) && <p className="muted small">{t('resNoAge')}</p>}
          </div>

          <div className="card">
            <h2>{t('resByQ')}</h2>
            {QUESTIONS.map((_, i) => (
              <div key={i} className="row">
                <span>{t('question')} {i + 1}</span>
                <div className="pbar" style={{ flex: 1 }}><span className="know" style={{ width: `${pq[i]}%` }} /></div>
                <b>{pq[i]}%</b>
              </div>
            ))}
          </div>

          <div className="card tablewrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>{t('resColName')}</th><th>{t('resColAge')}</th><th>{t('resPhase')}</th><th>{t('resColScore')}</th><th>{t('resColLevel')}</th><th />
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.id}>
                    <td>{r.name}</td>
                    <td>{r.age ?? '—'}</td>
                    <td>{r.phase === 'pre' ? t('pre') : r.phase === 'post' ? t('post') : r.phase}</td>
                    <td>{r.score}/{r.total} ({r.pct}%)</td>
                    <td><i className={`dot ${r.level}`} />{level(r)}</td>
                    <td><button className="btn small danger" onClick={() => remove(r)}>{t('remove')}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
