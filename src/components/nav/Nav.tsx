'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Nav.module.css';

const TABS = [
  { href: '/personal', icon: '◯', label: 'Personal' },
  { href: '/work',   icon: '⊡', label: 'Work'     },
  { href: '/all',    icon: '◎', label: 'All'      },
  { href: '/radar',  icon: '⊞', label: 'Onboarding' },
  { href: '/done',   icon: '✓', label: 'Done'     },
] as const;

function openHud() {
  const w = 340;
  const h = window.screen.availHeight;
  const left = window.screen.availWidth - w;
  window.open('/hud', 'slate-hud', `width=${w},height=${h},left=${left},top=0`);
}

export default function Nav() {
  const pathname = usePathname();

  // Icon-only nav in HUD window — prevents label wrapping that pushes FAB behind nav
  if (pathname === '/hud') {
    return (
      <nav className={styles.nav}>
        {TABS.map(({ href, icon, label }) => (
          <Link
            key={href}
            href={href}
            className={`${styles.navItem} ${styles.hudItem} ${pathname === href ? styles.active : ''}`}
            title={label}
          >
            <span className={styles.icon}>{icon}</span>
          </Link>
        ))}
      </nav>
    );
  }

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
      <button className={styles.hudLauncher} onClick={openHud} title="Open HUD panel">
        ↗
      </button>
    </nav>
  );
}
