"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/components/cart-provider";
import { formatCentavos } from "@/lib/format";

type FormData = {
  nome: string;
  email: string;
  telefone: string;
  cep: string;
  endereco: string;
  cidade: string;
  uf: string;
};

export default function CheckoutPage() {
  const { items, total, clear } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>({
    nome: "", email: "", telefone: "",
    cep: "", endereco: "", cidade: "", uf: "",
  });

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  if (items.length === 0) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-6 px-4">
        <span style={{ fontSize: 64 }}>🛍️</span>
        <h1 className="font-display italic text-3xl" style={{ color: "#4A3728" }}>Sacola vazia</h1>
        <Link href="/" className="btn-primary">Ver catálogo</Link>
      </main>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itens: items.map((i) => ({ id: i.id, precoCentavos: i.precoCentavos, titulo: i.titulo })),
          cliente: form,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao processar checkout");

      clear();
      window.location.href = data.initPoint;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
      setLoading(false);
    }
  };

  const ESTADOS_BR = [
    "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
    "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
  ];

  return (
    <main className="min-h-screen pt-8 pb-16 px-4" style={{ background: "#F4ECD8" }}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <Link href="/" className="text-2xl" aria-label="Voltar">←</Link>
          <h1 className="font-display italic text-4xl sm:text-5xl" style={{ color: "#4A3728" }}>
            ✦ Finalizar compra
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Formulário */}
          <div className="lg:col-span-3 space-y-6">
            {/* Dados pessoais */}
            <section className="p-6 rounded-3xl" style={{ background: "#fff9f2", border: "1px solid #E5D5B5" }}>
              <h2 className="font-display italic text-2xl mb-5" style={{ color: "#4A3728" }}>
                Seus dados
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: "#4A3728" }}>
                    Nome completo *
                  </label>
                  <input
                    className="input-base"
                    type="text"
                    required
                    placeholder="Maria da Silva"
                    value={form.nome}
                    onChange={set("nome")}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: "#4A3728" }}>
                      E-mail *
                    </label>
                    <input
                      className="input-base"
                      type="email"
                      required
                      placeholder="maria@email.com"
                      value={form.email}
                      onChange={set("email")}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: "#4A3728" }}>
                      Telefone
                    </label>
                    <input
                      className="input-base"
                      type="tel"
                      placeholder="(11) 99999-9999"
                      value={form.telefone}
                      onChange={set("telefone")}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Endereço */}
            <section className="p-6 rounded-3xl" style={{ background: "#fff9f2", border: "1px solid #E5D5B5" }}>
              <h2 className="font-display italic text-2xl mb-5" style={{ color: "#4A3728" }}>
                Endereço de entrega
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: "#4A3728" }}>
                    CEP *
                  </label>
                  <input
                    className="input-base"
                    type="text"
                    required
                    placeholder="00000-000"
                    maxLength={9}
                    value={form.cep}
                    onChange={set("cep")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: "#4A3728" }}>
                    Rua, número, complemento *
                  </label>
                  <input
                    className="input-base"
                    type="text"
                    required
                    placeholder="Rua das Flores, 42, apto 3"
                    value={form.endereco}
                    onChange={set("endereco")}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: "#4A3728" }}>
                      Cidade *
                    </label>
                    <input
                      className="input-base"
                      type="text"
                      required
                      placeholder="São Paulo"
                      value={form.cidade}
                      onChange={set("cidade")}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: "#4A3728" }}>
                      UF *
                    </label>
                    <select
                      className="input-base"
                      required
                      value={form.uf}
                      onChange={set("uf")}
                    >
                      <option value="">—</option>
                      {ESTADOS_BR.map((uf) => (
                        <option key={uf} value={uf}>{uf}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </section>

            {error && (
              <div className="p-4 rounded-2xl" style={{ background: "#FBF3F3", border: "1px solid #F2C4C5" }}>
                <p className="text-sm font-medium" style={{ color: "#C97B7B" }}>⚠ {error}</p>
              </div>
            )}
          </div>

          {/* Resumo do pedido */}
          <div className="lg:col-span-2">
            <div
              className="sticky top-8 p-6 rounded-3xl space-y-4"
              style={{ background: "#fff9f2", border: "1px solid #E5D5B5" }}
            >
              <h2 className="font-display italic text-2xl" style={{ color: "#4A3728" }}>
                Resumo
              </h2>

              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "#4A3728" }}>{item.titulo}</p>
                      {item.tamanho && (
                        <p className="text-xs" style={{ color: "#B8A898" }}>Tam. {item.tamanho}</p>
                      )}
                    </div>
                    <span className="text-sm font-semibold shrink-0" style={{ color: "#4A3728" }}>
                      {formatCentavos(item.precoCentavos)}
                    </span>
                  </div>
                ))}
              </div>

              <div
                className="border-t pt-4 flex justify-between items-center"
                style={{ borderColor: "#E5D5B5" }}
              >
                <span className="font-semibold" style={{ color: "#7A5C48" }}>Total</span>
                <span className="font-display italic text-2xl" style={{ color: "#4A3728" }}>
                  {formatCentavos(total)}
                </span>
              </div>

              <div
                className="p-3 rounded-xl text-sm"
                style={{ background: "#F4ECD8", color: "#7A5C48" }}
              >
                🔒 Pagamento via Mercado Pago — Pix, cartão ou boleto
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full text-base"
                style={{ padding: "1rem", opacity: loading ? 0.7 : 1 }}
              >
                {loading ? "Processando..." : "Ir para o pagamento →"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
