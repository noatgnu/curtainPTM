import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SequenceLogoPromptComponent } from './sequence-logo-prompt.component';

describe('SequenceLogoPromptComponent', () => {
  let component: SequenceLogoPromptComponent;
  let fixture: ComponentFixture<SequenceLogoPromptComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SequenceLogoPromptComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SequenceLogoPromptComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
