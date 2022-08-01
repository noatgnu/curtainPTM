import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CytoplotComponent } from './cytoplot.component';

describe('CytoplotComponent', () => {
  let component: CytoplotComponent;
  let fixture: ComponentFixture<CytoplotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CytoplotComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CytoplotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
