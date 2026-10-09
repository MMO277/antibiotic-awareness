import { useLang } from './i18n';
import { Status } from './types';

export default function StatusBadge({ status }: { status: Status }) {
  const { t } = useLang();
  return <span className={`badge ${status}`}>{t(`st_${status}`)}</span>;
}
