import { useEffect, useState } from 'react';
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { useLang } from './i18n';
import { QUESTIONS } from './quizData';
import { byAge, Dist, distribution, perQuestion, Resp, Row, toRow } from './researchStats';
import { pick } from './types';

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

const safeCell = (v: string) => (/^[=+\-@\t\r]/.test(v) ? `'${v}` : v);

export default function ResearchTab() {
  const { t, lang } = useLang();
  const [enabled, setEnabled] = useState(false);
  const [ref, setRef] = useState('');
  const [msg, setMsg] = useState('');
  const [rows, setRows] = useState<Row[] | null>(null);
  const [phase, setPhase] = useState<'all' | 'pre' | 'post'>('all');

  async function loadRows() {
    if (!db) {
      setRows([]);
      return;
    }
    try {
      const snap = await getDocs(collection(db, 'surveyResponses'));
      const surveyDocs = snap.docs.filter((d) => {
        const x = d.data();
        if (x.answers && typeof x.answers === 'object' && !Array.isArray(x.answers)) {
          if (x.answers._recordType === 'learning_analytics') return false;
        }
        return true;
      });

      setRows(
        surveyDocs.map((d) => {
          const x = d.data();
          const age = typeof x.age === 'number' ? x.age : null;
          let parsedAnswers: (number | null)[] = [];
          if (Array.isArray(x.answers)) {
            parsedAnswers = x.answers;
          } else if (x.answers && typeof x.answers === 'object') {
            parsedAnswers = QUESTIONS.map((_, idx) => {
              const val = (x.answers as Record<string, unknown>)[String(idx)];
              return typeof val === 'number' ? val : null;
            });
          }

          const r: Resp = {
            id: d.id,
            name: String(x.name ?? x.code ?? ''),
            age,
            phase: String(x.phase ?? ''),
            answers: parsedAnswers,
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
    if (!db) {
      setRows([]);
      return;
    }
    getDoc(doc(db, 'surveyConfig', 'main'))
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
    if (!db) return;
    const finalRef = ref.trim() || 'AMR-EDU-2026';
    if (enabled && !ref.trim()) {
      setRef(finalRef);
    }
    setMsg('');
    try {
      await setDoc(doc(db, 'surveyConfig', 'main'), {
        enabled,
        ethicsApprovalRef: finalRef,
      });
      setMsg(t('saved'));
    } catch {
      setMsg(t('actionFailed'));
    }
  }

  const filtered = (rows || []).filter((r) => phase === 'all' || r.phase === phase);
  const overall = distribution(filtered);
  const ageGroups = byAge(filtered);
  const qStats = perQuestion(filtered);

  function exportCSV() {
    if (!rows) return;
    const headers = ['ID', 'Name/Code', 'Age', 'Phase', 'Language', 'Score', ...QUESTIONS.map((_, i) => `Q${i + 1}`)];
    const lines = [headers.join(',')];
    rows.forEach((r) => {
      const line = [
        safeCell(r.id),
        safeCell(r.name || 'Anonymous'),
        r.age ?? '',
        r.phase,
        r.lang,
        r.score,
        ...r.answers.map((a) => (a === null ? '' : a)),
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`);
      lines.push(line.join(','));
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `research_responses_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function clearAll() {
    if (!db) return;
    if (!window.confirm(t('confirmDel'))) return;
    try {
      const snap = await getDocs(collection(db, 'surveyResponses'));
      const surveyDocs = snap.docs.filter((d) => {
        const x = d.data();
        return !(x.answers && typeof x.answers === 'object' && !Array.isArray(x.answers) && x.answers._recordType === 'learning_analytics');
      });
      await Promise.all(surveyDocs.map((d) => deleteDoc(doc(db!, 'surveyResponses', d.id))));
      setRows([]);
      setMsg(t('saved'));
    } catch {
      setMsg(t('actionFailed'));
    }
  }

  return (
    <div className="space-y-6">
      <div className="card space-y-4">
        <h2 className="text-xl font-bold">{t('tabResearch')}</h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <label className="flex items-center gap-2 cursor-pointer font-medium">
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="rounded text-emerald-600" />
            {t('resEnable')}
          </label>
          <div>
            <label className="block text-sm font-medium mb-1">{t('resEthics')}</label>
            <input
              type="text"
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              className="input-field"
              placeholder="e.g. REC/2025/1104"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={save} className="btn-primary">
            {t('save')}
          </button>
        </div>

        {msg && <p className="text-sm font-medium text-emerald-700">{msg}</p>}
      </div>

      <div className="card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-lg font-bold">{t('resStats')} ({filtered.length})</h3>
          <div className="flex items-center gap-2">
            <select value={phase} onChange={(e) => setPhase(e.target.value as 'all' | 'pre' | 'post')} className="input-field py-1">
              <option value="all">{t('resAll')}</option>
              <option value="pre">{t('pre')}</option>
              <option value="post">{t('post')}</option>
            </select>
            <button onClick={exportCSV} disabled={!rows || rows.length === 0} className="btn-secondary py-1 text-sm">
              {t('resExport')}
            </button>
            <button onClick={clearAll} disabled={!rows || rows.length === 0} className="btn-danger py-1 text-sm">
              {t('resDelete')}
            </button>
          </div>
        </div>

        {rows === null ? (
          <p className="text-gray-500">{t('loading')}</p>
        ) : filtered.length === 0 ? (
          <p className="text-gray-500">{t('resNoData')}</p>
        ) : (
          <div className="space-y-6">
            <div>
              <h4 className="font-bold mb-2">{t('resStats')}</h4>
              <Bars d={overall} />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {ageGroups.map(({ g, d: dist }) => (
                <div key={g.key} className="border p-3 rounded-lg">
                  <h5 className="font-semibold text-sm mb-1">{t('resByAge')}: {pick(g, lang)}</h5>
                  <Bars d={dist} />
                </div>
              ))}
            </div>

            <div>
              <h4 className="font-bold mb-2">{t('resByQ')}</h4>
              <div className="space-y-3">
                {qStats.map((pctCorrect, i) => {
                  const text = pick(QUESTIONS[i]?.q, lang);
                  const qDist: Dist = {
                    n: filtered.length,
                    know: pctCorrect,
                    partial: 0,
                    dont: Math.max(0, 100 - pctCorrect),
                    avg: pctCorrect,
                  };
                  return (
                    <div key={i} className="border-b pb-2">
                      <p className="text-xs font-medium mb-1">Q{i + 1}. {text} ({pctCorrect}%)</p>
                      <Bars d={qDist} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
