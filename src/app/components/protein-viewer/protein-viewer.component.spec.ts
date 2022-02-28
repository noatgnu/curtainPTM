import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProteinViewerComponent } from './protein-viewer.component';

describe('ProteinViewerComponent', () => {
  let component: ProteinViewerComponent;
  let fixture: ComponentFixture<ProteinViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProteinViewerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProteinViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
