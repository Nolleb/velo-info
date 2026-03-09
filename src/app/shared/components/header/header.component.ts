import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { SvgIconDirective } from "../../ui/svg/svg-icon.directive";
import { getRoutePath } from "../../../app.routes";
import { Router } from "@angular/router";

@Component({
  selector: "app-header",
  templateUrl: "./header.component.html",
  styleUrls: ["./header.component.scss"],
  imports: [SvgIconDirective, CommonModule]
})
export class HeaderComponent {
  router = inject(Router);
  
  getRoutePath = getRoutePath
  
  onGoHomePage() {
    this.router.navigate([this.getRoutePath('home')]);
  }
}