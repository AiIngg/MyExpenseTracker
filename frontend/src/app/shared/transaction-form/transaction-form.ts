
import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  inject,
  ChangeDetectorRef
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import {
  CategoryService,
  Category,
} from '../../services/category.service'; // ../../ 回到上上層

export type TransactionType = 'Income' | 'Expense';

export interface TransactionFormData {
  description: string;
  category: string;
  date: string;
  amount: number;
  type: TransactionType;
  paymentMethod: string;
}

@Component({
  selector: 'app-transaction-form',
  imports: [FormsModule],
  templateUrl: './transaction-form.html',
  styleUrl: './transaction-form.css',
})


export class TransactionForm implements OnInit {
  private categoryService = inject(CategoryService);

  private cdr = inject(ChangeDetectorRef);
  
  categories: Category[] = [];

  showAddCategoryForm = false;
  newCategoryName = '';
  newCategoryType: 'Income' | 'Expense' = 'Expense';

  @Input() showForm = false;
  @Input() editingId: number | null = null;
  @Input() form!: TransactionFormData;

  @Output() addClicked = new EventEmitter<void>();
  @Output() closeClicked = new EventEmitter<void>();
  @Output() saveClicked = new EventEmitter<void>();


  ngOnInit(): void {
    this.loadCategories();
  }

  // 從後端取得所有類別
  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (data) => {

        console.log('All categories:', data);
        console.log('First category:', data[0]);
        console.log('First category type:', data[0]?.type);

        this.categories = data;
        console.log('Expense categories:', this.expenseCategories);
        console.log('Income categories:', this.incomeCategories);

        this.updateAvailableCategories();
      },
      error: (error) => {
        console.error('Failed to load categories:', error);
      },
    });
  }

  // 依照交易類型，取得可選的類別名稱
  updateAvailableCategories(): void {
    if (!this.categories.length) {
      return;
    }

    const available = this.availableCategories;

    if (available.length > 0 &&
        !available.includes(this.form.category)) {
      this.form.category = available[0];
    }
  }



get expenseCategories(): string[] {
  return this.categories
    .filter((category) => category.type === 'Expense')
    .map((category) => category.name);
}

get incomeCategories(): string[] {
  return this.categories
    .filter((category) => category.type === 'Income')
    .map((category) => category.name);
}
  get availableCategories(): string[] {
    return this.form.type === 'Income'
      ? this.incomeCategories
      : this.expenseCategories;
  }

  onTypeChange(): void {
  this.updateAvailableCategories();
  }

  openAddForm(): void {
    this.addClicked.emit();
  }

  closeForm(): void {
    this.closeClicked.emit();
  }


  saveTransaction(): void {
    console.log('Child saveTransaction triggered');
    this.saveClicked.emit();
  }

  // Category 
  // 展開新增類別表單
openAddCategoryForm(): void {
  this.showAddCategoryForm = true;
  this.newCategoryName = '';
  this.newCategoryType =
    this.form.type === 'Income' ? 'Income' : 'Expense';
}

// 取消新增類別
cancelAddCategory(): void {
  this.showAddCategoryForm = false;
  this.newCategoryName = '';
}

// 儲存新類別
saveCategory(): void {
  const name = this.newCategoryName.trim();

  if (!name) {
    alert('Please enter a category name.');
    return;
  }

  console.log('New category type:', this.newCategoryType);
  
  this.categoryService.addCategory({
    name,
    type: this.newCategoryType,
    

  }).subscribe({
    next: (newCategory) => {
      this.categories = [...this.categories, newCategory];

      this.form.type =
        newCategory.type === 'Income' ? 'Income' : 'Expense';

      this.form.category = newCategory.name;

      this.showAddCategoryForm = false;
      this.newCategoryName = '';




      
      alert('Category added successfully!');

      // 使用者按下確定後，收起新增類別表單
      this.showAddCategoryForm = false;
      this.cdr.detectChanges();

    },
    error: (error) => {
      console.error('Failed to add category:', error);
      alert(
        error.error?.message ??
        'Failed to add category. Please try again.'
      );
    },
  });
}

  
}
