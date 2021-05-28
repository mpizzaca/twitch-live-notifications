import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Channel } from './channel';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly ENDPOINTS = {
    root: 'http://localhost:3005',
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

  constructor(private http: HttpClient) {
    this.Authorized();
  }

  Authorized(): Observable<boolean> {
    // No token header -> not authorized
    if (!this.httpOptions.headers.get('Authorization')) {
      return of(false);
    } else {
      // We have a token - check with server if it's for a valid user
      return this.http.get(this.ENDPOINTS.root, this.httpOptions).pipe(
        // if the HTTP request is successful will return true, otherwise false
        map(() => true),
        catchError(() => of(false))
      );
    }
  }

  getChannels(): Observable<Channel[]> {
    return this.http
      .get<Channel[]>(this.ENDPOINTS.channels, this.httpOptions)
      .pipe(
        catchError((err) => {
          console.log('getChannels error:', err);
          return of([]);
        })
      );
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
