import React from "react";
import { 
  User, 
  CreditCard, 
  Calendar, 
  BookOpen, 
  X,
  Check
} from "lucide-react";
import { motion } from "motion/react";

export function NewStudentForm({ onClose }: { onClose: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
      >
        <div className="p-8 bg-brand-primary text-white flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">Novo Cadastro</h2>
            <p className="text-slate-400 text-sm font-medium">Registre um novo aluno no sistema</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Nome do Aluno</label>
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-3 rounded-xl focus-within:border-brand-primary transition-all">
                <User className="w-5 h-5 text-slate-400" />
                <input type="text" placeholder="Ex: Martha Dias" className="bg-transparent border-none outline-none text-sm w-full font-bold" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Origem da Transferência</label>
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-3 rounded-xl focus-within:border-brand-primary transition-all">
                <CreditCard className="w-5 h-5 text-slate-400" />
                <select className="bg-transparent border-none outline-none text-sm w-full font-bold">
                  <option>Banco do Brasil</option>
                  <option>Nubank</option>
                  <option>Itaú</option>
                  <option>Pix</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Valor da Matrícula</label>
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-3 rounded-xl focus-within:border-brand-primary transition-all">
                <span className="text-slate-400 font-bold text-sm">R$</span>
                <input type="number" placeholder="0,00" className="bg-transparent border-none outline-none text-sm w-full font-bold" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Data de Início</label>
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-3 rounded-xl focus-within:border-brand-primary transition-all">
                <Calendar className="w-5 h-5 text-slate-400" />
                <input type="date" className="bg-transparent border-none outline-none text-sm w-full font-bold" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Módulo de Estudo</label>
            <div className="grid grid-cols-3 gap-4">
              {['Básico', 'Intermediário', 'Avançado'].map((mod) => (
                <button 
                  key={mod}
                  type="button"
                  className="p-4 border-2 border-slate-100 rounded-2xl flex flex-col items-center gap-2 hover:border-brand-primary hover:bg-slate-50 transition-all group"
                >
                  <BookOpen className="w-6 h-6 text-slate-300 group-hover:text-brand-primary transition-all" />
                  <span className="text-xs font-bold text-slate-600">{mod}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-4 border-2 border-slate-100 rounded-2xl font-bold text-slate-400 hover:bg-slate-50 transition-all"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="flex-1 py-4 bg-brand-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20"
            >
              <Check className="w-5 h-5" />
              Confirmar Matrícula
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
