import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BatchUploadModalComponent } from './batch-upload-modal.component';

describe('BatchUploadModalComponent', () => {
  let component: BatchUploadModalComponent;
  let fixture: ComponentFixture<BatchUploadModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BatchUploadModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BatchUploadModalComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
