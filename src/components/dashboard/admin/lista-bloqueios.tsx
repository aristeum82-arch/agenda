"use client";

import { useTransition } from "react";
import { removerBloqueio } from "@/server/actions/cancelamento-massa";
import { formatInTimeZone } from "date-fns-tz";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Bloqueio = {
    id: string;
    inicio: Date;
    fim: Date;
    motivo: string;
};

export function ListaBloqueios({ bloqueios }: { bloqueios: Bloqueio[] }) {
    const [isPending, startTransition] = useTransition();

    function handleRemove(id: string) {
        if (!confirm("Tem certeza que deseja remover este bloqueio? Os usuários poderão voltar a agendar nestes horários.")) {
            return;
        }

        startTransition(async () => {
            const res = await removerBloqueio(id);
            if (res.success) {
                toast.success(res.message);
            } else {
                toast.error(res.message);
            }
        });
    }

    if (bloqueios.length === 0) {
        return null; // Não mostra nada se não houver bloqueios futuros
    }

    return (
        <Card className="shadow-sm border-red-200 mb-6">
            <CardHeader className="bg-red-50/50 pb-4">
                <CardTitle className="text-lg text-red-700 flex items-center gap-2">
                    Períodos Bloqueados Ativos
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[300px]">Período (Início - Fim)</TableHead>
                                <TableHead>Motivo</TableHead>
                                <TableHead className="text-right w-[100px]">Ação</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {bloqueios.map((b) => (
                                <TableRow key={b.id} className="hover:bg-slate-50/50">
                                    <TableCell className="font-medium whitespace-nowrap">
                                        {formatInTimeZone(new Date(b.inicio), 'America/Sao_Paulo', "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                        {" - "}
                                        {formatInTimeZone(new Date(b.fim), 'America/Sao_Paulo', "HH:mm")}
                                    </TableCell>
                                    <TableCell>{b.motivo}</TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => handleRemove(b.id)}
                                            disabled={isPending}
                                            title="Desbloquear Período"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
