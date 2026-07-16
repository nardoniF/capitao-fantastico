import { Suspense } from "react";
import MinhaContaPage from "./MinhaContaClient";

export default function Page() {
  return (
    <Suspense
      fallback={
        <p className="px-5 py-20 text-center text-muted">Carregando…</p>
      }
    >
      <MinhaContaPage />
    </Suspense>
  );
}
