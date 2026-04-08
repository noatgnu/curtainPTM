import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UniprotErrorModalComponent } from './uniprot-error-modal.component';

describe('UniprotErrorModalComponent', () => {
  let component: UniprotErrorModalComponent;
  let fixture: ComponentFixture<UniprotErrorModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UniprotErrorModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UniprotErrorModalComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
