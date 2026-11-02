import { useEffect, useState } from 'react';
import { useLang } from './i18n';
import { Question, getQuestionsByLevel } from './quizData';
import { pick, tr } from './types';
import { useAuth } from './authContext';
import { db, configured } from './firebase';
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import AmbassadorCertificateModal, { CertificateRecord } from './AmbassadorCertificateModal';
import { saveQuizQuestionsLive, useLiveQuizQuestions } from './liveCatalogSync';
import { QuestionEditorModal } from './SurveyQuizEditor';

type Level = 'easy' | 'medium' | 'hard';
type Screen = 'pick' | 'quiz' | 'result';

interface WrongAnswer {
  question: Question;
  chosen: number;
}

const LEVEL_INFO = {
  easy: {
    emoji: '🌱',
    color: '#16a34a',
    bg: '#dcfce7',
    border: '#86efac',
    labelAr: 'مبتدئ',
    labelEn: 'Beginner',
    labelFr: 'Débutant',
    labelEs: 'Principiante',
    labelDe: 'Anfänger',
    descAr: 'أساسيات الوعي بالمضادات الحيوية',
    descEn: 'Antibiotic awareness basics',
    descFr: 'Les bases de la sensibilisation aux antibiotiques',
    descEs: 'Conceptos básicos de conciencia sobre antibióticos',
    descDe: 'Grundlagen des Antibiotika-Bewusstseins',
    count: 8,
  },
  medium: {
    emoji: '⚗️',
    color: '#d97706',
    bg: '#fef3c7',
    border: '#fcd34d',
    labelAr: 'متوسط',
    labelEn: 'Intermediate',
    labelFr: 'Intermédiaire',
    labelEs: 'Intermedio',
    labelDe: 'Fortgeschritten',
    descAr: 'مفاهيم أعمق عن المقاومة والاستخدام الصحيح',
    descEn: 'Deeper concepts on resistance & correct use',
    descFr: 'Concepts approfondis sur la résistance et bon usage',
    descEs: 'Conceptos más profundos sobre resistencia y uso correcto',
    descDe: 'Vertiefte Konzepte zu Resistenzen & sachgerechter Anwendung',
    count: 8,
  },
  hard: {
    emoji: '🔬',
    color: '#dc2626',
    bg: '#fee2e2',
    border: '#fca5a5',
    labelAr: 'متقدم',
    labelEn: 'Advanced',
    labelFr: 'Avancé',
    labelEs: 'Avanzado',
    labelDe: 'Experte',
    descAr: 'معرفة سريرية وعلمية متخصصة',
    descEn: 'Specialist clinical & scientific knowledge',
    descFr: 'Connaissances cliniques et scientifiques spécialisées',
    descEs: 'Conocimiento clínico y científico especializado',
    descDe: 'Klinisches & wissenschaftliches Fachwissen',
    count: 8,
  },
};

const LOCAL_CERTS_KEY = 'aa_saved_certificates_v1';

function getOrCreateAnonUid(): string {
  try {
    let anonId = localStorage.getItem('aa_anon_id');
    if (!anonId) {
      anonId = 'anon_' + Math.random().toString(36).slice(2, 10) + Date.now();
      localStorage.setItem('aa_anon_id', anonId);
    }
    return anonId;
  } catch {
    return 'anon_guest';
  }
}

