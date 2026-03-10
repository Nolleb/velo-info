import { Component, input } from "@angular/core";
import { MONTHS } from "../../utils/variables/months";

@Component({
  selector: "app-card-infos",
  templateUrl: "./card-infos.component.html",
  styleUrls: ["./card-infos.component.scss"],
  standalone: true,
})

export class CardInfosComponent {
  year = input<string>();
  month = input<number>();

  months = MONTHS
}