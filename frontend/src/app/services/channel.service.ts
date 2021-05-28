import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { Channel } from '../channel';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class ChannelService {
  channels = new BehaviorSubject<Channel[]>([]);

  constructor(private apiService: ApiService) {}

  getChannels(): void {
    this.apiService.getChannels().subscribe((channels) => {
      channels = channels.map(this.setSubscribed);
      this.channels.next(channels);
    });
  }

  searchChannels(term: string): Observable<Channel[]> {
    if (!term.trim()) {
      return of([]);
    }

    return this.apiService.getChannelsByName(term);
  }

  subscribe(channel: Channel): void {
    this.apiService.subscribeToChannel(channel).subscribe(
      (result) => {
        result = result.map(this.setSubscribed);
        this.channels.next(result);
      },
      (err) => console.error('Error subscribing: ', err)
    );
  }

  unsubscribe(channel: Channel): void {
    this.apiService.unsubscribeFromChannel(channel).subscribe(
      (result) => {
        result = result.map((channel) => {
          channel.subscribed = true;
          return channel;
        });
        this.channels.next(result);
      },
      (err) => console.error('Error unsubscribing: ', err)
    );
  }

  private setSubscribed(channel: Channel): Channel {
    channel.subscribed = true;
    return channel;
  }
}
