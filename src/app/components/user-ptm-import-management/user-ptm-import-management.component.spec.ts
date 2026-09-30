import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { UserPtmImportManagementComponent } from './user-ptm-import-management.component';

describe('UserPtmImportManagementComponent', () => {
  let component: UserPtmImportManagementComponent;
  let fixture: ComponentFixture<UserPtmImportManagementComponent>;

  const mockActiveModal = {
    dismiss: jasmine.createSpy('dismiss'),
    close: jasmine.createSpy('close')
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [UserPtmImportManagementComponent],
      providers: [
        { provide: NgbActiveModal, useValue: mockActiveModal }
      ]
    });
    fixture = TestBed.createComponent(UserPtmImportManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
