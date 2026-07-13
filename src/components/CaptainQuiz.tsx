"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ProductCategory } from "@/data/products";
import { formatBRL } from "@/data/products";
import { ProductImage } from "@/components/ProductImage";

type QuizProduct = {
  id: string;
  slug: string;
  name: string;
  blurb: string;
  price: number;
  image: string;
  category: ProductCategory;
  approved?: boolean;
  isNew?: boolean;
};

type Answers = {
  home?: "casa" | "apto";
  pet?: "cao" | "gato" | "nao";
  kids?: "sim" | "nao";
  office?: "sim" | "nao";
  car?: "sim" | "nao";
};

const STEPS: {
  key: keyof Answers;
  q: string;
  options: { value: Answers[keyof Answers]; label: string }[];
}[] = [
  {
    key: "home",
    q: "Mora em casa ou apartamento?",
    options: [
      { value: "casa", label: "Casa" },
      { value: "apto", label: "Apartamento" },
    ],
  },
  {
    key: "pet",
    q: "Tem cachorro ou gato?",
    options: [
      { value: "cao", label: "Cachorro" },
      { value: "gato", label: "Gato" },
      { value: "nao", label: "Não tenho" },
    ],
  },
  {
    key: "kids",
    q: "Tem filhos?",
    options: [
      { value: "sim", label: "Sim" },
      { value: "nao", label: "Não" },
    ],
  },
  {
    key: "office",
    q: "Trabalha em home office?",
    options: [
      { value: "sim", label: "Sim" },
      { value: "nao", label: "Não" },
    ],
  },
  {
    key: "car",
    q: "Usa muito o carro?",
    options: [
      { value: "sim", label: "Sim" },
      { value: "nao", label: "Não" },
    ],
  },
];

function preferredCategories(a: Answers): ProductCategory[] {
  const cats: ProductCategory[] = [];
  if (a.pet === "cao" || a.pet === "gato") cats.push("pet");
  if (a.kids === "sim") cats.push("kids");
  if (a.office === "sim") cats.push("gadgets");
  if (a.car === "sim") cats.push("auto");
  if (a.home === "casa" || a.home === "apto") cats.push("casa");
  cats.push("beauty", "fit");
  return [...new Set(cats)];
}

export function CaptainQuiz({ products }: { products: QuizProduct[] }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [done, setDone] = useState(false);

  const picks = useMemo(() => {
    if (!done) return [];
    const order = preferredCategories(answers);
    const scored = products.map((p) => {
      const idx = order.indexOf(p.category);
      const score =
        (idx >= 0 ? 100 - idx * 8 : 0) +
        (p.approved ? 5 : 0) +
        (p.isNew ? 3 : 0);
      return { p, score };
    });
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((x) => x.p);
  }, [answers, done, products]);

  function choose(value: Answers[keyof Answers]) {
    const key = STEPS[step].key;
    const next = { ...answers, [key]: value };
    setAnswers(next);
    if (step + 1 >= STEPS.length) {
      setDone(true);
    } else {
      setStep(step + 1);
    }
  }

  function reset() {
    setStep(0);
    setAnswers({});
    setDone(false);
  }

  return (
    <section
      id="quiz-capitao"
      className="border-b border-line bg-card py-14 md:py-16"
    >
      <div className="mx-auto max-w-[800px] px-5 md:px-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">
          Consultoria do Capitão
        </p>
        <h2 className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-bold text-white md:text-3xl">
          Monte sua seleção personalizada
        </h2>
        <p className="mt-2 text-[#888]">
          Responda 5 perguntas rápidas. O Capitão monta uma curadoria só para
          você — algo que marketplace genérico não faz.
        </p>

        {!done ? (
          <div className="mt-8 rounded-[14px] border border-[#333] bg-[#141414] p-6">
            <p className="text-xs text-muted">
              Pergunta {step + 1} de {STEPS.length}
            </p>
            <p className="mt-3 text-lg font-semibold text-white">
              {STEPS[step].q}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {STEPS[step].options.map((o) => (
                <button
                  key={String(o.value)}
                  type="button"
                  onClick={() => choose(o.value)}
                  className="rounded-md border border-[#333] bg-black px-4 py-3 text-sm font-semibold text-white transition hover:border-gold hover:text-gold"
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-8">
            <div className="rounded-[14px] border border-gold/40 bg-gold/10 p-5">
              <p className="text-sm font-bold text-gold">
                Seleção do Capitão pronta
              </p>
              <p className="mt-1 text-sm text-[#ccc]">
                Com base no seu perfil, estes são os aprovados que mais fazem
                sentido agora.
              </p>
            </div>
            {picks.length ? (
              <ul className="mt-6 grid gap-4 sm:grid-cols-2">
                {picks.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/produtos/${p.slug}`}
                      className="flex gap-3 rounded-[14px] border border-[#333] bg-[#1a1a1a] p-3 transition hover:border-gold"
                    >
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-[#111]">
                        <ProductImage
                          src={p.image}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="line-clamp-2 font-semibold text-white">
                          {p.name}
                        </p>
                        <p className="mt-1 text-sm text-gold">
                          {formatBRL(p.price)}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-muted">
                Catálogo ainda enchendo — veja todos os aprovados.
              </p>
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/produtos"
                className="rounded-md bg-gold px-5 py-3 text-sm font-bold text-black hover:bg-gold-deep"
              >
                Ver Produtos Aprovados
              </Link>
              <button
                type="button"
                onClick={reset}
                className="rounded-md border border-white/25 px-5 py-3 text-sm font-semibold text-white hover:border-gold hover:text-gold"
              >
                Refazer quiz
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
