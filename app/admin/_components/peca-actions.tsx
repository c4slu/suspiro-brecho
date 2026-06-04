"use client";

import { useTransition } from "react";
import { marcarVendidaAction, marcarDisponivelAction, excluirPecaAction } from "../actions";

type Props = {
  id: string;
  titulo: string;
  status: "DISPONIVEL" | "RESERVADO" | "VENDIDO";
};

export function PecaActions({ id, titulo, status }: Props) {
  const [pending, startTransition] = useTransition();

  function marcarVendida() {
    startTransition(() => marcarVendidaAction(id));
  }

  function marcarDisponivel() {
    startTransition(() => marcarDisponivelAction(id));
  }

  function excluir() {
    if (!confirm(`Excluir "${titulo}"?\nEsta ação não pode ser desfeita.`)) return;
    startTransition(() => excluirPecaAction(id));
  }

  return (
    <div className="flex gap-2 shrink-0 flex-col sm:flex-row items-end sm:items-center">
      {status !== "VENDIDO" ? (
        <button
          onClick={marcarVendida}
          disabled={pending}
          className="text-xs px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-opacity"
          style={{ background: "#FBF3F3", color: "#C97B7B", border: "1px solid #F2C4C5", opacity: pending ? 0.6 : 1 }}
        >
          Marcar vendida
        </button>
      ) : (
        <button
          onClick={marcarDisponivel}
          disabled={pending}
          className="text-xs px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-opacity"
          style={{ background: "#EDF5EE", color: "#4A6B50", border: "1px solid #B8D4B8", opacity: pending ? 0.6 : 1 }}
        >
          Disponibilizar
        </button>
      )}

      <button
        onClick={excluir}
        disabled={pending}
        className="text-xs p-1.5 rounded-full transition-colors hover:bg-red-50"
        style={{ color: "#C97B7B", opacity: pending ? 0.6 : 1 }}
        aria-label="Excluir"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
        </svg>
      </button>
    </div>
  );
}
