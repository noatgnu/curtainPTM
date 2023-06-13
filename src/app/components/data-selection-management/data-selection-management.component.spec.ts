import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataSelectionManagementComponent } from './data-selection-management.component';

describe('DataSelectionManagementComponent', () => {
  let component: DataSelectionManagementComponent;
  let fixture: ComponentFixture<DataSelectionManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DataSelectionManagementComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DataSelectionManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
