import { Component, OnInit } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  map,
} from 'rxjs/operators';
import { Channel } from '../channel';
import { ChannelService } from '../channel.service';

@Component({
  selector: 'app-channel-search',
  templateUrl: './channel-search.component.html',
  styleUrls: ['./channel-search.component.scss'],
})
export class ChannelSearchComponent implements OnInit {
  channels$!: Observable<Channel[]>;
  private searchTerms = new Subject<string>();

  constructor(private channelService: ChannelService) {}

  search(term: string): void {
    this.searchTerms.next(term);
  }

  ngOnInit(): void {
    this.channels$ = this.searchTerms.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((term: string) => this.channelService.searchChannels(term)),
      map((channels) => {
        // filter already subscribed-to channels from search results
        return channels.filter(
          (channel) =>
            this.channelService.channels.value.filter(
              (existingChannel) => existingChannel.name === channel.name
            ).length === 0
        );
      })
    );
  }
}
