import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SideFloatControlComponent } from './side-float-control.component';

describe('SideFloatControlComponent', () => {
  let component: SideFloatControlComponent;
  let fixture: ComponentFixture<SideFloatControlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SideFloatControlComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SideFloatControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
