
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Transaction {
  id: number;
  amount: number;
  description: string | null;
  date: string;
  categoryId: number | null;
  paymentMethodId: number | null;
}

export interface TransactionRequest {
  amount: number;
  description: string | null;
  date: string;
  categoryId: number | null;
  paymentMethodId: number | null;
}

@Injectable({
  providedIn: 'root'
})

// -------------------------------------------------------------------------
// TransactionService: 處理交易相關的 HTTP 請求
// -------------------------------------------------------------------------

export class TransactionService {

  private apiUrl = 'http://localhost:5098/api/transactions';

  constructor(private http: HttpClient) {}

  // 取得所有交易
  getTransactions(): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(this.apiUrl);
  }

  // 新增交易
  addTransaction(
    transaction: TransactionRequest
  ): Observable<Transaction> {
    return this.http.post<Transaction>(this.apiUrl, transaction);
  }

  // 更新交易
  updateTransaction(
    id: number,
    transaction: TransactionRequest
  ): Observable<unknown> {
    return this.http.put(
      `${this.apiUrl}/${id}`,
      transaction
    );
  }

  saveTransaction(
  id: number | null,
  transaction: TransactionRequest
    ): Observable<unknown> {
  if (id === null) {
    return this.addTransaction(transaction);
  }

  return this.updateTransaction(id, transaction);
}

  // 刪除交易
  deleteTransaction(id: number): Observable<unknown> {
    return this.http.delete(
      `${this.apiUrl}/${id}`
    );
  }
}
