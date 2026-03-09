export interface FooterSlice {
  currentYear: number;
  currentMonth: number;
  selectedYear: number | null;
}

export const InitialFooterSlice: FooterSlice = {
  currentYear: new Date().getFullYear(),
  currentMonth: new Date().getMonth() + 1,
  selectedYear: null
};