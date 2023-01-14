import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KinaseLibraryModalComponent } from './kinase-library-modal.component';

describe('KinaseLibraryModalComponent', () => {
  let component: KinaseLibraryModalComponent;
  let fixture: ComponentFixture<KinaseLibraryModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ KinaseLibraryModalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KinaseLibraryModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
