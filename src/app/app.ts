import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SvgIconDirective } from "./shared/ui/svg/svg-icon.directive";
import { HeaderComponent } from "./shared/components/header/header.component";
import { FooterComponent } from "./shared/components/footer/footer.component";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('velo-info');
}
