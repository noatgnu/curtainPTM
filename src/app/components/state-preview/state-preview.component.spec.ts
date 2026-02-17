import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatePreviewComponent } from './state-preview.component';

describe('StatePreviewComponent', () => {
  let component: StatePreviewComponent;
  let fixture: ComponentFixture<StatePreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StatePreviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StatePreviewComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
