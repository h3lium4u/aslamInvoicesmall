'use client';

import React from 'react';
import styles from './AnimationContainer.module.css';

interface AnimationContainerProps {
  children?: React.ReactNode;
  className?: string;
}

/**
 * AnimationContainer keeps TSX animation components isolated and reusable.
 * Can host visual effects/canvas/micro-animations without coupling business logic.
 */
export function AnimationContainer({ children, className }: AnimationContainerProps) {
  return (
    <div className={`${styles.container} ${className || ''}`}>
      {children || (
        <div className={styles.ambientGlow} />
      )}
    </div>
  );
}
