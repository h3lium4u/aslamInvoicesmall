'use client';

import { StatementForm } from '@/components/forms/StatementForm';
import styles from './Home.module.css';

export default function HomePage() {
  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div>
          <span className={styles.breadcrumb}>WESTERN INDUSTRIES / NEW ENTRY</span>
          <h1 className={styles.pageTitle}>New Stock Statement Entry</h1>
          <p className={styles.pageSubtitle}>
            Digitalize physical register rows with automatic S.No assignment and validation.
          </p>
        </div>
      </div>

      <StatementForm />
    </div>
  );
}
