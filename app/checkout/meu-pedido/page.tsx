"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatCentavos } from "@/lib/format";

type PedidoDetalhe = {
  id: string;
  clienteNome: string;
  clienteEmail: string;
  totalCentavos: number;
  status: string;
  enderecoLinha: string | null;
  enderecoCidade: string | null;
  enderecoUf: string | null;
  enderecoCep: string | null;
  itens: {
    id: string;
    precoCentavos: number;
    peca: {
      titulo: string;
      slug: string;
      tamanho: string | null;
      fotos: { url: string }[];
    };
  }[];
};

const STATUS_LABEL: Record<string, { emoji: string; texto: string; cor: string }> = {
  PENDENTE: { emoji: "⏳", texto: "Aguardando pagamento", cor: "#C4973F" },
  PAGO:     { emoji: "✅", texto: "Pagamento confirmado", cor: "#4A6B50" },
  EXPIRADO: { emoji: "❌", texto: "Expirado", cor: "#C97B7B" },
  CANCELADO:{ emoji: "❌", texto: "Cancelado", cor: "#C97B7B" },
};

export default function MeuPedidoPage() {
  const [pedido, setPedido] = useState<PedidoDetalhe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = localStorage.getItem("suspiro-last-order");
    if (!id) { setLoading(false); return; }

    fetch(`/api/pedido/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setPedido(data);
      })
      .catch(() => setError("Não foi possível carregar o pedido."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: "#F4ECD8" }}>
        <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: "#D4888A", borderTopColor: "transparent" }} />
      </main>
    );
  }

  if (!pedido) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-5 px-4 text-center"
        style={{ background: "#F4ECD8" }}>
        <span style={{ fontSize: 56 }}>🛍️</span>
        <h1 className="font-display italic text-3xl" style={{ color: "#4A3728" }}>
          Nenhum pedido encontrado
        </h1>
        <p className="text-sm" style={{ color: "#7A5C48" }}>
          {error ?? "Nenhum pedido recente neste dispositivo."}
        </p>
        <Link href="/produtos" className="btn-primary">Ver catálogo</Link>
      </main>
    );
  }

  const statusInfo = STATUS_LABEL[pedido.status] ?? STATUS_LABEL.PENDENTE;

  return (
    <main className="min-h-screen py-12 px-4" style={{ background: "#F4ECD8" }}>
      <div className="max-w-lg mx-auto space-y-5">

        {/* Status */}
        <div className="p-7 rounded-3xl text-center animate-scale-in"
          style={{ background: "#fff9f2", border: "1px solid #E5D5B5" }}>
          <div className="text-5xl mb-4">{statusInfo.emoji}</div>
          <h1 className="font-display italic text-2xl mb-1" style={{ color: "#4A3728" }}>
            Seu pedido
          </h1>
          <span className="text-sm font-semibold px-3 py-1 rounded-full"
            style={{ background: `${statusInfo.cor}22`, color: statusInfo.cor }}>
            {statusInfo.texto}
          </span>
          <p className="text-xs mt-3 font-mono" style={{ color: "#B8A898" }}>
            #{pedido.id.slice(-8).toUpperCase()}
          </p>
        </div>

        {/* Itens */}
        <div className="rounded-3xl overflow-hidden"
          style={{ background: "#fff9f2", border: "1px solid #E5D5B5" }}>
          <p className="font-display italic text-xl px-6 pt-5 pb-3" style={{ color: "#4A3728" }}>
            O que você levou
          </p>
          <div className="divide-y" style={{ borderColor: "#E5D5B5" }}>
            {pedido.itens.map((item) => (
              <div key={item.id} className="flex gap-4 px-6 py-4 items-center">
                <div className="relative w-14 h-18 rounded-xl overflow-hidden shrink-0"
                  style={{ width: 56, height: 72, background: "#EDE0C8" }}>
                  {item.peca.fotos[0]?.url ? (
                    <Image src={item.peca.fotos[0].url} alt={item.peca.titulo} fill className="object-cover" sizes="56px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">👗</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm leading-snug" style={{ color: "#4A3728" }}>{item.peca.titulo}</p>
                  {item.peca.tamanho && (
                    <span className="text-xs px-2 py-0.5 rounded-full mt-1 inline-block"
                      style={{ background: "#E5D5B5", color: "#4A3728" }}>{item.peca.tamanho}</span>
                  )}
                </div>
                <span className="text-sm font-semibold shrink-0" style={{ color: "#4A3728" }}>
                  {formatCentavos(item.precoCentavos)}
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-between px-6 py-4 border-t" style={{ borderColor: "#E5D5B5" }}>
            <span className="text-sm font-semibold" style={{ color: "#7A5C48" }}>Total</span>
            <span className="font-display italic text-xl" style={{ color: "#4A3728" }}>
              {formatCentavos(pedido.totalCentavos)}
            </span>
          </div>
        </div>

        {/* Endereço */}
        {pedido.enderecoLinha && (
          <div className="p-6 rounded-3xl" style={{ background: "#fff9f2", border: "1px solid #E5D5B5" }}>
            <p className="font-display italic text-xl mb-3" style={{ color: "#4A3728" }}>Endereço de entrega</p>
            <div className="text-sm space-y-1" style={{ color: "#7A5C48" }}>
              <p className="font-semibold" style={{ color: "#4A3728" }}>{pedido.clienteNome}</p>
              <p>{pedido.enderecoLinha}</p>
              <p>{pedido.enderecoCidade}{pedido.enderecoUf ? ` — ${pedido.enderecoUf}` : ""}{pedido.enderecoCep ? ` · CEP ${pedido.enderecoCep}` : ""}</p>
            </div>
          </div>
        )}

        <Link href="/produtos" className="btn-primary w-full block text-center">
          Continuar explorando ✦
        </Link>
      </div>
    </main>
  );
}
