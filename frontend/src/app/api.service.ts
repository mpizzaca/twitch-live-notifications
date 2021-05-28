import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Channel } from './channel';
import { User } from './user';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly ENDPOINTS = {
    root: 'http://localhost:3005',
    login: 'http://localhost:3005/login',
    channels: 'http://localhost:3005/channels',
    subscription: 'http://localhost:3005/subscription',
  };

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      // Authorization:
      //   'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySUQiOiI2MGFkODI4M2FjNGFkYjNkOTExMjg2NzciLCJpYXQiOjE2MjE5OTUxOTJ9.tzGjx5v1qYWB2TWi4-Gi3gFqdMMiRqINg3TtiX4sZo0',
    }),
  };

  authorized = new BehaviorSubject<boolean | undefined>(undefined);

  constructor(private http: HttpClient) {
    this.updateAuthorization();
  }

  updateAuthorization(): void {
    if (!this.httpOptions.headers.get('Authorization')) {
      // No token header -> not authorized
      this.authorized.next(false);
    } else {
      // We have a token - check with server if it's for a valid user
      this.http
        .get(this.ENDPOINTS.root, this.httpOptions)
        .pipe(
          // if the HTTP request is successful will return true, otherwise false
          map(() => this.authorized.next(true)),
          catchError(() => of(this.authorized.next(false)))
        )
        .subscribe();
    }
  }

  login(username: string, password: string): void {
    this.http
      .post<User>(
        this.ENDPOINTS.login,
        { username, password },
        this.httpOptions
      )
      .pipe(
        map((result: User) => {
          this.httpOptions.headers = this.httpOptions.headers.set(
            'Authorization',
            result.token
          );
          this.authorized.next(true);
        }),
        catchError((err) => {
          console.log('Error loggin in:', err);
          return of(this.authorized.next(false));
        })
      )
      .subscribe();
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
