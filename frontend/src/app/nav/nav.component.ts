import { Component, Input, OnInit } from '@angular/core';
import { faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss'],
})
export class NavComponent implements OnInit {
  @Input() showLogout = true;
  faSignOutAlt = faSignOutAlt;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {}

  logout(): void {
    this.apiService.logout();
  }
}
