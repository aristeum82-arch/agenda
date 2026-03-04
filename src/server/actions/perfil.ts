"use server";

import { db } from "@/db";
import { usuariosInfo } from "@/db/schema";
import { eq, ne } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const perfilSchema = z.object({
    re: z.string().length(6, "RE deve ter exatamente 6 dígitos"),
    email: z.string().email().optional().or(z.literal("")),
    postoGraduacao: z.enum([
        "Cel PM", "Ten Cel PM", "Maj PM", "Cap PM",
        "1º Ten PM", "2º Ten PM", "Sub Ten PM",
        "1º Sgt PM", "2º Sgt PM", "3º Sgt PM",
        "Cb PM", "Sd PM",
    ]),
    nomeGuerra: z.string().min(2, "Obrigatório"),
    opm: z.enum([
        "CPI-7",
        "ESSD",
        "7 BPM-I",
        "12 BPM-I",
        "14 BAEP",
        "22 BPM-I",
        "40 BPM-I",
        "50 BPM-I",
        "53 BPM-I",
        "54 BPM-I",
        "55 BPM-I",
    ]),
    // numeroOficioSei removed from profile; SEI belongs to agendamento
});

export async function getPerfilUsuario() {
    const { userId } = await auth();
    if (!userId) return null;

    const resultado = await db
        .select()
        .from(usuariosInfo)
        .where(eq(usuariosInfo.id, userId))
        .get();

    return resultado || null;
}

export async function salvarPerfil(data: z.infer<typeof perfilSchema>) {
    try {
        const { userId } = await auth();
        if (!userId) return { success: false, message: "Não autorizado" };

        const parsed = perfilSchema.safeParse(data);
        if (!parsed.success) return { success: false, message: "Dados inválidos" };

        const perfilExistente = await getPerfilUsuario();

        if (perfilExistente) {
            await db
                .update(usuariosInfo)
                .set(parsed.data)
                .where(eq(usuariosInfo.id, userId));
        } else {
            // Verifica se é o primeiro usuário (vira admin automaticamente)
            const totalUsuarios = await db.select().from(usuariosInfo).all();
            const role = totalUsuarios.length === 0 ? "admin_p5" : "user";

            await db.insert(usuariosInfo).values({
                id: userId,
                ...parsed.data,
                role,
                createdAt: new Date(),
            });
        }

        revalidatePath("/");
        return { success: true, message: "Perfil atualizado com sucesso" };
    } catch (error) {
        console.error(error);
        return { success: false, message: "Erro ao salvar perfil" };
    }
}

export async function listarUsuarios(reBusca?: string) {
    const { userId } = await auth();
    if (!userId) return [];

    const admin = await getPerfilUsuario();
    if (!admin || admin.role === "user") return [];

    let query = db.select().from(usuariosInfo);

    if (reBusca) {
        query = query.where(eq(usuariosInfo.re, reBusca)) as any;
    } else {
        query = query.where(ne(usuariosInfo.role, "user")) as any;
    }

    return await query.all();
}

export async function atualizarRole(
    targetUserId: string,
    novaRole: "user" | "admin_p5" | "admin_central"
) {
    try {
        const { userId } = await auth();
        if (!userId) return { success: false, message: "Não autorizado" };

        const admin = await getPerfilUsuario();
        if (!admin || admin.role === "user") return { success: false, message: "Sem permissão" };

        if (novaRole === "admin_p5") {
            // Rebaixa o atual chefe P5 para usuário antes de promover o novo
            await db
                .update(usuariosInfo)
                .set({ role: "user" })
                .where(eq(usuariosInfo.role, "admin_p5"));
        }

        await db
            .update(usuariosInfo)
            .set({ role: novaRole })
            .where(eq(usuariosInfo.id, targetUserId));

        revalidatePath("/dashboard/admin/usuarios");
        return { success: true, message: "Permissão atualizada com sucesso" };
    } catch (error) {
        console.error(error);
        return { success: false, message: "Erro ao atualizar permissão" };
    }
}
