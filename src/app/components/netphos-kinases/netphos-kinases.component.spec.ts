import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NetphosKinasesComponent } from './netphos-kinases.component';

describe('NetphosKinasesComponent', () => {
  let component: NetphosKinasesComponent;
  let fixture: ComponentFixture<NetphosKinasesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NetphosKinasesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NetphosKinasesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
