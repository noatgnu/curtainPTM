import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';

import { FdrCurveComponent } from './fdr-curve.component';
import { SettingsService } from '../../settings.service';
import { Settings } from '../../classes/settings';

describe('FdrCurveComponent', () => {
  let component: FdrCurveComponent;
  let fixture: ComponentFixture<FdrCurveComponent>;
  let settings: SettingsService;

  const mockActiveModal = {
    dismiss: jasmine.createSpy('dismiss'),
    close: jasmine.createSpy('close')
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FdrCurveComponent ],
      imports: [ FormsModule ],
      providers: [
        { provide: NgbActiveModal, useValue: mockActiveModal }
      ]
    })
    .compileComponents();
    settings = TestBed.inject(SettingsService);
    settings.settings = new Settings();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FdrCurveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should save curve mode and parameters to settings on apply', () => {
    component.cutoffMode = "curve";
    component.curve.type = "sam";
    component.curve.s0 = 0.5;
    component.updateFDRCurveText();
    expect(settings.settings.volcanoCutoffMode).toBe("curve");
    expect(settings.settings.volcanoCurve.s0).toBe(0.5);
  });

  it('should not change settings on cancel', () => {
    component.cutoffMode = "curve";
    component.closeModal();
    expect(settings.settings.volcanoCutoffMode).toBe("normal");
  });

  it('should only allow editing points when they are used', () => {
    expect(component.curvePointsEditable).toBeFalse();
    component.cutoffMode = "curve";
    component.curve.type = "points";
    expect(component.curvePointsEditable).toBeTrue();
  });
});
