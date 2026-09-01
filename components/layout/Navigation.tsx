'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Navigation.module.css';

export function Navigation() {
  const pathname = usePathname();

  const now = new Date();
  const currentMonthStr = now.toLocaleString('en-US', { month: 'short' });
  const currentYearStr = now.getFullYear();

  const navLinks = [
    { href: '/', label: 'New Entry' },
    { href: '/records', label: 'Records' },
    { href: '/reports', label: 'Reports' },
  ];

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {/* Brand with Logo */}
        <Link href="/" className={styles.brand}>
          <img
            src="/logo.jpg"
            alt="Western Industries Logo"
            className={styles.logoImage}
          />
          <div className={styles.brandText}>
            <span className={styles.brandTitle}>WESTERN INDUSTRIES</span>
            <span className={styles.brandSubtitle}>STOCK STATEMENT SYSTEM</span>
          </div>
        </Link>

        {/* Navigation links */}
        <nav className={styles.nav}>
          {navLinks.map((link) => {
            const isActive =
              link.href === '/'
                ? pathname === '/'
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`${styles.navLink} ${isActive ? styles.active : ''}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Info */}
        <div className={styles.rightInfo}>
          <div className={styles.periodBadge}>
            <span className={styles.periodLabel}>CURRENT PERIOD</span>
            <span className={styles.periodValue}>
              {currentMonthStr} {currentYearStr}
            </span>
          </div>
          <div className={styles.systemStatus}>
            <span className={styles.statusDot} />
            <span className={styles.statusText}>System Live</span>
          </div>
        </div>
      </div>
    </header>
  );
}
