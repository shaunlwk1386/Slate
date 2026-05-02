'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Nav.module.css';

const TABS = [
  { href: '/personal', icon: '◯', label: 'Personal' },
  { href: '/work',   icon: '⊡', label: 'Work'     },
  { href: '/all',    icon: '◎', label: 'All'      },
  { href: '/radar',  icon: '⬡', label: 'Radar'    },
  { href: '/done',   icon: '✓', label: 'Done'     },
] as const;

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav}>
      {TABS.map(({ href, icon, label }) => {
        const active = pathname === href || (href !== '/personal' && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={`${styles.navItem} ${active ? styles.active : ''}`}
          >
            <span className={styles.icon}>{icon}</span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
