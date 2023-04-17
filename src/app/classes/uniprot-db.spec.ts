import { UniprotDb } from './uniprot-db';

describe('UniprotDb', () => {
  it('should create an instance', () => {
    expect(new UniprotDb()).toBeTruthy();
  });
});
