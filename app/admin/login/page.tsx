"use client";

import { useActionState } from "react";
import { loginAction } from "../actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, null);

  return (
    <main className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "linear-gradient(160deg, #F4ECD8 0%, #EDBBBC 50%, #B8D4B8 100%)" }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <p className="font-display italic text-4xl mb-1" style={{ color: "#4A3728" }}>✦ Suspiro</p>
          <p className="text-sm" style={{ color: "#7A5C48" }}>Área administrativa</p>
        </div>

        <div className="p-8 rounded-3xl shadow-sm" style={{ background: "#fff9f2", border: "1px solid #E5D5B5" }}>
          <h1 className="font-display italic text-2xl mb-6" style={{ color: "#4A3728" }}>Entrar</h1>

          <form action={formAction} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "#4A3728" }}>
                E-mail
              </label>
              <input name="email" type="email" required autoComplete="email"
                placeholder="seu@email.com" className="input-base" />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "#4A3728" }}>
                Senha
              </label>
              <input name="senha" type="password" required autoComplete="current-password"
                placeholder="••••••••" className="input-base" />
            </div>

            {state?.error && (
              <p className="text-sm px-3 py-2 rounded-xl" style={{ background: "#FBF3F3", color: "#C97B7B" }}>
                ⚠ {state.error}
              </p>
            )}

            <button type="submit" disabled={pending} className="btn-primary w-full"
              style={{ marginTop: "0.5rem", padding: "0.9rem", opacity: pending ? 0.7 : 1 }}>
              {pending ? "Entrando…" : "Entrar"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "#B8A898" }}>
          Acesso restrito · Suspiro Brechó
        </p>
      </div>
    </main>
  );
}
