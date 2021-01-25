import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinalizarOrdenPage } from './finalizar-orden';
import { FinalizarOrdenPageRoutingModule } from './finalizar-orden-routing.module';
import { IonicModule } from '@ionic/angular';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    FinalizarOrdenPageRoutingModule
  ],
  declarations: [
    FinalizarOrdenPage,
  ]
})
export class FinalizarOrdenModule { }
