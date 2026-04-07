import React, { useState } from "react";
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
  Menu,
  X,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "inflows", label: "Entradas", icon: ArrowUpCircle },
  { id: "outflows", label: "Saídas", icon: ArrowDownCircle },
  { id: "payables", label: "Contas a Pagar", icon: CalendarClock },
  { id: "students", label: "Alunos", icon: GraduationCap },
  { id: "turmas", label: "Turmas", icon: Users },
  { id: "reports", label: "Relatórios", icon: BarChart3 },
  { id: "import", label: "Importar", icon: FileUp },
];

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const NavContent = () => (
    <>
      <div className="p-8">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <div className="w-6 h-6 bg-primary rounded-sm rotate-45" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tighter leading-none text-white">REDAÇÃO</h1>
            <p className="text-[10px] font-medium tracking-[0.2em] text-pink-200">FINANCEIRO</p>
          </div>
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-left",
                activeTab === item.id 
                  ? "bg-white text-primary shadow-lg shadow-primary/20" 
                  : "text-pink-100 hover:text-white hover:bg-white/10"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 transition-transform duration-200",
                activeTab === item.id ? "scale-110" : "group-hover:scale-110"
              )} />
              <span className="font-semibold text-sm">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-8 space-y-4">
        <button
          type="button"
          onClick={() => {
            setActiveTab("settings");
            setIsOpen(false);
          }}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left",
            activeTab === "settings"
              ? "bg-white text-primary shadow-lg shadow-primary/20"
              : "text-pink-100 hover:text-white hover:bg-white/10",
          )}
        >
          <Settings
            className={cn(
              "w-5 h-5 transition-transform duration-200",
              activeTab === "settings" ? "scale-110" : "",
            )}
          />
          <span className="font-semibold text-sm">Configurações</span>
        </button>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white hover:bg-rose-500/20 transition-all text-left bg-black/10"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-semibold text-sm">Sair</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Toggle */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-[60] md:hidden p-2 bg-primary text-white rounded-lg shadow-lg"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 h-screen bg-primary text-white flex-col sticky left-0 top-0 z-50 shadow-2xl">
        <NavContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-[55] md:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 h-full w-64 bg-primary text-white flex flex-col z-[56] transition-transform duration-300 md:hidden shadow-2xl",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <NavContent />
      </aside>
    </>
  );
}
