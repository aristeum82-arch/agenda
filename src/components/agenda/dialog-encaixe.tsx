"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { criarEncaixe } from "@/server/actions/agendamentos";
import { toast } from "sonner";
import { Zap } from "lucide-react";

const MOTIVOS = ["Promoção", "Extravio", "Dano", "Outros"];

export function DialogEncaixe() {
    const [open, setOpen] = useState(false);
    const [motivo, setMotivo] = useState("");
    const [motivoPersonalizado, setMotivoPersonalizado] = useState("");
    const [porIntermedio, setPorIntermedio] = useState<"Sim" | "Não" | "">("");
    const [numeroOficioSei, setNumeroOficioSei] = useState("");
    const [isPending, startTransition] = useTransition();

    const motivoFinal = motivo === "Outros" ? motivoPersonalizado : motivo;
    const isValid = motivoFinal.length >= 2 && porIntermedio !== "" && numeroOficioSei.trim().length >= 3;

    function handleConfirmar() {
        if (!isValid) return;
        startTransition(async () => {
            const res = await criarEncaixe(motivoFinal, porIntermedio === "Sim", numeroOficioSei.trim());
            if (res.success) {
                toast.success(`${res.message} — Protocolo: ${res.protocolo}`);
                setOpen(false);
                setMotivo("");
                setMotivoPersonalizado("");
                setPorIntermedio("");
                setNumeroOficioSei("");
            } else {
                toast.error(res.message);
            }
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="border-pm-blue text-pm-blue hover:bg-blue-50">
                    <Zap className="mr-2 h-4 w-4" />
                    Encaixe
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-pm-blue">
                        <Zap className="h-5 w-5" />
                        Registrar Encaixe
                    </DialogTitle>
                    <DialogDescription>
                        Agendamento imediato para <strong>agora</strong>, sem restrição de horário. Use para atendimentos presenciais urgentes.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                    {/* Motivo */}
                    <div className="space-y-2">
                        <Label>Motivo da Troca</Label>
                        <Select value={motivo} onValueChange={setMotivo}>
                            <SelectTrigger className="h-11">
                                <SelectValue placeholder="Selecione o motivo..." />
                            </SelectTrigger>
                            <SelectContent>
                                {MOTIVOS.map((m) => (
                                    <SelectItem key={m} value={m}>{m}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Campo de texto condicional para "Outros" */}
                    {motivo === "Outros" && (
                        <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200">
                            <Label>Descreva o motivo</Label>
                            <Input
                                placeholder="Ex: Mudança de cargo, Roubo em residência..."
                                value={motivoPersonalizado}
                                onChange={(e) => setMotivoPersonalizado(e.target.value)}
                                className="h-11"
                            />
                        </div>
                    )}

                    {/* Por intermédio do serviço */}
                    <div className="space-y-2">
                        <Label>Por intermédio do serviço?</Label>
                        <Select value={porIntermedio} onValueChange={(v) => setPorIntermedio(v as "Sim" | "Não")}>
                            <SelectTrigger className="h-11">
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Sim">Sim</SelectItem>
                                <SelectItem value="Não">Não</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Número SEI */}
                    <div className="space-y-2">
                        <Label>Número do Ofício SEI</Label>
                        <Input
                            placeholder="Ex: SEI-123456/2026"
                            value={numeroOficioSei}
                            onChange={(e) => setNumeroOficioSei(e.target.value)}
                            className="h-11"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="outline" onClick={() => setOpen(false)}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleConfirmar}
                            disabled={isPending || !isValid}
                            className="bg-pm-blue hover:bg-blue-800 text-white"
                        >
                            {isPending ? "Registrando..." : "Confirmar Encaixe"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
