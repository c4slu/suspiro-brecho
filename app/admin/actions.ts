"use server";

import { prisma } from "@/lib/prisma";
import { createSupabaseServer } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// ── Helpers ──────────────────────────────────────────────────────────────────

async function assertAdmin() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autorizado");
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function uniqueSlug(titulo: string, excludeId?: string) {
  const base = slugify(titulo);
  let slug = base;
  let n = 0;
  while (true) {
    const exists = await prisma.peca.findFirst({
      where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) },
    });
    if (!exists) break;
    slug = `${base}-${++n}`;
  }
  return slug;
}

function parsePecaForm(fd: FormData) {
  const precoRaw = fd.get("preco") as string;
  // Aceita "89,90" ou "89.90" ou "8990" (centavos)
  const precoNum = parseFloat(precoRaw.replace(",", "."));
  const precoCentavos = precoNum < 1000 ? Math.round(precoNum * 100) : Math.round(precoNum);

  const fotoCount = parseInt(fd.get("fotoCount") as string) || 0;
  const fotos: string[] = [];
  for (let i = 0; i < fotoCount; i++) {
    const url = fd.get(`foto-${i}`) as string;
    if (url) fotos.push(url);
  }

  return {
    titulo: (fd.get("titulo") as string).trim(),
    descricao: (fd.get("descricao") as string)?.trim() || undefined,
    precoCentavos,
    tamanho: (fd.get("tamanho") as string)?.trim() || undefined,
    marca: (fd.get("marca") as string)?.trim() || undefined,
    cor: (fd.get("cor") as string)?.trim() || undefined,
    estado: (fd.get("estado") as "NOVO_COM_ETIQUETA" | "SEMINOVO" | "USADO") || "USADO",
    medidas: (fd.get("medidas") as string)?.trim() || undefined,
    categoriaId: (fd.get("categoriaId") as string) || undefined,
    fotos,
  };
}

// ── Login / Logout ────────────────────────────────────────────────────────────

export async function loginAction(_: { error: string } | null, fd: FormData): Promise<{ error: string } | null> {
  const email = fd.get("email") as string;
  const senha = fd.get("senha") as string;

  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (error) return { error: "E-mail ou senha incorretos." };
  redirect("/admin");
}

export async function logoutAction() {
  const supabase = await createSupabaseServer();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

// ── Categorias ────────────────────────────────────────────────────────────────

export async function criarCategoriaAction(fd: FormData): Promise<void> {
  await assertAdmin();
  const nome = (fd.get("nome") as string)?.trim();
  if (!nome) return;
  const slug = slugify(nome);
  await prisma.categoria.upsert({
    where: { slug },
    update: {},
    create: { nome, slug },
  });
  revalidatePath("/admin");
}

// ── Criar peça ───────────────────────────────────────────────────────────────

export async function criarPecaAction(_: { error: string } | null, fd: FormData): Promise<{ error: string } | null> {
  await assertAdmin();
  const data = parsePecaForm(fd);
  if (!data.titulo) return { error: "Título obrigatório." };
  if (!data.precoCentavos) return { error: "Preço inválido." };

  const slug = await uniqueSlug(data.titulo);

  await prisma.peca.create({
    data: {
      titulo: data.titulo,
      slug,
      descricao: data.descricao,
      precoCentavos: data.precoCentavos,
      tamanho: data.tamanho,
      marca: data.marca,
      cor: data.cor,
      estado: data.estado,
      medidas: data.medidas,
      categoriaId: data.categoriaId || null,
      fotos: { create: data.fotos.map((url, i) => ({ url, ordem: i })) },
    },
  });

  revalidatePath("/admin");
  revalidatePath("/produtos");
  revalidatePath("/");
  redirect("/admin");
}

// ── Editar peça ───────────────────────────────────────────────────────────────

export async function editarPecaAction(_: { error: string } | null, fd: FormData): Promise<{ error: string } | null> {
  await assertAdmin();
  const id = fd.get("id") as string;
  if (!id) return { error: "ID não encontrado." };

  const data = parsePecaForm(fd);
  if (!data.titulo) return { error: "Título obrigatório." };

  const slug = await uniqueSlug(data.titulo, id);

  // Recria as fotos
  await prisma.foto.deleteMany({ where: { pecaId: id } });
  await prisma.peca.update({
    where: { id },
    data: {
      titulo: data.titulo,
      slug,
      descricao: data.descricao,
      precoCentavos: data.precoCentavos,
      tamanho: data.tamanho,
      marca: data.marca,
      cor: data.cor,
      estado: data.estado,
      medidas: data.medidas,
      categoriaId: data.categoriaId || null,
      fotos: { create: data.fotos.map((url, i) => ({ url, ordem: i })) },
    },
  });

  revalidatePath("/admin");
  revalidatePath(`/peca/${slug}`);
  revalidatePath("/produtos");
  revalidatePath("/");
  redirect("/admin");
}

// ── Marcar vendida (manual — venda fora do site) ─────────────────────────────

export async function marcarVendidaAction(id: string) {
  await assertAdmin();
  await prisma.peca.update({
    where: { id },
    data: { status: "VENDIDO", reservadoAte: null },
  });
  revalidatePath("/admin");
  revalidatePath("/produtos");
}

// ── Marcar disponível (desfazer venda manual) ────────────────────────────────

export async function marcarDisponivelAction(id: string) {
  await assertAdmin();
  await prisma.peca.update({
    where: { id },
    data: { status: "DISPONIVEL", reservadoAte: null },
  });
  revalidatePath("/admin");
  revalidatePath("/produtos");
}

// ── Excluir peça ──────────────────────────────────────────────────────────────

export async function excluirPecaAction(id: string) {
  await assertAdmin();
  await prisma.peca.delete({ where: { id } });
  revalidatePath("/admin");
  revalidatePath("/produtos");
  revalidatePath("/");
}
