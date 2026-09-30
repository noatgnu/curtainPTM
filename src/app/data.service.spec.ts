import { TestBed } from '@angular/core/testing';

import { DataService } from './data.service';
import { SettingsService } from './settings.service';
import { Settings } from './classes/settings';

describe('DataService', () => {
  let service: DataService;
  let settings: SettingsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DataService);
    settings = TestBed.inject(SettingsService);
    settings.settings = new Settings();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should keep p-value and fold change groups in normal mode', () => {
    expect(service.significantGroup(1, 2)).toEqual(["P-value <= 0.05;FC > 0.6", "P-value <= FC > "]);
    expect(service.isSignificant(1, 2)).toBeTrue();
    expect(service.isSignificant(0.1, 2)).toBeFalse();
  });

  it('should label groups by the curve in curve mode', () => {
    settings.settings.volcanoCutoffMode = "curve";
    settings.settings.volcanoCurve = {type: "hyperbolic", c: 1, s0: 0, df: 0, x0: 0.5};
    expect(service.significantGroup(1.5, 1.2)).toEqual(["Above curve;c=1;x0=0.5", "Above curve"]);
    expect(service.significantGroup(1.5, 0.8)).toEqual(["Below curve;c=1;x0=0.5", "Below curve"]);
    expect(service.isSignificant(-1.5, 1.2)).toBeTrue();
  });

  it('should use pasted points in curve mode without parameters in the label', () => {
    settings.settings.volcanoCutoffMode = "curve";
    settings.settings.volcanoCurve = {type: "points", c: 0, s0: 0, df: 0, x0: 0};
    settings.settings.fdrCurveText = "x\ty\n-1\t3\n-3\t1\n1\t3\n3\t1";
    expect(service.significantGroup(2, 2.5)).toEqual(["Above curve", "Above curve"]);
    expect(service.significantGroup(-2, 1.5)).toEqual(["Below curve", "Below curve"]);
  });
});
