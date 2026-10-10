import { useLang } from './i18n';

/**
 * The big "Important notice" box was removed from the pages.
 * Only a small plain line stays in the footer (compact) so the site still says it is educational.
 */
export default function Disclaimer({ compact = false }: { compact?: boolean }) {
  const { t } = useLang();
  if (!compact) return null;
  return <p className="small muted">{t('disclaimer')}</p>;
}
