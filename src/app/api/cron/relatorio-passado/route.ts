import { db } from "@/db";
import { agendamentos, notificacoes, usuariosInfo } from "@/db/schema";
import { inArray, and, eq, gte, lt } from "drizzle-orm";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { enviarEmail } from "@/lib/email";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    try {
        // 1. Encontrar o intervalo da semana passada (Segunda a Sexta passados)
        const hoje = new Date();
        const diasDesdeSegunda = (hoje.getDay() + 6) % 7;
        const ultimaSegunda = new Date(hoje);
        ultimaSegunda.setDate(hoje.getDate() - diasDesdeSegunda - 7);
        ultimaSegunda.setHours(0, 0, 0, 0);

        const ultimaSexta = new Date(ultimaSegunda);
        ultimaSexta.setDate(ultimaSegunda.getDate() + 4);
        ultimaSexta.setHours(23, 59, 59, 999);

        // 2. Buscar Agendamentos
        const realizados = await db
            .select({
                id: agendamentos.id,
                dataHora: agendamentos.dataHora,
                motivo: agendamentos.motivo,
                postoGraduacao: usuariosInfo.postoGraduacao,
                nomeGuerra: usuariosInfo.nomeGuerra,
            })
            .from(agendamentos)
            .leftJoin(usuariosInfo, eq(agendamentos.solicitanteId, usuariosInfo.id))
            .where(
                and(
                    eq(agendamentos.status, "Realizado"),
                    gte(agendamentos.dataHora, ultimaSegunda),
                    lt(agendamentos.dataHora, ultimaSexta)
                )
            )
            .all();

        // 3. Formatar Mensagem
        let mensagem = `📊 FECHAMENTO: Na última semana foram realizadas ${realizados.length} trocas de funcionais.`;

        // 4. Buscar Administradores
        const admins = await db.select().from(usuariosInfo).where(inArray(usuariosInfo.role, ["admin_p5", "admin_central"])).all();

        // 5. Salvar Notificações
        for (const admin of admins) {
            await db.insert(notificacoes).values({
                id: randomUUID(),
                usuarioId: admin.id,
                mensagem,
                lida: false,
                createdAt: new Date(),
            });

            // Envia e-mail real via Resend
            if (admin.email) {
                const listaFormatada = realizados.map(r => {
                    const dt = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(r.dataHora));
                    return `- ${r.postoGraduacao ?? ""} ${r.nomeGuerra ?? ""} | ${dt} | ${r.motivo}`;
                }).join("\n");

                await enviarEmail({
                    para: admin.email,
                    assunto: `Relatório: Fechamento de Trocas da Semana Passada`,
                    corpo: `Olá, ${admin.postoGraduacao} ${admin.nomeGuerra}!\n\n${mensagem}\n\n${realizados.length > 0 ? listaFormatada : "Nenhuma troca realizada na semana."}\n\nAcesse o painel para mais detalhes.\n\nAtenciosamente,\nSistema de Troca de Funcionais`,
                });
            }
        }

        return NextResponse.json({ success: true, count: realizados.length, message: "Relatório Passado gerado." });
    } catch (error) {
        console.error("Erro CRON Relatorio Passado", error);
        return NextResponse.json({ success: false, error: "Falha ao executar CRON" }, { status: 500 });
    }
}
