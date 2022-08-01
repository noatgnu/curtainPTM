import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VolcanoColorsComponent } from './volcano-colors.component';

describe('VolcanoColorsComponent', () => {
  let component: VolcanoColorsComponent;
  let fixture: ComponentFixture<VolcanoColorsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VolcanoColorsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VolcanoColorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
