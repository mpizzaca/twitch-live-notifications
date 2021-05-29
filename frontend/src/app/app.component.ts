import { Component } from '@angular/core';
import { ApiService } from './services/api.service';
import { User } from './user';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  user!: User | null;

  constructor(private apiService: ApiService) {
    this.apiService.user.subscribe((x) => (this.user = x));
  }
}
