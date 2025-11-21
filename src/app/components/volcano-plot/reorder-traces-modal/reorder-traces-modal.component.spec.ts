import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReorderTracesModalComponent } from './reorder-traces-modal.component';

describe('ReorderTracesModalComponent', () => {
  let component: ReorderTracesModalComponent;
  let fixture: ComponentFixture<ReorderTracesModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReorderTracesModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReorderTracesModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
