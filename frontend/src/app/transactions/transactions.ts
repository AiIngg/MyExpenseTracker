import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import {
  TransactionService,
  Transaction as ApiTransaction
} from '../services/transaction.service';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  TransactionForm,
  TransactionFormData,
  TransactionType,
} from '../shared/transaction-form/transaction-form';
import { TransactionFormService } from '../services/transaction-form.service';


interface Transaction {
  id: number;
  description: string;
  category: string;
  date: string;
  amount: number;
  type: TransactionType;
  paymentMethod: string;
}

@Component({
  selector: 'app-transactions',
  imports: [FormsModule, DecimalPipe, TransactionForm],
  templateUrl: './transactions.html',
  styleUrl: './transactions.css',
})

export class Transactions implements OnInit {

  constructor(
    private transactionService: TransactionService, 
    private transactionFormService: TransactionFormService,
    private cdr: ChangeDetectorRef
  ) {}

  // -------------------------------------------------------------------------
  // 1. 交易資料取得（從後端載入交易紀錄，讓其他功能有資料可以使用。）
  // -------------------------------------------------------------------------

  // Load transactions on component initialization 
  // 頁面載入時準備交易資料 (元件初始化時執行)  
  ngOnInit(): void {
    this.loadTransactions();
  }

  searchText = '';
  selectedType = 'All';
  selectedCategory = 'All';
  sortOrder = 'newest';
  calendarDate = new Date(); // 月曆目前顯示的月份

  showForm = false;
  editingId: number | null = null;


  form: TransactionFormData = {
  description: '',
  category: 'Food & Dining',
  date: new Date().toLocaleDateString('en-CA'),
  amount: 0,
  type: 'Expense',
  paymentMethod: 'Cash',
};

  
  transactions: Transaction[] = [];

  // 呼叫 API 取得資料，並轉成前端使用的格式  
  loadTransactions(): void {
    this.transactionService.getTransactions().subscribe({
      next: (data: ApiTransaction[]) => {
        this.transactions = data.map((item) => ({
          id: item.id,
          description: item.description ?? '',
          category: this.getCategoryName(item.categoryId),
          date: item.date,
          amount: item.amount,
          type: this.getTransactionType(item.categoryId),
          paymentMethod: this.getPaymentMethodName(item.paymentMethodId)
        }));

        this.cdr.markForCheck();

        console.log('Transactions count:', this.transactions.length);
        console.log('Filtered count:', this.filteredTransactions.length);
        console.log('Search text:', this.searchText);
        console.log('Selected type:', this.selectedType);
        console.log('Selected category:', this.selectedCategory);

      },
      error: (error) => {
        console.error('Failed to load transactions:', error);
        alert('Failed to load transactions. Please check the backend.');
      }
    });
  }




  // -------------------------------------------------------------------------
  // 2. 將分類 ID 轉成分類名稱、交易類型、付款方式名稱
  // -------------------------------------------------------------------------

  // 將分類 ID 轉成分類名稱
  getCategoryName(categoryId: number | null): string {
    const categories: Record<number, string> = {
      1: 'Salary Income',
      2: 'Investment Income',
      3: 'Transportation Expense',
      4: 'Shopping Expense',
      5: 'Entertainment Expense',
      6: 'Healthcare Expense',
      7: 'Other Expense',
      21: 'Food & Dining'
    };

    return categoryId !== null
      ? categories[categoryId] ?? 'Other Expense'
      : 'Other Expense';
  }

  // 將分類 ID 轉成交易類型（收入或支出）
  getTransactionType(categoryId: number | null): TransactionType {
    return categoryId === 1 || categoryId === 2
      ? 'Income'
      : 'Expense';
  }

  // 將付款方式 ID 轉成名稱（顯示 Cash、Credit Card 等）
  getPaymentMethodName(paymentMethodId: number | null): string {
    const methods: Record<number, string> = {
      1: 'Cash',
      2: 'Debit Card',
      3: 'Credit Card',
      4: 'Bank Transfer'
    };

  return paymentMethodId !== null
    ? methods[paymentMethodId] ?? 'Other'
    : 'Other';
}

// -------------------------------------------------------------------------
// 3. 交易資料篩選、統計、排序
// -------------------------------------------------------------------------


