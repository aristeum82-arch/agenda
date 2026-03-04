"use client";

import { useTransition } from "react";
import { adminCancelarAgendamento, reverterAgendamento } from "@/server/actions/agendamentos";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RotateCcw } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Props {
    agendamentoId: string;
    status: string;
}

export function AdminAgendamentoAcoes({ agendamentoId, status }: Props) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const podeAlterar = status === "Agendado";
    const podeReverter = status === "Cancelado";

    function handleCancelar() {
        startTransition(async () => {
            const res = await adminCancelarAgendamento(agendamentoId);
            if (res.success) {
                toast.success(res.message);
            } else {
                toast.error(res.message);
            }
        });
    }

    function handleReverter() {
        startTransition(async () => {
            const res = await reverterAgendamento(agendamentoId);
            if (res.success) {
                toast.success(res.message);
            } else {
                toast.error(res.message);
            }
        });
    }

    return (
        <div className="flex gap-2 justify-end flex-wrap">
            {podeAlterar && (
                <>
                    <Button
                        size="sm"
                        className="bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-sm"
                        onClick={() => router.push(`/dashboard/agendar?editar=${agendamentoId}`)}
                        disabled={isPending}
                    >
                        Alterar
                    </Button>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                size="sm"
                                className="bg-red-600 hover:bg-red-700 text-white font-semibold shadow-sm"
                                disabled={isPending}
                            >
                                {isPending ? "..." : "Cancelar"}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="sm:max-w-md">
                            <AlertDialogHeader>
                                <AlertDialogTitle>Cancelar agendamento (Admin)?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    O protocolo <strong>{agendamentoId}</strong> será cancelado.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Voltar</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleCancelar}
                                    className="bg-red-600 hover:bg-red-700"
                                >
                                    Confirmar Cancelamento
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </>
            )}

            {podeReverter && (
                <Button
                    size="sm"
                    variant="outline"
                    className="border-emerald-500 text-emerald-600 hover:bg-emerald-50 font-semibold shadow-sm flex gap-1 items-center"
                    onClick={handleReverter}
                    disabled={isPending}
                    title="Restaurar agendamento"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reverter
                </Button>
            )}

            {!podeAlterar && !podeReverter && (
                <span className="text-xs text-slate-400 italic">—</span>
            )}
        </div>
    );
}
