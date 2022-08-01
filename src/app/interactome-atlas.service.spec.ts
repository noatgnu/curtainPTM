import { TestBed } from '@angular/core/testing';

import { InteractomeAtlasService } from './interactome-atlas.service';

describe('InteractomeAtlasService', () => {
  let service: InteractomeAtlasService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InteractomeAtlasService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
