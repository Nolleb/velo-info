export interface WeekSlice {
  selectedMonth: number | null;
  selectedYear: number | null;
}

export const InitialWeekSlice: WeekSlice = {
  selectedMonth: null,
  selectedYear: null
};