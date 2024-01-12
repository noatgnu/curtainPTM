import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrimaryIdExportModalComponent } from './primary-id-export-modal.component';

describe('PrimaryIdExportModalComponent', () => {
  let component: PrimaryIdExportModalComponent;
  let fixture: ComponentFixture<PrimaryIdExportModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrimaryIdExportModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PrimaryIdExportModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