function loadLocalCertificates(): CertificateRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_CERTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocalCertificate(cert: CertificateRecord): CertificateRecord[] {
  try {
    const existing = loadLocalCertificates();
    const filtered = existing.filter((c) => c.certNumber !== cert.certNumber);
    const updated = [cert, ...filtered].slice(0, 30);
    localStorage.setItem(LOCAL_CERTS_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [cert];
  }
}

function getBestScore(level: Level): number {
  try {
    return parseInt(localStorage.getItem(`quiz_best_${level}`) || '0', 10);
  } catch {
    return 0;
  }
}

function saveBestScoreLocal(level: Level, score: number) {
  try {
    const prev = getBestScore(level);
    if (score > prev) {
      localStorage.setItem(`quiz_best_${level}`, String(score));
    }
  } catch {}
}

function makeCertSerial(level: Level, uid: string): string {
  const lvlCode = level === 'hard' ? 'ADV' : level === 'medium' ? 'INT' : 'FND';
  const shortUid = uid.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() || 'USER';
  const timePart = Date.now().toString(36).slice(-4).toUpperCase();
  return `AMR-${lvlCode}-${shortUid}-${timePart}`;
}

export default function Quiz() {
  const { t, lang } = useLang();
  const isAr = lang === 'ar';
  const { user, role } = useAuth();
  const canEditLive = role === 'editor' || role === 'reviewer' || role === 'admin';
  const { questions: liveAllQuestions } = useLiveQuizQuestions();
  const [editingGlobalIdx, setEditingGlobalIdx] = useState<number | null>(null);
  const [addingNewQ, setAddingNewQ] = useState(false);

  const [screen, setScreen] = useState<Screen>('pick');
  const [level, setLevel] = useState<Level>('easy');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswer[]>([]);
  const [showReview, setShowReview] = useState(false);
  const [saved, setSaved] = useState(false);

  // Cloud + Local Certificates State
  const [certificates, setCertificates] = useState<CertificateRecord[]>(() => loadLocalCertificates());
  const [loadingCloudCerts, setLoadingCloudCerts] = useState(false);
  const [activeCertificate, setActiveCertificate] = useState<CertificateRecord | null>(null);
  const [latestEarnedCert, setLatestEarnedCert] = useState<CertificateRecord | null>(null);
  const [customRecipientName, setCustomRecipientName] = useState<string>(() => {
    try {
      return localStorage.getItem('aa_cert_recipient_name') || '';
    } catch {
      return '';
    }
  });

  const effectiveUid = user ? user.uid : getOrCreateAnonUid();
  const defaultRecipientName =
    customRecipientName.trim() ||
    (user && user.displayName ? user.displayName : '') ||
    (user && user.email ? user.email.split('@')[0] : '') ||
    (isAr ? 'سفير الوعي الدوائي' : 'Stewardship Ambassador');

  // Sync user's past passed certificates from Firestore `quizResults` + local cache
  useEffect(() => {
    const localList = loadLocalCertificates();
    setCertificates(localList);

    if (!configured || !db || !user) return;
    let mounted = true;
    setLoadingCloudCerts(true);

    const q = query(collection(db, 'quizResults'), where('uid', '==', user.uid));
    getDocs(q)
      .then((snap) => {
        if (!mounted) return;
        const cloudCerts: CertificateRecord[] = [];
        snap.docs.forEach((d) => {
          const data = d.data();
          if (data.passed) {
            const createdDate =
              data.createdAt && typeof data.createdAt.toDate === 'function'
                ? data.createdAt.toDate().toISOString()
                : typeof data.issuedAtIso === 'string'
                ? data.issuedAtIso
                : new Date().toISOString();
            const lvl: Level =
              data.level === 'hard' || data.level === 'medium' ? data.level : 'easy';
            cloudCerts.push({
              id: d.id,
              certNumber:
                typeof data.certNumber === 'string' && data.certNumber
                  ? data.certNumber
                  : `AMR-${lvl.toUpperCase().slice(0, 3)}-${d.id.slice(0, 6).toUpperCase()}`,
              recipientName:
                typeof data.recipientName === 'string' && data.recipientName
                  ? data.recipientName
                  : typeof data.displayName === 'string' && data.displayName
                  ? data.displayName
                  : defaultRecipientName,
              level: lvl,
              score: Number(data.score || 0),
              total: Number(data.total || 8),
              percentage: Number(data.percentage || 75),
              issuedAtIso: createdDate,
            });
          }
        });

        // Merge cloud certificates with local certificates without duplicates
        const mergedMap = new Map<string, CertificateRecord>();
        [...cloudCerts, ...loadLocalCertificates()].forEach((c) => {
          mergedMap.set(c.certNumber, c);
        });
        const merged = Array.from(mergedMap.values()).sort(
          (a, b) => new Date(b.issuedAtIso).getTime() - new Date(a.issuedAtIso).getTime()
        );
        setCertificates(merged);
        try {
          localStorage.setItem(LOCAL_CERTS_KEY, JSON.stringify(merged.slice(0, 30)));
        } catch {}
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoadingCloudCerts(false);
      });

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  const startQuiz = (lvl: Level) => {
    setLevel(lvl);
    const liveByLvl = liveAllQuestions.filter((item) => item.level === lvl);
    const qs = liveByLvl.length > 0 ? liveByLvl : getQuestionsByLevel(lvl);
    setQuestions(qs);
    setCurrentIdx(0);
    setSelectedOpt(null);
    setScore(0);
    setShowExplanation(false);
    setWrongAnswers([]);
    setShowReview(false);
    setSaved(false);
    setLatestEarnedCert(null);
    setScreen('quiz');
  };

  const handleSelect = (idx: number) => {
    if (selectedOpt !== null) return;
    setSelectedOpt(idx);
    setShowExplanation(true);
    const q = questions[currentIdx];
    if (idx === q.answer) {
      setScore((s) => s + 1);
    } else {
      setWrongAnswers((prev) => [...prev, { question: q, chosen: idx }]);
    }
  };

  const handleNext = () => {
    setSelectedOpt(null);
    setShowExplanation(false);

    if (currentIdx + 1 < questions.length) {
      setCurrentIdx((i) => i + 1);
    } else {
      setScreen('result');
    }
  };

  // Save result & generate cloud/local certificate when result screen appears
  useEffect(() => {
    if (screen !== 'result' || saved) return;
    const total = questions.length;
    if (total === 0) return;

    saveBestScoreLocal(level, score);

    const pct = Math.round((score / total) * 100);
    const isPassed = score / total >= 0.75;
    const certNumber = makeCertSerial(level, effectiveUid);
    const nowIso = new Date().toISOString();

    let newCert: CertificateRecord | null = null;
    if (isPassed) {
      newCert = {
        id: certNumber,
        certNumber,
        recipientName: defaultRecipientName,
        level,
        score,
        total,
        percentage: pct,
        issuedAtIso: nowIso,
      };
      setLatestEarnedCert(newCert);
      const updatedLocal = saveLocalCertificate(newCert);
      setCertificates(updatedLocal);
    }

    if (configured && db) {
      addDoc(collection(db, 'quizResults'), {
        uid: effectiveUid,
        isAnonymous: user ? user.isAnonymous : true,
        displayName: user?.displayName || customRecipientName.trim() || null,
        recipientName: defaultRecipientName,
        certNumber: isPassed ? certNumber : null,
        level,
        score,
        total,
        percentage: pct,
        passed: isPassed,
        issuedAtIso: nowIso,
        createdAt: serverTimestamp(),
      }).catch((e) => console.error('Quiz save error:', e));
    }

    setSaved(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  const handleUpdateCertificateName = (newName: string) => {
    setCustomRecipientName(newName);
    try {
      localStorage.setItem('aa_cert_recipient_name', newName);
    } catch {}
    if (activeCertificate) {
      const updatedCert = { ...activeCertificate, recipientName: newName };
      setActiveCertificate(updatedCert);
      const updatedList = saveLocalCertificate(updatedCert);
      setCertificates(updatedList);
      if (latestEarnedCert && latestEarnedCert.certNumber === updatedCert.certNumber) {
        setLatestEarnedCert(updatedCert);
      }
    }
  };

  const handleRestart = () => startQuiz(level);
  const handleBackToPick = () => setScreen('pick');

  const info = LEVEL_INFO[level];
  const total = questions.length;
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  const passed = pct >= 75;

  // ── LEVEL PICKER & SAVED CLOUD CERTIFICATES VAULT ──
  if (screen === 'pick') {
    return (
      <main className="wrap narrow stack">
        <h1>📝 {t('navQuiz')}</h1>
        <p className="muted">
          {tr(
            lang,
            'اختر مستوى الاختبار الذي يناسبك. عند اجتياز أي مستوى بنسبة 75% أو أكثر تحصل فوراً على «شهادة سفير الوعي بالمضادات الحيوية» وتُحفظ تلقائياً في حسابك السحابي للرجوع إليها في أي وقت.',
            'Choose your quiz level. Score 75% or higher to earn your official "Antibiotic Stewardship Ambassador Certificate", automatically saved to your cloud history.',
            'Choisissez votre niveau. Obtenez 75 % ou plus pour recevoir votre Certificat d’Ambassadeur sauvegardé dans le cloud.',
            'Elige tu nivel. Obtén 75% o más para ganar tu Certificado de Embajador guardado en la nube.'
          )}
        </p>

        {canEditLive && (
          <div className="card" style={{ border: '2px dashed #0284c7', background: 'var(--tint)' }}>
            <div className="head" style={{ flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <b>🛠️ {tr(lang, 'وضع المحرر/الأدمن: تعديل وإضافة أسئلة الاختبار والاستبيان', 'Editor Mode: Manage Quiz & Survey Questions')}</b>
                <p className="small muted" style={{ margin: '2px 0 0' }}>
                  {tr(lang, `إجمالي الأسئلة الحالية: ${liveAllQuestions.length} سؤالاً`, `Total live questions: ${liveAllQuestions.length}`)}
                </p>
              </div>
              <button type="button" className="btn small" onClick={() => setAddingNewQ(true)}>
                ➕ {tr(lang, 'إضافة سؤال جديد', 'Add Question')}
              </button>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gap: '14px' }}>
          {(['easy', 'medium', 'hard'] as Level[]).map((lvl) => {
            const d = LEVEL_INFO[lvl];
            const best = getBestScore(lvl);
            return (
              <button
                key={lvl}
                type="button"
                onClick={() => startQuiz(lvl)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '18px 20px',
                  background: d.bg,
                  border: `2px solid ${d.border}`,
                  borderRadius: '14px',
                  cursor: 'pointer',
                  textAlign: isAr ? 'right' : 'left',
                  transition: 'transform 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                <span style={{ fontSize: '2.2rem', flexShrink: 0 }}>{d.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <strong style={{ color: d.color, fontSize: '1.1rem' }}>
                      {lang === 'ar' ? d.labelAr : lang === 'fr' ? d.labelFr : lang === 'es' ? d.labelEs : d.labelEn}
                    </strong>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      ({d.count} {tr(lang, 'سؤال', 'questions', 'questions', 'preguntas')})
                    </span>
                    {best > 0 && (
                      <span style={{ fontSize: '0.75rem', background: d.color, color: '#fff', borderRadius: '20px', padding: '2px 8px' }}>
                        🏅 {tr(lang, 'أفضل:', 'Best:', 'Meilleur :', 'Mejor:')} {best}/{d.count}
                      </span>
                    )}
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: '#475569' }}>
                    {lang === 'ar' ? d.descAr : lang === 'fr' ? d.descFr : lang === 'es' ? d.descEs : d.descEn}
                  </p>
                </div>
                <span style={{ color: d.color, fontSize: '1.4rem', flexShrink: 0 }}>{isAr ? '←' : '→'}</span>
              </button>
            );
          })}
        </div>

        {/* Cloud & Local Saved Certificates Section ("شهاداتي المحفوظة") */}
        <section
          className="card stack"
          style={{
            marginTop: '12px',
            border: '1.5px solid rgba(14, 154, 167, 0.4)',
            background: 'linear-gradient(145deg, var(--card-bg) 0%, var(--tint) 100%)',
          }}
        >
          <div className="head">
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem' }}>
                🏅 {tr(lang, 'شهاداتي المحفوظة على السحابة', 'My Cloud-Saved Certificates', 'Mes Certificats Sauvegardés', 'Mis Certificados Guardados')}
              </h2>
              <p className="small muted" style={{ margin: '2px 0 0' }}>
                {user
                  ? tr(
                      lang,
                      'مرتبطة بحسابك السحابي — يمكنك فتح وتحميل أي شهادة حصلت عليها في أي وقت ومن أي جهاز:',
                      'Synced with your cloud account — view or download your earned certificates anytime:',
                      'Synchronisés avec votre compte cloud :',
                      'Sincronizados con tu cuenta en la nube:'
                    )
                  : tr(
                      lang,
                      'محفوظة على جهازك حالياً — سجّل الدخول لحفظ شهاداتك على السحابة والرجوع إليها من أي جهاز آخر:',
                      'Saved on this device — sign in to sync your certificates to the cloud across all devices:',
                      'Enregistrés sur cet appareil — connectez-vous pour synchroniser dans le cloud :',
                      'Guardados en este dispositivo — inicia sesión para sincronizar en la nube:'
                    )}
              </p>
            </div>
            <span className="badge approved">
              ☁️ {certificates.length} {tr(lang, 'شهادة', 'Certificates', 'Certificats', 'Certificados')}
            </span>
          </div>

          {loadingCloudCerts ? (
            <p className="small muted">⏳ {tr(lang, 'جارٍ مزامنة شهاداتك من السحابة...', 'Syncing certificates from cloud...', 'Synchronisation...', 'Sincronizando...')}</p>
          ) : certificates.length === 0 ? (
            <div className="subcard center" style={{ padding: '20px' }}>
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>
                🎓 {tr(lang, 'لم تحصل على شهادة بعد. ابدأ أي مستوى أعلاه واجتزه بنسبة 75%+ لإصدار شهادتك الرسمية فوراً!', 'No certificates yet. Complete any quiz level above with 75%+ to issue your official certificate!', 'Aucun certificat pour le moment. Réussissez un quiz avec 75 %+ !', '¡Aún no tienes certificados. Aprueba cualquier nivel con 75%+!')}
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '10px' }}>
              {certificates.map((c) => {
                const lvl = LEVEL_INFO[c.level] || LEVEL_INFO.easy;
                const dateStr = new Date(c.issuedAtIso).toLocaleDateString(
                  isAr ? 'ar-EG' : 'en-GB',
                  { day: '2-digit', month: 'short', year: 'numeric' }
                );
                return (
                  <div
                    key={c.certNumber}
                    className="card rowcard"
                    style={{
                      padding: '12px 16px',
                      border: `1.5px solid ${lvl.border}`,
                      background: 'var(--card-bg)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '1.8rem' }}>🏅</span>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <b>{c.recipientName}</b>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              background: lvl.bg,
                              color: lvl.color,
                              padding: '2px 8px',
                              borderRadius: '999px',
                              fontWeight: 700,
                            }}
                          >
                            {lvl.emoji} {isAr ? lvl.labelAr : lvl.labelEn} ({c.percentage}%)
                          </span>
                        </div>
                        <div className="small muted">
                          📅 {dateStr} • <code style={{ fontSize: '0.75rem' }}>{c.certNumber}</code>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn small"
                      onClick={() => setActiveCertificate(c)}
                      style={{ background: '#0b3c5d', borderColor: '#0b3c5d', color: '#fde047' }}
                    >
                      📜 {tr(lang, 'عرض وتحميل الشهادة', 'View & Download', 'Voir & Télécharger', 'Ver y Descargar')}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {(addingNewQ || editingGlobalIdx !== null) && (
          <QuestionEditorModal
            question={editingGlobalIdx !== null ? liveAllQuestions[editingGlobalIdx] : null}
            questionIndex={editingGlobalIdx}
            defaultLevel={level}
            uid={user?.uid || 'editor'}
            onClose={() => {
              setAddingNewQ(false);
              setEditingGlobalIdx(null);
            }}
          />
        )}

        {activeCertificate && (
          <AmbassadorCertificateModal
            cert={activeCertificate}
            onClose={() => setActiveCertificate(null)}
            onUpdateName={handleUpdateCertificateName}
          />
        )}
      </main>
    );
  }

  const q = questions[currentIdx];
  const progress = (currentIdx / total) * 100;

  // ── RESULT SCREEN ──
  if (screen === 'result') {
    return (
      <main className="wrap narrow stack">
        <div
          className="card stack center"
          style={{
            padding: '32px 20px',
            background: passed ? '#f0fdf4' : '#fefce8',
            border: `2px solid ${passed ? '#86efac' : '#fcd34d'}`,
          }}
        >
          <div style={{ fontSize: '3.5rem', marginBottom: '8px' }}>
            {pct === 100 ? '🏆' : passed ? '🎉' : '📚'}
          </div>
          <h2 style={{ margin: '0 0 8px', color: passed ? '#15803d' : '#92400e' }}>
            {passed
              ? tr(lang, 'أحسنت! اجتزت الاختبار واستحققت الشهادة', 'Well done! You passed & earned a Certificate', 'Bravo ! Vous avez réussi', '¡Bien hecho! Aprobaste')
              : tr(lang, 'حاول مرة أخرى للحصول على الشهادة (75%+)', 'Try again to earn your certificate (75%+)', 'Réessayez (75 %+ requis)', 'Inténtalo de nuevo (75%+)')}
          </h2>

          {/* Score circle */}
          <div
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              background: passed ? '#dcfce7' : '#fef3c7',
              border: `4px solid ${passed ? '#22c55e' : '#f59e0b'}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '12px auto',
            }}
          >
            <span style={{ fontSize: '1.6rem', fontWeight: 800, color: passed ? '#15803d' : '#92400e' }}>
              {score}/{total}
            </span>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{pct}%</span>
          </div>

          <span
            style={{
              background: info.color,
              color: '#fff',
              borderRadius: '20px',
              padding: '3px 12px',
              fontSize: '0.82rem',
              marginBottom: '8px',
            }}
          >
            {info.emoji} {lang === 'ar' ? info.labelAr : lang === 'de' ? (info as any).labelDe || info.labelEn : lang === 'fr' ? info.labelFr : lang === 'es' ? info.labelEs : info.labelEn}
          </span>

          {/* Saved indicator */}
          {saved && (
            <p style={{ fontSize: '0.8rem', color: '#0f766e', fontWeight: 600, margin: '4px 0 8px' }}>
              ☁️{' '}
              {tr(
                lang,
                'تم حفظ نتيجتك وشهادتك في السحابة للرجوع إليها في أي وقت',
                'Your result & certificate have been saved to the cloud',
                'Résultat et certificat enregistrés dans le cloud',
                'Resultado y certificado guardados en la nube'
              )}
              {user && !user.isAnonymous && user.displayName ? ` (${user.displayName})` : ''}
            </p>
          )}

          {/* Prominent Issue / View Certificate CTA when Passed */}
          {passed && latestEarnedCert && (
            <div
              style={{
                background: 'linear-gradient(135deg, #061a29 0%, #0b3c5d 100%)',
                color: '#ffffff',
                padding: '18px',
                borderRadius: '14px',
                border: '2px solid #fbbf24',
                margin: '8px auto 16px',
                maxWidth: '480px',
                width: '100%',
                boxShadow: '0 10px 25px rgba(11, 60, 93, 0.25)',
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '4px' }}>🏅</div>
              <h3 style={{ margin: '0 0 6px', color: '#fde047', fontSize: '1.08rem' }}>
                {tr(lang, 'شهادة سفير الوعي بالمضادات الحيوية جاهزة!', 'Your Stewardship Ambassador Certificate is Ready!', 'Votre Certificat d’Ambassadeur est Prêt !', '¡Tu Certificado de Embajador está Listo!')}
              </h3>
              <p style={{ margin: '0 0 12px', fontSize: '0.84rem', color: '#cbd5e1' }}>
                {tr(
                  lang,
                  'افتح شهادتك الرسمية بالاسم ورمز الـ QR وحمّلها كصورة عالية الجودة أو شاركها مع أصدقائك:',
                  'Open your official certificate with your name and QR code to download in HD or share:',
                  'Ouvrez votre certificat officiel avec QR code pour le télécharger en HD :',
                  'Abre tu certificado oficial con código QR para descargarlo en HD:'
                )}
              </p>
              <button
                type="button"
                className="btn"
                onClick={() => setActiveCertificate(latestEarnedCert)}
                style={{
                  background: '#fbbf24',
                  borderColor: '#fbbf24',
                  color: '#041018',
                  fontWeight: 800,
                  width: '100%',
                }}
              >
                📜 {tr(lang, 'فتح وتحميل الشهادة الآن', 'Open & Download Certificate Now', 'Ouvrir & Télécharger le Certificat', 'Abrir y Descargar Certificado')}
              </button>
            </div>
          )}

          <div className="row" style={{ justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn"
              onClick={handleRestart}
              style={{ background: info.color, color: '#fff', border: 'none' }}
            >
              🔄 {tr(lang, 'إعادة الاختبار', 'Retake Quiz', 'Recommencer', 'Repetir')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={handleBackToPick}
              style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1' }}
            >
              🏠 {tr(lang, 'قائمة المستويات وشهاداتي المحفوظة', 'Levels & My Saved Certificates', 'Niveaux & Mes Certificats', 'Niveles y Mis Certificados')}
            </button>
          </div>

          {/* Wrong answers review */}
          {wrongAnswers.length > 0 && (
            <div style={{ width: '100%', marginTop: '24px' }}>
              <button
                type="button"
                onClick={() => setShowReview((v) => !v)}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#fff7ed',
                  border: '1px solid #fed7aa',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  color: '#c2410c',
                  fontSize: '0.95rem',
                }}
              >
                {showReview ? '▲' : '▼'}{' '}
                {tr(
                  lang,
                  `مراجعة ${wrongAnswers.length} إجابة خاطئة`,
                  `Review ${wrongAnswers.length} wrong answer${wrongAnswers.length > 1 ? 's' : ''}`,
                  `Revoir ${wrongAnswers.length} mauvaise${wrongAnswers.length > 1 ? 's' : ''} réponse${wrongAnswers.length > 1 ? 's' : ''}`,
                  `Revisar ${wrongAnswers.length} respuesta${wrongAnswers.length > 1 ? 's' : ''} incorrecta${wrongAnswers.length > 1 ? 's' : ''}`
                )}
              </button>
              {showReview && (
                <div style={{ display: 'grid', gap: '12px', marginTop: '12px' }}>
                  {wrongAnswers.map((w, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '14px',
                        background: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        textAlign: isAr ? 'right' : 'left',
                      }}
                    >
                      <p style={{ fontWeight: 700, margin: '0 0 8px', color: '#1e293b', fontSize: '0.95rem' }}>
                        ❓ {pick(w.question.q, lang)}
                      </p>
                      <p style={{ margin: '0 0 4px', color: '#dc2626', fontSize: '0.88rem' }}>
                        ✗ {tr(lang, 'إجابتك:', 'Your answer:', 'Votre réponse :', 'Tu respuesta:')}{' '}
                        {pick(w.question.options[w.chosen], lang)}
                      </p>
                      <p style={{ margin: '0 0 8px', color: '#16a34a', fontSize: '0.88rem' }}>
                        ✓ {tr(lang, 'الصواب:', 'Correct:', 'Correct :', 'Correcto:')}{' '}
                        {pick(w.question.options[w.question.answer], lang)}
                      </p>
                      <div
                        style={{
                          padding: '10px 12px',
                          background: '#f0f9ff',
                          borderRadius: '8px',
                          border: '1px solid #bae6fd',
                        }}
                      >
                        <b style={{ color: '#0369a1', fontSize: '0.82rem' }}>
                          💡 {tr(lang, 'التوضيح الطبي:', 'Clinical Explanation:', 'Explication médicale :', 'Explicación clínica:')}
                        </b>
                        <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#0c4a6e', lineHeight: 1.6 }}>
                          {pick(w.question.why, lang)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {(addingNewQ || editingGlobalIdx !== null) && (
          <QuestionEditorModal
            question={editingGlobalIdx !== null ? liveAllQuestions[editingGlobalIdx] : null}
            questionIndex={editingGlobalIdx}
            defaultLevel={level}
            uid={user?.uid || 'editor'}
            onClose={() => {
              setAddingNewQ(false);
              setEditingGlobalIdx(null);
            }}
          />
        )}

        {activeCertificate && (
          <AmbassadorCertificateModal
            cert={activeCertificate}
            onClose={() => setActiveCertificate(null)}
            onUpdateName={handleUpdateCertificateName}
          />
        )}
      </main>
    );
  }

  // ── QUIZ SCREEN ──
  return (
    <main className="wrap narrow stack">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={handleBackToPick}
          style={{
            background: 'none',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            padding: '5px 12px',
            cursor: 'pointer',
            fontSize: '0.85rem',
            color: '#64748b',
          }}
        >
          {isAr ? '← رجوع' : '← Back'}
        </button>
        <span
          style={{
            background: info.bg,
            color: info.color,
            border: `1px solid ${info.border}`,
            borderRadius: '20px',
            padding: '3px 12px',
            fontSize: '0.82rem',
            fontWeight: 600,
          }}
        >
          {info.emoji} {lang === 'ar' ? info.labelAr : lang === 'de' ? (info as any).labelDe || info.labelEn : lang === 'fr' ? info.labelFr : lang === 'es' ? info.labelEs : info.labelEn}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ background: '#e2e8f0', borderRadius: '99px', height: '8px', overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${progress}%`,
            background: info.color,
            borderRadius: '99px',
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      <div className="card stack" style={{ padding: '20px' }}>
        <div className="head" style={{ marginBottom: '8px' }}>
          <span className="badge" style={{ background: info.bg, color: info.color }}>
            {tr(
              lang,
              `السؤال ${currentIdx + 1} من ${total}`,
              `Question ${currentIdx + 1} of ${total}`,
              `Question ${currentIdx + 1} sur ${total}`,
              `Pregunta ${currentIdx + 1} de ${total}`
            )}
          </span>
          <span className="small muted">
            ✅ {tr(lang, `النتيجة: ${score}`, `Score: ${score}`, `Score : ${score}`, `Puntuación: ${score}`)}
          </span>
        </div>

        <div className="head" style={{ alignItems: 'flex-start', gap: '8px', marginBottom: '12px' }}>
          <h3 style={{ margin: 0, color: 'var(--navy)', fontSize: '1.1rem', lineHeight: 1.5, flex: 1 }}>
            {pick(q.q, lang)}
          </h3>
          {canEditLive && (
            <div className="row" style={{ gap: '6px' }}>
              <button
                type="button"
                className="btn small ghost"
                onClick={() => {
                  const gIdx = liveAllQuestions.findIndex((item) => item.q.ar === q.q.ar || item.q.en === q.q.en);
                  if (gIdx !== -1) setEditingGlobalIdx(gIdx);
                  else setAddingNewQ(true);
                }}
              >
                ✏️ {tr(lang, 'تعديل السؤال', 'Edit')}
              </button>
              <button
                type="button"
                className="btn small"
                onClick={() => setAddingNewQ(true)}
              >
                ➕
              </button>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gap: '8px' }}>
          {q.options.map((opt, optIdx) => {
            let bg = '#ffffff';
            let borderColor = 'var(--line)';
            let icon = '';
            if (selectedOpt !== null) {
              if (optIdx === q.answer) {
                bg = '#dcfce7';
                borderColor = '#22c55e';
                icon = '✓ ';
              } else if (optIdx === selectedOpt) {
                bg = '#fee2e2';
                borderColor = '#ef4444';
                icon = '✗ ';
              }
            }
            return (
              <button
                key={optIdx}
                type="button"
                onClick={() => handleSelect(optIdx)}
                disabled={selectedOpt !== null}
                style={{
                  padding: '12px 16px',
                  textAlign: isAr ? 'right' : 'left',
                  background: bg,
                  border: `2px solid ${borderColor}`,
                  borderRadius: '10px',
                  cursor: selectedOpt !== null ? 'default' : 'pointer',
                  fontSize: '0.95rem',
                  color: 'var(--ink)',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span
                  style={{
                    fontWeight: 700,
                    color: borderColor === 'var(--line)' ? '#94a3b8' : borderColor,
                    flexShrink: 0,
                  }}
                >
                  {icon || String.fromCharCode(65 + optIdx) + '.'}
                </span>
                {pick(opt, lang)}
              </button>
            );
          })}
        </div>

        {showExplanation && (
          <div
            style={{
              marginTop: '16px',
              padding: '14px 16px',
              borderRadius: '10px',
              border: '1px solid #bae6fd',
              background: '#f0f9ff',
            }}
          >
            <b style={{ color: '#0369a1', display: 'block', marginBottom: '6px', fontSize: '0.9rem' }}>
              💡 {tr(lang, 'التوضيح الطبي:', 'Clinical Explanation:', 'Explication médicale :', 'Explicación clínica:')}
            </b>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#0c4a6e', lineHeight: 1.65 }}>
              {pick(q.why, lang)}
            </p>
          </div>
        )}

        {selectedOpt !== null && (
          <div className="row" style={{ justifyContent: 'flex-end', marginTop: '12px' }}>
            <button
              type="button"
              onClick={handleNext}
              className="btn"
              style={{ background: info.color, color: '#fff', border: 'none' }}
            >
              {currentIdx + 1 < total
                ? tr(lang, 'السؤال التالي ←', 'Next Question →', 'Question suivante →', 'Siguiente →')
                : tr(lang, 'عرض النتيجة والشهادة 🏆', 'View Result & Certificate 🏆', 'Voir le résultat 🏆', 'Ver resultado 🏆')}
            </button>
          </div>
        )}
      </div>
      {(addingNewQ || editingGlobalIdx !== null) && (
        <QuestionEditorModal
          question={editingGlobalIdx !== null ? liveAllQuestions[editingGlobalIdx] : null}
          questionIndex={editingGlobalIdx}
          defaultLevel={level}
          uid={user?.uid || 'editor'}
          onClose={() => {
            setAddingNewQ(false);
            setEditingGlobalIdx(null);
          }}
        />
      )}
    </main>
  );
}
