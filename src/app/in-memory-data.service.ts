import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { InMemoryDbService } from 'angular-in-memory-web-api';
import { Channel } from './channel';

@Injectable({
  providedIn: 'root',
})
export class InMemoryDataService implements InMemoryDbService {
  createDb() {
    const channels = [
      {
        id: 1,
        name: 'xQcOW',
        avatar_url:
          'https://static-cdn.jtvnw.net/jtv_user_pictures/xqcow-profile_image-9298dca608632101-70x70.jpeg',
        live: true,
      },
      {
        id: 2,
        name: 'pokelaws',
        avatar_url:
          'https://static-cdn.jtvnw.net/jtv_user_pictures/aa68742d-ae1f-4fb7-9d0c-e1756d5204b0-profile_image-70x70.jpg',
      },
    ];

    return { channels };
  }

  genId(channels: Channel[]): number {
    return channels.length > 0
      ? Math.max(...channels.map((channel) => channel.id)) + 1
      : 1;
  }
}
