import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VolcanoPlotTextAnnotationComponent } from './volcano-plot-text-annotation.component';

describe('VolcanoPlotTextAnnotationComponent', () => {
  let component: VolcanoPlotTextAnnotationComponent;
  let fixture: ComponentFixture<VolcanoPlotTextAnnotationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VolcanoPlotTextAnnotationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VolcanoPlotTextAnnotationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
