import React from 'react';
import styles from './DashboardCard.module.css';

interface DashboardCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: string;
  icon?: string;
  highlight?: boolean;
}

export function DashboardCard({
  title,
  value,
  subtitle,
  icon,
  highlight = false,
}: DashboardCardProps) {
  return (
    <div className={`${styles.card} ${highlight ? styles.highlightCard : ''}`}>
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
        {icon && <span className={styles.icon}>{icon}</span>}
      </div>
      <div className={styles.body}>
        <span className={styles.value}>{value}</span>
        {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
      </div>
    </div>
  );
}
