
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DebtorService, Debtor } from '../../services/debtor.service';
import { DebtService } from '../../services/debt.service';

export type DebtStatus = 'Unpaid' | 'Paid';
export type DebtType = 'I_OWE' | 'OWED_TO_ME';

export interface DebtFormData {
  debtorId: number | null;
  debtType: DebtType;
  description: string;
  date: string;
  amount: number;
  status: DebtStatus;
}

@Component({
  selector: 'app-debt-form',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './debt-form.html',
  styleUrl: './debt-form.css',
})
export class DebtForm implements OnInit {
  @Output() debtAdded = new EventEmitter<DebtFormData>();

  showForm = false;
  debtors: Debtor[] = [];

  // 控制新增欠款人輸入欄位
  showNewDebtorInput = false;
  newDebtorName = '';
  isCreatingDebtor = false;

  form: DebtFormData = this.createDefaultForm();

  constructor(
    private debtorService: DebtorService, 
    private debtService: DebtService) {}

  //  ----------------------------------------------------------------
  //  欠款人資料管理（取得欠款人列表）
  // ----------------------------------------------------------------

  // 初始化元件時,取得並載入欠款人清單
  ngOnInit(): void {
    this.loadDebtors();
  }

  // 後端取得所有欠款人（用途：提供下拉選單選擇欠款人）
  loadDebtors(): void {
    this.debtorService.getDebtors().subscribe({
      next: (data) => {
        this.debtors = data;
      },
      error: (error) => {
        console.error('Failed to load debtors:', error);
        alert('Failed to load people.');
      },
    });
  }

  
  // 新增一個欠款人
  createDebtor(): void {
    const name = this.newDebtorName.trim();

    if (!name) {
      alert('Please enter a person\'s name.');
      return;
    }

    if (this.isCreatingDebtor) {
      return;
    }

    this.isCreatingDebtor = true;

    this.debtorService.createDebtor(name).subscribe({
      next: (newDebtor) => {
        // 更新下拉選單
        this.debtors = [...this.debtors, newDebtor].sort(
          (a, b) => a.name.localeCompare(b.name)
        );

        // 自動選取剛新增的人
        this.form.debtorId = newDebtor.id;

        // 清空輸入欄位並關閉新增區域
        this.newDebtorName = '';
        this.showNewDebtorInput = false;
        this.isCreatingDebtor = false;

        alert(`Successfully added ${newDebtor.name}!`);
      },
      error: (error) => {
        console.error('Failed to create debtor:', error);
        alert('Failed to add person. Please try again.');
        this.isCreatingDebtor = false;
      },
    });
  }


  // ----------------------------------------------------------------
  // 欠款表單管理
  // ----------------------------------------------------------------

  // Add Debt 按鈕：初始化表單、重設表單內容
  private createDefaultForm(): DebtFormData {
    return {
      debtorId: null,
      debtType: 'I_OWE',
      description: '',
      date: new Date().toISOString().slice(0, 10),
      amount: 0,
      status: 'Unpaid',
      
    };
  }

  // Add Debt 按鈕：開啟新增債務表單
  openAddForm(): void {
    this.form = this.createDefaultForm();
    this.showNewDebtorInput = false;
    this.newDebtorName = '';
    this.showForm = true;
  }

  // Close 按鈕：關閉債務表單
  closeForm(): void {
    this.showForm = false;
    this.showNewDebtorInput = false;
    this.newDebtorName = '';
  }

  // Save Debt 按鈕：驗證表單資料，並將債務資料送到後端 API 儲存
  saveDebt(): void {
    if (
      this.form.debtorId === null ||
      !this.form.description.trim() ||
      !this.form.date ||
      !Number.isFinite(this.form.amount) ||
      this.form.amount <= 0
    ) {
      alert(
        'Please select a person, fill in all required fields, and enter an amount greater than zero.'
      );
      return;
    }

    const request = {
      debtorId: this.form.debtorId,
      debtType: this.form.debtType,
      amount: this.form.amount,
      date: this.form.date,
      description: this.form.description.trim()
    };

    this.debtService.createDebt(request).subscribe({
      next: (newDebt) => {
        alert('Debt saved successfully!');

        // 通知父元件重新載入債務列表
        this.debtAdded.emit(this.form);

        this.showForm = false;
      },
      error: (error) => {
        console.error('Failed to save debt:', error);

        const message =
          error.error?.message ||
          error.error ||
          'Failed to save debt. Please try again.';

        alert(message);
      }
    });
  }



}
