import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { VolcanoAndCytoComponent } from './volcano-and-cyto.component';

describe('VolcanoAndCytoComponent', () => {
  let component: VolcanoAndCytoComponent;
  let fixture: ComponentFixture<VolcanoAndCytoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ NgbModule ],
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
