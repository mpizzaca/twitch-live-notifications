import { Component } from '@angular/core';
import { ApiService } from './api.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  authorized: boolean | undefined;

  constructor(private apiService: ApiService) {
    apiService.authorized.subscribe(
      (authorized) => (this.authorized = authorized)
    );
  }
}
