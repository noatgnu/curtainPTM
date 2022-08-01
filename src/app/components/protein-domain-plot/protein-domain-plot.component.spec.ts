import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProteinDomainPlotComponent } from './protein-domain-plot.component';

describe('ProteinDomainPlotComponent', () => {
  let component: ProteinDomainPlotComponent;
  let fixture: ComponentFixture<ProteinDomainPlotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProteinDomainPlotComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProteinDomainPlotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
