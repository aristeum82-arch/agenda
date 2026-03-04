import { CalendarDays, LayoutDashboard, Settings, UserCircle, Users, ClipboardList } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getPerfilUsuario } from "@/server/actions/perfil";

// Items visíveis para todos os usuários autenticados
const userItems = [
    { title: "Início", href: "/dashboard", icon: LayoutDashboard },
    { title: "Troca de Funcional", href: "/dashboard/agenda", icon: CalendarDays },
    { title: "Meu Perfil", href: "/dashboard/perfil", icon: UserCircle },
];

// Items extras visíveis apenas para admins
const adminItems = [
    { title: "Todos os Agendamentos", href: "/dashboard/admin/agendamentos", icon: ClipboardList },
    { title: "Gerenciar Usuários", href: "/dashboard/admin/usuarios", icon: Users },
];

export async function Sidebar() {
    const perfil = await getPerfilUsuario();
    const isAdmin = perfil?.role === "admin_p5" || perfil?.role === "admin_central";

    const items = isAdmin ? [...userItems, ...adminItems] : userItems;

    return (
        <div className="flex flex-col h-full bg-pm-blue text-white shadow-xl">
            <div className="h-16 flex items-center px-6 border-b border-blue-900/50">
                <Image src="/logo.png" alt="PMESP Logo" width={36} height={36} className="mr-3 rounded-full object-cover" />
                <span className="font-bold tracking-tight text-lg">Agenda PMESP</span>
            </div>
            <nav className="flex-1 py-4 space-y-1 px-3">
                {items.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center px-3 py-2.5 rounded-md hover:bg-blue-800 transition-colors text-blue-100 hover:text-white group"
                    >
                        <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                        <span className="font-medium text-sm">{item.title}</span>
                    </Link>
                ))}

                {/* Área de Administração oculta temporariamente */}
            </nav>
            <div className="p-4 border-t border-blue-900/50">
                <div className="text-xs text-blue-300/70 text-center">CPI-7</div>
            </div>
        </div>
    );
}
