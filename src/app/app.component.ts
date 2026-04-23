import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BackButtonComponent } from './components/back-button/back-button.component';
import { NavbarComponent } from './components/navbar/navbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, BackButtonComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {}
