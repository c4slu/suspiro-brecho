import Link from "next/link";

export default function SucessoPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <div
        className="max-w-md w-full p-10 rounded-3xl animate-scale-in"
        style={{ background: "#fff9f2", border: "1px solid #E5D5B5" }}
      >
        <div className="text-6xl mb-6 animate-float-gentle inline-block">🪩</div>

        <h1 className="font-display italic text-4xl mb-3" style={{ color: "#4A3728" }}>
          Pedido confirmado!
        </h1>

        <p className="mb-2" style={{ color: "#7A5C48" }}>
          Recebemos seu pedido com sucesso.
        </p>
        <p className="text-sm mb-8" style={{ color: "#B8A898" }}>
          Você receberá uma confirmação por e-mail com os detalhes da entrega.
        </p>

        <div className="flex flex-col gap-3">
          <Link href="/" className="btn-primary w-full">
            Continuar comprando
          </Link>
        </div>
      </div>
    </main>
  );
}
