import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserListsManagementComponent } from './user-lists-management.component';

describe('UserListsManagementComponent', () => {
  let component: UserListsManagementComponent;
  let fixture: ComponentFixture<UserListsManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserListsManagementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserListsManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
