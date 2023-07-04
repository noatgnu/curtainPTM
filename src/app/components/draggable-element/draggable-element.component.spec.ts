import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DraggableElementComponent } from './draggable-element.component';

describe('DraggableElementComponent', () => {
  let component: DraggableElementComponent;
  let fixture: ComponentFixture<DraggableElementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DraggableElementComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DraggableElementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
