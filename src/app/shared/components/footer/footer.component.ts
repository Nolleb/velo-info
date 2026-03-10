import { Component, inject } from "@angular/core";
import { getRoutePath } from "../../../app.routes";
import { Router } from "@angular/router";
import { SvgIconDirective } from "../../ui/svg/svg-icon.directive";
import { FooterStore } from "./store/footer.store";
import { MonthStore } from "../../../features/month-page/store/month.store";
import { CycleLoaderComponent } from "../cycle-loader/cycle-loader.component";

@Component({
  selector: "app-footer",
  templateUrl: "./footer.component.html",
  styleUrls: ["./footer.component.scss"],
  imports: [SvgIconDirective, CycleLoaderComponent]
})
export class FooterComponent {

  router = inject(Router);
  readonly footerStore = inject(FooterStore);
  readonly monthStore = inject(MonthStore);

  getRoutePath = getRoutePath
  currentYear = new Date().getFullYear();

  onOpenMonthPage(year: string) {
    this.monthStore.setYearDate(parseInt(year))
    this.router.navigate([this.getRoutePath('monthPage').replace(':year', year)]);
  }
}