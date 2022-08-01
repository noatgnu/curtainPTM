import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataBlockComponent } from './data-block.component';

describe('DataBlockComponent', () => {
  let component: DataBlockComponent;
  let fixture: ComponentFixture<DataBlockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DataBlockComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DataBlockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
