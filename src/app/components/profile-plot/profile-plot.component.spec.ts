import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfilePlotComponent } from './profile-plot.component';

describe('ProfilePlotComponent', () => {
  let component: ProfilePlotComponent;
  let fixture: ComponentFixture<ProfilePlotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProfilePlotComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfilePlotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
