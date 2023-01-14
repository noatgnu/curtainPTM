import { TestBed } from '@angular/core/testing';

import { KinaseLibraryService } from './kinase-library.service';

describe('KinaseLibraryService', () => {
  let service: KinaseLibraryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(KinaseLibraryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
