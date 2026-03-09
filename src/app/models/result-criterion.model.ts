import { SvgIcon } from "../shared/ui/svg/svg.type";

export interface ResultCriterion {
  label: string;
  value: string | number;
  icon: {
    name: SvgIcon;
    width: string;
    height: string;
    color: string;
  };
}

export interface ResultCriterionBlock {
  rows: ResultCriterion[][];
}