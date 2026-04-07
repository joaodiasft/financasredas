export interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  type: "inflow" | "outflow";
  status: "paid" | "pending" | "overdue";
  account?: string;
  group?: string;
}

export interface DashboardData {
  summary: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    growth: number;
    revenueThisMonth: number;
    expensesThisMonth: number;
    marginMonth: number;
    activeStudents: number;
    pendingInflowCount: number;
    pendingInflowSum: number;
    outPendingCount: number;
    outPendingSum: number;
    reconcilePending: number;
    fixedBillsActive: number;
    fixedDueSoon: number;
  };
  cashFlow: {
    month: string;
    inflow: number;
    outflow: number;
  }[];
  expensesByCategory: {
    name: string;
    value: number;
  }[];
  revenueByCategory: {
    name: string;
    value: number;
  }[];
  revenueByTurma: {
    name: string;
    value: number;
  }[];
  byAccount: {
    name: string;
    value: number;
  }[];
}

export interface Group {
  id: string;
  name: string;
  balance: number;
  performance: number;
  status: "profitable" | "loss" | "neutral";
}
