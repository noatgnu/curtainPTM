import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdvanceHighlightsComponent } from './advance-highlights.component';

describe('AdvanceHighlightsComponent', () => {
  let component: AdvanceHighlightsComponent;
  let fixture: ComponentFixture<AdvanceHighlightsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdvanceHighlightsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdvanceHighlightsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
