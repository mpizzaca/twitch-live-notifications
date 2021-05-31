import { Component, OnInit } from '@angular/core';
import { ChannelService } from '../services/channel.service';
import { Channel } from '../channel';

@Component({
  selector: 'app-channels',
  templateUrl: './channels.component.html',
  styleUrls: ['./channels.component.scss'],
})
export class ChannelsComponent implements OnInit {
  channels: Channel[] = [];

  constructor(private channelService: ChannelService) {
    // Subscribe to updates to the channelService 'channels' array.
    this.channelService.channels.subscribe(
      (channels) => (this.channels = channels)
    );
  }

  ngOnInit(): void {
    this.channelService.getChannels();
  }
}
