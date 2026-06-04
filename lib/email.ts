import { Resend } from "resend";
import { formatCentavos } from "./format";

// Lazy — evita erro se RESEND_API_KEY não estiver disponível no load do módulo
function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key || key.startsWith("re_XXX")) return null;
  return new Resend(key);
}

const FROM = () => process.env.RESEND_FROM ?? "Suspiro Brechó <onboarding@resend.dev>";

type Item = { titulo: string; precoCentavos: number; tamanho?: string | null };
type Pedido = {
  id: string;
  clienteNome: string;
  clienteEmail: string;
  totalCentavos: number;
  enderecoLinha?: string | null;
  enderecoCidade?: string | null;
  enderecoUf?: string | null;
  enderecoCep?: string | null;
  itens: Item[];
};

function emailHtml(pedido: Pedido): string {
  const itemsHtml = pedido.itens.map(item => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #E5D5B5;color:#4A3728;font-size:14px;">
        ${item.titulo}${item.tamanho ? ` <span style="color:#B8A898">(${item.tamanho})</span>` : ""}
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #E5D5B5;color:#4A3728;font-size:14px;text-align:right;white-space:nowrap;">
        ${formatCentavos(item.precoCentavos)}
      </td>
    </tr>
  `).join("");

  const temEndereco = pedido.enderecoLinha && pedido.enderecoCidade;
  const enderecoHtml = temEndereco ? `
    <div style="background:#EDF5EE;border-radius:12px;padding:20px;margin:20px 0;">
      <p style="margin:0 0 8px;font-weight:bold;color:#4A3728;">📦 Endereço de entrega</p>
      <p style="margin:0;color:#4A6B50;line-height:1.6;">
        ${pedido.enderecoLinha}<br>
        ${pedido.enderecoCidade}${pedido.enderecoUf ? ` — ${pedido.enderecoUf}` : ""}
        ${pedido.enderecoCep ? `<br>CEP ${pedido.enderecoCep}` : ""}
      </p>
    </div>
  ` : "";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Pedido Confirmado – Suspiro Brechó</title></head>
<body style="margin:0;padding:20px;background:#F4ECD8;font-family:Georgia,'Times New Roman',serif;">
  <div style="max-width:560px;margin:0 auto;">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#D4888A,#C4973F,#7A9E7E);border-radius:16px 16px 0 0;padding:40px 32px;text-align:center;">
      <p style="margin:0;color:#fff;font-style:italic;font-size:36px;letter-spacing:1px;">✦ Suspiro</p>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.88);font-size:13px;font-family:Arial,sans-serif;">Brechó curado com amor</p>
    </div>

    <!-- Body -->
    <div style="background:#fff9f2;padding:32px;border:1px solid #E5D5B5;border-top:none;">
      <h1 style="margin:0 0 8px;color:#4A3728;font-style:italic;font-size:26px;">🪩 Pedido confirmado!</h1>
      <p style="margin:0 0 20px;color:#7A5C48;font-size:15px;">
        Olá, <strong>${pedido.clienteNome.split(" ")[0]}</strong>! Seu pagamento foi aprovado e seu pedido está sendo preparado com carinho.
      </p>

      <!-- Pedido ID -->
      <p style="margin:0 0 16px;font-family:monospace;font-size:12px;color:#B8A898;">
        Pedido #${pedido.id.slice(-8).toUpperCase()}
      </p>

      <!-- Itens -->
      <div style="background:#F4ECD8;border-radius:12px;padding:20px;margin:0 0 20px;">
        <p style="margin:0 0 12px;font-weight:bold;color:#4A3728;font-size:14px;">🛍️ O que você levou</p>
        <table style="width:100%;border-collapse:collapse;">
          ${itemsHtml}
          <tr>
            <td style="padding:12px 0 0;font-weight:bold;color:#4A3728;font-size:15px;">Total</td>
            <td style="padding:12px 0 0;font-weight:bold;color:#D4888A;font-size:18px;text-align:right;font-style:italic;">
              ${formatCentavos(pedido.totalCentavos)}
            </td>
          </tr>
        </table>
      </div>

      ${enderecoHtml}

      <!-- Next steps -->
      <div style="background:#FBF6EE;border-radius:12px;padding:20px;border:1px solid #E5D5B5;">
        <p style="margin:0 0 10px;font-weight:bold;color:#4A3728;font-size:14px;">O que acontece agora?</p>
        <p style="margin:0 0 8px;color:#7A5C48;font-size:13px;line-height:1.6;">
          📱 <strong>Entraremos em contato</strong> em breve para combinar os detalhes do envio.
        </p>
        <p style="margin:0 0 8px;color:#7A5C48;font-size:13px;line-height:1.6;">
          📦 Sua peça será embalada com cuidado e enviada para o endereço informado.
        </p>
        <p style="margin:0;color:#7A5C48;font-size:13px;line-height:1.6;">
          ♻️ Obrigada por escolher moda circular!
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#EDE0C8;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center;">
      <p style="margin:0;color:#7A5C48;font-size:12px;font-family:Arial,sans-serif;">
        Suspiro Brechó · Peças únicas com história<br>
        <span style="color:#B8A898;">Dúvidas? Responda este e-mail.</span>
      </p>
    </div>

  </div>
</body>
</html>`;
}

export async function enviarEmailConfirmacao(pedido: Pedido) {
  const resend = getResend();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY não configurada — e-mail não enviado");
    return { ok: false, reason: "not_configured" };
  }

  const { data, error } = await resend.emails.send({
    from: FROM(),
    to: [pedido.clienteEmail],
    subject: `✦ Pedido confirmado – Suspiro Brechó #${pedido.id.slice(-8).toUpperCase()}`,
    html: emailHtml(pedido),
  });

  if (error) {
    console.error("[email] Falha ao enviar:", error);
    return { ok: false, reason: error.message };
  }

  console.log("[email] Enviado:", data?.id);
  return { ok: true, id: data?.id };
}
