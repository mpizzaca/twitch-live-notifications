import { Component, Input, OnInit } from '@angular/core';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.scss'],
})
export class AlertComponent implements OnInit {
  @Input() error!: string;
  faExclamationTriangle = faExclamationTriangle;

  constructor() {}

  ngOnInit(): void {}
}
