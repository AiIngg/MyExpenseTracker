
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// -------------------------------------------------------------------------
// Debt: 債務資料格式
// -------------------------------------------------------------------------

// GET(DEBTS): 取得所有債務時要傳送的資料格式
export interface Debt {
  id: number;
  debtorId: number;
  debtorName: string | null;
  debtType: string;
  amount: number;
  date: string | null;
  description: string | null;
  status: string; // 債務狀態，例如 UNPAID、PAID、RECEIVED
}

// POST(DEBTS): 新增一筆債務時要傳送的資料格式
export interface CreateDebtRequest {
  debtorId: number;
  debtType: 'I_OWE' | 'OWED_TO_ME';
  amount: number;
  date: string;
  description: string;
}

@Injectable({
  providedIn: 'root'
})

// -------------------------------------------------------------------------
// DebtService: 處理債務相關的 HTTP 請求
// -------------------------------------------------------------------------

export class DebtService {
  private apiUrl = 'http://localhost:5098/api/debts';

  constructor(private http: HttpClient) {}

  // GET(DEBTS): 取得所有債務
  getDebts(): Observable<Debt[]> {
    return this.http.get<Debt[]>(this.apiUrl);
  }
  
  // POST：新增一筆債務
  createDebt(request: CreateDebtRequest): Observable<Debt> {
    return this.http.post<Debt>(this.apiUrl, request);
  }

  // PUT: 更新債務狀態 (PAID / RECEIVED)
  updateDebtStatus(
    id: number,
    status: 'PAID' | 'RECEIVED'
  ) {
    return this.http.put<{ id: number; status: string; message: string }>(
      `${this.apiUrl}/${id}/status`,
      { status }
    );
  }

}



