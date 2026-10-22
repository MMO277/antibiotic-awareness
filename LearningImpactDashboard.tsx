import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db, configured } from './firebase';
import { useLang } from './i18n';
import { STEPS } from './contentData';
import { PairedAssessmentRecord } from './assessmentWorkflow';

export function LearningImpactDashboard() {
  const { lang } = useLang();
  const isAr = lang === 'ar';

  const [timeFilter, setTimeFilter] = useState<'7d' | '30d' | 'all'>('30d');
  const [topicFilter, setTopicFilter] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [records, setRecords] = useState<PairedAssessmentRecord[]>([]);
  const [events, setEvents] = useState<{ eventType: string; topicId: string; createdMs: number }[]>([]);

  // تحميل البيانات الحقيقية من Firestore
  useEffect(() => {
    async function fetchData() {
      if (!configured || !db) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const now = Date.now();
        const minMs =
          timeFilter === '7d'
            ? now - 7 * 86400000
            : timeFilter === '30d'
            ? now - 30 * 86400000
            : 0;

        // جلب سجلات التقييم القبلي والبعدي
        const assessRef = collection(db, 'assessmentPairs');
        const qAssess = query(
          assessRef,
          where('createdMs', '>=', minMs),
          orderBy('createdMs', 'desc'),
          limit(1000)
        );
        const assessSnap = await getDocs(qAssess);
        const loadedRecords: PairedAssessmentRecord[] = [];
        assessSnap.forEach((doc) => {
          loadedRecords.push({ pairId: doc.id, ...(doc.data() as PairedAssessmentRecord) });
        });
        setRecords(loadedRecords);

        // جلب أحداث الدروس والاختبارات
        const eventsRef = collection(db, 'learningAnalytics');
        const qEvents = query(
          eventsRef,
          where('createdMs', '>=', minMs),
          orderBy('createdMs', 'desc'),
          limit(2000)
        );
        const eventsSnap = await getDocs(qEvents);
        const loadedEvents: { eventType: string; topicId: string; createdMs: number }[] = [];
        eventsSnap.forEach((doc) => {
          loadedEvents.push(doc.data() as any);
        });
        setEvents(loadedEvents);
      } catch (err) {
        console.error('Error fetching impact analytics:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [timeFilter]);

  // تطبيق فلتر الموضوع
  const filteredRecords = useMemo(() => {
    if (topicFilter === 'all') return records;
    return records.filter((r) => r.topicId === topicFilter);
  }, [records, topicFilter]);

  const filteredEvents = useMemo(() => {
    if (topicFilter === 'all') return events;
    return events.filter((e) => e.topicId === topicFilter);
  }, [events, topicFilter]);

  // احتساب مؤشرات التعلم والمحتوى
  const analytics = useMemo(() => {
    const startedAttempts = filteredEvents.filter((e) => e.eventType === 'lesson_start').length;
    const completedAttempts = filteredEvents.filter((e) => e.eventType === 'lesson_complete').length;
    const lessonCompletionRate =
      startedAttempts > 0 ? Math.round((completedAttempts / startedAttempts) * 100) : 0;

    // حساب إحصائيات التقييم المقترن (Paired Sample)
    const totalPre = filteredRecords.length;
    const pairedCompleted = filteredRecords.filter(
      (r) => r.status === 'completed' && r.postScore !== undefined
    );
    const nPaired = pairedCompleted.length;
    const missingPostData = totalPre - nPaired;
    const attritionRate = totalPre > 0 ? Math.round((missingPostData / totalPre) * 100) : 0;

    // حجب البيانات إذا كانت العينة أقل من 5 مشاركين لحماية الخصوصية
    const isSuppressed = nPaired > 0 && nPaired < 5;

    let avgPre = 0;
    let avgPost = 0;
    let pointDiff = 0;
    let improvedPct = 0;

    if (nPaired >= 5) {
      const sumPre = pairedCompleted.reduce((acc, r) => acc + (r.preScore / r.preTotal) * 100, 0);
      const sumPost = pairedCompleted.reduce(
        (acc, r) => acc + ((r.postScore || 0) / (r.postTotal || 5)) * 100,
        0
      );
      avgPre = Math.round(sumPre / nPaired);
      avgPost = Math.round(sumPost / nPaired);
      pointDiff = avgPost - avgPre;

      const countImproved = pairedCompleted.filter((r) => (r.scoreDelta || 0) > 0).length;
      improvedPct = Math.round((countImproved / nPaired) * 100);
    }

    return {
      startedAttempts,
      completedAttempts,
      lessonCompletionRate,
      totalPre,
      nPaired,
      missingPostData,
      attritionRate,
      isSuppressed,
      avgPre,
      avgPost,
      pointDiff,
      improvedPct
    };
  }, [filteredEvents, filteredRecords]);

  // تصدير البيانات المجمعة الخالية من الهويات كملف CSV
  const handleExportCSV = () => {
    if (analytics.nPaired < 5 && analytics.startedAttempts < 5) {
      alert(
        isAr
          ? 'البيانات غير كافية للتصدير التراكمي (أقل من الحد الأدنى للخصوصية: 5 سجلات).'
          : 'Data cannot be exported (below minimum privacy threshold of 5 records).'
      );
      return;
    }

    const headers = [
      'Topic ID',
      'Started Attempts',
      'Completed Attempts',
      'Completion Rate (%)',
      'Pre-Test Total (N)',
      'Paired Completed (N)',
      'Attrition Rate (%)',
      'Avg Pre Score (%)',
      'Avg Post Score (%)',
      'Percentage Point Delta',
      'Improved Participants (%)'
    ];

    const row = [
      topicFilter,
      analytics.startedAttempts,
      analytics.completedAttempts,
      analytics.lessonCompletionRate,
      analytics.totalPre,
      analytics.nPaired,
      analytics.attritionRate,
      analytics.isSuppressed ? 'SUPPRESSED (<5)' : analytics.avgPre,
      analytics.isSuppressed ? 'SUPPRESSED (<5)' : analytics.avgPost,
      analytics.isSuppressed ? 'SUPPRESSED (<5)' : analytics.pointDiff,
      analytics.isSuppressed ? 'SUPPRESSED (<5)' : analytics.improvedPct
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), row.join(',')].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `amr_learning_impact_report_${topicFilter}_${timeFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="learning-impact-dashboard" style={{ marginTop: '1.5rem' }}>
      {/* رأس اللوحة والتعريف السريري المحكم */}
      <div
        className="card"
        style={{
          borderLeft: isAr ? 'none' : '4px solid var(--brand, #00897b)',
          borderRight: isAr ? '4px solid var(--brand, #00897b)' : 'none',
          marginBottom: '1.5rem',
          padding: '1.25rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ margin: 0, color: 'var(--brand, #00897b)' }}>
              {isAr ? '📊 لوحة قياس الأثر والتحصيل المعرفي' : '📊 Awareness & Learning Impact Dashboard'}
            </h2>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem', color: 'var(--text-muted, #666)' }}>
              {isAr
                ? 'تقييم منهجي مبني على الأدلة لقياس استيعاب المرضى للمفاهيم التوعوية (التقييم القبلي والبعدي المقترن ومعدلات إتمام الدروس).'
                : 'Evidence-based evaluation measuring patient comprehension of educational modules via paired pre/post testing.'}
            </p>
          </div>
          <button
            onClick={handleExportCSV}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem' }}
          >
            📥 {isAr ? 'تصدير التقرير المجمع (CSV)' : 'Export Aggregated Report (CSV)'}
          </button>
        </div>

        {/* تنبيه الدقة المنهجية المعتمدة */}
        <div
          style={{
            marginTop: '1rem',
            padding: '0.75rem',
            borderRadius: '6px',
            backgroundColor: 'rgba(25, 118, 210, 0.08)',
            border: '1px solid rgba(25, 118, 210, 0.2)',
            fontSize: '0.85rem',
            lineHeight: 1.5
          }}
        >
          <strong>ℹ️ {isAr ? 'ضوابط التفسير العلمي السليم:' : 'Scientific Interpretation Guidelines:'}</strong>{' '}
          {isAr
            ? 'هذه اللوحة تقيس فقط التحصيل المعرفي والتفاعل التوعوي. لا يجوز علمياً استنتاج معدلات مقاومة الميكروبات، أو حساسية البكتيريا، أو المآلات السريرية في المستشفيات من نتائج استيعاب الموقع، كما أن تحسن الدرجات لا يُعد دليلاً جازماً على تغيير السلوك اليومي للمريض.'
            : 'This dashboard measures educational comprehension only. It must never be used to infer bacterial resistance rates, susceptibility patterns, or clinical outcomes. Test improvements do not constitute proof of real-world behavioral changes.'}
        </div>
      </div>

      {/* شريط الفلاتر والتحكم */}
      <div
        className="card"
        style={{
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          alignItems: 'center',
          marginBottom: '1.5rem',
          padding: '0.85rem'
        }}
      >
        <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>
          {isAr ? 'الفترة الزمنية:' : 'Time Period:'}
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value as any)}
            style={{ marginLeft: isAr ? 0 : '0.5rem', marginRight: isAr ? '0.5rem' : 0, padding: '0.35rem' }}
          >
            <option value="7d">{isAr ? 'آخر 7 أيام' : 'Last 7 Days'}</option>
            <option value="30d">{isAr ? 'آخر 30 يوماً' : 'Last 30 Days'}</option>
            <option value="all">{isAr ? 'جميع الفترات' : 'All Time'}</option>
          </select>
        </label>

        <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>
          {isAr ? 'الوحدة التوعوية:' : 'Educational Topic:'}
          <select
            value={topicFilter}
            onChange={(e) => setTopicFilter(e.target.value)}
            style={{ marginLeft: isAr ? 0 : '0.5rem', marginRight: isAr ? '0.5rem' : 0, padding: '0.35rem' }}
          >
            <option value="all">{isAr ? 'جميع الوحدات التعليمية' : 'All Modules'}</option>
            {STEPS.map((s) => (
              <option key={s.id} value={s.id}>
                {isAr ? s.title.ar : s.title.en}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* حالة التحميل أو قاعدة البيانات الفارغة */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p>{isAr ? 'جاري تحميل مؤشرات الأثر الحقيقية من Firestore...' : 'Loading verified impact metrics from Firestore...'}</p>
        </div>
      ) : analytics.startedAttempts === 0 && analytics.totalPre === 0 ? (
        <div
          className="card"
          style={{
            textAlign: 'center',
            padding: '3rem',
            border: '2px dashed var(--border, #ccc)',
            backgroundColor: 'transparent'
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📭</div>
          <h3 style={{ margin: 0 }}>
            {isAr ? 'لا توجد بيانات تفاعل كافية بعد' : 'No Sufficient Activity Data Yet'}
          </h3>
          <p style={{ color: 'var(--text-muted, #777)', maxWidth: '500px', margin: '0.5rem auto 0', fontSize: '0.9rem' }}>
            {isAr
              ? 'تلتزم اللوحة بعرض الأرقام الحقيقية المسجلة فقط ولا تُظهر أي بيانات وهمية. ستظهر المؤشرات فور إتمام الزوار للدروس والتقييمات.'
              : 'The dashboard strictly displays real Firestore metrics without fabricated charts. Results will populate as users complete assessments.'}
          </p>
        </div>
      ) : (
        <>
          {/* شبكة البطاقات التلخيصية للمؤشرات الأساسية */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}
          >
            {/* معدل إتمام الدروس */}
            <div className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted, #666)' }}>
                {isAr ? 'معدل إتمام الدروس' : 'Lesson Completion Rate'}
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--brand, #00897b)', margin: '0.3rem 0' }}>
                {analytics.lessonCompletionRate}%
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #888)' }}>
                {analytics.completedAttempts} {isAr ? 'مكتمل' : 'completed'} / {analytics.startedAttempts} {isAr ? 'بدء' : 'started'}
              </div>
            </div>

            {/* متوسط التحصيل القبلي والبعدي المقترن */}
            <div className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted, #666)' }}>
                {isAr ? 'التحصيل المقترن (قبلي ← بعدي)' : 'Paired Knowledge (Pre → Post)'}
              </div>
              {analytics.isSuppressed ? (
                <div style={{ fontSize: '0.8rem', color: '#d32f2f', margin: '0.7rem 0', fontWeight: 600 }}>
                  ⚠️ {isAr ? 'محجوب (عينة < 5 لحماية الخصوصية)' : 'Suppressed (N < 5 for privacy)'}
                </div>
              ) : (
                <div style={{ fontSize: '1.6rem', fontWeight: 'bold', margin: '0.3rem 0' }}>
                  <span style={{ color: '#757575' }}>{analytics.avgPre}%</span>
                  <span style={{ margin: '0 0.5rem', color: 'var(--brand, #00897b)' }}>→</span>
                  <span style={{ color: '#2e7d32' }}>{analytics.avgPost}%</span>
                </div>
              )}
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #888)' }}>
                {isAr ? 'حجم العينة المقترنة:' : 'Paired Sample Size:'} N = {analytics.nPaired}
              </div>
            </div>

            {/* الفارق المعرفي ونسبة التحسن */}
            <div className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted, #666)' }}>
                {isAr ? 'الفارق بنقاط النسبة المئوية' : 'Percentage-Point Delta'}
              </div>
              {analytics.isSuppressed ? (
                <div style={{ fontSize: '0.8rem', color: '#d32f2f', margin: '0.7rem 0', fontWeight: 600 }}>
                  ⚠️ {isAr ? 'محجوب (عينة < 5)' : 'Suppressed (N < 5)'}
                </div>
              ) : (
                <div
                  style={{
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    color: analytics.pointDiff >= 0 ? '#2e7d32' : '#d32f2f',
                    margin: '0.3rem 0'
                  }}
                >
                  {analytics.pointDiff > 0 ? `+${analytics.pointDiff}` : analytics.pointDiff} %
                </div>
              )}
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #888)' }}>
                {analytics.isSuppressed
                  ? '-'
                  : `${analytics.improvedPct}% ${isAr ? 'من المشاركين ارتفعت درجاتهم' : 'improved their score'}`}
              </div>
            </div>

            {/* معدل التسرب وفقدان التقييم البعدي */}
            <div className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted, #666)' }}>
                {isAr ? 'البيانات البعدية المفقودة (التسرب)' : 'Missing Post-Test Data (Attrition)'}
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f57c00', margin: '0.3rem 0' }}>
                {analytics.attritionRate}%
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #888)' }}>
                {analytics.missingPostData} {isAr ? 'لم يكملوا التقييم البعدي من أصل' : 'unpaired out of'} {analytics.totalPre}
              </div>
            </div>
          </div>

          {/* جدول تفصيلي للمفاهيم والتعاريف الحسابية المعتمدة */}
          <div className="card" style={{ padding: '1.25rem', overflowX: 'auto' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>
              {isAr ? '📐 معادلات واشتقاق المؤشرات الإحصائية المعتمدة' : '📐 Metric Definitions & Mathematical Formulations'}
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: isAr ? 'right' : 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border, #eee)', backgroundColor: 'rgba(0,0,0,0.02)' }}>
                  <th style={{ padding: '0.6rem' }}>{isAr ? 'المؤشر' : 'Metric'}</th>
                  <th style={{ padding: '0.6rem' }}>{isAr ? 'المعادلة الحسابية' : 'Formula'}</th>
                  <th style={{ padding: '0.6rem' }}>{isAr ? 'الهدف التعليمي والسريري' : 'Clinical/Educational Purpose'}</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border, #eee)' }}>
                  <td style={{ padding: '0.6rem', fontWeight: 600 }}>
                    {isAr ? 'معدل إتمام الدروس' : 'Lesson Completion Rate'}
                  </td>
                  <td style={{ padding: '0.6rem', fontFamily: 'monospace' }}>
                    (completed_attempts / started_attempts) × 100
                  </td>
                  <td style={{ padding: '0.6rem' }}>
                    {isAr ? 'قياس مدى جاذبية المادة وقدرة المريض على استيعابها حتى النهاية دون مغادرة' : 'Evaluates content engagement and course drop-off rates'}
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border, #eee)' }}>
                  <td style={{ padding: '0.6rem', fontWeight: 600 }}>
                    {isAr ? 'الفارق المعرفي المقترن' : 'Paired Delta'}
                  </td>
                  <td style={{ padding: '0.6rem', fontFamily: 'monospace' }}>
                    Avg(Post_score) - Avg(Pre_score) [Paired N only]
                  </td>
                  <td style={{ padding: '0.6rem' }}>
                    {isAr ? 'قياس الزيادة الفعلية في الاستيعاب للمشاركين الذين أتموا النموذجين معاً' : 'Quantifies actual knowledge acquisition controlling for attrition'}
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border, #eee)' }}>
                  <td style={{ padding: '0.6rem', fontWeight: 600 }}>
                    {isAr ? 'نسبة التحسن الفردي' : 'Improvement Proportion'}
                  </td>
                  <td style={{ padding: '0.6rem', fontFamily: 'monospace' }}>
                    (Count(Post > Pre) / Paired_N) × 100
                  </td>
                  <td style={{ padding: '0.6rem' }}>
                    {isAr ? 'نسبة الأفراد الذين أظهروا تحسناً حقيقياً مقارنة بنقطة انطلاقهم المعرفية' : 'Proportion of individual learners who achieved a net positive score change'}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '0.6rem', fontWeight: 600 }}>
                    {isAr ? 'عتبة الخصوصية الصارمة' : 'Privacy Suppression Threshold'}
                  </td>
                  <td style={{ padding: '0.6rem', fontFamily: 'monospace' }}>
                    If N &lt; 5 =&gt; Mask and Suppress Data
                  </td>
                  <td style={{ padding: '0.6rem' }}>
                    {isAr ? 'حماية بيانات المرضى من محاولات إعادة التعريف في المجموعات الصغيرة جداً' : 'Prevents re-identification attacks from sparse analytical clusters'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
