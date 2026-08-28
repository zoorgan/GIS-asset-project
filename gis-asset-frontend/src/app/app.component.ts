import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppHeaderComponent } from './features/header/app-header.component';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AppHeaderComponent],
  template: `
    <div class="app-shell">
      <app-header></app-header>
      <main class="app-shell__content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100vw;
        height: 100vh;
        overflow: hidden;
      }
      .app-shell {
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
      }
      .app-shell__content {
        flex: 1;
        min-height: 0;
      }
    `,
  ],
})
export class AppComponent {}
