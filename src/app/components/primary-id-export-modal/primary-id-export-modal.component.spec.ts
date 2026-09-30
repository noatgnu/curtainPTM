import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { PrimaryIdExportModalComponent } from './primary-id-export-modal.component';

describe('PrimaryIdExportModalComponent', () => {
  let component: PrimaryIdExportModalComponent;
  let fixture: ComponentFixture<PrimaryIdExportModalComponent>;

  const mockActiveModal = {
    dismiss: jasmine.createSpy('dismiss'),
    close: jasmine.createSpy('close')
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrimaryIdExportModalComponent],
      providers: [
        { provide: NgbActiveModal, useValue: mockActiveModal }
      ]
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
