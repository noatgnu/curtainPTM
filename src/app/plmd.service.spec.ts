import { TestBed } from '@angular/core/testing';

import { PlmdService } from './plmd.service';

describe('PlmdService', () => {
  let service: PlmdService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PlmdService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
