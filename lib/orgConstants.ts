/** Turmas oficiais — aluno pode estar em até duas ao mesmo tempo */
export const TURMAS = [
  "Exatas EX 1",
  "Redação R1",
  "Redação R2",
  "Redação R3",
  "Redação R4",
  "Redação R5",
  "Redação R6",
  "Matematica m1",
  "Matematica m2",
] as const;

/** Nomes antigos → nome atual (migração em seed / dados legados) */
export const LEGACY_TURMA_ALIASES: Record<string, string> = {
  Exatas: "Exatas EX 1",
  EX1: "Exatas EX 1",
  "Exatas EX1": "Exatas EX 1",
  Matemática: "Matematica m1",
  M1: "Matematica m1",
  M2: "Matematica m2",
};

export type TurmaName = (typeof TURMAS)[number];

/** Contas bancárias padrão */
export const BANK_ACCOUNTS = ["Sicoob Redação", "Nubank Martha"] as const;

export type BankAccount = (typeof BANK_ACCOUNTS)[number];

export const DEFAULT_INCOME_CATEGORIES = [
  "Mensalidade",
  "Material didático",
  "Taxa de exame",
  "Pacote intensivo",
  "Aula avulsa",
  "Estorno / desconto",
  "Outras receitas",
];

/** Categorias de despesa — ordem usada no seed, filtros e resumos */
export const DEFAULT_EXPENSE_CATEGORIES = [
  "Folha / RH",
  "Aluguel",
  "Infraestrutura",
  "Software / SaaS",
  "Marketing",
  "Impostos",
  "Alimentação",
  "Transporte",
  "PIX / transferências",
  "Cartão de crédito",
  "Tarifas e banco",
  "Compras e materiais",
  "Outras despesas",
] as const;
