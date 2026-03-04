import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getAgendamentos } from "@/server/actions/agendamentos";
import { formatInTimeZone } from "date-fns-tz";
import { getPerfilUsuario } from "@/server/actions/perfil";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Zap } from "lucide-react";
import { AgendamentoAcoes } from "@/components/agenda/agendamento-acoes";

export default async function AgendaPage() {
    const perfil = await getPerfilUsuario();
    if (!perfil) {
        redirect("/dashboard/perfil");
    }

    const data = await getAgendamentos();

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-pm-blue">Troca de Funcional</h1>
                    <p className="text-muted-foreground mt-1">Gerencie e visualize seus agendamentos.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/dashboard/agendar?encaixe=true">
                        <Button className="bg-amber-400 hover:bg-amber-500 text-black font-semibold">
                            <Zap className="mr-2 h-4 w-4" />
                            Encaixe
                        </Button>
                    </Link>
                    <Link href="/dashboard/agendar">
                        <Button className="bg-pm-blue hover:bg-blue-800 text-white">
                            <Plus className="mr-2 h-4 w-4" />
                            Nova Solicitação
                        </Button>
                    </Link>
                </div>
            </div>

            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg text-pm-blue">Histórico e Agendamentos</CardTitle>
                </CardHeader>
                <CardContent>
                    {data.length === 0 ? (
                        <div className="text-sm text-slate-500 italic py-8 text-center bg-slate-50 rounded-md border border-dashed border-slate-200">
                            Nenhum agendamento registrado. Clique em "Nova Solicitação" para começar.
                        </div>
                    ) : (
                        <div className="border rounded-md overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow>
                                        <TableHead>Protocolo</TableHead>
                                        <TableHead>Data Prevista</TableHead>
                                        <TableHead>Solicitante</TableHead>
                                        <TableHead>Motivo</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.map((troca) => (
                                        <TableRow key={troca.id} className="hover:bg-slate-50/50">
                                            <TableCell className="font-mono text-xs font-semibold">{troca.id}</TableCell>
                                            <TableCell className="font-medium whitespace-nowrap">
                                                {formatInTimeZone(new Date(troca.dataHora), 'America/Sao_Paulo', "dd/MM/yyyy HH:mm")}
                                            </TableCell>
                                            <TableCell>
                                                {troca.postoGraduacao && troca.nomeGuerra ? (
                                                    <span>
                                                        <span className="text-xs text-slate-500 font-medium">{troca.postoGraduacao} </span>
                                                        <span className="font-semibold">{troca.nomeGuerra}</span>
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-slate-400 italic">Sem perfil</span>
                                                )}
                                            </TableCell>
                                            <TableCell>{troca.motivo}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="secondary"
                                                    className={
                                                        troca.status === "Realizado"
                                                            ? "bg-emerald-100 text-emerald-700"
                                                            : troca.status === "Cancelado"
                                                                ? "bg-red-100 text-red-700"
                                                                : "bg-amber-100 text-amber-700"
                                                    }
                                                >
                                                    {troca.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <AgendamentoAcoes
                                                    agendamentoId={troca.id}
                                                    status={troca.status}
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
