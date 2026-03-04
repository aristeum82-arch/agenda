import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { usuariosInfo } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

/**
 * ROTA DE EMERGÊNCIA - Promove o usuário logado para admin_p5
 * CONDIÇÃO: Só funciona se NÃO houver nenhum admin no banco ainda.
 * Após o primeiro uso bem-sucedido, esta rota não terá mais efeito.
 */
export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Você precisa estar logado." }, { status: 401 });
        }

        // Verifica se já existe algum admin
        const adminsExistentes = await db
            .select()
            .from(usuariosInfo)
            .where(inArray(usuariosInfo.role, ["admin_p5", "admin_central"]))
            .all();

        if (adminsExistentes.length > 0) {
            return NextResponse.json({
                error: "Já existe um administrador no sistema. Esta rota não pode mais ser usada.",
                admins: adminsExistentes.map(a => `${a.postoGraduacao} ${a.nomeGuerra} (${a.role})`)
            }, { status: 403 });
        }

        // Verifica se o usuário tem perfil cadastrado
        const meuPerfil = await db
            .select()
            .from(usuariosInfo)
            .where(eq(usuariosInfo.id, userId))
            .get();

        if (!meuPerfil) {
            return NextResponse.json({
                error: "Você precisa primeiro completar seu cadastro em /dashboard/perfil"
            }, { status: 400 });
        }

        // Promove para admin_p5
        await db
            .update(usuariosInfo)
            .set({ role: "admin_p5" })
            .where(eq(usuariosInfo.id, userId));

        return NextResponse.json({
            success: true,
            message: `${meuPerfil.postoGraduacao} ${meuPerfil.nomeGuerra} promovido(a) para admin_p5! Acesse o painel em /dashboard`
        });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
    }
}
