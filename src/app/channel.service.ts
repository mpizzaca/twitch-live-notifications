import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Channel } from './channel';

@Injectable({
  providedIn: 'root',
})
export class ChannelService {
  private channelsURL = 'http://localhost:3005/channels';
  channels = new BehaviorSubject<Channel[]>([]);

  httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySUQiOiI2MGFkODI4M2FjNGFkYjNkOTExMjg2NzciLCJpYXQiOjE2MjE5OTUxOTJ9.tzGjx5v1qYWB2TWi4-Gi3gFqdMMiRqINg3TtiX4sZo0',
    }),
  };

  constructor(private http: HttpClient) {}

  getChannels(): void {
    this.http
      .get<Channel[]>(this.channelsURL, this.httpOptions)
      .subscribe((channels) => {
        channels = channels.map(this.setSubscribed);
        this.channels.next(channels);
      });
  }

  searchChannels(term: string): Observable<Channel[]> {
    if (!term.trim()) {
      return of([]);
    }

    return this.http.get<Channel[]>(
      `${this.channelsURL}/?name=${term}`,
      this.httpOptions
    );
  }

  subscribe(channel: Channel): void {
    this.http
      .post<Channel[]>(`${this.channelsURL}`, { channel }, this.httpOptions)
      .subscribe(
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
        this.httpOptions
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
