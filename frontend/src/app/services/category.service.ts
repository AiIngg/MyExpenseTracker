
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// 一個類別的資料格式
export interface Category {
  id: number;
  name: string;
  type: string;
}

// 新增類別時需要的資料
export interface CategoryRequest {
  name: string;
  type: 'Income' | 'Expense';
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5098/api/categories';

  // 取得所有類別
  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(this.apiUrl);
  }

  // 新增類別
  addCategory(category: CategoryRequest): Observable<Category> {
    return this.http.post<Category>(this.apiUrl, category);
  }
}
