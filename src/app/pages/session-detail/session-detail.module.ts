import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SessionDetailPage } from './session-detail';
import { SessionDetailPageRoutingModule } from './session-detail-routing.module';
import { IonicModule } from '@ionic/angular';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    SessionDetailPageRoutingModule
  ],
  declarations: [
    SessionDetailPage,
  ]
})
export class SessionDetailModule { }
