"use client";

import { useTransition, useState } from "react";
import { marcarEntregueAction, reenviarEmailAction, confirmarPagamentoAction } from "../../actions";

type Props = {
  pedidoId: string;
  status: string;
  email: string;
};

export function VendaActions({ pedidoId, status, email }: Props) {
  const [pending, startTransition] = useTransition();
  const [emailMsg, setEmailMsg] = useState<string | null>(null);

  function confirmarPagamento() {
    if (!confirm("Confirmar pagamento manualmente?\n\nUse apenas quando o webhook do Mercado Pago não chegou.")) return;
    startTransition(() => confirmarPagamentoAction(pedidoId));
  }

  function marcarEntregue() {
    if (!confirm("Confirmar entrega realizada?")) return;
    startTransition(() => marcarEntregueAction(pedidoId));
  }

  function reenviarEmail() {
    setEmailMsg(null);
    startTransition(async () => {
      const res = await reenviarEmailAction(pedidoId);
      setEmailMsg(res && "error" in res ? `Erro: ${res.error}` : `E-mail enviado para ${email}`);
    });
  }

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {status === "PAGO" && (
        <button onClick={marcarEntregue} disabled={pending}
          className="text-xs px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-opacity"
          style={{ background: "#EDF5EE", color: "#4A6B50", border: "1px solid #B8D4B8", opacity: pending ? 0.6 : 1 }}>
          ✓ Marcar entregue
        </button>
      )}

      <button onClick={reenviarEmail} disabled={pending}
        className="text-xs px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-opacity"
        style={{ background: "#F4ECD8", color: "#7A5C48", border: "1px solid #E5D5B5", opacity: pending ? 0.6 : 1 }}
        title={`Reenviar e-mail para ${email}`}>
        📧 Reenviar e-mail
      </button>

      {emailMsg && (
        <span className="text-xs" style={{ color: emailMsg.startsWith("Erro") ? "#C97B7B" : "#4A6B50" }}>
          {emailMsg}
        </span>
      )}
    </div>
  );
}

// Componente separado — aparece na aba "Pedidos pendentes" do admin
export function ConfirmarPagamentoButton({ pedidoId }: { pedidoId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() => {
        if (!confirm("Confirmar pagamento manualmente?\n\nUse apenas quando o webhook do MP não chegou.")) return;
        startTransition(() => confirmarPagamentoAction(pedidoId));
      }}
      disabled={pending}
      className="text-xs px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-opacity"
      style={{ background: "#FBF6EE", color: "#C4973F", border: "1px solid #E5D5B5", opacity: pending ? 0.6 : 1 }}
    >
      {pending ? "Confirmando…" : "⚡ Confirmar pagamento"}
    </button>
  );
}
