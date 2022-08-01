import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VolcanoAndCytoComponent } from './volcano-and-cyto.component';

describe('VolcanoAndCytoComponent', () => {
  let component: VolcanoAndCytoComponent;
  let fixture: ComponentFixture<VolcanoAndCytoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VolcanoAndCytoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VolcanoAndCytoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
