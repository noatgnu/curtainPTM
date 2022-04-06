import { TestBed } from '@angular/core/testing';

import { GlyconnectService } from './glyconnect.service';

describe('GlyconnectService', () => {
  let service: GlyconnectService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GlyconnectService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
