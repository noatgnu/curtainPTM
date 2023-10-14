import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserPtmImportManagementComponent } from './user-ptm-import-management.component';

describe('UserPtmImportManagementComponent', () => {
  let component: UserPtmImportManagementComponent;
  let fixture: ComponentFixture<UserPtmImportManagementComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [UserPtmImportManagementComponent]
    });
    fixture = TestBed.createComponent(UserPtmImportManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
