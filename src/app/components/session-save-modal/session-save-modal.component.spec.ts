import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { SessionSaveModalComponent } from './session-save-modal.component';

describe('SessionSaveModalComponent', () => {
  let component: SessionSaveModalComponent;
  let fixture: ComponentFixture<SessionSaveModalComponent>;

  const mockActiveModal = {
    dismiss: jasmine.createSpy('dismiss'),
    close: jasmine.createSpy('close')
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionSaveModalComponent],
      providers: [
        { provide: NgbActiveModal, useValue: mockActiveModal }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SessionSaveModalComponent);
    component = fixture.componentInstance;
    component.siteProperties = {
      non_user_post: true,
      allow_user_set_permanent: true,
      expiry_duration_options: [1, 3, 6, 12],
      default_expiry_duration_months: 6,
      jwt_access_token_lifetime_minutes: 60,
      jwt_refresh_token_lifetime_days: 7,
      jwt_remember_me_access_token_lifetime_days: 30,
      jwt_remember_me_refresh_token_lifetime_days: 90
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
