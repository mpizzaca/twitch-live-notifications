import { Injectable } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly PUBLIC_VAPID_KEY =
    'BP7TYEqtTtlZdYL1Jcaq0qIG7_kvwcXq4RDYoBiboSwjC3t0H4BAZO7YBSxEQjdX2PAc3D-lX1tnbTJmvX7KonE';

  constructor(private swPush: SwPush, private apiService: ApiService) {}

  observeSubscription(): void {
    this.swPush.subscription.subscribe((sub) => {
      console.log('NotificationService: Push Sub', sub);
      if (sub !== null) {
        console.log('NotificationService: Sending Push Sub to server');
        this.apiService.sendPushSubscription(sub);
      }
    });
  }

  registerSubscription(): void {
    this.swPush
      .requestSubscription({
        serverPublicKey: this.PUBLIC_VAPID_KEY,
      })
      .then((sub) =>
        console.log('NotificationService: Requested Push Sub', sub)
      )
      .catch((err) =>
        console.log('NotificationService: Request Push Sub Error', err)
      );
  }

  dropSubscription(): void {
    this.swPush
      .unsubscribe()
      .then(() => {
        console.log('NotificationService: Unsubscribed');
        this.apiService.deletePushSubscription();
      })
      .catch((err) =>
        console.log('NotificationService: Error unsubscribing', err)
      );
  }
}
