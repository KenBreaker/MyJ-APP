import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { FinalizarOrdenPage } from './finalizar-orden';

const routes: Routes = [
  {
    path: '',
    component: FinalizarOrdenPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FinalizarOrdenPageRoutingModule { }
