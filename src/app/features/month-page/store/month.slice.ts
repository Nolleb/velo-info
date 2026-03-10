export interface MonthSlice {
  currentYear: number;
  currentMonth: number;
  selectedYear: number | null;
}

export const InitialMonthSlice: MonthSlice = {
  currentYear: new Date().getFullYear(),
  currentMonth: new Date().getMonth() + 1,
  selectedYear: null
};