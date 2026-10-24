import { Injectable } from '@angular/core';
import {
  TransactionFormData,
  TransactionType,
} from '../shared/transaction-form/transaction-form';
import { TransactionService } from './transaction.service';

@Injectable({
  providedIn: 'root',
})
export class TransactionFormService {
  constructor(private transactionService: TransactionService) {}

  // 建立新增交易時的預設表單
  createEmptyForm(): TransactionFormData {
    return {
      description: '',
      category: 'Food & Dining',
      date: new Date().toLocaleDateString('en-CA'),
      amount: 0,
      type: 'Expense' as TransactionType,
      paymentMethod: 'Cash',
    };
  }

  // 檢查表單資料是否完整
  validateForm(form: TransactionFormData): boolean {
    if (
      !form.description.trim() ||
      !form.date ||
      form.amount <= 0
    ) {
      alert(
        'Please enter a description, date, and amount greater than zero.'
      );
      return false;
    }

    return true;
  }

  // 將表單內容轉成後端 API 需要的資料格式
  createRequest(form: TransactionFormData) {
    const categoryIds: Record<string, number> = {
      'Salary Income': 1,
      'Investment Income': 2,

      'Transportation': 3,
      'Shopping': 4,
      'Entertainment': 5,
      'Healthcare': 6,
      'Other': 7,
      'Food & Dining': 21,
    };

    const paymentMethodIds: Record<string, number> = {
      Cash: 1,
      'Debit Card': 2,
      'Credit Card': 3,
      'Bank Transfer': 4,
    };

    return {
      amount: form.amount,
      description: form.description.trim(),
      date: form.date,
      categoryId: categoryIds[form.category] ?? 7,
      paymentMethodId: paymentMethodIds[form.paymentMethod] ?? 1,
    };
  }

  // 共用新增交易 API
  addTransaction(form: TransactionFormData) {
    return this.transactionService.saveTransaction(
      null,
      this.createRequest(form)
    );
  }


  saveTransaction(
    editingId: number | null,
    form: TransactionFormData
  ) {
    return this.transactionService.saveTransaction(
      editingId,
      this.createRequest(form)
    );
  }


  




}
