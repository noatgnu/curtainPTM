import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataciteAdminManagementComponent } from './datacite-admin-management.component';

describe('DataciteAdminManagementComponent', () => {
  let component: DataciteAdminManagementComponent;
  let fixture: ComponentFixture<DataciteAdminManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataciteAdminManagementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DataciteAdminManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
