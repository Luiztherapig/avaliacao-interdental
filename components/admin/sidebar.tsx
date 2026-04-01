"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MessageCircleHeart, NotebookPen, Settings, Stethoscope } from "lucide-react";

import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/avaliacoes", label: "Avaliações", icon: MessageCircleHeart },
  { href: "/admin/dentistas", label: "Dentistas", icon: Stethoscope },
  { href: "/admin/perguntas", label: "Perguntas", icon: NotebookPen },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings }
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="panel-shell h-fit p-4">
      <div className="mb-6 border-b pb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">Painel</p>
        <h2 className="mt-2 text-xl">Interdental</h2>
      </div>
      <nav className="grid gap-2">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900",
                active && "bg-cyan-50 text-cyan-800"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
