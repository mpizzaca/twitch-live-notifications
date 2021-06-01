import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Channel } from '../channel';
import { User } from '../user';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private userSubject: BehaviorSubject<User | null>;
  public user: Observable<User | null>;

  private readonly ENDPOINTS = {
    root: `${environment.apiUrl}`,
    login: `${environment.apiUrl}/login`,
    register: `${environment.apiUrl}/register`,
    channels: `${environment.apiUrl}/channels`,
    subscription: `${environment.apiUrl}/subscription`,
  };

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
    }),
  };

  constructor(private router: Router, private http: HttpClient) {
    this.userSubject = new BehaviorSubject<User | null>(
      JSON.parse(localStorage.getItem('user') || 'null')
    );
    this.user = this.userSubject.asObservable();
  }

  public get userValue(): User | null {
    return this.userSubject.value;
  }

  login(username: string, password: string): Observable<User> {
    return this.http
      .post<User>(this.ENDPOINTS.login, { username, password })
      .pipe(
        map((user: User) => {
          localStorage.setItem('user', JSON.stringify(user));
          this.userSubject.next(user);
          return user;
        })
      );
  }

  register(username: string, password: string): Observable<User> {
    return this.http
      .post<User>(this.ENDPOINTS.register, {
        username,
        password,
      })
      .pipe(
        map((user: User) => {
          localStorage.setItem('user', JSON.stringify(user));
          this.userSubject.next(user);
          return user;
        })
      );
  }

  logout(): void {
    localStorage.removeItem('user');
    this.userSubject.next(null);
    this.router.navigate(['/account/login']);
  }

  getChannels(): Observable<Channel[]> {
    return this.http
      .get<Channel[]>(this.ENDPOINTS.channels, this.httpOptions)
      .pipe(
        catchError((err) => {
          console.log('Error getting channels:', err);
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
      .subscribe(() => {
        // Add the pushSub to the user object
        const user = JSON.parse(localStorage.getItem('user')!);
        user.webpushSubscription = sub;
        localStorage.setItem('user', JSON.stringify(user));
      });
  }

  deletePushSubscription(): void {
    this.http
      .delete(this.ENDPOINTS.subscription, this.httpOptions)
      .subscribe(() => {
        // Delete the pushSub from the user object
        const user = JSON.parse(localStorage.getItem('user')!);
        user.webpushSubscription = null;
        localStorage.setItem('user', JSON.stringify(user));
      });
  }
}
