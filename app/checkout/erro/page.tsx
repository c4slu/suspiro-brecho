import Link from "next/link";

type Props = {
  searchParams: Promise<{
    collection_status?: string;
    status?: string;
    external_reference?: string;
  }>;
};

export default async function ErroPage({ searchParams }: Props) {
  const sp = await searchParams;
  const status = sp.collection_status ?? sp.status ?? "";

  // Usuário clicou em "voltar" sem tentar pagar (status vem como "null" string ou vazio)
  const voltouSemPagar = !status || status === "null" || status === "";

  if (voltouSemPagar) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 text-center"
        style={{ background: "#F4ECD8" }}>
        <div className="max-w-md w-full p-8 sm:p-10 rounded-3xl animate-scale-in"
          style={{ background: "#fff9f2", border: "1px solid #E5D5B5" }}>
          <div className="text-5xl mb-5 inline-block">🛍️</div>

          <h1 className="font-display italic text-3xl sm:text-4xl mb-3" style={{ color: "#4A3728" }}>
            Voltou antes de pagar?
          </h1>

          <p className="mb-2" style={{ color: "#7A5C48" }}>
            Sem problema! Suas peças ficam reservadas por alguns minutos.
          </p>
          <p className="text-sm mb-8" style={{ color: "#B8A898" }}>
            Se quiser tentar de novo, basta ir para o carrinho e finalizar a compra.
          </p>

          <div className="flex flex-col gap-3">
            <Link href="/checkout" className="btn-primary w-full block text-center">
              Tentar novamente
            </Link>
            <Link href="/produtos" className="btn-secondary w-full block text-center text-sm">
              Continuar explorando
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Pagamento recusado / rejeitado
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 text-center"
      style={{ background: "#F4ECD8" }}>
      <div className="max-w-md w-full p-8 sm:p-10 rounded-3xl animate-scale-in"
        style={{ background: "#fff9f2", border: "1px solid #E5D5B5" }}>
        <div className="text-5xl mb-5 inline-block">💳</div>

        <h1 className="font-display italic text-3xl sm:text-4xl mb-3" style={{ color: "#4A3728" }}>
          Pagamento não aprovado
        </h1>

        <p className="mb-2" style={{ color: "#7A5C48" }}>
          Houve um problema ao processar seu pagamento.
        </p>
        <p className="text-sm mb-8" style={{ color: "#B8A898" }}>
          Isso pode acontecer por saldo insuficiente, dados incorretos ou limite do cartão.
          Você pode tentar com outro meio de pagamento.
        </p>

        <div className="flex flex-col gap-3">
          <Link href="/checkout" className="btn-primary w-full block text-center">
            Tentar com outro pagamento
          </Link>
          <Link href="/produtos" className="btn-secondary w-full block text-center text-sm">
            Ver mais peças
          </Link>
        </div>
      </div>
    </main>
  );
}
