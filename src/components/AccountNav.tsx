"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  clearCustomerSession,
  customerDisplayName,
  getCustomerUser,
  refreshCustomerSession,
  type CustomerUser,
} from "@/lib/customer-session-client";

export function AccountNav() {
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [open, setOpen] = useState(false);

  const sync = useCallback((u: CustomerUser | null) => {
    setUser(u);
  }, []);

  useEffect(() => {
    sync(getCustomerUser());
    void refreshCustomerSession().then(sync);

    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<{ user: CustomerUser | null }>).detail;
      sync(detail?.user ?? getCustomerUser());
    };
    window.addEventListener("cf-account-changed", onChange);
    return () => window.removeEventListener("cf-account-changed", onChange);
  }, [sync]);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);

  if (!user) {
    return (
      <Link
        href="/minha-conta"
        className="hidden items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 text-sm text-white/80 transition hover:border-gold hover:text-gold sm:inline-flex"
      >
        <UserIcon />
        <span>Minha conta</span>
      </Link>
    );
  }

  const nome = customerDisplayName(user);

  return (
    <div className="relative hidden sm:block">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="inline-flex max-w-[140px] items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 text-sm text-white/90 transition hover:border-gold hover:text-gold"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <UserIcon />
        <span className="truncate">{nome}</span>
        <Chevron className={open ? "rotate-180" : ""} />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 min-w-[200px] rounded-md border border-line bg-[#141414] py-2 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="border-b border-line px-3 pb-2 text-xs text-muted">
            {user.email}
          </p>
          <Link
            href="/minha-conta"
            role="menuitem"
            className="block px-3 py-2 text-sm text-white hover:bg-[#222] hover:text-gold"
            onClick={() => setOpen(false)}
          >
            Minha conta
          </Link>
          <Link
            href="/central"
            role="menuitem"
            className="block px-3 py-2 text-sm text-white hover:bg-[#222] hover:text-gold"
            onClick={() => setOpen(false)}
          >
            Meus pedidos
          </Link>
          <button
            type="button"
            role="menuitem"
            className="block w-full px-3 py-2 text-left text-sm text-red-300 hover:bg-[#222]"
            onClick={() => {
              clearCustomerSession();
              setOpen(false);
            }}
          >
            Sair
          </button>
        </div>
      ) : null}
    </div>
  );
}

function UserIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 shrink-0 opacity-80"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </svg>
  );
}

function Chevron({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-3 w-3 shrink-0 opacity-70 transition ${className}`}
      fill="currentColor"
      aria-hidden
    >
      <path d="M7 10l5 5 5-5H7z" />
    </svg>
  );
}
