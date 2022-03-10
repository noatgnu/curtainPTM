import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuickSearchSelectedComponent } from './quick-search-selected.component';

describe('QuickSearchSelectedComponent', () => {
  let component: QuickSearchSelectedComponent;
  let fixture: ComponentFixture<QuickSearchSelectedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ QuickSearchSelectedComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(QuickSearchSelectedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
