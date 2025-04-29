import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CurtainStatsSummaryComponent } from './curtain-stats-summary.component';

describe('CurtainStatsSummaryComponent', () => {
  let component: CurtainStatsSummaryComponent;
  let fixture: ComponentFixture<CurtainStatsSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CurtainStatsSummaryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CurtainStatsSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
