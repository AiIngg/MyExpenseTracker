
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BudgetService, Budget as ApiBudget } from '../services/budget.service';
import {
  TransactionService,
  Transaction,
} from '../services/transaction.service';

// Budget 頁面使用的資料格式
interface Budget {
  id: number;
  categoryId: number;
  category: string;
  limit: number;
  spent: number;
}

@Component({
  selector: 'app-budgets',
  standalone: true,
  imports: [DecimalPipe, FormsModule],
  templateUrl: './budgets.html',
  styleUrl: './budgets.css',
})
export class Budgets implements OnInit {

  private budgetService = inject(BudgetService);
  private transactionService = inject(TransactionService);
  private cdr = inject(ChangeDetectorRef);

  selectedMonth = '2026-10';

  // 儲存從後端取得的預算
  budgets: Budget[] = [];

  // 載入狀態與錯誤訊息
  isLoading = false;
  errorMessage = '';

  // --------------- BUDEGET 修改 -----------------------

  // 目前正在編輯的預算 ID
  editingBudgetId: number | null = null;

  // 使用者正在修改的預算金額
  editedLimit = 0;

  // ---------------------------------------------------


  ngOnInit(): void {
    this.loadBudgets();
  }

  // 切換月份時，重新載入預算資料
  onMonthChange(): void {
    this.loadBudgets();
  }

  // 從後端 API 取得預算
  loadBudgets(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.budgetService.getBudgets().subscribe({
      next: (data: ApiBudget[]) => {
        // 只保留所選月份的預算
        const selectedBudgets = data.filter((item) => {
          const budgetDate = new Date(item.budgetMonth);
          const yearMonth = [
            budgetDate.getFullYear(),
            String(budgetDate.getMonth() + 1).padStart(2, '0'),
          ].join('-');

          return yearMonth === this.selectedMonth;
        });

        this.budgets = selectedBudgets.map((item) => ({
          id: item.id,
          categoryId: item.categoryId,
          category: this.getCategoryName(item.categoryId),
          limit: item.limitAmount,
          spent: 0,
        }));

        this.transactionService.getTransactions().subscribe({
          next: (transactions: Transaction[]) => {
            this.budgets = this.budgets.map((budget) => {
              const spent = transactions
                .filter((transaction) => {
                  if (transaction.categoryId !== budget.categoryId) {
                    return false;
                  }

                  // 使用 yyyy-MM 字串比對月份
                  return transaction.date.slice(0, 7) === this.selectedMonth;
                })
                .reduce((total, transaction) => total + transaction.amount, 0);

              return { ...budget, spent };
            });

            this.isLoading = false;
            this.cdr.detectChanges();
          },
          error: (error) => {
            console.error('Failed to load transactions:', error);
            this.errorMessage = 'Failed to load transactions. Please try again.';
            this.isLoading = false;
            this.cdr.detectChanges();
          },
        });
      },
      error: (error) => {
        console.error('Failed to load budgets:', error);
        this.errorMessage = 'Failed to load budgets. Please try again.';
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }




  // 將資料庫的類別 ID 轉換成畫面顯示的名稱
  getCategoryName(categoryId: number): string {
    const categories: Record<number, string> = {
      1: 'Salary',
      2: 'Investment',
      3: 'Transportation',
      4: 'Shopping',
      5: 'Entertainment',
      6: 'Healthcare',
      7: 'Other Expense',
      21: 'Food & Dining',
    };

    return categories[categoryId] ?? 'Unknown Category';
  }

  get totalBudget(): number {
    return this.budgets.reduce((sum, item) => sum + item.limit, 0);
  }

  get totalSpent(): number {
    return this.budgets.reduce((sum, item) => sum + item.spent, 0);
  }

  get remainingBudget(): number {
    return this.totalBudget - this.totalSpent;
  }

  getUsagePercentage(budget: Budget): number {
    if (budget.limit <= 0) {
      return 0;
    }

    return (budget.spent / budget.limit) * 100;
  }

  isOverBudget(budget: Budget): boolean {
    return budget.spent > budget.limit;
  }

  //---------------------- BUDGET 修改 ----------------------------
  // 開始編輯預算
  startEditBudget(budget: Budget): void {
    this.editingBudgetId = budget.id;
    this.editedLimit = budget.limit;
  }

  // 取消編輯
  cancelEditBudget(): void {
    this.editingBudgetId = null;
    this.editedLimit = 0;
  }

  // 儲存修改後的預算
  saveBudget(budget: Budget): void {
    if (this.editedLimit <= 0 || !Number.isFinite(this.editedLimit)) {
      this.errorMessage = 'Budget amount must be greater than zero.';
      return;
    }

    this.errorMessage = '';

    this.budgetService.updateBudget(budget.id, {
      categoryId: budget.categoryId,
      budgetMonth: this.selectedMonth,
      limitAmount: this.editedLimit,
    }).subscribe({
      next: () => {
        // 更新成功後，重新取得最新資料
        this.editingBudgetId = null;
        this.editedLimit = 0;
        this.loadBudgets();
      },
      error: (error) => {
        console.error('Failed to update budget:', error);
        this.errorMessage = 'Failed to update budget. Please try again.';
        this.cdr.detectChanges();
      },
    });
  }



}
