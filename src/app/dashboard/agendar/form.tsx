"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Clock, FileText } from "lucide-react";
import { formatInTimeZone } from "date-fns-tz";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { getHorariosDisponiveis } from "@/server/actions/horarios";
import { criarAgendamento } from "@/server/actions/agendamentos";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const agendarSchema = z.object({
    motivo: z.string().min(2, "Selecione um motivo"),
    motivoPersonalizado: z.string().optional(),
    porIntermedioServico: z.enum(["Sim", "Não"]),
    dataConsulta: z.date(),
    horarioISO: z.string().min(1, "Escolha um horário."),
    numeroOficioSei: z.string().min(3, "Insira o número do ofício SEI."),
}).refine(data => {
    if (data.motivo === "Outros" && (!data.motivoPersonalizado || data.motivoPersonalizado.length < 3)) {
        return false;
    }
    return true;
}, {
    message: "Descreva o motivo (mínimo 3 letras)",
    path: ["motivoPersonalizado"]
});

export default function AgendarForm({ perfil, isEncaixe = false }: { perfil: any; isEncaixe?: boolean }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [passo, setPasso] = useState(1);
    const [horarios, setHorarios] = useState<Date[]>([]);
    const [loadingHorarios, setLoadingHorarios] = useState(false);
    const [protocoloId, setProtocoloId] = useState<string | null>(null);

    const form = useForm<z.infer<typeof agendarSchema>>({
        resolver: zodResolver(agendarSchema),
    });

    const dataEscolhida = form.watch("dataConsulta");
    const [popoverOpen, setPopoverOpen] = useState(false);

    // Busca slots de horários quando a data muda
    const buscarSlots = async (data: Date) => {
        setLoadingHorarios(true);
        form.setValue("horarioISO", ""); // reseta horário ao trocar o dia
        try {
            const slots = await getHorariosDisponiveis(data);
            setHorarios(slots);
        } catch (e) {
            toast.error("Erro ao buscar horários.");
        } finally {
            setLoadingHorarios(false);
        }
    };

    function onSubmit(values: z.infer<typeof agendarSchema>) {
        startTransition(async () => {
            const dbDate = isEncaixe ? new Date() : new Date(values.horarioISO);

            const motivoFinal = values.motivo === "Outros" ? values.motivoPersonalizado! : values.motivo;

            const res = await criarAgendamento({
                dataHora: dbDate,
                motivo: motivoFinal,
                porIntermedioServico: values.porIntermedioServico === "Sim",
                numeroOficioSei: values.numeroOficioSei,
            });

            if (res.success) {
                toast.success(res.message);
                setProtocoloId(res.protocolo || "Gerado com sucesso");
                setPasso(4); // Vai para tela de sucesso
            } else {
                toast.error(res.message);
            }
        });
    }

    // Desabilitar finais de semana
    const isDateDisabled = (date: Date) => {
        const day = date.getDay();
        // Exclui sabado (6) e domingo (0)
        return day === 0 || day === 6 || date < new Date();
    };

    return (
        <Card className="border-t-4 border-t-pm-blue shadow-md mt-6">
            <CardContent className="pt-6">
                {passo < 4 && (
                    <div className="mb-8 border-b pb-4 flex flex-wrap gap-2 text-sm font-medium text-slate-500">
                        <span className={cn(passo >= 1 && "text-pm-blue")}>1. Motivo</span>
                        <span>›</span>
                        <span className={cn(passo >= 2 && "text-pm-blue")}>2. Data</span>
                        <span>›</span>
                        <span className={cn(passo >= 3 && "text-pm-blue")}>3. Horário e Confirmação</span>
                    </div>
                )}

                {passo === 4 ? (
                    <div className="text-center space-y-4 py-8">
                        <div className="mx-auto w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                            <FileText className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-pm-blue">Protocolo Gerado!</h2>
                        <p className="text-muted-foreground">
                            Seu agendamento foi confirmado para o dia{" "}
                            <strong className="text-slate-900">
                                {formatInTimeZone(new Date(form.getValues("horarioISO")!), 'America/Sao_Paulo', "dd/MM/yyyy 'às' HH:mm")}
                            </strong>
                            .
                        </p>
                        <div className="bg-slate-50 border p-4 rounded-md inline-block my-4">
                            <p className="text-sm text-slate-500 uppercase font-bold tracking-wider mb-1">CÓDIGO DE AGENDAMENTO</p>
                            <p className="text-lg font-mono text-slate-900">{protocoloId}</p>
                        </div>
                        <p className="text-sm text-red-600 font-medium">Lembre-se de comparecer com toda a documentação necessária!</p>
                        <div className="pt-6">
                            <Button onClick={() => router.push("/dashboard/agenda")} className="bg-pm-blue hover:bg-blue-800">
                                Ir para Minha Agenda
                            </Button>
                        </div>
                    </div>
                ) : (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                            {/* PASSO 1 */}
                            {passo === 1 && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                                    <FormField
                                        control={form.control}
                                        name="motivo"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Qual o motivo para a troca de funcional?</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-12 text-lg">
                                                            <SelectValue placeholder="Selecione um motivo..." />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {["Promoção", "Extravio", "Dano", "Outros"].map((m) => (
                                                            <SelectItem key={m} value={m} className="text-base py-3">
                                                                {m}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    {form.watch("motivo") === "Outros" && (
                                        <FormField
                                            control={form.control}
                                            name="motivoPersonalizado"
                                            render={({ field }) => (
                                                <FormItem className="animate-in fade-in zoom-in-95 duration-200">
                                                    <FormLabel>Descreva o motivo:</FormLabel>
                                                    <FormControl>
                                                        <Input className="h-12 text-base" placeholder="Ex: Mudança de cargo, Roubo em residência..." {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}
                                    <FormField
                                        control={form.control}
                                        name="porIntermedioServico"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Por intermédio do serviço?</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-12 text-lg">
                                                            <SelectValue placeholder="Selecione..." />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {["Sim", "Não"].map((m) => (
                                                            <SelectItem key={m} value={m} className="text-base py-3">
                                                                {m}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="flex justify-end pt-4">
                                        <Button
                                            type={isEncaixe ? "submit" : "button"}
                                            onClick={isEncaixe ? undefined : () => form.trigger(["motivo", "porIntermedioServico"]).then(v => v && setPasso(2))}
                                            className="bg-pm-blue hover:bg-blue-800"
                                            disabled={isPending}
                                        >
                                            {isEncaixe
                                                ? (isPending ? "Registrando Encaixe..." : "⚡ Confirmar Encaixe")
                                                : "Avançar"}
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* PASSO 2 */}
                            {passo === 2 && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                                    <FormField
                                        control={form.control}
                                        name="dataConsulta"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>Qual o dia deseja comparecer?</FormLabel>
                                                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant={"outline"}
                                                                className={cn(
                                                                    "w-full h-12 text-left font-normal border-pm-blue/30",
                                                                    !field.value && "text-muted-foreground"
                                                                )}
                                                            >
                                                                {field.value ? (
                                                                    formatInTimeZone(field.value, 'America/Sao_Paulo', "PPP", { locale: ptBR })
                                                                ) : (
                                                                    <span>Escolha uma data no calendário</span>
                                                                )}
                                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={field.value}
                                                            onSelect={(date) => {
                                                                field.onChange(date);
                                                                if (date) {
                                                                    buscarSlots(date);
                                                                    setPopoverOpen(false); // fecha o popover ao selecionar
                                                                }
                                                            }}
                                                            disabled={isDateDisabled}
                                                            initialFocus
                                                            locale={ptBR}
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="flex justify-between pt-4">
                                        <Button type="button" variant="outline" onClick={() => setPasso(1)}>Voltar</Button>
                                        <Button
                                            type="button"
                                            onClick={() => form.trigger("dataConsulta").then(v => v && setPasso(3))}
                                            className="bg-pm-blue hover:bg-blue-800"
                                        >
                                            Avançar
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* PASSO 3 */}
                            {passo === 3 && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                                    <div className="bg-blue-50 p-4 rounded-md border border-blue-100 mb-6">
                                        <p className="text-sm font-semibold text-pm-blue mb-1">Resumo OPM</p>
                                        <p className="text-slate-700">{perfil.postoGraduacao} {perfil.nomeGuerra} - {perfil.re} ({perfil.opm})</p>
                                        <p className="text-slate-700 mt-1">Motivo: <span className="font-medium">{form.getValues('motivo')} (Serviço: {form.getValues('porIntermedioServico')})</span></p>
                                        <p className="text-slate-700 mt-1">Data: <span className="font-medium">{dataEscolhida && formatInTimeZone(dataEscolhida, 'America/Sao_Paulo', 'dd/MM/yyyy')}</span></p>
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="horarioISO"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Horários Disponíveis (Intervalo de 30min)</FormLabel>
                                                <FormControl>
                                                    {loadingHorarios ? (
                                                        <div className="text-sm text-muted-foreground animate-pulse p-4">Carregando horários...</div>
                                                    ) : horarios.length === 0 ? (
                                                        <div className="text-sm text-red-500 p-4 border border-red-200 rounded-md bg-red-50">Não há horários disponíveis para este dia. Escolha outra data.</div>
                                                    ) : (
                                                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mt-3">
                                                            {horarios.map((slot) => {
                                                                const iso = slot.toISOString();
                                                                const isSelected = field.value === iso;
                                                                return (
                                                                    <div
                                                                        key={iso}
                                                                        onClick={() => field.onChange(iso)}
                                                                        className={cn(
                                                                            "border rounded-md py-3 px-2 text-center cursor-pointer transition-all hover:border-pm-blue hover:bg-blue-50",
                                                                            isSelected ? "bg-pm-blue text-white border-pm-blue shadow-md" : "border-slate-200 bg-white"
                                                                        )}
                                                                    >
                                                                        <div className="flex items-center justify-center gap-1.5 mb-1">
                                                                            <Clock className="w-3.5 h-3.5" />
                                                                            <span className="font-medium">{formatInTimeZone(slot, 'America/Sao_Paulo', "HH:mm")}</span>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Campo SEI */}
                                    <FormField
                                        control={form.control}
                                        name="numeroOficioSei"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Número do Ofício SEI</FormLabel>
                                                <FormControl>
                                                    <Input className="h-12 text-base" placeholder="Ex: SEI-123456/2026" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="flex justify-between pt-8 border-t">
                                        <Button type="button" variant="outline" onClick={() => setPasso(2)}>Voltar</Button>
                                        <Button
                                            type="submit"
                                            className="bg-pm-blue hover:bg-blue-800 px-8"
                                            disabled={isPending || loadingHorarios || !form.watch('horarioISO')}
                                        >
                                            {isPending ? "Confirmando Agendamento..." : "Confirmar Agendamento"}
                                        </Button>
                                    </div>
                                </div>
                            )}

                        </form>
                    </Form>
                )}
            </CardContent>
        </Card>
    );
}
