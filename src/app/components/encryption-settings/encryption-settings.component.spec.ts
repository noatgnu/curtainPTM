import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EncryptionSettingsComponent } from './encryption-settings.component';

describe('EncryptionSettingsComponent', () => {
  let component: EncryptionSettingsComponent;
  let fixture: ComponentFixture<EncryptionSettingsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EncryptionSettingsComponent]
    });
    fixture = TestBed.createComponent(EncryptionSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
