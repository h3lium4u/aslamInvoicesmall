'use client';

import { useState, useEffect, use } from 'react';
import { Statement } from '@/types';
import { StatementForm } from '@/components/forms/StatementForm';
import { LoadingState, ErrorState } from '@/components/ui/States';
import styles from './EditRecord.module.css';

export default function EditRecordPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [statement, setStatement] = useState<Statement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStatement() {
      try {
        const res = await fetch(`/api/statements/${id}`);
        if (!res.ok) throw new Error('Statement not found');
        const json = await res.json();
        setStatement(json.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadStatement();
  }, [id]);

  if (loading) return <div style={{ padding: 32 }}><LoadingState message="Loading statement for editing..." /></div>;
  if (error || !statement) return <div style={{ padding: 32 }}><ErrorState message={error || 'Statement not found'} /></div>;

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div>
          <span className={styles.breadcrumb}>
            WESTERN INDUSTRIES / EDIT STATEMENT {statement.statementNumber}
          </span>
          <h1 className={styles.pageTitle}>Edit Stock Statement</h1>
          <p className={styles.pageSubtitle}>
            Modify header information, add/remove stock rows, and recalculate balances.
          </p>
        </div>
      </div>

      <StatementForm initialData={statement} isEditing />
    </div>
  );
}
