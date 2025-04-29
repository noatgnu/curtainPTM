import { TestBed } from '@angular/core/testing';

import { DataCiteService } from './data-cite.service';

describe('DataCiteService', () => {
  let service: DataCiteService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DataCiteService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
