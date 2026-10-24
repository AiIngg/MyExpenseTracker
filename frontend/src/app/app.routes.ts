import { Routes } from '@angular/router';
import { Overview } from './overview/overview';
import { Transactions } from './transactions/transactions';
import { Debts } from './debts/debts';
import { Budgets } from './budgets/budgets';

export const routes: Routes = [

  { path: '', redirectTo: 'overview', pathMatch: 'full' }, 
  // path: '': 預設路由，當網址為根目錄時，會自動導向到 /overview 
  // full: 網址要符合到什麼程度，才套用這條路由規則

  // path: 網址, component: 顯示的元件
  { path: 'overview', component: Overview },
  { path: 'transactions', component: Transactions }, 
  { path: 'debts', component: Debts },
  { path: 'budgets', component: Budgets },
];