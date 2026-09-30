import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { VolcanoPlotTextAnnotationComponent } from './volcano-plot-text-annotation.component';

describe('VolcanoPlotTextAnnotationComponent', () => {
  let component: VolcanoPlotTextAnnotationComponent;
  let fixture: ComponentFixture<VolcanoPlotTextAnnotationComponent>;

  const mockActiveModal = {
    dismiss: jasmine.createSpy('dismiss'),
    close: jasmine.createSpy('close')
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VolcanoPlotTextAnnotationComponent ],
      providers: [
        { provide: NgbActiveModal, useValue: mockActiveModal }
      ]
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
