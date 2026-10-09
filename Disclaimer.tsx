import { useLang } from './i18n';

export default function Disclaimer({ compact = false }: { compact?: boolean }) {
  const { t } = useLang();
  return (
    <aside className={compact ? 'notice compact' : 'notice'} role="note">
      <strong>{t('disclaimerTitle')}: </strong>
      {t('disclaimer')}
    </aside>
  );
}
