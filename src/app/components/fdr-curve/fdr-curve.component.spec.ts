import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FdrCurveComponent } from './fdr-curve.component';

describe('FdrCurveComponent', () => {
  let component: FdrCurveComponent;
  let fixture: ComponentFixture<FdrCurveComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FdrCurveComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FdrCurveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
