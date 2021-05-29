import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { User } from '../user';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  user: User | null;
  constructor(private apiService: ApiService) {
    this.user = this.apiService.userValue;
  }

  ngOnInit(): void {}
}
