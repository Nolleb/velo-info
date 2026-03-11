import { Component, model } from "@angular/core";
import { SvgIconDirective } from "../../ui/svg/svg-icon.directive";

@Component({
  selector: "app-sidebar",
  templateUrl: "./sidebar.component.html",
  styleUrls: ["./sidebar.component.scss"],
  imports: [SvgIconDirective]
})
export class SidebarComponent {
  isOpen = model(false);

  toggle() {
    this.isOpen.update(value => !value);
  }
}