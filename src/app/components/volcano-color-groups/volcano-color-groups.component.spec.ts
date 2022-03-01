import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VolcanoColorGroupsComponent } from './volcano-color-groups.component';

describe('VolcanoColorGroupsComponent', () => {
  let component: VolcanoColorGroupsComponent;
  let fixture: ComponentFixture<VolcanoColorGroupsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VolcanoColorGroupsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VolcanoColorGroupsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
