import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PermanentLinkRequestModalComponent } from './permanent-link-request-modal.component';

describe('PermanentLinkRequestModalComponent', () => {
  let component: PermanentLinkRequestModalComponent;
  let fixture: ComponentFixture<PermanentLinkRequestModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PermanentLinkRequestModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PermanentLinkRequestModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
