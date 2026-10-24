
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Debtor {
  id: number;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class DebtorService {
  private apiUrl = 'http://localhost:5098/api/debtors';

  constructor(private http: HttpClient) {}

  // 讀取所有欠款人
  getDebtors(): Observable<Debtor[]> {
    return this.http.get<Debtor[]>(this.apiUrl);
  }

  // 新增欠款人
  createDebtor(name: string): Observable<Debtor> {
    return this.http.post<Debtor>(this.apiUrl, {
      name: name
    });
  }


}
