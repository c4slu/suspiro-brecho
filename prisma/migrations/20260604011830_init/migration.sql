-- CreateEnum
CREATE TYPE "StatusPeca" AS ENUM ('DISPONIVEL', 'RESERVADO', 'VENDIDO');

-- CreateEnum
CREATE TYPE "StatusPedido" AS ENUM ('PENDENTE', 'PAGO', 'EXPIRADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "EstadoConservacao" AS ENUM ('NOVO_COM_ETIQUETA', 'SEMINOVO', 'USADO');

-- CreateTable
CREATE TABLE "Categoria" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Categoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Peca" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descricao" TEXT,
    "precoCentavos" INTEGER NOT NULL,
    "tamanho" TEXT,
    "marca" TEXT,
    "cor" TEXT,
    "estado" "EstadoConservacao" NOT NULL DEFAULT 'USADO',
    "medidas" TEXT,
    "status" "StatusPeca" NOT NULL DEFAULT 'DISPONIVEL',
    "reservadoAte" TIMESTAMP(3),
    "categoriaId" TEXT,
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadaEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Peca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Foto" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "pecaId" TEXT NOT NULL,

    CONSTRAINT "Foto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pedido" (
    "id" TEXT NOT NULL,
    "clienteNome" TEXT NOT NULL,
    "clienteEmail" TEXT NOT NULL,
    "clienteTelefone" TEXT,
    "enderecoCep" TEXT,
    "enderecoLinha" TEXT,
    "enderecoCidade" TEXT,
    "enderecoUf" TEXT,
    "status" "StatusPedido" NOT NULL DEFAULT 'PENDENTE',
    "totalCentavos" INTEGER NOT NULL,
    "mpPreferenceId" TEXT,
    "mpPaymentId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "expiraEm" TIMESTAMP(3),

    CONSTRAINT "Pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemPedido" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "pecaId" TEXT NOT NULL,
    "precoCentavos" INTEGER NOT NULL,

    CONSTRAINT "ItemPedido_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Categoria_nome_key" ON "Categoria"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Categoria_slug_key" ON "Categoria"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Peca_slug_key" ON "Peca"("slug");

-- CreateIndex
CREATE INDEX "Peca_status_idx" ON "Peca"("status");

-- CreateIndex
CREATE INDEX "Peca_categoriaId_idx" ON "Peca"("categoriaId");

-- CreateIndex
CREATE INDEX "Foto_pecaId_idx" ON "Foto"("pecaId");

-- CreateIndex
CREATE UNIQUE INDEX "Pedido_mpPreferenceId_key" ON "Pedido"("mpPreferenceId");

-- CreateIndex
CREATE UNIQUE INDEX "Pedido_mpPaymentId_key" ON "Pedido"("mpPaymentId");

-- CreateIndex
CREATE INDEX "Pedido_status_idx" ON "Pedido"("status");

-- CreateIndex
CREATE INDEX "ItemPedido_pecaId_idx" ON "ItemPedido"("pecaId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemPedido_pedidoId_pecaId_key" ON "ItemPedido"("pedidoId", "pecaId");

-- AddForeignKey
ALTER TABLE "Peca" ADD CONSTRAINT "Peca_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Foto" ADD CONSTRAINT "Foto_pecaId_fkey" FOREIGN KEY ("pecaId") REFERENCES "Peca"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemPedido" ADD CONSTRAINT "ItemPedido_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemPedido" ADD CONSTRAINT "ItemPedido_pecaId_fkey" FOREIGN KEY ("pecaId") REFERENCES "Peca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
