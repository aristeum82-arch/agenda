"use server";

import { db } from "@/db";
import { agendamentos, usuariosInfo } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { getPerfilUsuario } from "./perfil";

export type TipoRelatorio = "Realizado" | "Cancelado";

export type RegistroRelatorio = {
    id: string;
    dataHora: Date;
    re: string | null;
    nomeGuerra: string | null;
    postoGraduacao: string | null;
    motivo: string;
    numeroOficioSei: string | null;
    porIntermedioServico: boolean;
    status: string;
};

export async function gerarDadosRelatorio(
    tipo: TipoRelatorio,
    dataInicio: string,
    dataFim: string
): Promise<{ success: boolean; dados?: RegistroRelatorio[]; message?: string }> {
    try {
        const { userId } = await auth();
        if (!userId) return { success: false, message: "Não autorizado" };

        const perfil = await getPerfilUsuario();
        if (!perfil || perfil.role === "user") return { success: false, message: "Sem permissão" };

        const inicio = new Date(dataInicio);
        inicio.setHours(0, 0, 0, 0);

        const fim = new Date(dataFim);
        fim.setHours(23, 59, 59, 999);

        const rows = await db
            .select({
                id: agendamentos.id,
                dataHora: agendamentos.dataHora,
                motivo: agendamentos.motivo,
                status: agendamentos.status,
                porIntermedioServico: agendamentos.porIntermedioServico,
                re: usuariosInfo.re,
                nomeGuerra: usuariosInfo.nomeGuerra,
                postoGraduacao: usuariosInfo.postoGraduacao,
                numeroOficioSei: agendamentos.numeroOficioSei,
            })
            .from(agendamentos)
            .leftJoin(usuariosInfo, eq(agendamentos.solicitanteId, usuariosInfo.id))
            .where(
                and(
                    eq(agendamentos.status, tipo),
                    gte(agendamentos.dataHora, inicio),
                    lte(agendamentos.dataHora, fim)
                )
            )
            .all();

        return { success: true, dados: rows };
    } catch (error) {
        console.error(error);
        return { success: false, message: "Erro ao gerar relatório" };
    }
}
