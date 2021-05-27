import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UserService } from './user.service';
import { Channel } from './channel';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly ENDPOINTS = {
    channels: 'http://localhost:3005/channels',
    subscription: 'http://localhost:3005/subscription',
  };

  constructor(private http: HttpClient, private userService: UserService) {}

  getChannels(): Observable<Channel[]> {
    return this.http.get<Channel[]>(
      this.ENDPOINTS.channels,
      this.userService.httpOptions
    );
  }

  getChannelsByName(term: string): Observable<Channel[]> {
    return this.http.get<Channel[]>(
      `${this.ENDPOINTS.channels}/?name=${term}`,
      this.userService.httpOptions
    );
  }

  subscribeToChannel(channel: Channel): Observable<Channel[]> {
    return this.http.post<Channel[]>(
      `${this.ENDPOINTS.channels}`,
      { channel },
      this.userService.httpOptions
    );
  }

  sendPushSubscription(sub: PushSubscription): void {
    this.http
      .post(
        this.ENDPOINTS.subscription,
        { webpushSubscription: sub },
        this.userService.httpOptions
      )
      .subscribe();
  }
}
