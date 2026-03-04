import { listarUsuarios } from "@/server/actions/perfil";
import { getPerfilUsuario } from "@/server/actions/perfil";
import { redirect } from "next/navigation";
import { UsuarioRoleForm } from "./role-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { UserSearch } from "@/components/dashboard/admin/user-search";

const ROLE_LABELS: Record<string, string> = {
    user: "Usuário",
    admin_p5: "Chefe P5",
    admin_central: "Central",
};

const ROLE_COLORS: Record<string, string> = {
    user: "bg-slate-100 text-slate-700",
    admin_p5: "bg-blue-100 text-blue-700",
    admin_central: "bg-amber-100 text-amber-700",
};

export default async function AdminUsuariosPage(
    props: { searchParams: Promise<{ re?: string }> }
) {
    const searchParams = await props.searchParams;

    const meuPerfil = await getPerfilUsuario();
    if (!meuPerfil || meuPerfil.role === "user") {
        redirect("/dashboard");
    }

    const usuarios = await listarUsuarios(searchParams.re);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-pm-blue flex items-center gap-3">
                    <Users className="h-8 w-8" />
                    Gerenciar Usuários
                </h1>
                <p className="text-muted-foreground mt-1">
                    Gerencie permissões de acesso dos policiais cadastrados no sistema.
                </p>
            </div>

            <UserSearch />

            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg text-pm-blue">
                        Usuários Cadastrados ({usuarios.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {usuarios.map((usuario) => (
                            <div
                                key={usuario.id}
                                className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
                            >
                                <div className="space-y-0.5">
                                    <p className="font-semibold text-slate-900">
                                        {usuario.nomeGuerra}
                                    </p>
                                    <p className="text-sm text-slate-500">
                                        RE: {usuario.re} &middot; {usuario.opm}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Badge
                                        variant="secondary"
                                        className={ROLE_COLORS[usuario.role]}
                                    >
                                        {ROLE_LABELS[usuario.role]}
                                    </Badge>
                                    {/* Não pode alterar a si mesmo */}
                                    {usuario.id !== meuPerfil.id && (
                                        <UsuarioRoleForm
                                            userId={usuario.id}
                                            currentRole={usuario.role as "user" | "admin_p5" | "admin_central"}
                                        />
                                    )}
                                </div>
                            </div>
                        ))}

                        {usuarios.length === 0 && (
                            <p className="text-sm text-slate-500 text-center py-8 italic">
                                Nenhum usuário cadastrado ainda.
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
