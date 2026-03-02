import { HttpClient } from '@angular/common/http';
import { UniprotParser } from './uniprot-parser';

describe('UniprotParser', () => {
  let mockHttp: jasmine.SpyObj<HttpClient>;

  beforeEach(() => {
    mockHttp = jasmine.createSpyObj('HttpClient', ['get', 'post']);
  });

  it('should create an instance', () => {
    expect(new UniprotParser(mockHttp)).toBeTruthy();
  });
});
