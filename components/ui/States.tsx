import styles from './State.module.css';

export function LoadingState({ message = 'Loading records...' }: { message?: string }) {
  return (
    <div className={styles.stateContainer}>
      <div className={styles.spinner} />
      <span className={styles.stateText}>{message}</span>
    </div>
  );
}

export function EmptyState({
  title = 'No records found',
  description = 'Try adjusting your search or filters, or create a new stock statement.',
  action,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={styles.stateContainer}>
      <h3 className={styles.stateTitle}>{title}</h3>
      <p className={styles.stateDescription}>{description}</p>
      {action && <div className={styles.actionWrapper}>{action}</div>}
    </div>
  );
}

export function ErrorState({
  message = 'Unable to load data. Please try again.',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className={styles.stateContainer}>
      <h3 className={styles.stateTitle}>Error Occurred</h3>
      <p className={styles.stateDescription}>{message}</p>
      {onRetry && (
        <button onClick={onRetry} className={styles.retryBtn}>
          Try Again
        </button>
      )}
    </div>
  );
}
