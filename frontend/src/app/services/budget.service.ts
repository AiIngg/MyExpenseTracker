
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// 一筆預算的資料格式
export interface Budget {
  id: number;
  categoryId: number;
  budgetMonth: string;
  limitAmount: number;
}

// 新增或修改預算時需要的資料
export interface BudgetRequest {
  categoryId: number;
  budgetMonth: string;
  limitAmount: number;
}

@Injectable({
  providedIn: 'root'
})
export class BudgetService {

  // 用來發送 HTTP 請求
  private http = inject(HttpClient);

  // 後端 API 的網址
  private apiUrl = 'http://localhost:5098/api/budgets';

  // GET：取得所有預算
  getBudgets(): Observable<Budget[]> {
    return this.http.get<Budget[]>(this.apiUrl);
  }

  // POST：新增預算
  addBudget(budget: BudgetRequest): Observable<any> {
    return this.http.post(this.apiUrl, budget);
  }

  // PUT：修改指定預算
  updateBudget(
    id: number,
    budget: BudgetRequest
  ): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, budget);
  }

  // DELETE：刪除指定預算
  deleteBudget(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
