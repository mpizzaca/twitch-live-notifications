import { Component, OnInit } from '@angular/core';
import { Observable, Subject, of } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  map,
} from 'rxjs/operators';
import { Channel } from '../channel';
import { ChannelService } from '../services/channel.service';

@Component({
  selector: 'app-channel-search',
  templateUrl: './channel-search.component.html',
  styleUrls: ['./channel-search.component.scss'],
})
export class ChannelSearchComponent implements OnInit {
  channels: Channel[] = [];
  private searchTerms = new Subject<string>();

  constructor(private channelService: ChannelService) {}

  search(term: string): void {
    this.searchTerms.next(term);
  }

  ngOnInit(): void {
    this.searchTerms
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((term: string) => this.channelService.searchChannels(term)),
        map((channels) => {
          // filter already subscribed-to channels from search results
          return channels.filter((channel) =>
            this.filterSubscribedChannels(channel)
          );
        })
      )
      .subscribe((searchResults) => (this.channels = searchResults));

    // Setup observer for subscribed channels
    // when this changes, we want to re-filter results
    this.channelService.channels.subscribe(() => {
      this.channels = this.channels.filter((channel) =>
        this.filterSubscribedChannels(channel)
      );
    });
  }

  private filterSubscribedChannels(channel: Channel): boolean {
    return (
      this.channelService.channels.value.filter(
        (exChannel) => exChannel.name === channel.name
      ).length === 0
    );
  }
}
