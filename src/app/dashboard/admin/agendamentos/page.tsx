import { getAgendamentos } from "@/server/actions/agendamentos";
import { getPerfilUsuario } from "@/server/actions/perfil";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ClipboardList } from "lucide-react";
import { DialogCancelarPeriodo } from "@/components/dashboard/admin/dialog-cancelar-periodo";
import { ListaBloqueios } from "@/components/dashboard/admin/lista-bloqueios";
import { getBloqueiosAtivos } from "@/server/actions/cancelamento-massa";
import { DialogRelatorio } from "@/components/dashboard/admin/dialog-relatorio";

export default async function AdminAgendamentosPage() {
    const meuPerfil = await getPerfilUsuario();
    if (!meuPerfil || meuPerfil.role === "user") {
        redirect("/dashboard");
    }

    const [agendamentos, bloqueios] = await Promise.all([
        getAgendamentos(),
        getBloqueiosAtivos()
    ]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-pm-blue flex items-center gap-3">
                        <ClipboardList className="h-8 w-8" />
                        Todos os Agendamentos
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Visão geral de todos os agendamentos do sistema.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <DialogRelatorio />
                    <DialogCancelarPeriodo />
                </div>
            </div>

            <ListaBloqueios bloqueios={bloqueios} />

            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg text-pm-blue">
                        Registros ({agendamentos.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {agendamentos.length === 0 ? (
                        <div className="text-sm text-slate-500 italic py-8 text-center bg-slate-50 rounded-md border border-dashed">
                            Nenhum agendamento registrado.
                        </div>
                    ) : (
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow>
                                        <TableHead>Protocolo / SEI</TableHead>
                                        <TableHead>Solicitante</TableHead>
                                        <TableHead>Data/Hora</TableHead>
                                        <TableHead>Motivo</TableHead>
                                        <TableHead>Serviço</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {agendamentos.map((a) => (
                                        <TableRow key={a.id} className="hover:bg-slate-50/50">
                                            <TableCell className="font-mono text-xs">
                                                <div className="font-bold">{a.id}</div>
                                                <div className="text-muted-foreground mt-0.5" title="Ofício SEI">
                                                    {a.numeroOficioSei || "Sem ofício"}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {a.postoGraduacao && a.nomeGuerra ? (
                                                    <span>
                                                        <span className="text-xs text-slate-500">{a.postoGraduacao} </span>
                                                        <span className="font-semibold">{a.nomeGuerra}</span>
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-slate-400 italic">Sem perfil</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {format(new Date(a.dataHora), "dd/MM/yyyy HH:mm")}
                                            </TableCell>
                                            <TableCell>{a.motivo}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className={a.porIntermedioServico ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}>
                                                    {a.porIntermedioServico ? "Sim" : "Não"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className={
                                                    a.status === "Realizado" ? "bg-emerald-100 text-emerald-700"
                                                        : a.status === "Cancelado" ? "bg-red-100 text-red-700"
                                                            : "bg-amber-100 text-amber-700"
                                                }>
                                                    {a.status}
                                                </Badge>
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
