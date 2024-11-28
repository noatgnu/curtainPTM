import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ColorByCategoryModalComponent } from './color-by-category-modal.component';

describe('ColorByCategoryModalComponent', () => {
  let component: ColorByCategoryModalComponent;
  let fixture: ComponentFixture<ColorByCategoryModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ColorByCategoryModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ColorByCategoryModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
