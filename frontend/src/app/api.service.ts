import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Channel } from './channel';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly ENDPOINTS = {
    channels: 'http://localhost:3005/channels',
    subscription: 'http://localhost:3005/subscription',
  };

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySUQiOiI2MGFkODI4M2FjNGFkYjNkOTExMjg2NzciLCJpYXQiOjE2MjE5OTUxOTJ9.tzGjx5v1qYWB2TWi4-Gi3gFqdMMiRqINg3TtiX4sZo0',
    }),
  };

  constructor(private http: HttpClient) {}

  getChannels(): Observable<Channel[]> {
    return this.http.get<Channel[]>(this.ENDPOINTS.channels, this.httpOptions);
  }

  getChannelsByName(term: string): Observable<Channel[]> {
    return this.http.get<Channel[]>(
      `${this.ENDPOINTS.channels}/?name=${term}`,
      this.httpOptions
    );
  }

  subscribeToChannel(channel: Channel): Observable<Channel[]> {
    console.log('Subscribing to channel', channel);
    return this.http.post<Channel[]>(
      `${this.ENDPOINTS.channels}`,
      { channel },
      this.httpOptions
    );
  }

  unsubscribeFromChannel(channel: Channel): Observable<Channel[]> {
    return this.http.delete<Channel[]>(
      `${this.ENDPOINTS.channels}/${channel.name}`,
      this.httpOptions
    );
  }

  sendPushSubscription(sub: PushSubscription): void {
    this.http
      .post(
        this.ENDPOINTS.subscription,
        { webpushSubscription: sub },
        this.httpOptions
      )
      .subscribe();
  }

  deletePushSubscription(): void {
    this.http.delete(this.ENDPOINTS.subscription, this.httpOptions).subscribe();
  }
}
