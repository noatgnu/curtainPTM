import { TestBed } from '@angular/core/testing';

import { PspService } from './psp.service';

describe('PspService', () => {
  let service: PspService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PspService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
