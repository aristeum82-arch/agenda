"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { buscarPerfilPorRE, buscarOuCriarPerfilPorRE } from "@/server/actions/encaixe";
import { criarAgendamentoParaTerceiro } from "@/server/actions/agendamentos";
import { useRouter } from "next/navigation";
import { Search, Zap, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const POSTOS = [
    "Cel PM", "Ten Cel PM", "Maj PM", "Cap PM",
    "1º Ten PM", "2º Ten PM", "Sub Ten PM",
    "1º Sgt PM", "2º Sgt PM", "3º Sgt PM",
    "Cb PM", "Sd PM",
];

const OPMS = [
    "CPI-7", "ESSD", "7 BPM-I", "12 BPM-I", "14 BAEP",
    "22 BPM-I", "40 BPM-I", "50 BPM-I", "53 BPM-I", "54 BPM-I", "55 BPM-I",
];

const reSchema = z.object({ re: z.string().length(6, "RE deve ter 6 dígitos") });
const perfilSchema = z.object({
    postoGraduacao: z.string().min(1, "Selecione o posto"),
    nomeGuerra: z.string().min(2, "Obrigatório"),
    opm: z.string().min(1, "Selecione a OPM"),
    email: z.string().email("E-mail inválido").optional().or(z.literal("")),
});
const motivoSchema = z.object({
    motivo: z.string().min(2, "Selecione um motivo"),
    motivoPersonalizado: z.string().optional(),
    porIntermedioServico: z.enum(["Sim", "Não"]),
    numeroOficioSei: z.string().min(3, "Informe o SEI"),
}).refine(data => {
    if (data.motivo === "Outros" && (!data.motivoPersonalizado || data.motivoPersonalizado.length < 3)) return false;
    return true;
}, { message: "Descreva o motivo", path: ["motivoPersonalizado"] });

export function EncaixeForm() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [passo, setPasso] = useState<1 | 2 | 3 | 4>(1);
    const [usuarioEncontrado, setUsuarioEncontrado] = useState<any>(null);
    const [protocolo, setProtocolo] = useState<string | null>(null);

    const reForm = useForm<z.infer<typeof reSchema>>({ resolver: zodResolver(reSchema) });
    const perfilForm = useForm<z.infer<typeof perfilSchema>>({ resolver: zodResolver(perfilSchema) });
    const motivoForm = useForm<z.infer<typeof motivoSchema>>({ resolver: zodResolver(motivoSchema) });

    // PASSO 1 — Buscar por RE
    function buscarPorRE(values: z.infer<typeof reSchema>) {
        startTransition(async () => {
            const resultado = await buscarPerfilPorRE(values.re);
            if (resultado) {
                setUsuarioEncontrado(resultado);
                setPasso(3); // Já tem cadastro, pula para motivo
                toast.success(`Cadastro encontrado: ${resultado.postoGraduacao} ${resultado.nomeGuerra}`);
            } else {
                setUsuarioEncontrado({ re: values.re }); // parcial
                setPasso(2); // Preencher dados manualmente
                toast.info("RE não encontrado. Preencha os dados para cadastro.");
            }
        });
    }

    // PASSO 2 — Criar perfil manual
    function salvarPerfil(values: z.infer<typeof perfilSchema>) {
        startTransition(async () => {
            const res = await buscarOuCriarPerfilPorRE({
                re: usuarioEncontrado.re,
                ...values,
            });
            if (res.success) {
                setUsuarioEncontrado(res.usuario);
                setPasso(3);
                toast.success("Cadastro salvo. Preencha o motivo.");
            } else {
                toast.error("Erro ao salvar cadastro.");
            }
        });
    }

    // PASSO 3 — Motivo e SEI → Confirmar Encaixe
    function confirmarEncaixe(values: z.infer<typeof motivoSchema>) {
        startTransition(async () => {
            const motivoFinal = values.motivo === "Outros" ? values.motivoPersonalizado! : values.motivo;
            const res = await criarAgendamentoParaTerceiro({
                solicitanteId: usuarioEncontrado.id,
                dataHora: new Date(),
                motivo: motivoFinal,
                porIntermedioServico: values.porIntermedioServico === "Sim",
                numeroOficioSei: values.numeroOficioSei,
            });
            if (res.success) {
                setProtocolo(res.protocolo || "Encaixe realizado");
                setPasso(4);
                toast.success("Encaixe realizado com sucesso!");
            } else {
                toast.error(res.message);
            }
        });
    }

    return (
        <Card className="border-t-4 border-t-amber-500 shadow-md mt-6">
            <CardContent className="pt-6">
                {passo < 4 && (
                    <div className="mb-8 border-b pb-4 flex flex-wrap gap-2 text-sm font-medium text-slate-500">
                        <span className={cn(passo >= 1 && "text-amber-600")}>1. Identificar</span>
                        <span>›</span>
                        <span className={cn(passo >= 2 && "text-amber-600")}>2. Dados</span>
                        <span>›</span>
                        <span className={cn(passo >= 3 && "text-amber-600")}>3. Motivo e Confirmação</span>
                    </div>
                )}

                {/* PASSO 4 — Sucesso */}
                {passo === 4 && (
                    <div className="text-center space-y-4 py-8">
                        <div className="mx-auto w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-pm-blue">Encaixe Realizado!</h2>
                        <p className="text-muted-foreground">
                            {usuarioEncontrado?.postoGraduacao} <strong>{usuarioEncontrado?.nomeGuerra}</strong> foi registrado com sucesso.
                        </p>
                        <div className="bg-slate-50 border p-4 rounded-md inline-block my-4">
                            <p className="text-sm text-slate-500 uppercase font-bold tracking-wider mb-1">PROTOCOLO (SEI)</p>
                            <p className="text-lg font-mono text-slate-900">{protocolo}</p>
                        </div>
                        <div className="pt-4">
                            <Button onClick={() => router.push("/dashboard/agenda")} className="bg-pm-blue hover:bg-blue-800">
                                Voltar ao Painel
                            </Button>
                        </div>
                    </div>
                )}

                {/* PASSO 1 — Identificar por RE */}
                {passo === 1 && (
                    <Form {...reForm}>
                        <form onSubmit={reForm.handleSubmit(buscarPorRE)} className="space-y-6">
                            <FormField
                                control={reForm.control}
                                name="re"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>RE (Registro do militar a ser encaixado)</FormLabel>
                                        <FormControl>
                                            <Input className="h-12 text-base" placeholder="Ex: 111925" maxLength={6} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="flex justify-end pt-2">
                                <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-black font-semibold" disabled={isPending}>
                                    <Search className="mr-2 h-4 w-4" />
                                    {isPending ? "Buscando..." : "Buscar"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                )}

                {/* PASSO 2 — Dados manuais */}
                {passo === 2 && (
                    <Form {...perfilForm}>
                        <form onSubmit={perfilForm.handleSubmit(salvarPerfil)} className="space-y-4">
                            <p className="text-sm text-slate-500 bg-slate-50 p-3 rounded-md border">
                                RE <strong>{usuarioEncontrado?.re}</strong> não encontrado no sistema. Preencha os dados do militar.
                            </p>
                            <FormField control={perfilForm.control} name="postoGraduacao" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Posto/Graduação</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger className="h-12"><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                                        <SelectContent>{POSTOS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={perfilForm.control} name="nomeGuerra" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome de Guerra</FormLabel>
                                    <FormControl><Input className="h-12" placeholder="Ex: SILVA" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={perfilForm.control} name="opm" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Unidade (OPM)</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger className="h-12"><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                                        <SelectContent>{OPMS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={perfilForm.control} name="email" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>E-mail (opcional)</FormLabel>
                                    <FormControl><Input className="h-12" placeholder="email@pm.sp.gov.br" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <div className="flex justify-between pt-4">
                                <Button type="button" variant="outline" onClick={() => setPasso(1)}>Voltar</Button>
                                <Button type="submit" className="bg-pm-blue hover:bg-blue-800" disabled={isPending}>
                                    {isPending ? "Salvando..." : "Avançar"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                )}

                {/* PASSO 3 — Motivo */}
                {passo === 3 && (
                    <Form {...motivoForm}>
                        <form onSubmit={motivoForm.handleSubmit(confirmarEncaixe)} className="space-y-4">
                            <div className="bg-amber-50 p-4 rounded-md border border-amber-200 mb-4">
                                <p className="text-sm font-semibold text-amber-800">Encaixando:</p>
                                <p className="text-slate-700">{usuarioEncontrado?.postoGraduacao} {usuarioEncontrado?.nomeGuerra} — RE {usuarioEncontrado?.re} ({usuarioEncontrado?.opm})</p>
                            </div>
                            <FormField control={motivoForm.control} name="motivo" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Motivo</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger className="h-12 text-base"><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                                        <SelectContent>{["Promoção", "Extravio", "Dano", "Outros"].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            {motivoForm.watch("motivo") === "Outros" && (
                                <FormField control={motivoForm.control} name="motivoPersonalizado" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Descreva o motivo</FormLabel>
                                        <FormControl><Input className="h-12" placeholder="Ex: Extravio em ocorrência..." {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            )}
                            <FormField control={motivoForm.control} name="porIntermedioServico" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Por intermédio do serviço?</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger className="h-12"><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                                        <SelectContent><SelectItem value="Sim">Sim</SelectItem><SelectItem value="Não">Não</SelectItem></SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={motivoForm.control} name="numeroOficioSei" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Número do Ofício SEI</FormLabel>
                                    <FormControl><Input className="h-12 text-base" placeholder="Ex: SEI-123456/2026" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <div className="flex justify-between pt-6 border-t">
                                <Button type="button" variant="outline" onClick={() => setPasso(1)}>Voltar ao início</Button>
                                <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-black font-semibold px-8" disabled={isPending}>
                                    {isPending ? "Registrando..." : <><Zap className="mr-2 h-4 w-4" /> Confirmar Encaixe</>}
                                </Button>
                            </div>
                        </form>
                    </Form>
                )}
            </CardContent>
        </Card>
    );
}
