import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CalendarCheck2, CheckCircle2, XCircle, CalendarClock } from "lucide-react";
import { getPerfilUsuario } from "@/server/actions/perfil";
import { redirect } from "next/navigation";
import { getDashboardStats, getAgendamentosHoje } from "@/server/actions/dashboard";
import { formatInTimeZone } from "date-fns-tz";
import { ptBR } from "date-fns/locale";
import { ConfirmarPresencaBtn } from "@/components/dashboard/confirmar-presenca-btn";

export default async function DashboardPage() {
    const perfil = await getPerfilUsuario();

    // Usuários comuns não precisam do painel — vão direto para a agenda
    if (!perfil || perfil.role === "user") {
        redirect("/dashboard/agenda");
    }

    const [stats, agendamentosHoje] = await Promise.all([
        getDashboardStats(),
        getAgendamentosHoje(),
    ]);

    const cards = [
        {
            title: "Agendamentos para Hoje",
            value: stats.agendadosHoje,
            sub: "Com status Agendado",
            icon: CalendarClock,
            color: "border-l-amber-500",
            valueColor: "text-amber-600",
        },
        {
            title: "Trocas Realizadas no Mês",
            value: stats.realizadosMes,
            sub: "Confirmadas este mês",
            icon: CheckCircle2,
            color: "border-l-emerald-500",
            valueColor: "text-emerald-600",
        },
        {
            title: "Agendamentos Cancelados",
            value: stats.cancelados,
            sub: "Total cancelados",
            icon: XCircle,
            color: "border-l-red-400",
            valueColor: "text-red-600",
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-pm-blue">Painel Geral</h1>
                <p className="text-muted-foreground mt-1">
                    {formatInTimeZone(new Date(), 'America/Sao_Paulo', "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
            </div>

            {/* Cards de Estatísticas */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                {cards.map((card) => (
                    <Card key={card.title} className={`border-l-4 ${card.color} shadow-sm`}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                            <card.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-3xl font-bold ${card.valueColor}`}>{card.value}</div>
                            <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Lista Diária */}
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg text-pm-blue flex items-center gap-2">
                        <CalendarCheck2 className="h-5 w-5" />
                        Próximas Trocas — Hoje
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {agendamentosHoje.length === 0 ? (
                        <div className="text-sm text-slate-500 italic py-8 text-center bg-slate-50 rounded-md border border-dashed">
                            Nenhum agendamento para hoje.
                        </div>
                    ) : (
                        <div className="border rounded-md overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow>
                                        <TableHead>Horário</TableHead>
                                        <TableHead>Solicitante</TableHead>
                                        <TableHead>Motivo</TableHead>
                                        <TableHead>Serviço</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Ação</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {agendamentosHoje.map((ag) => (
                                        <TableRow key={ag.id} className="hover:bg-slate-50/50">
                                            <TableCell className="font-mono font-semibold whitespace-nowrap">
                                                {formatInTimeZone(new Date(ag.dataHora), 'America/Sao_Paulo', "HH:mm")}
                                            </TableCell>
                                            <TableCell>
                                                {ag.postoGraduacao && ag.nomeGuerra ? (
                                                    <span>
                                                        <span className="text-xs text-slate-500">{ag.postoGraduacao} </span>
                                                        <span className="font-semibold">{ag.nomeGuerra}</span>
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-slate-400 italic">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm">{ag.motivo}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className={ag.porIntermedioServico ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"}>
                                                    {ag.porIntermedioServico ? "Serviço" : "Pessoal"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className={
                                                    ag.status === "Realizado" ? "bg-emerald-100 text-emerald-700"
                                                        : ag.status === "Cancelado" ? "bg-red-100 text-red-700"
                                                            : "bg-amber-100 text-amber-700"
                                                }>
                                                    {ag.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <ConfirmarPresencaBtn
                                                    agendamentoId={ag.id}
                                                    dataHora={ag.dataHora}
                                                    status={ag.status}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
