import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-month-selector',
  standalone: true,
  templateUrl: './month-selector.html',
  styleUrl: './month-selector.css',
})
export class MonthSelector {
  @Input() month = '';
  @Output() monthChange = new EventEmitter<string>();

  onMonthChange(value: string): void {
    this.monthChange.emit(value);
  }
}