import { TestBed } from '@angular/core/testing';

import { DbStringService } from './db-string.service';

describe('DbStringService', () => {
  let service: DbStringService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DbStringService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
