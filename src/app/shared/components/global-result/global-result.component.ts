import { Component, input } from "@angular/core";
import { ResultCriterion, ResultCriterionBlock } from "../../../models/result-criterion.model";
import { SvgIconDirective } from "../../ui/svg/svg-icon.directive";

@Component({
  selector: "app-global-result",
  templateUrl: "./global-result.component.html",
  styleUrls: ["./global-result.component.scss"],
  imports: [SvgIconDirective],
  standalone: true
})
export class GlobalResultComponent {
  // Support des deux formats : ancien (criteria) et nouveau (block)
  criteria = input<ResultCriterion[]>();
  block = input<ResultCriterionBlock>();
  isStatsGlobales = input<boolean>(false);

  // Computed pour gérer les deux formats
  rowsToDisplay(): ResultCriterion[][] {
    if (this.block()) {
      return this.block()!.rows;
    }
    if (this.criteria()) {
      return [this.criteria()!];
    }
    return [];
  }
}