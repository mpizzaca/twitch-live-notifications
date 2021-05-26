import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { HttpClientInMemoryWebApiModule } from 'angular-in-memory-web-api';
import { InMemoryDataService } from './in-memory-data.service';

import { AppComponent } from './app.component';
import { ChannelListItemComponent } from './channel-list-item/channel-list-item.component';
import { ChannelsComponent } from './channels/channels.component';
import { ChannelSearchComponent } from './channel-search/channel-search.component';

@NgModule({
  declarations: [
    AppComponent,
    ChannelListItemComponent,
    ChannelsComponent,
    ChannelSearchComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    HttpClientInMemoryWebApiModule.forRoot(InMemoryDataService, {
      dataEncapsulation: false,
      passThruUnknownUrl: true,
    }),
  ],
  providers: [ChannelsComponent],
  bootstrap: [AppComponent],
})
export class AppModule {}
