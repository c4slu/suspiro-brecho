@AGENTS.md

# Brechó — e-commerce de peças únicas

Loja online de um brechó. Catálogo de roupas/acessórios de segunda mão, venda
direta com pagamento online. Construído com a dona do brechó (não-técnica) como
quem cadastra as peças no dia a dia.

## Stack

- **Next.js (App Router) + TypeScript**
- **Tailwind + shadcn/ui** para a UI
- **Postgres via Supabase** (banco + Storage de imagens + Auth do admin)
- **Prisma** como ORM (schema em `prisma/schema.prisma`)
- **Mercado Pago — Checkout Pro** para pagamento (Pix, cartão, boleto)
- **Deploy na Vercel**

## Conceito que rege tudo: peça única

Cada peça tem **estoque 1**. Não há variações de quantidade. Quando vende, sai do
catálogo. Por isso:

- `Peca.status` = `DISPONIVEL | RESERVADO | VENDIDO`.
- Ao iniciar um checkout, as peças do carrinho passam a `RESERVADO` com
  `reservadoAte` = agora + 15 min. Isso impede que duas pessoas comprem a mesma peça.
- A transição `DISPONIVEL -> RESERVADO` DEVE ser feita dentro de uma transação que
  cheque o status atual de forma atômica (evitar condição de corrida no checkout).
- Webhook do Mercado Pago confirma pagamento -> peças viram `VENDIDO`, pedido `PAGO`.
- Se a reserva expira sem pagamento -> peças voltam a `DISPONIVEL`, pedido `EXPIRADO`.
  (Precisa de um job/cron ou verificação on-read pra liberar reservas vencidas.)

## Pedido com vários itens (carrinho)

O cliente pode comprar várias peças num mesmo pedido. Modelo: `Pedido` tem muitos
`ItemPedido`, cada um aponta pra uma `Peca`. `ItemPedido.precoCentavos` guarda o
preço no momento da compra (snapshot).

## Pagamento (Mercado Pago Checkout Pro)

- Fluxo: criar uma "preferência" via API do MP -> redirecionar o cliente pro
  checkout do MP -> ele volta pro site -> o **webhook** confirma o pagamento.
- Guardar `mpPreferenceId` e `mpPaymentId` no `Pedido`.
- Credenciais do Mercado Pago e do Supabase ficam em variáveis de ambiente
  (`.env`), NUNCA no código. Quem gera e cola as chaves é o desenvolvedor humano.

## Escopo do MVP (foco: vender já)

1. Catálogo público com fotos, filtros por categoria e tamanho, página da peça.
2. Carrinho com várias peças.
3. Checkout via Checkout Pro, com reserva temporária + webhook.
4. Painel admin protegido por login (Supabase Auth).
5. Frete: começar com valor fixo por região (cálculo real fica pra depois).

Fora do MVP (fase 2): cálculo de frete via Melhor Envio, contas de cliente, lista
de desejos, cupons, e-mails automáticos, Checkout Bricks, relatórios.

## Painel admin (prioridade de usabilidade)

A dona do brechó cadastra sozinha e não é técnica. O `/admin` precisa ser simples
e à prova de erro:

- Formulário de cadastro de peça: arrastar várias fotos, título, descrição, preço,
  tamanho, categoria, marca, estado de conservação, medidas.
- Botão "marcar como vendido" (pra peças vendidas pessoalmente ou pelo Instagram,
  que não podem continuar aparecendo no site).

## Convenções

- Dinheiro SEMPRE em centavos (`Int`), nunca float. Formatar pra exibição só na UI.
- `slug` único em `Peca` e `Categoria` para URLs amigáveis e filtros.
- Português nos nomes de modelo/campo do domínio (Peca, Pedido) — manter consistência.

## Roadmap de construção

1. Setup Next + Supabase + Prisma + modelo de dados (`schema.prisma`).
2. Catálogo público lendo do banco.
3. Painel admin de cadastro.
4. Integração Mercado Pago: reserva + webhook.
5. Frete fixo + e-mail de confirmação.
6. Deploy na Vercel.

Ver o modelo de dados em @prisma/schema.prisma
