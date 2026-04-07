import React from "react";
import {
  Sparkles,
  TrendingUp,
  Download,
} from "lucide-react";
import { formatCurrency } from "../lib/utils";
import { motion } from "motion/react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { name: "Jan", value: 4000 },
  { name: "Fev", value: 3000 },
  { name: "Mar", value: 5000 },
  { name: "Abr", value: 4500 },
  { name: "Mai", value: 6000 },
  { name: "Jun", value: 5500 },
];

export function Reports() {
  return (
    <div className="page-content">
      {/* Header */}
      <header className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <h2 className="text-xs font-bold text-slate-400 tracking-[0.2em] uppercase mb-1">Análise Avançada</h2>
          <h1 className="editorial-heading">Relatórios & Insights</h1>
        </div>
        <button className="bg-brand-primary text-white px-5 py-2.5 sm:py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-800 active:scale-95 transition-all shadow-lg shadow-slate-900/10 text-sm">
          <Download className="w-4 h-4" />
          Gerar PDF
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
        {/* Left column — charts */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-8">
          {/* Area chart */}
          <div className="glass-card p-5 sm:p-8">
            <div className="flex flex-wrap justify-between items-start gap-3 mb-6 sm:mb-8">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">Projeção de Receita</h3>
                <p className="text-sm text-slate-400 font-medium">Estimativa baseada em dados históricos</p>
              </div>
              <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-lg">
                <Sparkles className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                <span className="text-xs font-bold text-emerald-600 uppercase">IA Insight</span>
              </div>
            </div>
            <div className="h-56 sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#0F172A" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#0F172A" stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} width={48} />
                  <Tooltip
                    formatter={(v: number) => formatCurrency(v)}
                    contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#0F172A" strokeWidth={2.5} fillOpacity={1} fill="url(#colorValue)" name="Receita" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Mini KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-5 sm:p-6"
            >
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Ticket Médio</h4>
              <div className="flex items-end gap-3">
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">{formatCurrency(450)}</p>
                <span className="text-emerald-600 text-xs font-bold mb-1 flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" aria-hidden="true" />
                  +5.2%
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-2 font-medium">Aumento de R$ 22,00 em relação ao mês anterior.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              className="glass-card p-5 sm:p-6"
            >
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Taxa de Churn</h4>
              <div className="flex items-end gap-3">
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">2.4%</p>
                <span className="text-rose-600 text-xs font-bold mb-1">−0.8%</span>
              </div>
              <p className="text-xs text-slate-400 mt-2 font-medium">Redução significativa após novos módulos.</p>
            </motion.div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4 sm:space-y-6">
          {/* AI recommendation */}
          <div className="glass-card p-5 sm:p-8 bg-brand-primary text-white">
            <Sparkles className="w-8 h-8 text-amber-400 mb-5" aria-hidden="true" />
            <h3 className="text-lg sm:text-xl font-bold mb-3">Recomendação da IA</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              Identificamos uma oportunidade de otimização tributária no módulo de Turmas. Ao migrar a Turma B para o modelo de assinatura trimestral, você pode aumentar o LTV em até 18%.
            </p>
            <button className="w-full py-3.5 bg-white text-brand-primary rounded-2xl font-bold text-sm hover:bg-slate-100 active:scale-95 transition-all">
              Ver Detalhes da Estratégia
            </button>
          </div>

          {/* Upcoming events */}
          <div className="glass-card p-5 sm:p-6">
            <h3 className="font-bold text-slate-900 mb-5">Próximos Eventos</h3>
            <div className="space-y-4">
              {[
                { title: "Fechamento Mensal",    date: "30 Abr", type: "Financeiro"   },
                { title: "Renovação de Licenças", date: "15 Mai", type: "Operacional"  },
                { title: "Auditoria Trimestral",  date: "02 Jun", type: "Fiscal"        },
              ].map((event, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-slate-100 rounded-xl flex flex-col items-center justify-center shrink-0">
                    <span className="text-[9px] font-black text-slate-400 uppercase leading-none">{event.date.split(" ")[1]}</span>
                    <span className="text-sm font-black text-slate-900 leading-tight">{event.date.split(" ")[0]}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{event.title}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{event.type}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
