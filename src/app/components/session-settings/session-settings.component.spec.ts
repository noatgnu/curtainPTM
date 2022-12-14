import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SessionSettingsComponent } from './session-settings.component';

describe('SessionSettingsComponent', () => {
  let component: SessionSettingsComponent;
  let fixture: ComponentFixture<SessionSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SessionSettingsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SessionSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
