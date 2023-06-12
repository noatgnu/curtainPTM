import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VariantSelectionComponent } from './variant-selection.component';

describe('VariantSelectionComponent', () => {
  let component: VariantSelectionComponent;
  let fixture: ComponentFixture<VariantSelectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VariantSelectionComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VariantSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
