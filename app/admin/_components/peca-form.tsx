"use client";

import { useActionState, useState } from "react";
import { FotoUpload } from "./foto-upload";
import { formatCentavos } from "@/lib/format";

type Categoria = { id: string; nome: string; slug: string };
type FotoMin  = { id: string; url: string; ordem: number };
type PecaMin  = {
  id: string; titulo: string; descricao: string | null;
  precoCentavos: number; tamanho: string | null; marca: string | null;
  cor: string | null; estado: string; medidas: string | null;
  categoriaId: string | null; fotos: FotoMin[];
};

type Props = {
  categorias: Categoria[];
  peca?: PecaMin;
  action: (prev: { error: string } | null, fd: FormData) => Promise<{ error: string } | null>;
};

const ESTADOS = [
  { value: "USADO",              label: "Usado" },
  { value: "SEMINOVO",           label: "Seminovo" },
  { value: "NOVO_COM_ETIQUETA",  label: "Novo com etiqueta" },
];

export function PecaForm({ categorias, peca, action }: Props) {
  const [state, formAction, pending] = useActionState(action, null);
  const [fotos, setFotos] = useState<string[]>(
    peca?.fotos.sort((a, b) => a.ordem - b.ordem).map((f) => f.url) ?? []
  );

  // Exibe o preço formatado para edição
  const precoDefault = peca
    ? (peca.precoCentavos / 100).toFixed(2).replace(".", ",")
    : "";

  return (
    <form action={formAction} className="space-y-6 max-w-2xl">
      {peca ? <input type="hidden" name="id" value={peca.id} /> : null}

      {/* Fotos */}
      <section className="p-5 rounded-2xl" style={{ background: "#fff9f2", border: "1px solid #E5D5B5" }}>
        <h2 className="font-semibold mb-3" style={{ color: "#4A3728" }}>📸 Fotos</h2>
        {/* Hidden inputs para URLs das fotos */}
        <input type="hidden" name="fotoCount" value={fotos.length} />
        {fotos.map((url, i) => (
          <input key={i} type="hidden" name={`foto-${i}`} value={url} />
        ))}
        <FotoUpload fotos={fotos} onChange={setFotos} />
      </section>

      {/* Dados básicos */}
      <section className="p-5 rounded-2xl space-y-4" style={{ background: "#fff9f2", border: "1px solid #E5D5B5" }}>
        <h2 className="font-semibold" style={{ color: "#4A3728" }}>✏️ Dados da peça</h2>

        <Field label="Título *" hint="Nome que aparece no catálogo">
          <input name="titulo" required defaultValue={peca?.titulo} placeholder="Ex: Jaqueta jeans azul vintage"
            className="input-base" />
        </Field>

        <Field label="Preço *" hint="Em reais — ex: 89,90">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium" style={{ color: "#7A5C48" }}>R$</span>
            <input name="preco" required type="text" inputMode="decimal"
              defaultValue={precoDefault} placeholder="0,00"
              className="input-base pl-10" />
          </div>
        </Field>

        <Field label="Descrição">
          <textarea name="descricao" rows={3} defaultValue={peca?.descricao ?? ""}
            placeholder="Conte sobre a peça, seu histórico, detalhes…"
            className="input-base resize-none" />
        </Field>
      </section>

      {/* Atributos */}
      <section className="p-5 rounded-2xl space-y-4" style={{ background: "#fff9f2", border: "1px solid #E5D5B5" }}>
        <h2 className="font-semibold" style={{ color: "#4A3728" }}>🏷 Atributos</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Categoria">
            <select name="categoriaId" defaultValue={peca?.categoriaId ?? ""} className="input-base">
              <option value="">Sem categoria</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </Field>

          <Field label="Tamanho" hint="P, M, G, 38, 40…">
            <input name="tamanho" defaultValue={peca?.tamanho ?? ""}
              placeholder="M" className="input-base" />
          </Field>

          <Field label="Marca">
            <input name="marca" defaultValue={peca?.marca ?? ""}
              placeholder="Ex: Zara, Farm, sem marca…" className="input-base" />
          </Field>

          <Field label="Cor">
            <input name="cor" defaultValue={peca?.cor ?? ""}
              placeholder="Ex: Azul, Multicolorido" className="input-base" />
          </Field>
        </div>

        <Field label="Estado de conservação *">
          <div className="flex flex-wrap gap-3 mt-1">
            {ESTADOS.map(({ value, label }) => (
              <label key={value} className="flex items-center gap-2 cursor-pointer px-4 py-2 rounded-full transition-all"
                style={{ border: "1.5px solid #E5D5B5", background: "#FAF6EE" }}>
                <input type="radio" name="estado" value={value}
                  defaultChecked={(peca?.estado ?? "USADO") === value}
                  className="accent-rosa" />
                <span className="text-sm font-medium" style={{ color: "#4A3728" }}>{label}</span>
              </label>
            ))}
          </div>
        </Field>

        <Field label="Medidas" hint="Opcional — ex: Busto 90cm, Cintura 72cm">
          <input name="medidas" defaultValue={peca?.medidas ?? ""}
            placeholder="Busto 90cm · Cintura 72cm · Comprimento 105cm"
            className="input-base" />
        </Field>
      </section>

      {/* Erro */}
      {state && "error" in state && (
        <p className="px-4 py-3 rounded-2xl text-sm font-medium"
          style={{ background: "#FBF3F3", color: "#C97B7B", border: "1px solid #F2C4C5" }}>
          ⚠ {state.error}
        </p>
      )}

      {/* Submit */}
      <div className="flex gap-3 flex-wrap">
        <button type="submit" disabled={pending} className="btn-primary"
          style={{ opacity: pending ? 0.7 : 1, fontSize: "1rem", padding: "0.85rem 2rem" }}>
          {pending ? "Salvando…" : peca ? "💾 Salvar alterações" : "✦ Publicar peça"}
        </button>
        <a href="/admin" className="btn-secondary" style={{ fontSize: "0.9rem", padding: "0.85rem 1.5rem" }}>
          Cancelar
        </a>
      </div>
    </form>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1" style={{ color: "#4A3728" }}>
        {label}
        {hint && <span className="ml-2 text-xs font-normal" style={{ color: "#B8A898" }}>{hint}</span>}
      </label>
      {children}
    </div>
  );
}
