"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { salvarPerfil } from "@/server/actions/perfil";
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
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const OPM_LIST = [
    "CPI-7",
    "ESSD",
    "7 BPM-I",
    "12 BPM-I",
    "14 BAEP",
    "22 BPM-I",
    "40 BPM-I",
    "50 BPM-I",
    "53 BPM-I",
    "54 BPM-I",
    "55 BPM-I",
] as const;

const POSTOS = [
    "Cel PM",
    "Ten Cel PM",
    "Maj PM",
    "Cap PM",
    "1º Ten PM",
    "2º Ten PM",
    "Sub Ten PM",
    "1º Sgt PM",
    "2º Sgt PM",
    "3º Sgt PM",
    "Cb PM",
    "Sd PM",
] as const;

const perfilSchema = z.object({
    re: z.string().length(6, "RE deve conter exatamente 6 dígitos numéricos."),
    email: z.string().email("E-mail inválido.").optional().or(z.literal("")),
    postoGraduacao: z.enum(POSTOS),
    nomeGuerra: z.string().min(2, "Campo obrigatório."),
    opm: z.enum(OPM_LIST),
});

export default function PerfilForm({ dadosIniciais }: { dadosIniciais: any }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const form = useForm<z.infer<typeof perfilSchema>>({
        resolver: zodResolver(perfilSchema),
        defaultValues: {
            re: dadosIniciais?.re || "",
            email: dadosIniciais?.email || "",
            postoGraduacao: (dadosIniciais?.postoGraduacao as typeof POSTOS[number]) || undefined,
            nomeGuerra: dadosIniciais?.nomeGuerra || "",
            opm: dadosIniciais?.opm || undefined,
        },
    });

    function onSubmit(values: z.infer<typeof perfilSchema>) {
        startTransition(async () => {
            const res = await salvarPerfil(values);
            if (res.success) {
                toast.success(res.message);
                router.push("/dashboard/agendar");
            } else {
                toast.error(res.message);
            }
        });
    }

    return (
        <Card className="border-t-4 border-t-pm-blue shadow-md">
            <CardContent className="pt-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="re"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Registro (RE)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: 123456" maxLength={6} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>E-mail (para notificações)</FormLabel>
                                        <FormControl>
                                            <Input type="email" placeholder="seu@email.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="postoGraduacao"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Posto/Graduação</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione o posto..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {POSTOS.map((p) => (
                                                    <SelectItem key={p} value={p}>{p}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="nomeGuerra"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nome de Guerra</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Sd PM Silva" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

 

                        <FormField
                            control={form.control}
                            name="opm"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Unidade (OPM)</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione sua OPM..." />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {OPM_LIST.map((opm) => (
                                                <SelectItem key={opm} value={opm}>
                                                    {opm}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="pt-4">
                            <Button
                                type="submit"
                                className="w-full bg-pm-blue hover:bg-blue-800 text-white"
                                disabled={isPending}
                            >
                                {isPending ? "Salvando..." : "Salvar Cadastro e Prosseguir"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
