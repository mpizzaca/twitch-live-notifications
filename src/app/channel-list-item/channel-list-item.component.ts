import { Component, OnInit, Input } from '@angular/core';
import { Channel } from '../channel';
import { ChannelService } from '../channel.service';
import { ChannelsComponent } from '../channels/channels.component';

@Component({
  selector: 'app-channel-list-item',
  templateUrl: './channel-list-item.component.html',
  styleUrls: ['./channel-list-item.component.scss'],
})
export class ChannelListItemComponent implements OnInit {
  @Input() channel!: Channel;

  constructor(private channelService: ChannelService) {}

  ngOnInit(): void {
    console.log('Channel init: ', this.channel);
  }

  subscribe(channel: Channel): void {
    this.channelService.subscribe(channel);
  }

  unsubscribe(channel: Channel): void {
    this.channelService.unsubscribe(channel);
  }
}