  get filteredTransactions(): Transaction[] {
    const result = this.transactions.filter((transaction) => {
      const matchesSearch =
        transaction.description
          .toLowerCase()
          .includes(this.searchText.toLowerCase()) ||
        transaction.category
          .toLowerCase()
          .includes(this.searchText.toLowerCase());

      const matchesType =
        this.selectedType === 'All' ||
        transaction.type === this.selectedType;

      const matchesCategory =
        this.selectedCategory === 'All' ||
        transaction.category === this.selectedCategory;

      console.log({
        description: transaction.description,
        matchesSearch,
        matchesType,
        matchesCategory,
        selectedType: this.selectedType,
        selectedCategory: this.selectedCategory
      });
      

      return matchesSearch && matchesType && matchesCategory;
    });

    console.log('Filtered transactions:', result);
    console.log('Selected category:', this.selectedCategory);

    return result.sort((a, b) =>
      this.sortOrder === 'newest'
        ? b.date.localeCompare(a.date)
        : this.sortOrder === 'oldest'
          ? a.date.localeCompare(b.date)
          : this.sortOrder === 'highest'
            ? b.amount - a.amount
            : a.amount - b.amount
    );
  }

  // 計算全部收入總額
  get totalIncome(): number {
    return this.transactions
      .filter((item) => item.type === 'Income')
      .reduce((sum, item) => sum + item.amount, 0);
  }


  // 計算全部支出總額
  get totalExpenses(): number {
    return this.transactions
      .filter((item) => item.type === 'Expense')
      .reduce((sum, item) => sum + item.amount, 0);
  }

  //  計算總收入減總支出
  get netBalance(): number {
    return this.totalIncome - this.totalExpenses;
  }

// -------------------------------------------------------------------------
// 4. 月曆功能
// -------------------------------------------------------------------------

  // 取得目前顯示的月份標題
get calendarMonthLabel(): string {
  return this.calendarDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });
}

// 計算目前月份每天的總支出
get dailyExpenses(): Record<string, number> {
  const result: Record<string, number> = {};

  for (const transaction of this.transactions) {
    if (transaction.type !== 'Expense') {
      continue;
    }

    const date = transaction.date.slice(0, 10);

    const transactionDate = new Date(`${date}T12:00:00`);
    if (
      transactionDate.getFullYear() !== this.calendarDate.getFullYear() ||
      transactionDate.getMonth() !== this.calendarDate.getMonth()
    ) {
      continue;
    }

    result[date] = (result[date] ?? 0) + transaction.amount;
  }

  return result;
}

// 產生目前月份的日曆日期格
get calendarDays(): Array<{
  date: string;
  day: number;
} | null> {
  const year = this.calendarDate.getFullYear();
  const month = this.calendarDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days: Array<{ date: string; day: number } | null> = [];

  // 月初前的空白格
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  // 當月每一天
  for (let day = 1; day <= daysInMonth; day++) {
    const date = [
      year,
      String(month + 1).padStart(2, '0'),
      String(day).padStart(2, '0')
    ].join('-');

    days.push({ date, day });
  }

  return days;
}

// 切換上一個月或下一個月
changeCalendarMonth(offset: number): void {
  this.calendarDate = new Date(
    this.calendarDate.getFullYear(),
    this.calendarDate.getMonth() + offset,
    1
  );
  }

//-----------------------------------------------------------------------------
// 5. 新增、編輯、儲存、刪除
//-----------------------------------------------------------------------------

// Add Transaction 按鈕 - 開啟新增交易表單
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
    this.showForm = true; // 控制表單是否顯示
  }

  // 編輯交易 - 開啟編輯交易表單
  editTransaction(transaction: Transaction): void {
    this.editingId = transaction.id;
    this.form = {
      description: transaction.description,
      category: transaction.category,
      date: transaction.date,
      amount: transaction.amount,
      type: transaction.type,
      paymentMethod: transaction.paymentMethod,
    };
    this.showForm = true;
  }

  //  新增或更新交易
  saveTransaction(): void {
  // 1. 驗證表單資料
  if (!this.transactionFormService.validateForm(this.form)) {
    return;
  }

  // 2. 判斷目前是新增還是編輯
  const isAdding = this.editingId === null;

  // 3. 呼叫共用 Service 儲存交易
  this.transactionFormService
    .saveTransaction(this.editingId, this.form)
    .subscribe({
      next: () => {
        // 4. 關閉表單
        this.closeForm();

        // 5. 重新載入交易資料
        this.loadTransactions();

        // 6. 顯示操作結果
        alert(
          isAdding
            ? 'Transaction added successfully!'
            : 'Transaction updated successfully!'
        );
      },
      error: (error) => {
        console.error('Failed to save transaction:', error);
        alert('Failed to save transaction. Please try again.');
      },
    });
}


  
  // 刪除交易
  deleteTransaction(id: number): void {
    if (!confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    this.transactionService.deleteTransaction(id).subscribe({
      next: () => {
        // 後端刪除成功後，重新載入交易資料
        this.loadTransactions();

        alert('Transaction deleted successfully!');
      },
      error: (error) => {
        console.error('Failed to delete transaction:', error);
        alert('Failed to delete transaction. Please try again.');
      },
    });
  }


  // 關閉表單
  closeForm(): void {
    this.showForm = false;
  }
  


}
