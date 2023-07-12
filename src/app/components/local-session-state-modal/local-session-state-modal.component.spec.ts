import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LocalSessionStateModalComponent } from './local-session-state-modal.component';

describe('LocalSessionStateModalComponent', () => {
  let component: LocalSessionStateModalComponent;
  let fixture: ComponentFixture<LocalSessionStateModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LocalSessionStateModalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LocalSessionStateModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
