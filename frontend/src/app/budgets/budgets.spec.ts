import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Budgets } from './budgets';

describe('Budgets', () => {
  let component: Budgets;
  let fixture: ComponentFixture<Budgets>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Budgets],
    }).compileComponents();

    fixture = TestBed.createComponent(Budgets);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
