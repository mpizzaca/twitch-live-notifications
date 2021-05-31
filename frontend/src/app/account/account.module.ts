import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { AccountRoutingModule } from './account-routing.module';
import { LayoutComponent } from './layout.component';
import { LoginComponent } from './login.component';
import { RegisterComponent } from './register.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AlertComponent } from '../alert/alert.component';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    AccountRoutingModule,
  ],
  declarations: [
    LayoutComponent,
    LoginComponent,
    RegisterComponent,
    AlertComponent,
  ],
})
export class AccountModule {}
