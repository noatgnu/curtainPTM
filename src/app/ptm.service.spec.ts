import { TestBed } from '@angular/core/testing';

import { PtmService } from './ptm.service';

describe('PtmService', () => {
  let service: PtmService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PtmService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
