import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PtmPositionViewerComponent } from './ptm-position-viewer.component';

describe('PtmPositionViewerComponent', () => {
  let component: PtmPositionViewerComponent;
  let fixture: ComponentFixture<PtmPositionViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PtmPositionViewerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PtmPositionViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
