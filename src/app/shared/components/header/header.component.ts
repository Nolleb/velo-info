import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { SvgIconDirective } from "../../ui/svg/svg-icon.directive";
import { getRoutePath } from "../../../app.routes";
import { Router } from "@angular/router";
import { AuthStore } from "../../../stores/auth/auth.store";
import { AuthButtonComponent } from "../auth-button/auth-button.component";

@Component({
  selector: "app-header",
  templateUrl: "./header.component.html",
  styleUrls: ["./header.component.scss"],
  imports: [SvgIconDirective, CommonModule, AuthButtonComponent]
})
export class HeaderComponent {
  readonly authStore = inject(AuthStore);
  router = inject(Router);
  
  getRoutePath = getRoutePath
  
  onGoHomePage() {
    this.router.navigate([this.getRoutePath('home')]);
  }

  onSyncPage() {
    this.router.navigate([this.getRoutePath('syncActivities')]);
  }
}