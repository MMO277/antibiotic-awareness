import { useState } from 'react';
import { useLang } from './i18n';
import { MYTHS } from './contentData';
import { pick, tr } from './types';
import Disclaimer from './Disclaimer';

export default function MythFact() {
  const { lang } = useLang();
  const L = (ar: string, en: string, fr?: string, es?: string, de?: string) => tr(lang, ar, en, fr, es, de);
  const [i, setI] = useState(0);
  const [ans, setAns] = useState<boolean | null>(null); // user's answer: true = "fact"
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const m = MYTHS[i];

  const answer = (v: boolean) => {
    if (ans !== null) return;
    setAns(v);
    if (v === m.isFact) setScore((s) => s + 1);
  };
  const next = () => {
    if (i + 1 >= MYTHS.length) setDone(true);
    else {
      setI(i + 1);
      setAns(null);
    }
  };
  const restart = () => {
    setI(0);
    setAns(null);
    setScore(0);
    setDone(false);
  };

  return (
    <main className="wrap narrow stack">
      <h1>{L('خرافة أم حقيقة؟', 'Myth or fact?', 'Mythe ou réalité ?', '¿Mito o realidad?', 'Mythos oder Fakt?')}</h1>
      <p className="muted">
        {L(
          'كل إجابة معها شرح ورابط للمصدر الرسمي. المحتوى مكتوب بصياغة المنصة استناداً للمصادر الطبية الموثقة.',
          'Every answer comes with an explanation and a link to the official source. The wording is the project’s own and is awaiting review by a qualified professional.',
          'Chaque réponse est accompagnée d’une explication et d’un lien vers la source officielle (CDC / MedlinePlus / OMS).',
          'Cada respuesta incluye una explicación y un enlace a la fuente oficial (CDC / MedlinePlus / OMS).',
          'Jede Antwort enthält eine fundierte Begründung und einen Link zur offiziellen Quelle (CDC / MedlinePlus / WHO).'
        )}
      </p>

      {done ? (
        <div className="card center">
          <h2>{L('نتيجتك', 'Your score', 'Votre score', 'Tu puntuación', 'Ihr Ergebnis')}</h2>
          <p className="big">{score} / {MYTHS.length}</p>
          <p className="small muted">
            {L(
              'هذا نشاط للتعلم الذاتي وليس أداة قياس معتمدة.',
              'This is a self-learning activity, not a validated measurement instrument.',
              'Il s’agit d’une activité d’auto-apprentissage éducative.',
              'Esta es una actividad de autoaprendizaje educativo.',
              'Dies ist eine interaktive Selbstlernübung zur Gesundheitsaufklärung.'
            )}
          </p>
          <button className="btn" onClick={restart}>
            {L('إعادة', 'Restart', 'Recommencer', 'Reiniciar', 'Neu starten')}
          </button>
        </div>
      ) : (
        <div className="card">
          <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={MYTHS.length} aria-valuenow={i + (ans !== null ? 1 : 0)}>
            <span style={{ width: `${((i + (ans !== null ? 1 : 0)) / MYTHS.length) * 100}%` }} />
          </div>
          <p className="muted small">
            {L('العبارة', 'Statement', 'Affirmation', 'Afirmación', 'Aussage')} {i + 1} / {MYTHS.length}
          </p>
          <h2>{pick(m.statement, lang)}</h2>
          <div className="row">
            <button className={`opt ${ans === null ? '' : m.isFact ? 'right' : ans === true ? 'bad' : ''}`} disabled={ans !== null} onClick={() => answer(true)}>
              {L('حقيقة', 'Fact', 'Réalité', 'Realidad', 'Fakt')}
            </button>
            <button className={`opt ${ans === null ? '' : !m.isFact ? 'right' : ans === false ? 'bad' : ''}`} disabled={ans !== null} onClick={() => answer(false)}>
              {L('خرافة', 'Myth', 'Mythe', 'Mito', 'Mythos')}
            </button>
          </div>
          {ans !== null && (
            <>
              <p className="why">
                <strong>
                  {m.isFact
                    ? L('حقيقة. ', 'Fact. ', 'Réalité. ', 'Realidad. ', 'Fakt. ')
                    : L('خرافة. ', 'Myth. ', 'Mythe. ', 'Mito. ', 'Mythos. ')}
                </strong>
                {pick(m.why, lang)}
              </p>
              <p className="small">
                {L('المصدر: ', 'Source: ', 'Source : ', 'Fuente: ', 'Quelle: ')}
                <a href={m.source.url} target="_blank" rel="noopener noreferrer">{m.source.title}</a>
                <span className="muted"> — {m.source.publisher}{m.source.date ? `, ${m.source.date}` : ''}</span>
              </p>
              <button className="btn" onClick={next}>
                {i + 1 >= MYTHS.length
                  ? L('إنهاء', 'Finish', 'Terminer', 'Finalizar', 'Beenden')
                  : L('التالي', 'Next', 'Suivant', 'Siguiente', 'Weiter')}
              </button>
            </>
          )}
        </div>
      )}
      <Disclaimer />
    </main>
  );
}
