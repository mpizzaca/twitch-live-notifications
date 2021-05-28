import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-login-register',
  templateUrl: './login-register.component.html',
  styleUrls: ['./login-register.component.scss'],
})
export class LoginRegisterComponent implements OnInit {
  constructor(private apiService: ApiService) {}

  ngOnInit(): void {}

  login(username: string, password: string): void {
    console.log(`Login: ${username}:${password}`);
    this.apiService.login(username, password);
  }
}
