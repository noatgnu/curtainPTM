import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RawDataComponent } from './raw-data.component';
import { DataService } from '../../data.service';
import { SettingsService } from '../../settings.service';
import { Settings } from '../../classes/settings';

describe('RawDataComponent', () => {
  let component: RawDataComponent;
  let fixture: ComponentFixture<RawDataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RawDataComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RawDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should mark rows significant by the active cutoff', () => {
    const data = TestBed.inject(DataService);
    const settings = TestBed.inject(SettingsService);
    settings.settings = new Settings();
    data.differentialForm.foldChange = "fc";
    data.differentialForm.significant = "p";
    expect(component.isSignificant({fc: 1, p: 2})).toBeTrue();
    expect(component.isSignificant({fc: 1, p: 1})).toBeFalse();
    settings.settings.volcanoCutoffMode = "curve";
    settings.settings.volcanoCurve = {type: "hyperbolic", c: 1, s0: 0, df: 0, x0: 0.5};
    expect(component.isSignificant({fc: 1.5, p: 1.2})).toBeTrue();
    expect(component.isSignificant({fc: 1.5, p: 0.8})).toBeFalse();
  });
});
