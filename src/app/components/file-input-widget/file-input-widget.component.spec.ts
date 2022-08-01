import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileInputWidgetComponent } from './file-input-widget.component';

describe('FileInputWidgetComponent', () => {
  let component: FileInputWidgetComponent;
  let fixture: ComponentFixture<FileInputWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FileInputWidgetComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FileInputWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
