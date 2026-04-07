import React, { useState } from "react";
import { 
  FileUp, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Clock,
  ShieldCheck
} from "lucide-react";
import { cn } from "../lib/utils";
import { motion } from "motion/react";

export function Import() {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div className="p-8 space-y-8 ml-64">
      <header>
        <h2 className="text-sm font-bold text-slate-400 tracking-[0.2em] uppercase mb-1">Integração de Dados</h2>
        <h1 className="editorial-heading">Importar Arquivos</h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <motion.div 
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            className={cn(
              "glass-card p-16 border-2 border-dashed flex flex-col items-center justify-center text-center transition-all duration-300",
              isDragging ? "border-brand-primary bg-slate-100/50 scale-[1.02]" : "border-slate-200"
            )}
          >
            <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-6">
              <FileUp className={cn("w-10 h-10 transition-colors", isDragging ? "text-brand-primary" : "text-slate-400")} />
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900 mb-2">Arraste seus arquivos aqui</h3>
            <p className="text-slate-400 font-medium max-w-xs mb-8">
              Suportamos extratos bancários em PDF, CSV ou OFX para conciliação automática.
            </p>
            <button className="bg-brand-primary text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20">
              Selecionar Arquivo
            </button>
          </motion.div>

          <div className="glass-card">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">Importações Recentes</h3>
            </div>
            <div className="divide-y divide-slate-50">
              {[
                { name: "extrato_nubank_março.pdf", date: "Hoje, 14:20", status: "success", size: "1.2 MB" },
                { name: "vendas_hotmart_q1.csv", date: "Ontem, 09:15", status: "success", size: "450 KB" },
                { name: "folha_pagamento_abril.xlsx", date: "01 Abr, 16:45", status: "error", size: "890 KB" },
              ].map((file, i) => (
                <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-slate-100 rounded-lg">
                      <FileText className="w-5 h-5 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{file.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{file.date} • {file.size}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {file.status === 'success' ? (
                      <span className="flex items-center gap-1 text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg uppercase">
                        <CheckCircle2 className="w-3 h-3" /> Processado
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-extrabold text-rose-600 bg-rose-50 px-2 py-1 rounded-lg uppercase">
                        <AlertCircle className="w-3 h-3" /> Erro
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6 bg-slate-900 text-white">
            <div className="flex items-center gap-3 mb-6">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              <h3 className="font-bold">Segurança de Dados</h3>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              Seus dados são criptografados de ponta a ponta. Não armazenamos suas credenciais bancárias, apenas processamos os extratos para análise editorial.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                <span className="text-xs font-bold text-slate-300">Criptografia AES-256</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                <span className="text-xs font-bold text-slate-300">Conformidade LGPD</span>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="font-bold text-slate-900 mb-4">Instruções</h3>
            <div className="space-y-4">
              {[
                { step: 1, text: "Exporte o extrato do seu banco no formato PDF ou OFX." },
                { step: 2, text: "Arraste o arquivo para a zona de upload ao lado." },
                { step: 3, text: "Aguarde a conciliação automática via IA." },
                { step: 4, text: "Revise as categorias sugeridas e confirme." },
              ].map((item) => (
                <div key={item.step} className="flex gap-4">
                  <span className="text-xl font-black text-slate-100 leading-none">{item.step}</span>
                  <p className="text-xs font-bold text-slate-500 leading-tight">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


