
import { Component, OnInit, signal } from '@angular/core';
import {
  DebtForm,
  DebtFormData,
} from '../shared/debt-form/debt-form';
import { DebtService } from '../services/debt.service';
import type { Debt } from '../services/debt.service';


interface DebtGroup {
  key: string;
  debtorId: number;
  debtorName: string | null;
  amountIOwe: number;
  amountOwedToMe: number;
  balance: number;
  records: Debt[];
}


@Component({
  selector: 'app-debts',
  standalone: true,
  imports: [DebtForm],
  styleUrl: './debts.css',
  templateUrl: './debts.html',
})


export class Debts implements OnInit {
  debts = signal<Debt[]>([]);

  expandedGroupKey = signal<string | null>(null);

  constructor(private debtService: DebtService) {}


  // -------------------------------------------------------------------------
  // 取得債務資料
  // -------------------------------------------------------------------------
  
  // 進入 Debts 頁面時載入債務資料
  ngOnInit(): void {
    this.loadDebts();
  }

  // 從後端取得債務資料
  loadDebts(): void {
    this.debtService.getDebts().subscribe({
      next: (data) => {
        this.debts.set(data);
      },
      error: (error) => {
        console.error('Failed to load debts:', error);
      },
    });
  }



// -------------------------------------------------------------------------
// 更新債務狀態
// -------------------------------------------------------------------------

markDebtSettled(debt: Debt): void {
  const newStatus =
    debt.debtType === 'I_OWE' ? 'PAID' : 'RECEIVED';

  this.debtService.updateDebtStatus(
    debt.id,
    newStatus
  ).subscribe({
    next: () => {
      // 更新成功後，重新從後端取得最新資料
      this.loadDebts();
    },
    error: (error) => {
      console.error('Failed to update debt status:', error);
    },
  });
}


// -------------------------------------------------------------------------
// 1. 債務統計（計算我欠別人的總額、欠我錢的人數、我欠錢的人數）
// -------------------------------------------------------------------------

  // Calculate total amount of debts by type 計算我欠全部人的債務總額
  get totalDebt(): number {
    return this.debts()
      .filter(debt => debt.debtType === 'I_OWE')
      .reduce((total, debt) => total + debt.amount, 0);
  }

  
  // People Owe Me 統計：計算欠我錢的人數
  get peopleOweMeCount(): number {
    return new Set(
      this.debts()
        .filter(debt => debt.debtType === 'OWED_TO_ME')
        .map(debt => debt.debtorId)
    ).size;
  }

  // People I Owe 統計：計算我欠錢的人數
  get peopleIOweCount(): number {
    return new Set(
      this.debts()
        .filter(debt => debt.debtType === 'I_OWE')
        .map(debt => debt.debtorId)
    ).size;
  }

  // 接收新增債務表單（Add Debt Form）送出的資料
  addDebt(debt: DebtFormData): void {
    // 暫時保留原本的表單事件處理。
    // 下一步會將新增功能正式連接到後端 API。
    console.log('Debt form submitted:', debt);
  }

  //-------------------------------------------------------------
  // 2. 將同一個人的多筆債務整理在一起，並控制明細展開或收合。
  //-------------------------------------------------------------

  // 將債務依欠款人分組，計算雙方金額與餘額
  get groupedDebts(): DebtGroup[] {
    const groups = new Map<string, DebtGroup>();

    for (const debt of this.debts()) {
      const key = String(debt.debtorId);

      if (!groups.has(key)) {
        groups.set(key, {
          key,
          debtorId: debt.debtorId,
          debtorName: debt.debtorName,
          amountIOwe: 0,
          amountOwedToMe: 0,
          balance: 0,
          records: [],
        });
      }

      const group = groups.get(key)!;

      if (debt.debtType === 'I_OWE') {
        group.amountIOwe += debt.amount;
      } else if (debt.debtType === 'OWED_TO_ME') {
        group.amountOwedToMe += debt.amount;
      }
      // 保留每一筆原始紀錄
      group.records.push(debt);
    }

    // 計算雙方抵銷後的金額
    for (const group of groups.values()) {
      group.balance =
        group.amountOwedToMe - group.amountIOwe;
    }

  return Array.from(groups.values());
}

  // 切換某個債務群組的展開或收合狀態
  // 點擊欠款人或群組標題時，展開／收合明細
  toggleGroup(key: string): void {
    this.expandedGroupKey.update(current =>
      current === key ? null : key
    );
  }

  // 顯示「對方欠我」、「我欠對方」或「雙方已抵銷」
  getBalanceLabel(balance: number): string {
    if (balance > 0) {
      return '對方欠我';
    }

    if (balance < 0) {
      return '我欠對方';
    }

    return '雙方已抵銷';
  }

  // 顯示抵銷後的金額，不帶負號
  getBalanceAmount(balance: number): number {
    return Math.abs(balance);
  }


}
