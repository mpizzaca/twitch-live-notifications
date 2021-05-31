import { Component, Input, OnInit } from '@angular/core';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss'],
})
export class NotificationComponent implements OnInit {
  @Input() isChecked!: boolean;

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.notificationService.observeSubscription();
    this.isChecked = JSON.parse(localStorage.getItem('user')!)
      .webpushSubscription
      ? true
      : false;
  }

  notificationsToggle(): void {
    if (this.isChecked) {
      this.subscribeToPushNotifications();
    } else {
      this.unsubscribeFromPushNotifications();
    }
  }

  subscribeToPushNotifications(): void {
    this.notificationService.registerSubscription();
  }

  unsubscribeFromPushNotifications(): void {
    this.notificationService.dropSubscription();
  }
}
