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
        channels = channels.map((channel) => {
          channel.subscribed = true;
          return channel;
        });
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
    console.log('Channel service - current channels: ', this.channels);
    console.log('Channel service - subscribing to channel: ', channel);
    this.http
      .post<Channel[]>(`${this.channelsURL}`, { channel }, this.httpOptions)
      .subscribe(
        () => {
          console.log('Channel service - subscription successful');
          this.channels.next([...this.channels.value, channel]);
          console.log('Channel service - new channels: ', this.channels);
        },
        (err) => console.error('Error subscribing: ', err)
      );
  }

  unsubscribe(channel: Channel): Observable<Channel> {
    // TODO: implement
    return of(channel);
  }
}
