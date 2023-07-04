import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CollaborateModalComponent } from './collaborate-modal.component';

describe('CollaborateModalComponent', () => {
  let component: CollaborateModalComponent;
  let fixture: ComponentFixture<CollaborateModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CollaborateModalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CollaborateModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
