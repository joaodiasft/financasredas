import React, { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { Dashboard } from "./components/Dashboard";
import { Payables } from "./components/Payables";
import { Turmas } from "./components/Turmas";
import { Transactions } from "./components/Transactions";
import { NewStudentForm } from "./components/NewStudentForm";
import { Import } from "./components/Import";
import { Reports } from "./components/Reports";
import { Login } from "./components/Login";
import { motion, AnimatePresence } from "motion/react";
import { Plus } from "lucide-react";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isNewStudentOpen, setIsNewStudentOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":  return <Dashboard />;
      case "inflows":    return <Transactions type="inflow" />;
      case "outflows":   return <Transactions type="outflow" />;
      case "payables":   return <Payables />;
      case "turmas":     return <Turmas />;
      case "reports":    return <Reports />;
      case "import":     return <Import />;
      default:           return <Dashboard />;
    }
  };

  return (
    <div className="min-h-dvh bg-slate-50">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => { setActiveTab(tab); setSidebarOpen(false); }}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main area — offset by sidebar on lg+ */}
      <div className="lg:pl-64 flex flex-col min-h-dvh">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>

          <button
            onClick={() => setIsNewStudentOpen(true)}
            aria-label="Novo cadastro"
            className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 w-14 h-14 sm:w-16 sm:h-16 bg-brand-primary text-white rounded-2xl shadow-2xl shadow-slate-900/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 group"
          >
            <Plus className="w-7 h-7 sm:w-8 sm:h-8 group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </main>
      </div>

      <AnimatePresence>
        {isNewStudentOpen && (
          <NewStudentForm onClose={() => setIsNewStudentOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
