import { Channel } from './channel';

export interface User {
  username: string;
  token: string;
  channels: Channel[];
}
