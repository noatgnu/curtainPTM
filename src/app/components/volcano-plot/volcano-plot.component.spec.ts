import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { DataFrame } from 'data-forge';

import { VolcanoPlotComponent } from './volcano-plot.component';
import { SettingsService } from '../../settings.service';
import { Settings } from '../../classes/settings';

describe('VolcanoPlotComponent', () => {
  let component: VolcanoPlotComponent;
  let fixture: ComponentFixture<VolcanoPlotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ NgbModule ],
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

  it('should draw cutoff lines in normal mode', () => {
    const settings = TestBed.inject(SettingsService);
    settings.settings = new Settings();
    component._data = new DataFrame([]);
    component.drawVolcano();
    expect(component.graphLayout.shapes?.length).toBe(3);
  });

  it('should not draw cutoff lines when the curve is applied', () => {
    const settings = TestBed.inject(SettingsService);
    settings.settings = new Settings();
    component._data = new DataFrame([]);
    component.drawVolcano();
    settings.settings.volcanoCutoffMode = "curve";
    component.drawVolcano();
    expect(component.graphLayout.shapes?.length).toBe(0);
  });
});
