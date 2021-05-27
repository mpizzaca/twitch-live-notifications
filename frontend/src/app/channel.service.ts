import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Channel } from './channel';
import { UserService } from './user.service';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class ChannelService {
  private channelsURL = 'http://localhost:3005/channels';
  channels = new BehaviorSubject<Channel[]>([]);

  constructor(
    private http: HttpClient,
    private userService: UserService,
    private apiService: ApiService
  ) {}

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
    this.http
      .delete<Channel[]>(
        `${this.channelsURL}/${channel.name}`,
        this.userService.httpOptions
      )
      .subscribe((result) => {
        result = result.map((channel) => {
          channel.subscribed = true;
          return channel;
        });
        this.channels.next(result);
      });
  }

  private setSubscribed(channel: Channel): Channel {
    channel.subscribed = true;
    return channel;
  }
}
