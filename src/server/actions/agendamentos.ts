"use server";

import { db } from "@/db";
import { agendamentos, usuariosInfo } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { enviarEmail } from "@/lib/email";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const agendamentoSchema = z.object({
    dataHora: z.date(),
    motivo: z.string().min(3, "Insira um motivo válido"),
    porIntermedioServico: z.boolean(),
    numeroOficioSei: z.string().min(3, "Insira um número SEI válido"),
});

export async function criarAgendamento(data: z.infer<typeof agendamentoSchema>) {
    try {
        const { userId } = await auth();
        if (!userId) return { success: false, message: "Não autorizado" };

        const parsed = agendamentoSchema.safeParse(data);
        if (!parsed.success) return { success: false, message: "Dados inválidos" };

        const { dataHora, motivo, porIntermedioServico, numeroOficioSei } = parsed.data;

        // Verifica unicidade do SEI (id)
        const existente = await db.select().from(agendamentos).where(eq(agendamentos.id, numeroOficioSei)).get();
        if (existente) return { success: false, message: "Número SEI já cadastrado" };

        // protocolo é o próprio SEI
        const protocolo = numeroOficioSei;

        await db.insert(agendamentos).values({
            id: protocolo,
            solicitanteId: userId,
            dataHora,
            motivo,
            numeroOficioSei: protocolo,
            porIntermedioServico,
            status: "Agendado",
            createdAt: new Date(),
        });

        revalidatePath("/dashboard/agenda");

        // Enviar e-mail de confirmação para o usuário
        const perfilUsuario = await db.select({ email: usuariosInfo.email, nomeGuerra: usuariosInfo.nomeGuerra, postoGraduacao: usuariosInfo.postoGraduacao })
            .from(usuariosInfo)
            .where(eq(usuariosInfo.id, userId))
            .get();

        if (perfilUsuario?.email) {
            const dataFormatada = new Intl.DateTimeFormat('pt-BR', {
                timeZone: 'America/Sao_Paulo',
                weekday: 'long',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            }).format(new Date(dataHora));
            await enviarEmail({
                para: perfilUsuario.email,
                assunto: `Agendamento Confirmado - Protocolo ${protocolo}`,
                corpo: `Olá, ${perfilUsuario.postoGraduacao} ${perfilUsuario.nomeGuerra}!\n\nSeu agendamento foi confirmado!\n\nProtocolo: ${protocolo}\nData e Hora: ${dataFormatada}\nMotivo: ${motivo}\n\nMantenha este protocolo para referência. Em caso de dúvidas, entre em contato com a CPI-7.\n\nAtenciosamente,\nCentral de Troca de Funcionais`,
            });
        }

        return { success: true, protocolo, message: "Agendamento confirmado!" };
    } catch (error) {
        console.error(error);
        return { success: false, message: "Erro ao criar agendamento" };
    }
}

export async function criarEncaixe(motivo: string, porIntermedioServico: boolean = false, numeroOficioSei?: string) {
    try {
        const { userId } = await auth();
        if (!userId) return { success: false, message: "Não autorizado" };

        if (!motivo || motivo.length < 2) return { success: false, message: "Informe o motivo do encaixe" };
        if (!numeroOficioSei || numeroOficioSei.trim().length < 3) return { success: false, message: "Informe um número SEI válido para o encaixe" };

        const protocolo = numeroOficioSei.trim();

        // Verifica unicidade do SEI
        const existente = await db.select().from(agendamentos).where(eq(agendamentos.id, protocolo)).get();
        if (existente) return { success: false, message: "Número SEI já cadastrado" };

        await db.insert(agendamentos).values({
            id: protocolo,
            solicitanteId: userId,
            dataHora: new Date(),
            motivo,
            numeroOficioSei: protocolo,
            porIntermedioServico,
            status: "Agendado",
            createdAt: new Date(),
        });

        revalidatePath("/dashboard/agenda");

        const perfilUsuario = await db.select({
            email: usuariosInfo.email,
            nomeGuerra: usuariosInfo.nomeGuerra,
            postoGraduacao: usuariosInfo.postoGraduacao,
        }).from(usuariosInfo).where(eq(usuariosInfo.id, userId)).get();

        if (perfilUsuario?.email) {
            const dataFormatada = new Intl.DateTimeFormat('pt-BR', {
                timeZone: 'America/Sao_Paulo',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            }).format(new Date());
            await enviarEmail({
                para: perfilUsuario.email,
                assunto: `Encaixe Confirmado - Protocolo ${protocolo}`,
                corpo: `Olá, ${perfilUsuario.postoGraduacao} ${perfilUsuario.nomeGuerra}!\n\nSeu encaixe foi registrado com sucesso!\n\nProtocolo: ${protocolo}\nData e Hora: ${dataFormatada}\nMotivo: ${motivo}\n\nCompareça imediatamente ao setor com sua documentação.\n\nAtenciosamente,\nCentral de Troca de Funcionais`,
            });
        }

        return { success: true, protocolo, message: "Encaixe registrado!" };
    } catch (error) {
        console.error(error);
        return { success: false, message: "Erro ao registrar encaixe" };
    }
}

export async function cancelarAgendamento(agendamentoId: string) {
    try {
        const { userId } = await auth();
        if (!userId) return { success: false, message: "Não autorizado" };

        // Busca o agendamento para verificar dono
        const agendamento = await db
            .select()
            .from(agendamentos)
            .where(eq(agendamentos.id, agendamentoId))
            .get();

        if (!agendamento) return { success: false, message: "Agendamento não encontrado" };
        if (agendamento.solicitanteId !== userId) return { success: false, message: "Sem permissão" };
        if (agendamento.status !== "Agendado") return { success: false, message: "Só é possível cancelar agendamentos com status 'Agendado'" };

        await db
            .update(agendamentos)
            .set({ status: "Cancelado" })
            .where(eq(agendamentos.id, agendamentoId));

        revalidatePath("/dashboard/agenda");
        return { success: true, message: "Agendamento cancelado com sucesso" };
    } catch (error) {
        console.error(error);
        return { success: false, message: "Erro ao cancelar agendamento" };
    }
}

