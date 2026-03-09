export interface HomeSlice {
  currentYear: number;
  currentMonth: number;
}

export const InitialHomeSlice: HomeSlice = {
  currentYear: new Date().getFullYear(),
  currentMonth: new Date().getMonth() + 1,
};