import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SessionSaveModalComponent } from './session-save-modal.component';

describe('SessionSaveModalComponent', () => {
  let component: SessionSaveModalComponent;
  let fixture: ComponentFixture<SessionSaveModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionSaveModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SessionSaveModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
