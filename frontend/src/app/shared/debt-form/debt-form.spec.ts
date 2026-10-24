import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DebtForm } from './debt-form';

describe('DebtForm', () => {
  let component: DebtForm;
  let fixture: ComponentFixture<DebtForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DebtForm],
    }).compileComponents();

    fixture = TestBed.createComponent(DebtForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
