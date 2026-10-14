import styles from './feedback.module.css'
import { BellIcon } from './icons'

export interface AlertBannerProps {
  title: string
  body: string
}

/** Completion message after a session ends (AC-6.7). Uses the current --accent. */
export function AlertBanner({ title, body }: AlertBannerProps) {
  return (
    <div className={styles.banner} role="status">
      <span className={styles.bannerIcon}>
        <BellIcon />
      </span>
      <span className={styles.bannerText}>
        <strong>{title}</strong>
        <span>{body}</span>
      </span>
    </div>
  )
}
