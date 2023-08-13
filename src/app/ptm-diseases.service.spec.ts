import { TestBed } from '@angular/core/testing';

import { PtmDiseasesService } from './ptm-diseases.service';

describe('PtmDiseasesService', () => {
  let service: PtmDiseasesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PtmDiseasesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
