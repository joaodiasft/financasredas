"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Lock, Mail, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        router.push("/?entered=1");
        router.refresh();
      } else {
        setError("Credenciais inválidas");
      }
    } catch (err) {
      setError("Erro ao tentar fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl shadow-slate-200 border border-slate-100"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-4">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Redação Financeiro</h1>
          <p className="text-slate-500 mt-1">Acesse sua conta com segurança</p>
          <p className="text-slate-600 text-sm mt-3 leading-relaxed text-left px-1">
            Cada login autorizado entra no <strong className="text-slate-800">mesmo painel</strong>: você verá todos os
            lançamentos, alunos e turmas já cadastrados no sistema.
          </p>
          {process.env.NODE_ENV === "development" ? (
            <p className="text-xs text-slate-400 mt-3 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
              Dev: após migrar o banco, rode <code className="text-[10px]">npm run db:seed</code>. Conta principal{" "}
              <strong>claudiney@redasmil.com</strong> (senha no seed).
            </p>
          ) : null}
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <div className="relative">
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                placeholder="nome@exemplo.com"
                required
              />
              <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
                required
              />
              <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-white rounded-xl font-semibold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Entrar no Sistema"}
          </button>

          <p className="text-xs text-slate-400 text-center pt-4 uppercase tracking-widest font-bold">
            Redação Financeiro • 2026
          </p>
        </form>
      </motion.div>
    </div>
  );
}
