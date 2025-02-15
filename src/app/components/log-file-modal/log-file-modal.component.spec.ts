import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LogFileModalComponent } from './log-file-modal.component';

describe('LogFileModalComponent', () => {
  let component: LogFileModalComponent;
  let fixture: ComponentFixture<LogFileModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogFileModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LogFileModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
