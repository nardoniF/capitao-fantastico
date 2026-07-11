"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { SuggestionForm } from "@/components/SuggestionForm";

export function SuggestionsFab() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.body.classList.add("overflow-hidden");
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("overflow-hidden");
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (pathname.startsWith("/admin")) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="fixed bottom-6 left-6 z-50 flex items-center gap-2 rounded-full border border-gold/50 bg-[#1a1a1a] px-4 py-3 text-sm font-bold text-gold shadow-lg transition hover:border-gold hover:bg-gold hover:text-black"
      >
        <span className="hidden sm:inline">Sugestões</span>
        <span className="sm:hidden">Ideias</span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center">
          <button
            type="button"
            aria-label="Fechar"
            className="absolute inset-0 bg-black/70"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cf-sugestoes-title"
            className="relative z-[61] max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[14px] border border-[#333] bg-[#141414] p-5 shadow-2xl md:p-6"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2
                  id="cf-sugestoes-title"
                  className="font-[family-name:var(--font-syne)] text-xl font-bold text-white"
                >
                  Ajude o Capitão a melhorar
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Produtos, o que faltou no site ou reclamações.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md border border-[#333] px-2.5 py-1 text-sm text-muted hover:border-gold hover:text-gold"
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            <SuggestionForm
              compact
              page={pathname}
              onDone={() => {
                window.setTimeout(() => setOpen(false), 1800);
              }}
            />

            <p className="mt-4 text-center text-xs text-muted">
              Ou abra a página{" "}
              <Link href="/sugestoes" className="text-gold hover:underline">
                /sugestoes
              </Link>
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
