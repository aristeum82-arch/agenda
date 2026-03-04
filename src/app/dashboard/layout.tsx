import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { Suspense } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-slate-50">
            {/* Sidebar Desktop */}
            <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50">
                <Suspense fallback={<div className="p-6 text-white bg-pm-blue h-full">Carregando...</div>}>
                    <Sidebar />
                </Suspense>
            </aside>

            {/* Mobile Nav */}
            <div className="md:hidden sticky top-0 z-50">
                <MobileNav>
                    <Suspense fallback={<div className="p-6 text-white">Carregando...</div>}>
                        <Sidebar />
                    </Suspense>
                </MobileNav>
            </div>

            {/* Conteúdo Principal */}
            <main className="md:pl-64 flex flex-col min-h-screen transition-all duration-300">
                <Header />
                <div className="flex-1 p-6 md:p-8 pt-6 max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {children}
                </div>
            </main>
        </div>
    );
}
