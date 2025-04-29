import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataciteMetadataDisplayComponent } from './datacite-metadata-display.component';

describe('DataciteMetadataDisplayComponent', () => {
  let component: DataciteMetadataDisplayComponent;
  let fixture: ComponentFixture<DataciteMetadataDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataciteMetadataDisplayComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DataciteMetadataDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
