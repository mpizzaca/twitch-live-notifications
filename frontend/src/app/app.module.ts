import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { ChannelListItemComponent } from './channel-list-item/channel-list-item.component';
import { ChannelsComponent } from './channels/channels.component';
import { ChannelSearchComponent } from './channel-search/channel-search.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { NotificationComponent } from './notification/notification.component';
import { LoadingComponent } from './loading/loading.component';
import { AppRoutingModule } from './app-routing.module';
import { JwtInterceptor, ErrorInterceptor } from './helpers';
import { HomeComponent } from './home/home.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NavModule } from './nav/nav.module';

@NgModule({
  declarations: [
    AppComponent,
    ChannelListItemComponent,
    ChannelsComponent,
    ChannelSearchComponent,
    NotificationComponent,
    LoadingComponent,
    HomeComponent,
  ],
  imports: [
    FormsModule,
    FontAwesomeModule,
    BrowserModule,
    HttpClientModule,
    ReactiveFormsModule,
    ServiceWorkerModule.register('./custom-service-worker.js', {
      enabled: environment.production,
      registrationStrategy: 'registerWhenStable:30000',
    }),
    AppRoutingModule,
    NavModule,
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
    ChannelSearchComponent,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
