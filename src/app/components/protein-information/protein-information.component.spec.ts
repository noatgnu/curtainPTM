import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProteinInformationComponent } from './protein-information.component';

describe('ProteinInformationComponent', () => {
  let component: ProteinInformationComponent;
  let fixture: ComponentFixture<ProteinInformationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProteinInformationComponent ]
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
