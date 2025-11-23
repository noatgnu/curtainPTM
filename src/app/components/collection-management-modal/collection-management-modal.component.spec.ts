import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CollectionManagementModalComponent } from './collection-management-modal.component';

describe('CollectionManagementModalComponent', () => {
  let component: CollectionManagementModalComponent;
  let fixture: ComponentFixture<CollectionManagementModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CollectionManagementModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CollectionManagementModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
