import { Component, OnInit, Input } from '@angular/core';
import { Channel } from '../channel';

@Component({
  selector: 'app-channel-list-item',
  templateUrl: './channel-list-item.component.html',
  styleUrls: ['./channel-list-item.component.scss'],
})
export class ChannelListItemComponent implements OnInit {
  @Input() channel?: Channel;

  constructor() {}

  ngOnInit(): void {
    console.log('Channel init: ', this.channel);
  }
}