export async function adminCancelarAgendamento(agendamentoId: string) {
    try {
        const { userId } = await auth();
        if (!userId) return { success: false, message: "Não autorizado" };

        const usuarioLogado = await db.select().from(usuariosInfo).where(eq(usuariosInfo.id, userId)).get();
        if (!usuarioLogado || usuarioLogado.role === "user") {
            return { success: false, message: "Sem permissão" };
        }

        const agendamento = await db.select().from(agendamentos).where(eq(agendamentos.id, agendamentoId)).get();
        if (!agendamento) return { success: false, message: "Agendamento não encontrado" };
        if (agendamento.status !== "Agendado") return { success: false, message: "Só é possível cancelar agendamentos com status 'Agendado'" };

        await db
            .update(agendamentos)
            .set({ status: "Cancelado" })
            .where(eq(agendamentos.id, agendamentoId));

        revalidatePath("/dashboard/admin/agendamentos");
        return { success: true, message: "Agendamento cancelado pelo administrador" };
    } catch (error) {
        console.error(error);
        return { success: false, message: "Erro ao cancelar agendamento" };
    }
}

export async function reverterAgendamento(agendamentoId: string) {
    try {
        const { userId } = await auth();
        if (!userId) return { success: false, message: "Não autorizado" };

        const usuarioLogado = await db.select().from(usuariosInfo).where(eq(usuariosInfo.id, userId)).get();
        if (!usuarioLogado || usuarioLogado.role === "user") {
            return { success: false, message: "Sem permissão" };
        }

        const agendamento = await db.select().from(agendamentos).where(eq(agendamentos.id, agendamentoId)).get();
        if (!agendamento) return { success: false, message: "Agendamento não encontrado" };
        if (agendamento.status !== "Cancelado") return { success: false, message: "Apenas agendamentos cancelados podem ser revertidos" };

        await db
            .update(agendamentos)
            .set({ status: "Agendado" })
            .where(eq(agendamentos.id, agendamentoId));

        revalidatePath("/dashboard/admin/agendamentos");
        return { success: true, message: "Agendamento revertido com sucesso" };
    } catch (error) {
        console.error(error);
        return { success: false, message: "Erro ao reverter agendamento" };
    }
}

export async function criarAgendamentoParaTerceiro(data: {
    solicitanteId: string;
    dataHora: Date;
    motivo: string;
    porIntermedioServico: boolean;
    numeroOficioSei: string;
}) {
    try {
        const { userId } = await auth();
        if (!userId) return { success: false, message: "Não autorizado" };

        const usuarioLogado = await db.select().from(usuariosInfo).where(eq(usuariosInfo.id, userId)).get();
        if (!usuarioLogado || usuarioLogado.role === "user") {
            return { success: false, message: "Sem permissão" };
        }

        const existente = await db.select().from(agendamentos).where(eq(agendamentos.id, data.numeroOficioSei)).get();
        if (existente) return { success: false, message: "Número SEI já cadastrado" };

        await db.insert(agendamentos).values({
            id: data.numeroOficioSei,
            solicitanteId: data.solicitanteId,
            dataHora: data.dataHora,
            motivo: data.motivo,
            numeroOficioSei: data.numeroOficioSei,
            porIntermedioServico: data.porIntermedioServico,
            status: "Agendado",
            createdAt: new Date(),
        });

        revalidatePath("/dashboard/agenda");
        revalidatePath("/dashboard/admin/agendamentos");
        return { success: true, protocolo: data.numeroOficioSei, message: "Encaixe registrado!" };
    } catch (error) {
        console.error(error);
        return { success: false, message: "Erro ao criar encaixe" };
    }
}

export type AgendamentoComPerfil = {
    id: string;
    dataHora: Date;
    motivo: string;
    status: string;
    porIntermedioServico: boolean;
    solicitanteId: string;
    postoGraduacao: string | null;
    nomeGuerra: string | null;
    numeroOficioSei: string | null;
};

export async function getAgendamentos(): Promise<AgendamentoComPerfil[]> {
    try {
        const { userId } = await auth();
        if (!userId) return [];

        const usuarioLogado = await db
            .select()
            .from(usuariosInfo)
            .where(eq(usuariosInfo.id, userId))
            .get();

        if (!usuarioLogado) return [];

        // Busca agendamentos com JOIN nas infos do usuário
        const isAdmin = usuarioLogado.role !== "user";

        const rows = await db
            .select({
                id: agendamentos.id,
                dataHora: agendamentos.dataHora,
                motivo: agendamentos.motivo,
                status: agendamentos.status,
                porIntermedioServico: agendamentos.porIntermedioServico,
                solicitanteId: agendamentos.solicitanteId,
                postoGraduacao: usuariosInfo.postoGraduacao,
                nomeGuerra: usuariosInfo.nomeGuerra,
                numeroOficioSei: agendamentos.numeroOficioSei,
            })
            .from(agendamentos)
            .leftJoin(usuariosInfo, eq(agendamentos.solicitanteId, usuariosInfo.id))
            .orderBy(desc(agendamentos.dataHora))
            .all();

        // Filtro por usuário se não for admin
        if (!isAdmin) {
            return rows.filter((r) => r.solicitanteId === userId);
        }

        return rows;
    } catch (error) {
        console.error(error);
        return [];
    }
}
