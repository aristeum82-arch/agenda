import { NextResponse } from "next/server";
import { db } from "@/db";
import { usuariosInfo } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * ROTA DE EMERGÊNCIA - Promove usuário por RE para admin_p5
 * Uso: GET /api/make-admin?re=SEU_RE&secret=pmesp2025
 * REMOVA esta rota após o uso!
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const re = searchParams.get("re");
        const secret = searchParams.get("secret");

        if (secret !== "pmesp2025") {
            return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
        }

        if (!re) {
            return NextResponse.json({ error: "Parâmetro 're' é obrigatório." }, { status: 400 });
        }

        // Listar todos os usuários do banco
        const todos = await db.select().from(usuariosInfo).all();

        const usuario = todos.find(u => u.re === re);
        if (!usuario) {
            return NextResponse.json({
                error: `Usuário com RE ${re} não encontrado.`,
                usuariosNoBanco: todos.map(u => ({ re: u.re, nome: u.nomeGuerra, role: u.role }))
            }, { status: 404 });
        }

        // Rebaixa qualquer outro admin_p5 existente
        await db
            .update(usuariosInfo)
            .set({ role: "user" })
            .where(eq(usuariosInfo.role, "admin_p5"));

        // Promove o usuário solicitado
        await db
            .update(usuariosInfo)
            .set({ role: "admin_p5" })
            .where(eq(usuariosInfo.re, re));

        return NextResponse.json({
            success: true,
            message: `${usuario.postoGraduacao} ${usuario.nomeGuerra} (RE: ${re}) promovido para admin_p5!`,
            instrucao: "Agora acesse /dashboard e você entrará como administrador."
        });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Erro interno: " + String(error) }, { status: 500 });
    }
}
