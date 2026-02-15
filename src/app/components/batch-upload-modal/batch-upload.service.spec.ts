import { TestBed } from '@angular/core/testing';

import { BatchUploadService } from './batch-upload.service';

describe('BatchUploadService', () => {
  let service: BatchUploadService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BatchUploadService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
