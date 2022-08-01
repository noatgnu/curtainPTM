import { TestBed } from '@angular/core/testing';

import { BiomsaService } from './biomsa.service';

describe('BiomsaService', () => {
  let service: BiomsaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BiomsaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
