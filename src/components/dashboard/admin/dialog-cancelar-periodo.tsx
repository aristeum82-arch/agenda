"use client";

import { useState, useTransition } from "react";
import { cancelarPeriodo } from "@/server/actions/cancelamento-massa";
import { formatInTimeZone } from "date-fns-tz";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Calendar as CalendarIcon, Ban } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Utility to combine date + time into a local Date object
function combineDateTime(date: Date, hours: number, minutes: number = 0) {
    const d = new Date(date);
    d.setHours(hours, minutes, 0, 0);
    return d;
}

export function DialogCancelarPeriodo() {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const [date, setDate] = useState<Date>();
    const [popoverOpen, setPopoverOpen] = useState(false);
    const [periodType, setPeriodType] = useState("all_day");
    const [startTime, setStartTime] = useState("08:00");
    const [endTime, setEndTime] = useState("18:00");
    const [motivo, setMotivo] = useState("");

    function handleSave() {
        if (!date) {
            toast.error("Selecione uma data válida.");
            return;
        }
        if (!motivo.trim()) {
            toast.error("Informe o motivo do cancelamento.");
            return;
        }

        let minDate: Date;
        let maxDate: Date;

        if (periodType === "all_day") {
            minDate = combineDateTime(date, 0, 0);
            maxDate = combineDateTime(date, 23, 59);
        } else if (periodType === "morning") {
            minDate = combineDateTime(date, 8, 0);
            maxDate = combineDateTime(date, 12, 10); // Covers up to 12:00
        } else if (periodType === "afternoon") {
            minDate = combineDateTime(date, 14, 0);
            maxDate = combineDateTime(date, 18, 10);
        } else {
            // custom
            const [sh, sm] = startTime.split(":").map(Number);
            const [eh, em] = endTime.split(":").map(Number);

            if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) {
                toast.error("Horários inválidos.");
                return;
            }

            minDate = combineDateTime(date, sh, sm);
            maxDate = combineDateTime(date, eh, em);

            if (minDate >= maxDate) {
                toast.error("O horário de início deve ser antes do horário de fim.");
                return;
            }
        }

        startTransition(async () => {
            const res = await cancelarPeriodo(minDate, maxDate, motivo);
            if (res.success) {
                toast.success(res.message);
                setOpen(false);
                // reset state
                setDate(undefined);
                setMotivo("");
                setPeriodType("all_day");
            } else {
                toast.error(res.message);
            }
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="destructive" className="flex items-center gap-2">
                    <Ban className="h-4 w-4" />
                    Bloquear / Cancelar Período
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-red-600">Cancelar e Bloquear</DialogTitle>
                    <DialogDescription>
                        Todos os agendamentos no período selecionado serão cancelados e os usuários notificados. O período ficará indisponível para novos agendamentos.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label>Data alvo</Label>
                        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={`w-full justify-start text-left font-normal ${!date && "text-muted-foreground"}`}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? formatInTimeZone(date, 'America/Sao_Paulo', "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={(d) => {
                                        setDate(d);
                                        if (d) setPopoverOpen(false);
                                    }}
                                    initialFocus
                                    disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="space-y-3">
                        <Label>Período de Bloqueio</Label>
                        <RadioGroup value={periodType} onValueChange={setPeriodType} className="flex flex-col space-y-1">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="all_day" id="all_day" />
                                <Label htmlFor="all_day" className="font-normal">Dia Todo</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="morning" id="morning" />
                                <Label htmlFor="morning" className="font-normal">Manhã (08h as 12h)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="afternoon" id="afternoon" />
                                <Label htmlFor="afternoon" className="font-normal">Tarde (14h as 18h)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="custom" id="custom" />
                                <Label htmlFor="custom" className="font-normal">Personalizado</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {periodType === "custom" && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Início</Label>
                                <Input
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Fim</Label>
                                <Input
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Motivo do Cancelamento</Label>
                        <Input
                            value={motivo}
                            onChange={(e) => setMotivo(e.target.value)}
                            placeholder="Ex: Falta de luz, Treinamento..."
                        />
                        <p className="text-xs text-muted-foreground">
                            Este motivo será enviado por e-mail e notificação aos usuários.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                        Voltar
                    </Button>
                    <Button variant="destructive" onClick={handleSave} disabled={isPending}>
                        {isPending ? "Processando..." : "Confirmar Bloqueio"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
