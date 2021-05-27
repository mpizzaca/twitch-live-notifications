import { Component, OnInit } from '@angular/core';
import { SwPush } from '@angular/service-worker';

@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss'],
})
export class NotificationComponent implements OnInit {
  private readonly PUBLIC_VAPID_KEY =
    'BP7TYEqtTtlZdYL1Jcaq0qIG7_kvwcXq4RDYoBiboSwjC3t0H4BAZO7YBSxEQjdX2PAc3D-lX1tnbTJmvX7KonE';

  subscription?: PushSubscription | null;

  constructor(private swPush: SwPush) {}

  ngOnInit(): void {
    this.swPush.subscription.subscribe((pushSub) => {
      console.log('PushSub updated', pushSub);
      this.subscription = pushSub;
    });
  }

  subscribeToPushNotifications(): void {
    console.log('swPush.subscription', this.swPush.subscription);
    console.log('swPush.isEnabled', this.swPush.isEnabled);
    this.swPush
      .requestSubscription({
        serverPublicKey: this.PUBLIC_VAPID_KEY,
      })
      .then((sub) => console.log('Push Subscription: ', sub))
      .catch((err) => console.log('Error getting Push Subscription:', err));
  }

  unsubscribe(): void {
    this.swPush
      .unsubscribe()
      .then((e) => console.log('Unsubbed', e))
      .catch((e) => console.log('Error unsubbing', e));
  }
}
