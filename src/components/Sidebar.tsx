import React from "react";
import {
  LayoutDashboard,
  ArrowUpCircle,
  ArrowDownCircle,
  CalendarClock,
  Users,
  BarChart3,
  FileUp,
  Settings,
  LogOut,
  X,
} from "lucide-react";
import { cn } from "../lib/utils";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { id: "dashboard", label: "Dashboard",       icon: LayoutDashboard },
  { id: "inflows",   label: "Entradas",         icon: ArrowUpCircle   },
  { id: "outflows",  label: "Saídas",           icon: ArrowDownCircle },
  { id: "payables",  label: "Contas a Pagar",   icon: CalendarClock   },
  { id: "turmas",    label: "Turmas",           icon: Users           },
  { id: "reports",   label: "Relatórios",       icon: BarChart3       },
  { id: "import",    label: "Importar",         icon: FileUp          },
];

export function Sidebar({ activeTab, setActiveTab, isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay backdrop */}
      <AnimOverlay show={isOpen} onClick={onClose} />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-brand-primary text-white flex flex-col transition-transform duration-300 ease-in-out",
          // Always visible on lg+; slide in/out on mobile
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo + close button (close only visible on mobile) */}
        <div className="p-6 lg:p-8">
          <div className="flex items-center justify-between mb-8 lg:mb-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0">
                <div className="w-6 h-6 bg-brand-primary rounded-sm rotate-45" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-tighter leading-none">ELYSIAN</h1>
                <p className="text-[10px] font-medium tracking-[0.2em] text-slate-400">LEDGER</p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Fechar menu"
              className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="space-y-1" aria-label="Navegação principal">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                aria-current={activeTab === item.id ? "page" : undefined}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-left",
                  activeTab === item.id
                    ? "bg-white text-brand-primary shadow-lg shadow-white/10"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5 shrink-0 transition-transform duration-200",
                    activeTab === item.id ? "scale-110" : "group-hover:scale-110"
                  )}
                />
                <span className="font-semibold text-sm truncate">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-6 lg:p-8 space-y-1">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all">
            <Settings className="w-5 h-5 shrink-0" />
            <span className="font-semibold text-sm">Configurações</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all">
            <LogOut className="w-5 h-5 shrink-0" />
            <span className="font-semibold text-sm">Sair</span>
          </button>
        </div>
      </aside>
    </>
  );
}

// Lightweight backdrop — avoids importing a separate file
function AnimOverlay({ show, onClick }: { show: boolean; onClick: () => void }) {
  if (!show) return null;
  return (
    <div
      onClick={onClick}
      aria-hidden="true"
      className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
    />
  );
}
