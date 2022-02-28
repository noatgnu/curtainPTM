import { TestBed } from '@angular/core/testing';

import { UniprotService } from './uniprot.service';

describe('UniprotService', () => {
  let service: UniprotService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UniprotService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
