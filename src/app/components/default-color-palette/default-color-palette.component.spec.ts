import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DefaultColorPaletteComponent } from './default-color-palette.component';

describe('DefaultColorPaletteComponent', () => {
  let component: DefaultColorPaletteComponent;
  let fixture: ComponentFixture<DefaultColorPaletteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DefaultColorPaletteComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DefaultColorPaletteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
