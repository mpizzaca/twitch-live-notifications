import { Component, OnInit } from '@angular/core';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss'],
})
export class NotificationComponent implements OnInit {
  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.notificationService.observeSubscription();
  }

  subscribeToPushNotifications(): void {
    this.notificationService.registerSubscription();
  }

  unsubscribeFromPushNotifications(): void {
    this.notificationService.dropSubscription();
  }
}
