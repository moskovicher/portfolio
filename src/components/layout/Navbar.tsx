'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import type { Locale } from '@/lib/portfolio/types';

interface NavbarProps {
  locale: Locale;
  /** When false, the Shop link is hidden (no published products). Defaults to shown. */
  showShop?: boolean;
}

const INSTAGRAM_URL = 'https://www.instagram.com/shachar_moskovich/';
const LINKEDIN_URL = 'https://www.linkedin.com/in/shachar-moskovich-89ba76241/';

function InstagramIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

export function Navbar({ locale, showShop = true }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const isRtl = locale === 'he';

  // Gallery now lives inside Work; Shop only appears when it has products.
  const navItems = [
    { label: { en: 'Work', he: 'עבודות' }, href: '/portfolio' },
    ...(showShop ? [{ label: { en: 'Shop', he: 'חנות' }, href: '/shop' }] : []),
    { label: { en: 'About', he: 'אודות' }, href: '/about' },
    { label: { en: 'Contact', he: 'יצירת קשר' }, href: '/contact' },
  ];

  const isActive = (href: string) => pathname.includes(href);

  return (
    <nav
      className="bg-canvas border-b border-border sticky top-0 z-40"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="px-5 md:px-10">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* LOGO (start corner) */}
          <Link href={`/${locale}`} className="flex items-center shrink-0" aria-label="Home">
            <img
              src="/logo.png"
              alt="Shachar Moskovich"
              className="h-9 w-9 md:h-11 md:w-11 object-contain"
            />
          </Link>

          {/* Desktop Nav - Centered */}
          <div className="hidden md:flex gap-12 items-center">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={`/${locale}${item.href}`}
                className={`text-lg transition-colors ${
                  isRtl ? 'font-display-he' : 'font-display'
                } ${
                  isActive(item.href)
                    ? 'text-accent font-medium underline decoration-2 underline-offset-8'
                    : 'text-ink-secondary hover:text-accent'
                }`}
              >
                {item.label[locale]}
              </Link>
            ))}
            {/* Language Toggle */}
            <Link
              href={`/${locale === 'en' ? 'he' : 'en'}${pathname.replace(/^\/(en|he)/, '')}`}
              className={`text-lg tracking-[0.1em] uppercase text-ink-secondary hover:text-accent transition-colors border-l border-border pl-12 ${locale === 'en' ? 'font-display-he' : 'font-display'}`}
            >
              {locale === 'en' ? 'עברית' : 'English'}
            </Link>
          </div>

          {/* SOCIAL (end corner) - desktop */}
          <div className="hidden md:flex items-center gap-4 shrink-0">
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="flex items-center justify-center text-ink-secondary hover:text-accent transition-colors"
            >
              <InstagramIcon />
            </a>
            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="flex items-center justify-center text-ink-secondary hover:text-accent transition-colors"
            >
              <LinkedInIcon />
            </a>
          </div>

          {/* Mobile right side: Instagram + Menu button */}
          <div className="md:hidden flex items-center gap-4">
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="text-ink-secondary hover:text-accent transition-colors"
            >
              <InstagramIcon />
            </a>
            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="text-ink-secondary hover:text-accent transition-colors"
            >
              <LinkedInIcon />
            </a>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex flex-col gap-1.5"
              aria-label="Toggle menu"
            >
              <span className={`w-5 h-0.5 bg-ink transition-all ${isOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`w-5 h-0.5 bg-ink transition-opacity ${isOpen ? 'opacity-0' : ''}`} />
              <span className={`w-5 h-0.5 bg-ink transition-all ${isOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4 space-y-3 border-t border-border pt-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={`/${locale}${item.href}`}
                onClick={() => setIsOpen(false)}
                className={`block text-base transition-colors ${
                  isRtl ? 'font-display-he' : 'font-display'
                } ${
                  isActive(item.href)
                    ? 'text-accent font-medium'
                    : 'text-ink-secondary hover:text-accent'
                }`}
              >
                {item.label[locale]}
              </Link>
            ))}
            <div className="border-t border-border pt-3">
              <Link
                href={`/${locale === 'en' ? 'he' : 'en'}${pathname.replace(/^\/(en|he)/, '')}`}
                onClick={() => setIsOpen(false)}
                className={`text-base tracking-[0.1em] uppercase text-ink-secondary hover:text-accent transition-colors ${locale === 'en' ? 'font-display-he' : 'font-display'}`}
              >
                {locale === 'en' ? 'עברית' : 'English'}
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
