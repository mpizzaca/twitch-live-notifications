import { NgModule } from '@angular/core';
import { NavComponent } from './nav.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonModule } from '@angular/common';

@NgModule({
  declarations: [NavComponent],
  imports: [CommonModule, FontAwesomeModule],
  exports: [NavComponent],
})
export class NavModule {}
