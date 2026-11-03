/**
 * AiActionConfirmationCard.tsx
 *
 * Interactive Patient Action Confirmation Card for `ChatWidget.tsx` and `Assistant.tsx`.
 * Crafted with warm, natural Egyptian Colloquial Arabic (مصري عامي) when lang === 'ar'.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Lang } from './types';
import { PendingAiActionProposal } from './aiActionExecutor';

interface Props {
  proposal: PendingAiActionProposal;
  lang: Lang;
  onConfirm: (proposalId: string, editedFields?: Record<string, string>) => Promise<void>;
  onCancel: (proposalId: string) => void;
  onCloseWidget?: () => void;
}

export default function AiActionConfirmationCard({
  proposal,
  lang,
  onConfirm,
  onCancel,
  onCloseWidget,
}: Props) {
  const isAr = lang === 'ar';
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const f of proposal.fields) {
      init[f.key] = f.value;
    }
    return init;
  });

  const safety = proposal.safetyPreview;
  const safetyColors: Record<
    typeof safety.status,
    { bg: string; border: string; text: string }
  > = {
    safe: { bg: '#ecfdf5', border: '#6ee7b7', text: '#065f46' },
    caution: { bg: '#eff6ff', border: '#93c5fd', text: '#1e40af' },
    warning: { bg: '#fffbeb', border: '#fcd34d', text: '#92400e' },
    urgent: { bg: '#fef2f2', border: '#fca5a5', text: '#991b1b' },
  };
  const sc = safetyColors[safety.status] || safetyColors.caution;

  const handleConfirmClick = async () => {
    if (saving || proposal.status !== 'pending_confirmation') return;
    setSaving(true);
    try {
      await onConfirm(proposal.id, editing ? fieldValues : undefined);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const destinationLink = (() => {
    switch (proposal.actionType) {
      case 'add_prescription':
      case 'update_prescription_status':
        return {
          to: '/prescription-radar',
          labelAr: '📡 افتح رادار الروشتة',
          labelEn: '📡 Open Prescription Radar',
        };
      case 'create_reminder':
      case 'update_reminder':
      case 'stop_reminder':
        return {
          to: '/tracker',
          labelAr: '⏰ افتح متابع الجرعات والمنبهات',
          labelEn: '⏰ Open Dose Tracker',
        };
      default:
        return {
          to: '/health-profile',
          labelAr: '👤 افتح ملفي الصحي',
          labelEn: '👤 Open My Health Profile',
        };
    }
  })();

  return (
    <div
      className="ai-action-confirmation-card"
      dir={isAr ? 'rtl' : 'ltr'}
      style={{
        background: '#ffffff',
        border: '1.5px solid #cbd5e1',
        borderTop: '4px solid #0284c7',
        borderRadius: '12px',
        padding: '12px 14px',
        marginTop: '8px',
        boxShadow: '0 4px 14px rgba(15, 23, 42, 0.06)',
        color: '#0f172a',
        fontSize: '0.88rem',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          flexWrap: 'wrap',
          marginBottom: '8px',
          paddingBottom: '8px',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.25rem' }}>{proposal.icon}</span>
          <div>
            <strong style={{ color: '#0b3c5d', fontSize: '0.93rem', display: 'block' }}>
              {isAr ? proposal.titleAr : proposal.titleEn}
            </strong>
            <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
              {isAr ? proposal.sourceLabelAr : proposal.sourceLabelEn}
            </span>
          </div>
        </div>

        <span
          style={{
            background:
              proposal.status === 'confirmed_saved'
                ? '#dcfce7'
                : proposal.status === 'cancelled'
                  ? '#f1f5f9'
                  : proposal.status === 'failed'
                    ? '#fee2e2'
                    : '#fef3c7',
            color:
              proposal.status === 'confirmed_saved'
                ? '#166534'
                : proposal.status === 'cancelled'
                  ? '#475569'
                  : proposal.status === 'failed'
                    ? '#991b1b'
                    : '#92400e',
            padding: '3px 9px',
            borderRadius: '999px',
            fontSize: '0.73rem',
            fontWeight: 700,
          }}
        >
          {proposal.status === 'confirmed_saved'
            ? isAr
              ? '✅ اتحفظ في حسابك خلاص'
              : '✅ Saved to Account'
            : proposal.status === 'cancelled'
              ? isAr
                ? '✕ اتلغى'
                : '✕ Cancelled'
              : proposal.status === 'failed'
                ? isAr
                  ? '⚠️ متحفظش'
                  : '⚠️ Save Failed'
                : isAr
                  ? '⏳ مستني تأكيدك'
                  : '⏳ Awaiting Confirmation'}
        </span>
      </div>

      {/* Image Preview if Document/Prescription Uploaded */}
      {proposal.previewImageUrl && (
        <div
          style={{
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: '#f8fafc',
            padding: '8px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
          }}
        >
          <img
            src={proposal.previewImageUrl}
            alt="Uploaded medical document preview"
            style={{
              width: '64px',
              height: '64px',
              objectFit: 'cover',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              flexShrink: 0,
            }}
          />
          <div style={{ fontSize: '0.78rem', color: '#334155' }}>
            <div style={{ fontWeight: 700 }}>
              📎 {isAr ? 'معاينة الصورة المرفوعة' : 'Medical Attachment Preview'}
            </div>
            <div>
              {isAr
                ? 'بص على البيانات اللي طلعناها تحت، ولو في حاجة محتاجة تظبيط دوس «تعديل» قبل ما تحفظ.'
                : 'Review the extracted fields below and edit any unclear field before saving.'}
            </div>
          </div>
        </div>
      )}

      {/* Live Medication Safety Engine Banner */}
      <div
        style={{
          background: sc.bg,
          border: `1px solid ${sc.border}`,
          color: sc.text,
          borderRadius: '8px',
          padding: '8px 10px',
          marginBottom: '10px',
          fontSize: '0.8rem',
        }}
      >
        <div style={{ fontWeight: 700 }}>
          {isAr ? safety.headlineAr : safety.headlineEn}
        </div>
        {safety.duplicateDetected && (
          <div style={{ marginTop: '4px', fontWeight: 600 }}>
            {isAr ? safety.duplicateMessageAr : safety.duplicateMessageEn}
          </div>
        )}
        {(isAr ? safety.detailsAr : safety.detailsEn).slice(0, 3).map((line, idx) => (
          <div key={idx} style={{ marginTop: '4px', lineHeight: 1.5 }}>
            • {line}
          </div>
        ))}
      </div>

      {/* Structured Preview / Editable Fields */}
      <div style={{ display: 'grid', gap: '8px', marginBottom: '10px' }}>
        {proposal.fields.map((field) => {
          const currentVal =
            fieldValues[field.key] !== undefined ? fieldValues[field.key] : field.value;
          const isUncertain = field.uncertainOrMissing && !currentVal.trim();

          return (
            <div
              key={field.key}
              style={{
                background: isUncertain ? '#fffbeb' : '#f8fafc',
                border: isUncertain ? '1px solid #f59e0b' : '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '7px 10px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.76rem',
                  color: isUncertain ? '#b45309' : '#475569',
                  fontWeight: 700,
                  marginBottom: editing ? '4px' : '2px',
                }}
              >
                <span>{isAr ? field.labelAr : field.labelEn}:</span>
                {isUncertain && (
                  <span style={{ color: '#d97706', fontSize: '0.72rem' }}>
                    ⚠️ {isAr ? 'خانة ناقصة / مش واضحة' : 'Unclear / Required'}
                  </span>
                )}
              </div>

              {editing && field.editable && proposal.status === 'pending_confirmation' ? (
                field.inputType === 'select' && field.options ? (
                  <select
                    value={currentVal}
                    onChange={(e) =>
                      setFieldValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      border: '1px solid #94a3b8',
                      fontSize: '0.84rem',
                      background: '#fff',
                    }}
                  >
                    {field.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {isAr ? opt.labelAr : opt.labelEn}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.inputType === 'number' ? 'number' : 'text'}
                    value={currentVal}
                    onChange={(e) =>
                      setFieldValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                    placeholder={
                      isAr ? 'اكتب القيمة الصح هنا...' : 'Enter verified value...'
                    }
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      border: '1px solid #94a3b8',
                      fontSize: '0.84rem',
                      background: '#fff',
                    }}
                  />
                )
              ) : (
                <div style={{ fontWeight: 600, color: currentVal ? '#0f172a' : '#b45309' }}>
                  {field.options
                    ? (() => {
                        const matchedOpt = field.options.find((o) => o.value === currentVal);
                        return matchedOpt
                          ? isAr
                            ? matchedOpt.labelAr
                            : matchedOpt.labelEn
                          : currentVal || (isAr ? 'مش متحدد (دوس تعديل عشان تكتبه)' : 'Unspecified (Click Edit)');
                      })()
                    : currentVal || (isAr ? 'مش متحدد (دوس تعديل عشان تكتبه)' : 'Unspecified (Click Edit)')}
                </div>
              )}
            </div>
          );
        })}

        {/* Source & Evidence Status Row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '6px',
            fontSize: '0.74rem',
            color: '#64748b',
            padding: '2px 4px',
          }}
        >
          <span>
            📌 <b>{isAr ? 'الحالة:' : 'Verification:'}</b>{' '}
            {isAr ? proposal.verificationBadgeAr : proposal.verificationBadgeEn}
          </span>
        </div>
      </div>

      {/* Action Buttons or Post-Execution Result */}
      {proposal.status === 'pending_confirmation' ? (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            className="btn"
            disabled={saving}
            onClick={handleConfirmClick}
            style={{
              background: safety.status === 'urgent' ? '#dc2626' : '#0284c7',
              color: '#fff',
              fontWeight: 700,
              padding: '7px 14px',
              borderRadius: '8px',
              fontSize: '0.84rem',
              cursor: saving ? 'wait' : 'pointer',
            }}
          >
            {saving
              ? isAr
                ? '⏳ بحفظهولك...'
                : '⏳ Saving...'
              : isAr
                ? '✅ أيوه، أكد واحفظ'
                : '✅ Confirm and Save'}
          </button>

          <button
            type="button"
            className="btn ghost"
            disabled={saving}
            onClick={() => setEditing((v) => !v)}
            style={{
              padding: '7px 12px',
              borderRadius: '8px',
              fontSize: '0.82rem',
              border: '1px solid #94a3b8',
            }}
          >
            {editing
              ? isAr
                ? '✔️ خلصت تعديل'
                : '✔️ Done Editing'
              : isAr
                ? '✏️ تعديل البيانات'
                : '✏️ Edit'}
          </button>

          <button
            type="button"
            className="btn ghost"
            disabled={saving}
            onClick={() => onCancel(proposal.id)}
            style={{
              padding: '7px 12px',
              borderRadius: '8px',
              fontSize: '0.82rem',
              color: '#dc2626',
              borderColor: '#fca5a5',
            }}
          >
            {isAr ? '✕ لا، الغي' : '✕ Cancel'}
          </button>
        </div>
      ) : (
        <div
          style={{
            borderTop: '1px solid #e2e8f0',
            paddingTop: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <span
            style={{
              fontSize: '0.82rem',
              fontWeight: 600,
              color:
                proposal.status === 'confirmed_saved'
                  ? '#166534'
                  : proposal.status === 'failed'
                    ? '#991b1b'
                    : '#475569',
            }}
          >
            {isAr ? proposal.resultMessageAr : proposal.resultMessageEn}
          </span>

          {proposal.status === 'confirmed_saved' && (
            <Link
              to={destinationLink.to}
              onClick={onCloseWidget}
              style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                color: '#0284c7',
                textDecoration: 'none',
              }}
            >
              {isAr ? destinationLink.labelAr : destinationLink.labelEn} →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
