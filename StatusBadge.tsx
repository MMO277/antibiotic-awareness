import { useLang } from './i18n';
import { Status } from './types';

export default function StatusBadge({ status }: { status: Status }) {
  const { lang } = useLang();
  const isAr = lang === 'ar';

  const config: Record<Status, { labelAr: string; labelEn: string; bg: string; color: string; border: string }> = {
    approved: {
      labelAr: 'معتمد رسمياً',
      labelEn: 'Approved',
      bg: '#dcfce7',
      color: '#166534',
      border: '#86efac',
    },
    pending_review: {
      labelAr: 'قيد المراجعة السريرية',
      labelEn: 'Pending Review',
      bg: '#fef3c7',
      color: '#92400e',
      border: '#fde68a',
    },
    draft: {
      labelAr: 'مسودة',
      labelEn: 'Draft',
      bg: '#f1f5f9',
      color: '#475569',
      border: '#cbd5e1',
    },
    archived: {
      labelAr: 'مؤرشف',
      labelEn: 'Archived',
      bg: '#fee2e2',
      color: '#991b1b',
      border: '#fca5a5',
    },
  };

  const item = config[status] || config.approved;

  return (
    <span
      className="badge"
      style={{
        background: item.bg,
        color: item.color,
        border: `1px solid ${item.border}`,
        fontWeight: 700,
        fontSize: '0.84rem',
        padding: '3px 8px',
        borderRadius: '6px',
      }}
    >
      {isAr ? item.labelAr : item.labelEn}
    </span>
  );
}
