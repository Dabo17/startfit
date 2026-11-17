"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  {
    href: "/plan",
    label: "Plan",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="16" height="17" rx="2" />
        <path d="M8 2v4M16 2v4M8 11h8M8 15h5" />
      </svg>
    ),
  },
  {
    href: "/fortschritt",
    label: "Fortschritt",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 20h18M6 16l4-5 3 3 5-7" />
      </svg>
    ),
  },
  {
    href: "/mythen",
    label: "Mythen-Check",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-3.5-3.5M8.5 11l2 2 3.5-4" />
      </svg>
    ),
  },
  {
    href: "/profil",
    label: "Profil",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const path = usePathname();
  return (
    <nav className="nav" aria-label="Hauptnavigation">
      <div className="nav-inner">
        {items.map((i) => (
          <Link key={i.href} href={i.href} className={path?.startsWith(i.href) ? "active" : ""}>
            {i.icon}
            {i.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
