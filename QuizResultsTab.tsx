import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { useLang } from './i18n';
import { tr } from './types';

interface QuizResult {
  id: string;
  uid: string;
  isAnonymous: boolean;
  displayName: string | null;
  level: 'easy' | 'medium' | 'hard';
  score: number;
  total: number;
  percentage: number;
  passed: boolean;
  createdAt: { toDate: () => Date } | null;
}

const LEVEL_LABELS: Record<string, { ar: string; en: string; color: string; emoji: string }> = {
  easy:   { ar: 'مبتدئ',  en: 'Beginner',     color: '#16a34a', emoji: '🌱' },
  medium: { ar: 'متوسط',  en: 'Intermediate', color: '#d97706', emoji: '⚗️' },
  hard:   { ar: 'متقدم',  en: 'Advanced',     color: '#dc2626', emoji: '🔬' },
};

export default function QuizResultsTab() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const [results, setResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterLevel, setFilterLevel] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');

  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, 'quizResults'),
      orderBy('createdAt', 'desc'),
      limit(200)
    );
    getDocs(q)
      .then((snap) => {
        setResults(
          snap.docs.map((d) => ({ id: d.id, ...d.data() } as QuizResult))
        );
      })
      .catch(() => setError(tr(lang, 'خطأ في تحميل النتائج', 'Error loading results', 'Erreur de chargement', 'Error al cargar')))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filterLevel === 'all' ? results : results.filter((r) => r.level === filterLevel);

  // Stats
  const total = filtered.length;
  const passed = filtered.filter((r) => r.passed).length;
  const avgPct = total > 0 ? Math.round(filtered.reduce((s, r) => s + r.percentage, 0) / total) : 0;
  const uniqueUsers = new Set(filtered.map((r) => r.uid)).size;

  if (loading) return (
    <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
      ⏳ {tr(lang, 'جارٍ التحميل...', 'Loading...', 'Chargement...', 'Cargando...')}
    </div>
  );

  if (error) return (
    <div style={{ padding: '20px', color: '#dc2626' }}>{error}</div>
  );

  return (
    <div style={{ display: 'grid', gap: '20px' }}>

      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
        {[
          { label: tr(lang, 'إجمالي المحاولات', 'Total Attempts', 'Total tentatives', 'Total intentos'), value: total, color: '#0284c7', emoji: '📊' },
          { label: tr(lang, 'مستخدمون مختلفون', 'Unique Users', 'Utilisateurs uniques', 'Usuarios únicos'), value: uniqueUsers, color: '#7c3aed', emoji: '👥' },
          { label: tr(lang, 'نجحوا', 'Passed', 'Réussis', 'Aprobaron'), value: passed, color: '#16a34a', emoji: '✅' },
          { label: tr(lang, 'متوسط النتيجة', 'Avg Score', 'Score moyen', 'Puntuación media'), value: `${avgPct}%`, color: '#d97706', emoji: '🎯' },
        ].map((s, i) => (
          <div key={i} style={{ padding: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.6rem' }}>{s.emoji}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {(['all', 'easy', 'medium', 'hard'] as const).map((lvl) => (
          <button
            key={lvl}
            type="button"
            onClick={() => setFilterLevel(lvl)}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: '1px solid',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: filterLevel === lvl ? 700 : 400,
              background: filterLevel === lvl ? (lvl === 'all' ? '#0284c7' : LEVEL_LABELS[lvl]?.color) : '#f1f5f9',
              color: filterLevel === lvl ? '#fff' : '#475569',
              borderColor: filterLevel === lvl ? 'transparent' : '#cbd5e1',
            }}
          >
            {lvl === 'all'
              ? tr(lang, 'الكل', 'All', 'Tous', 'Todos')
              : `${LEVEL_LABELS[lvl].emoji} ${isAr ? LEVEL_LABELS[lvl].ar : LEVEL_LABELS[lvl].en}`}
          </button>
        ))}
      </div>

      {/* Results table */}
      {filtered.length === 0 ? (
        <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
          {tr(lang, 'لا توجد نتائج بعد', 'No results yet', 'Aucun résultat', 'Sin resultados aún')}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', color: '#475569' }}>
                {[
                  tr(lang, 'المستخدم', 'User', 'Utilisateur', 'Usuario'),
                  tr(lang, 'المستوى', 'Level', 'Niveau', 'Nivel'),
                  tr(lang, 'النتيجة', 'Score', 'Score', 'Puntuación'),
                  tr(lang, 'النسبة', 'Pct', '%', '%'),
                  tr(lang, 'الحالة', 'Status', 'Statut', 'Estado'),
                  tr(lang, 'التاريخ', 'Date', 'Date', 'Fecha'),
                ].map((h, i) => (
                  <th key={i} style={{ padding: '10px 12px', textAlign: isAr ? 'right' : 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const lvlInfo = LEVEL_LABELS[r.level];
                const dateStr = r.createdAt
                  ? r.createdAt.toDate().toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })
                  : '—';
                const userName = r.displayName
                  ? r.displayName
                  : r.isAnonymous
                  ? tr(lang, 'زائر', 'Guest', 'Visiteur', 'Invitado')
                  : r.uid.slice(0, 8) + '…';
                return (
                  <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '')}>
                    <td style={{ padding: '10px 12px', color: '#334155' }}>
                      {r.isAnonymous ? '👤 ' : '🔐 '}{userName}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        background: lvlInfo?.color + '20',
                        color: lvlInfo?.color,
                        borderRadius: '20px',
                        padding: '2px 10px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                      }}>
                        {lvlInfo?.emoji} {isAr ? lvlInfo?.ar : lvlInfo?.en}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: '#1e293b' }}>
                      {r.score}/{r.total}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '50px', height: '6px', background: '#e2e8f0', borderRadius: '99px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${r.percentage}%`, background: r.passed ? '#22c55e' : '#f59e0b', borderRadius: '99px' }} />
                        </div>
                        <span style={{ fontSize: '0.82rem', color: '#64748b' }}>{r.percentage}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        background: r.passed ? '#dcfce7' : '#fef3c7',
                        color: r.passed ? '#15803d' : '#92400e',
                        borderRadius: '20px',
                        padding: '2px 10px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                      }}>
                        {r.passed
                          ? tr(lang, 'ناجح ✓', 'Passed ✓', 'Réussi ✓', 'Aprobado ✓')
                          : tr(lang, 'راسب ✗', 'Failed ✗', 'Échoué ✗', 'Reprobado ✗')}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#94a3b8', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                      {dateStr}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
