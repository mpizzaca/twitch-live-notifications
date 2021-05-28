import { Component, OnInit, Input } from '@angular/core';
import { Channel } from '../channel';
import { ChannelService } from '../channel.service';
@Component({
  selector: 'app-channel-list-item',
  templateUrl: './channel-list-item.component.html',
  styleUrls: ['./channel-list-item.component.scss'],
})
export class ChannelListItemComponent implements OnInit {
  @Input() channel!: Channel;

  constructor(private channelService: ChannelService) {}

  ngOnInit(): void {}

  subscribe(channel: Channel): void {
    this.channelService.subscribe(channel);
  }

  unsubscribe(channel: Channel): void {
    this.channelService.unsubscribe(channel);
  }
}
