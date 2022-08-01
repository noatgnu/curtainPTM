import { TestBed } from '@angular/core/testing';

import { CarbonyldbService } from './carbonyldb.service';

describe('CarbonyldbService', () => {
  let service: CarbonyldbService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CarbonyldbService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
