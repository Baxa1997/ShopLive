'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, History, LogOut, ChevronDown, Crown, X, Zap } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/lib/auth-context';

function ShopsReadyIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="slogo_grad" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#10B981" />
          <stop offset="1" stopColor="#059669" />
        </linearGradient>
      </defs>
      {/* Bold Modern Geometric S */}
      <path
        d="M24 9.5C24 6.46243 21.5376 4 18.5 4H12.5C9.46243 4 7 6.46243 7 9.5V11C7 14.0376 9.46243 16.5 12.5 16.5H19.5C22.5376 16.5 25 18.9624 25 22V23.5C25 26.5376 22.5376 29 19.5 29H13.5C10.4624 29 8 26.5376 8 23.5"
        stroke="url(#slogo_grad)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Accent dot for uniqueness */}
      <rect x="22" y="5" width="4" height="4" rx="2" fill="#10B981" />
    </svg>
  );
}

export default function Navbar() {
  const { user, signOut, isPro } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Hide Navbar on Login page
  if (pathname === '/login') return null;

  const isMainPage = pathname === '/';

  // Scroll listener — only triggers island on main page
  useEffect(() => {
    if (!isMainPage) return;
    const handleScroll = () => setScrolled(window.scrollY > 40);
    // check immediately in case page loads already scrolled
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMainPage]);

  // On non-main pages always island
  const isIsland = !isMainPage || scrolled;

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const navLinks = [
    { href: '/tools/multi-importer', label: 'Generator', icon: Sparkles },
    { href: '/history', label: 'History', icon: History },
    { href: '/pricing', label: 'Pricing', icon: Crown },
  ];

  return (
    <>
      {/* ── NAV WRAPPER: always fixed, flex centering ── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none transition-[padding] duration-500 ease-in-out ${
          isIsland ? 'pt-4 px-4' : 'pt-0 px-0'
        }`}
      >
        {/*
          Island container — CSS transitions only on border-radius, background, shadow, max-width.
          NO Framer Motion layout animation here to avoid jank.
        */}
        <div
          className={`pointer-events-auto flex items-center justify-between w-full transition-all duration-500 ease-in-out ${
            isIsland
              ? 'max-w-7xl h-16 px-5 bg-white/80 backdrop-blur-xl border border-white/50 shadow-[0_4px_24px_0_rgba(0,0,0,0.08)] rounded-[1.75rem]'
              : 'max-w-full h-24 px-12 bg-transparent backdrop-blur-none border-transparent shadow-none rounded-none'
          }`}
        >
          {/* ── LOGO ── */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <ShopsReadyIcon className="w-8 h-8 flex-shrink-0 transition-transform group-hover:scale-105" />
            <span className="font-heading font-black text-xl tracking-tight text-slate-900">
              Shops<span className="text-emerald-600">Ready</span>
            </span>
          </Link>

          {/* ── CENTER NAV (shown on other pages) ── */}
          {!isMainPage && (
            <div className="hidden md:flex items-center gap-1 transition-opacity duration-300 opacity-100">
              {navLinks.filter(l => l.label !== 'Pricing').map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </Link>
                );
              })}
            </div>
          )}

          {/* ── RIGHT SIDE ── */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Pricing always visible on right on main page */}
            <Link
              href="/pricing"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-all"
            >
              <Crown className="w-3.5 h-3.5 text-amber-500" />
              Pricing
            </Link>

            {/* Pro upgrade badge */}
            {user && !isPro && (
              <Link href="/pricing" className="hidden sm:flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-black rounded-full hover:shadow-md transition-all">
                <Zap className="w-2.5 h-2.5" />
                UPGRADE
              </Link>
            )}

            {/* Auth */}
            {user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowUserMenu(v => !v)}
                  className="flex items-center gap-2 pl-1 pr-3 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-2xl transition-all"
                >
                  <img
                    src={user.user_metadata?.picture || user.user_metadata?.avatar_url}
                    alt={user.user_metadata?.full_name || user.email}
                    className="w-7 h-7 rounded-xl object-cover"
                  />
                  <span className="hidden sm:block text-xs font-bold text-slate-900 leading-none">{user.user_metadata?.given_name || user.user_metadata?.full_name?.split(' ')[0]}</span>
                  <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden z-50"
                    >
                      <div className="p-3 border-b border-slate-100">
                        <p className="text-sm font-bold text-slate-900">{user.user_metadata?.full_name || user.email}</p>
                        <p className="text-xs text-slate-400 truncate">{user.email}</p>
                      </div>
                      <div className="p-1.5 flex flex-col gap-0.5">
                        <Link href="/tools/multi-importer" onClick={() => setShowUserMenu(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-700 hover:bg-slate-50 transition-colors font-medium">
                          <Sparkles className="w-4 h-4 text-emerald-500" />
                          Generator
                        </Link>
                        <Link href="/history" onClick={() => setShowUserMenu(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-700 hover:bg-slate-50 transition-colors font-medium">
                          <History className="w-4 h-4 text-slate-400" />
                          My History
                        </Link>
                        <Link href="/pricing" onClick={() => setShowUserMenu(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-700 hover:bg-slate-50 transition-colors font-medium">
                          <Crown className="w-4 h-4 text-amber-400" />
                          Pricing & Plans
                        </Link>
                      </div>
                      <div className="p-1 border-t border-slate-100">
                        <button
                          onClick={() => { signOut(); setShowUserMenu(false); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors font-bold"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-emerald-200/60 hover:scale-[1.02] active:scale-[0.98]"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </nav>

    </>
  );
}
