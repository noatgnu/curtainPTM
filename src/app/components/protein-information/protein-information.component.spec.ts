import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { PlotlyModule } from 'angular-plotly.js';
import * as PlotlyJS from 'plotly.js-dist-min';

import { ProteinInformationComponent } from './protein-information.component';
import { ProteinDomainPlotComponent } from '../protein-domain-plot/protein-domain-plot.component';

PlotlyModule.forRoot(PlotlyJS);

describe('ProteinInformationComponent', () => {
  let component: ProteinInformationComponent;
  let fixture: ComponentFixture<ProteinInformationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ NgbModule ],
      declarations: [ ProteinInformationComponent, ProteinDomainPlotComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProteinInformationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
