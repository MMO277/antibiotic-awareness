import { useEffect, useState } from 'react';
import { collection, deleteDoc, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { useLang } from './i18n';
import { byAge, Dist, distribution, perQuestion, Resp, Row, toRow } from './researchStats';
import { pick } from './types';
import { useAuth } from './authContext';
import { saveSurveyConfigLive, useLiveQuizQuestions } from './liveCatalogSync';

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

interface RowWithSource extends Row {
  _col: 'surveyResponses' | 'researchResponses';
}

export default function ResearchTab() {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const { questions: liveQuestions, surveyConfig } = useLiveQuizQuestions();
  const [enabled, setEnabled] = useState(surveyConfig?.enabled ?? true);
  const [ref, setRef] = useState(surveyConfig?.ethicsApprovalRef ?? 'AMR-EDU-2026');
  const [msg, setMsg] = useState('');
  const [rows, setRows] = useState<RowWithSource[] | null>(null);
  const [phase, setPhase] = useState<'all' | 'pre' | 'post'>('all');

  async function loadRows() {
    if (!db) {
      setRows([]);
      return;
    }
    try {
      const [snapSurvey, snapResearch] = await Promise.all([
        getDocs(collection(db, 'surveyResponses')).catch(() => null),
        getDocs(collection(db, 'researchResponses')).catch(() => null),
      ]);

      const combined: { id: string; data: Record<string, unknown>; col: 'surveyResponses' | 'researchResponses' }[] = [];
      const seenIds = new Set<string>();

      if (snapSurvey) {
        snapSurvey.docs.forEach((d) => {
          const x = d.data();
          if (x.answers && typeof x.answers === 'object' && !Array.isArray(x.answers)) {
            if ((x.answers as Record<string, unknown>)._recordType === 'learning_analytics') return;
          }
          seenIds.add(d.id);
          combined.push({ id: d.id, data: x, col: 'surveyResponses' });
        });
      }

      if (snapResearch) {
        snapResearch.docs.forEach((d) => {
          if (seenIds.has(d.id)) return;
          const x = d.data();
          if (x.answers && typeof x.answers === 'object' && !Array.isArray(x.answers)) {
            if ((x.answers as Record<string, unknown>)._recordType === 'learning_analytics') return;
          }
          combined.push({ id: d.id, data: x, col: 'researchResponses' });
        });
      }

      setRows(
        combined.map(({ id, data: x, col }) => {
          const rawAge = typeof x.age === 'number' ? x.age : Number(x.age);
          const age = Number.isFinite(rawAge) && rawAge > 0 ? rawAge : null;
          let parsedAnswers: (number | null)[] = [];
          if (Array.isArray(x.answers)) {
            parsedAnswers = x.answers.map((v) => (typeof v === 'number' ? v : Number.isFinite(Number(v)) && v !== null && v !== '' ? Number(v) : null));
          } else if (x.answers && typeof x.answers === 'object') {
            parsedAnswers = liveQuestions.map((_, idx) => {
              const val = (x.answers as Record<string, unknown>)[String(idx)];
              if (typeof val === 'number') return val;
              if (typeof val === 'string' && val.trim() !== '' && Number.isFinite(Number(val))) return Number(val);
              return null;
            });
          }

          const r: Resp = {
            id,
            name: String(x.name ?? x.code ?? x.participantName ?? ''),
            age,
            phase: String(x.phase ?? 'pre'),
            answers: parsedAnswers,
            lang: String(x.lang ?? 'ar'),
          };
          return { ...toRow(r), _col: col };
        }),
      );
    } catch {
      setRows([]);
      setMsg(t('loadError'));
    }
  }

  useEffect(() => {
    if (surveyConfig) {
      setEnabled(surveyConfig.enabled);
      setRef(surveyConfig.ethicsApprovalRef || 'AMR-EDU-2026');
    } else if (db) {
      Promise.all([
        getDoc(doc(db, 'surveyConfig', 'main')).catch(() => null),
        getDoc(doc(db, 'researchConfig', 'main')).catch(() => null),
      ]).then(([s1, s2]) => {
        if (s1 && s1.exists()) {
          setEnabled(!!s1.data().enabled);
          setRef(String(s1.data().ethicsApprovalRef ?? 'AMR-EDU-2026'));
        } else if (s2 && s2.exists()) {
          setEnabled(!!s2.data().enabled);
          setRef(String(s2.data().ethicsApprovalRef ?? 'AMR-EDU-2026'));
        }
      });
    }
    loadRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surveyConfig]);

  async function save() {
    const finalRef = ref.trim() || 'AMR-EDU-2026';
    if (enabled && !ref.trim()) {
      setRef(finalRef);
    }
    setMsg('');
    try {
      await saveSurveyConfigLive(
        { enabled, ethicsApprovalRef: finalRef },
        user?.uid || 'editor'
      );
      setMsg(t('resSaved') || t('saved'));
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
    const headers = ['ID', 'Name/Code', 'Age', 'Phase', 'Language', 'Score', ...liveQuestions.map((_, i) => `Q${i + 1}`)];
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

  async function removeOne(r: RowWithSource) {
    if (!db) return;
    if (!window.confirm(t('confirmDel'))) return;
    try {
      await deleteDoc(doc(db, r._col, r.id));
      setRows((prev) => (prev ? prev.filter((item) => item.id !== r.id) : prev));
    } catch {
      setMsg(t('actionFailed'));
    }
  }

  async function clearAll() {
    if (!db || !rows) return;
    if (!window.confirm(t('confirmDel'))) return;
    try {
      await Promise.all(rows.map((r) => deleteDoc(doc(db!, r._col, r.id))));
      setRows([]);
      setMsg(t('resSaved') || t('saved'));
    } catch {
      setMsg(t('actionFailed'));
    }
  }

  return (
    <div className="stack">
      <div className="card form">
        <h2>{t('tabResearch')}</h2>
        <p className="small muted">{t('resAdminNote')}</p>

        <label className="check" style={{ alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            style={{ width: '18px', height: '18px', margin: 0 }}
          />
          <span>{t('resEnable')}</span>
        </label>

        <label htmlFor="ethics-ref">{t('resEthics')}</label>
        <input
          id="ethics-ref"
          type="text"
          dir="ltr"
          value={ref}
          onChange={(e) => setRef(e.target.value)}
          placeholder="e.g. REC/2025/1104"
        />

        <div className="row">
          <button type="button" onClick={save} className="btn">
            {t('save')}
          </button>
        </div>

        {msg && <p className="small" style={{ color: 'var(--ok)', fontWeight: 600, margin: 0 }}>{msg}</p>}
      </div>

      <div className="card stack">
        <div className="head">
          <h3 style={{ margin: 0 }}>{t('resStats')} ({filtered.length})</h3>
          <div className="row wrapRow">
            <select
              value={phase}
              onChange={(e) => setPhase(e.target.value as 'all' | 'pre' | 'post')}
              style={{ width: 'auto' }}
            >
              <option value="all">{t('resAll')}</option>
              <option value="pre">{t('pre')}</option>
              <option value="post">{t('post')}</option>
            </select>
            <button type="button" onClick={exportCSV} disabled={!rows || rows.length === 0} className="btn small ghost">
              📥 {t('resExport')}
            </button>
            <button type="button" onClick={clearAll} disabled={!rows || rows.length === 0} className="btn small danger">
              🗑️ {t('resDelete')}
            </button>
          </div>
        </div>

        {rows === null ? (
          <p className="muted">{t('loading')}</p>
        ) : filtered.length === 0 ? (
          <p className="muted">{t('resNoData')}</p>
        ) : (
          <div className="stack">
            <div className="subcard">
              <div className="head">
                <span><b>{t('resRespondents')}:</b> {overall.n}</span>
                <span><b>{t('resAvg')}:</b> {overall.avg}%</span>
              </div>
              <Bars d={overall} />
              <p className="small muted" style={{ margin: 0 }}>{t('resMethodNote')}</p>
            </div>

            {ageGroups.length > 0 && (
              <div className="stack">
                <h3 style={{ margin: 0 }}>{t('resByAge')}</h3>
                <div className="grid">
                  {ageGroups.map(({ g, d: dist }) => (
                    <div key={g.key} className="subcard">
                      <b>{pick(g, lang)} ({dist.n})</b>
                      <Bars d={dist} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="stack">
              <h3 style={{ margin: 0 }}>{t('resByQ')}</h3>
              {qStats.map((pctCorrect, i) => {
                const text = pick(liveQuestions[i]?.q, lang);
                const qDist: Dist = {
                  n: filtered.length,
                  know: pctCorrect,
                  partial: 0,
                  dont: Math.max(0, 100 - pctCorrect),
                  avg: pctCorrect,
                };
                return (
                  <div key={i} className="subcard">
                    <div className="head">
                      <span className="small"><b>Q{i + 1}.</b> {text}</span>
                      <span className="badge approved">{pctCorrect}%</span>
                    </div>
                    <Bars d={qDist} />
                  </div>
                );
              })}
            </div>

            <div className="tablewrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>{t('resColName')}</th>
                    <th>{t('resColAge')}</th>
                    <th>{t('resPhase')}</th>
                    <th>{t('resColScore')}</th>
                    <th>{t('resColLevel')}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={`${r._col}_${r.id}`}>
                      <td>{r.name || '—'}</td>
                      <td>{r.age ?? '—'}</td>
                      <td>{r.phase === 'pre' ? t('pre') : r.phase === 'post' ? t('post') : r.phase}</td>
                      <td><b>{r.score}/{r.total}</b> ({r.pct}%)</td>
                      <td>
                        <span className={`badge ${r.level === 'know' ? 'approved' : r.level === 'partial' ? 'pending_review' : ''}`}>
                          {r.level === 'know' ? t('lvlKnow') : r.level === 'partial' ? t('lvlPartial') : t('lvlDont')}
                        </span>
                      </td>
                      <td>
                        <button type="button" className="btn small danger" onClick={() => removeOne(r)}>
                          {t('del')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
