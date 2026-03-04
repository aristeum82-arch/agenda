"use server";

import { db } from "@/db";
import { usuariosInfo } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { randomUUID } from "crypto";

export async function buscarOuCriarPerfilPorRE(data: {
    re: string;
    email?: string;
    postoGraduacao: string;
    nomeGuerra: string;
    opm: string;
}) {
    const { userId } = await auth();
    if (!userId) return { success: false, message: "Não autorizado" } as const;

    // Verificar se ja existe um usuario com esse RE
    const existente = await db
        .select()
        .from(usuariosInfo)
        .where(eq(usuariosInfo.re, data.re))
        .get();

    if (existente) {
        return { success: true, usuario: existente, criado: false } as const;
    }

    // Criar usuário "fantasma" sem conta Clerk — o ID gerado não mapeia para o Clerk
    const novoId = `enc_${randomUUID()}`;
    await db.insert(usuariosInfo).values({
        id: novoId,
        re: data.re,
        email: data.email || null,
        postoGraduacao: data.postoGraduacao,
        nomeGuerra: data.nomeGuerra,
        opm: data.opm as any,
        role: "user",
        createdAt: new Date(),
    });

    const criado = await db.select().from(usuariosInfo).where(eq(usuariosInfo.id, novoId)).get();
    return { success: true, usuario: criado!, criado: true } as const;
}

export async function buscarPerfilPorRE(re: string) {
    const resultado = await db
        .select()
        .from(usuariosInfo)
        .where(eq(usuariosInfo.re, re))
        .get();

    return resultado || null;
}
