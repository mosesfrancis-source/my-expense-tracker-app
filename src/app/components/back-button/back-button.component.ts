import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-back-button',
  standalone: true,
  templateUrl: './back-button.component.html',
  styleUrl: './back-button.component.css',
})
export class BackButtonComponent {
  constructor(
    private location: Location,
    private router: Router,
  ) {}

  goBack() {
    if (window.history.length > 1) {
      this.location.back();
      return;
    }

    this.router.navigate(['/dashboard']);
  }
}
