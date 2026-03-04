import { getPerfilUsuario } from "@/server/actions/perfil";
import { redirect } from "next/navigation";
import { Zap } from "lucide-react";
import { EncaixeForm } from "@/components/dashboard/admin/encaixe-form";

export default async function EncaixePage() {
    const perfil = await getPerfilUsuario();

    if (!perfil) redirect("/dashboard/perfil");
    if (perfil.role === "user") redirect("/dashboard/agenda");

    return (
        <div className="max-w-2xl mx-auto space-y-6 pt-10">
            <div className="mb-2">
                <h1 className="text-3xl font-bold tracking-tight text-pm-blue flex items-center gap-3">
                    <Zap className="h-8 w-8 text-amber-500" />
                    Encaixe
                </h1>
                <p className="text-muted-foreground mt-2">
                    Agendamento imediato para agora, sem restrição de horário. Identifique o militar e confirme.
                </p>
            </div>

            <EncaixeForm />
        </div>
    );
}
