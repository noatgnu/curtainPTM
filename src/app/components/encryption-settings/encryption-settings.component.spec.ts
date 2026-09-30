import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { EncryptionSettingsComponent } from './encryption-settings.component';

describe('EncryptionSettingsComponent', () => {
  let component: EncryptionSettingsComponent;
  let fixture: ComponentFixture<EncryptionSettingsComponent>;

  const mockActiveModal = {
    dismiss: jasmine.createSpy('dismiss'),
    close: jasmine.createSpy('close')
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EncryptionSettingsComponent],
      providers: [
        { provide: NgbActiveModal, useValue: mockActiveModal }
      ]
    });
    fixture = TestBed.createComponent(EncryptionSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
