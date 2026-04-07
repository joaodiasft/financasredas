import React from "react";
import { Shield, Lock, Mail } from "lucide-react";
import { motion } from "motion/react";

export function Login({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="min-h-screen bg-brand-primary flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center">
              <div className="w-8 h-8 bg-brand-primary rounded-md rotate-45" />
            </div>
            <div className="text-left text-white">
              <h1 className="text-2xl font-extrabold tracking-tighter leading-none">ELYSIAN</h1>
              <p className="text-[10px] font-medium tracking-[0.3em] text-slate-400">LEDGER</p>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Bem-vindo de volta</h2>
          <p className="text-slate-400 font-medium mt-2">Acesse sua central editorial financeira</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl">
          <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); onLogin(); }}>
            <div className="space-y-2">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] ml-2">E-mail ou ID de Acesso</label>
              <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-2xl focus-within:border-white/30 transition-all">
                <Mail className="w-5 h-5 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="seu@email.com" 
                  className="bg-transparent border-none outline-none text-white text-sm w-full font-medium placeholder:text-slate-600"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] ml-2">Token de Segurança</label>
              <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-2xl focus-within:border-white/30 transition-all">
                <Lock className="w-5 h-5 text-slate-500" />
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  className="bg-transparent border-none outline-none text-white text-sm w-full font-medium placeholder:text-slate-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-between px-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="hidden" />
                <div className="w-5 h-5 border-2 border-white/10 rounded-lg flex items-center justify-center group-hover:border-white/30 transition-all">
                  <div className="w-2 h-2 bg-emerald-400 rounded-sm opacity-0 group-hover:opacity-100 transition-all" />
                </div>
                <span className="text-xs font-bold text-slate-400">Lembrar acesso</span>
              </label>
              <button type="button" className="text-xs font-bold text-slate-400 hover:text-white transition-all">Esqueci a senha</button>
            </div>

            <button 
              type="submit"
              className="w-full py-5 bg-white text-brand-primary rounded-2xl font-black text-sm tracking-widest uppercase hover:bg-slate-100 transition-all shadow-xl shadow-white/5"
            >
              Entrar no Sistema
            </button>
          </form>
        </div>

        <div className="mt-12 flex items-center justify-center gap-8 text-slate-500">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Secure Gateway</span>
          </div>
          <div className="w-1 h-1 bg-slate-700 rounded-full" />
          <span className="text-[10px] font-bold uppercase tracking-widest">v2.4.0</span>
        </div>
      </motion.div>
    </div>
  );
}
