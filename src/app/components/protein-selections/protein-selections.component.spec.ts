import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProteinSelectionsComponent } from './protein-selections.component';

describe('ProteinSelectionsComponent', () => {
  let component: ProteinSelectionsComponent;
  let fixture: ComponentFixture<ProteinSelectionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProteinSelectionsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProteinSelectionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
