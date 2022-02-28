import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VolcanoPlotComponent } from './volcano-plot.component';

describe('VolcanoPlotComponent', () => {
  let component: VolcanoPlotComponent;
  let fixture: ComponentFixture<VolcanoPlotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VolcanoPlotComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VolcanoPlotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
