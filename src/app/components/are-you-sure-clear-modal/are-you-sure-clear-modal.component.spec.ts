import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AreYouSureClearModalComponent } from './are-you-sure-clear-modal.component';

describe('AreYouSureClearModalComponent', () => {
  let component: AreYouSureClearModalComponent;
  let fixture: ComponentFixture<AreYouSureClearModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AreYouSureClearModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AreYouSureClearModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
