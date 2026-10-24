
import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { TransactionService, Transaction } from '../services/transaction.service';
import {
  TransactionForm,
  TransactionFormData,
  TransactionType,
} from '../shared/transaction-form/transaction-form';
import { TransactionFormService } from '../services/transaction-form.service';


@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [TransactionForm],
  templateUrl: './overview.html',
  styleUrl: './overview.css',
})

export class Overview implements OnInit {
  constructor(
    private transactionService: TransactionService,
    private transactionFormService: TransactionFormService,
    private cdr: ChangeDetectorRef
  ) {}

  transactions: Transaction[] = [];

  showForm = false;
  editingId: number | null = null;

  form: TransactionFormData = {
    description: '',
    category: 'Food & Dining',
    date: new Date().toLocaleDateString('en-CA'),
    amount: 0,
    type: 'Expense' as TransactionType,
    paymentMethod: 'Cash',
  };

  ngOnInit(): void {
    this.loadTransactions();
  }

  // 從後端 API 取得交易資料
  loadTransactions(): void {
    this.transactionService.getTransactions().subscribe({
      next: (data) => {
        console.log('Overview transactions:', data);
        console.log('Number of transactions:', data.length);
        this.transactions = data;
        this.cdr.detectChanges();

      },
      error: (error) => {
        console.error('Failed to load transactions:', error);
      },
    });
  }

  // 依照支出類別計算金額
  getSpendingByCategory() {
    const categoryMap: Record<number, string> = {
      3: 'Transportation',
      4: 'Shopping',
      5: 'Entertainment',
      6: 'Healthcare',
      7: 'Others',
      21: 'Food & Dining',
    };

    const colors: Record<number, string> = {
      3: '#A9BBA5',  // Transportation：淺鼠尾草綠
      4: '#829A83',  // Shopping：莫蘭迪綠
      5: '#6F8974',  // Entertainment：深鼠尾草綠
      6: '#C5D1BD',  // Healthcare：淡灰綠
      7: '#97AD94',  // Others：柔和綠
      21: '#526B5C', // Food & Dining：深森林綠
    };

    const totals = new Map<number, number>();

    for (const transaction of this.transactions) {
      const id = transaction.categoryId;

      if (id === null || !(id in categoryMap)) {
        continue;
      }

      totals.set(
        id,
        (totals.get(id) ?? 0) + transaction.amount
      );
    }

    const totalSpending = Array.from(totals.values())
      .reduce((sum, amount) => sum + amount, 0);

    return Array.from(totals.entries())
      .filter(([, amount]) => amount > 0)
      .map(([categoryId, amount]) => ({
        categoryId,
        name: categoryMap[categoryId],
        amount,
        percentage: totalSpending > 0
          ? (amount / totalSpending) * 100
          : 0,
        color: colors[categoryId],
      }))
      .sort((a, b) => b.amount - a.amount);
  }

  // 計算總支出
  getTotalSpending(): number {
    return this.getSpendingByCategory()
      .reduce((sum, item) => sum + item.amount, 0);
  }

  // 計算當月支出
  getMonthlySpending(): number {
    const now = new Date();

    return this.transactions
      .filter((transaction) => {
        const date = new Date(transaction.date);

        return (
          date.getFullYear() === now.getFullYear() &&
          date.getMonth() === now.getMonth() &&
          transaction.categoryId !== null &&
          [3, 4, 5, 6, 7, 21].includes(transaction.categoryId)
        );
      })
      .reduce((total, transaction) => total + transaction.amount, 0);
  }

  // 計算當月收入
  getMonthlyIncome(): number {
    const now = new Date();

    return this.transactions
      .filter((transaction) => {
        const date = new Date(transaction.date);

        return (
          date.getFullYear() === now.getFullYear() &&
          date.getMonth() === now.getMonth() &&
          transaction.categoryId !== null &&
          [1, 2].includes(transaction.categoryId)
        );
      })
      .reduce((total, transaction) => total + transaction.amount, 0);
  }

  // 設定圓餅圖的顏色與比例
  categoryChartBackground(): string {
    const categories = this.getSpendingByCategory();

    if (categories.length === 0) {
      return '#EAE1D7';
    }

    let currentPercentage = 0;

    const segments = categories.map((category) => {
      const start = currentPercentage;
      currentPercentage += category.percentage;

      return `${category.color} ${start}% ${currentPercentage}%`;
    });

    return `conic-gradient(${segments.join(', ')})`;
  }

  // 開啟新增交易表單
  openAddForm(): void {
    this.editingId = null;

    this.form = {
      description: '',
      category: 'Food & Dining',
      date: new Date().toLocaleDateString('en-CA'),
      amount: 0,
      type: 'Expense',
      paymentMethod: 'Cash',
    };

    this.showForm = true;
  }

  // 關閉表單
  closeForm(): void {
    this.showForm = false;
  }

  // 新增交易並儲存至後端
  saveTransaction(): void {
  // 1. 驗證表單資料
  if (!this.transactionFormService.validateForm(this.form)) {
    return;
  }

  // 2. 使用共用 Service 新增交易
  this.transactionFormService.addTransaction(this.form).subscribe({
    next: () => {
      // 3. 關閉表單
      this.closeForm();

      // 4. 清空表單
      this.form = this.transactionFormService.createEmptyForm();

      // 5. 重新取得交易資料
      this.loadTransactions();

      alert('Transaction added successfully!');
    },
    error: (error) => {
      console.error('Failed to add transaction:', error);
      alert('Failed to add transaction. Please try again.');
    },
  });
}







}
