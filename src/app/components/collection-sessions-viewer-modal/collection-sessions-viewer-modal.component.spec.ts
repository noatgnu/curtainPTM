import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CollectionSessionsViewerModalComponent } from './collection-sessions-viewer-modal.component';

describe('CollectionSessionsViewerModalComponent', () => {
  let component: CollectionSessionsViewerModalComponent;
  let fixture: ComponentFixture<CollectionSessionsViewerModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CollectionSessionsViewerModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CollectionSessionsViewerModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
