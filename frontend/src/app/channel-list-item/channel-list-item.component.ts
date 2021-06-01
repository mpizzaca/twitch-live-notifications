import { Component, OnInit, Input } from '@angular/core';
import { Channel } from '../channel';
import { ChannelService } from '../services/channel.service';
import { faPlusCircle, faMinusCircle } from '@fortawesome/free-solid-svg-icons';
import { ChannelSearchComponent } from '../channel-search/channel-search.component';

@Component({
  selector: 'app-channel-list-item',
  templateUrl: './channel-list-item.component.html',
  styleUrls: ['./channel-list-item.component.scss'],
})
export class ChannelListItemComponent implements OnInit {
  @Input() channel!: Channel;
  faPlusCircle = faPlusCircle;
  faMinusCircle = faMinusCircle;

  constructor(
    private channelService: ChannelService,
    private channelSearch: ChannelSearchComponent
  ) {}

  ngOnInit(): void {}

  subscribe(channel: Channel): void {
    this.channelService.subscribe(channel);
    this.channelSearch.clearSearch();
  }

  unsubscribe(channel: Channel): void {
    this.channelService.unsubscribe(channel);
  }
}
