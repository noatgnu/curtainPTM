import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { DataciteService } from './data-cite.service';

describe('DataciteService', () => {
  let service: DataciteService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DataciteService]
    });
    service = TestBed.inject(DataciteService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
