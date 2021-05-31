import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { ApiService } from '../services/api.service';

@Component({
  templateUrl: 'layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent {
  constructor(private router: Router, private apiService: ApiService) {
    // redirect to home if already logged in
    if (this.apiService.userValue) {
      this.router.navigate(['/']);
    }
  }
}
