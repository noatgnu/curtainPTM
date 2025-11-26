import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { StringNetworkService, StringDBNetworkResponse, StringDBEdge } from './string-network.service';

describe('StringNetworkService', () => {
  let service: StringNetworkService;
  let httpMock: HttpTestingController;

  const mockNetworkTSV = `stringId_A\tstringId_B\tpreferredName_A\tpreferredName_B\tncbiTaxonId\tscore\tnscore\tfscore\tpscore\tascore\tescore\tdscore\ttscore
9606.ENSP00000000001\t9606.ENSP00000000002\tGENE1\tGENE2\t9606\t0.900\t0.1\t0.2\t0.3\t0.4\t0.5\t0.6\t0.7
9606.ENSP00000000002\t9606.ENSP00000000003\tGENE2\tGENE3\t9606\t0.800\t0.15\t0.25\t0.35\t0.45\t0.55\t0.65\t0.75`;

  const mockInteractionPartnersTSV = `stringId\tpreferredName\tncbiTaxonId\tscore
9606.ENSP00000000004\tGENE4\t9606\t0.750
9606.ENSP00000000005\tGENE5\t9606\t0.650`;

  const mockEnrichmentTSV = `category\tterm\tnumber_of_genes\tnumber_of_genes_in_background\tncbiTaxonId\tinputGenes\tpreferredNames\tpvalue\tfdr\tdescription
GO\tGO:0006412\t5\t500\t9606\tGENE1;GENE2\tGENE1;GENE2\t0.001\t0.01\tTranslation`;

  const mockResolveIdsTSV = `queryTerm\tstringId\tpreferredName\tncbiTaxonId
TP53\t9606.ENSP00000269305\tTP53\t9606
BRCA1\t9606.ENSP00000350283\tBRCA1\t9606`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [StringNetworkService]
    });
    service = TestBed.inject(StringNetworkService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getNetwork', () => {
    it('should fetch and parse network data correctly', (done) => {
      const params = {
        identifiers: ['GENE1', 'GENE2'],
        species: 9606,
        required_score: 400,
        network_type: 'functional' as const
      };

      service.getNetwork(params).subscribe((response: StringDBNetworkResponse) => {
        expect(response).toBeDefined();
        expect(response.edges.length).toBe(2);
        expect(response.nodes.length).toBe(3);
        done();
      });

      const req = httpMock.expectOne(request =>
        request.url.includes('string-db.org/api/tsv/network')
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockNetworkTSV);
    });

    it('should handle network fetch errors gracefully', (done) => {
      const params = {
        identifiers: ['GENE1'],
        species: 9606
      };

      service.getNetwork(params).subscribe((response) => {
        expect(response.nodes.length).toBe(0);
        expect(response.edges.length).toBe(0);
        done();
      });

      const req = httpMock.expectOne(request =>
        request.url.includes('string-db.org/api/tsv/network')
      );
      req.error(new ProgressEvent('Network error'));
    });
  });

  describe('getInteractionPartners', () => {
    it('should fetch and parse interaction partners', (done) => {
      service.getInteractionPartners(['GENE1'], 9606, 400, 10).subscribe((partners) => {
        expect(partners.length).toBe(2);
        done();
      });

      const req = httpMock.expectOne(request =>
        request.url.includes('string-db.org/api/tsv/interaction_partners')
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockInteractionPartnersTSV);
    });
  });

  describe('getEnrichment', () => {
    it('should fetch and parse enrichment data', (done) => {
      service.getEnrichment(['GENE1', 'GENE2'], 9606).subscribe((terms) => {
        expect(terms.length).toBe(1);
        done();
      });

      const req = httpMock.expectOne(request =>
        request.url.includes('string-db.org/api/tsv/enrichment')
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockEnrichmentTSV);
    });
  });

  describe('resolveIdentifiers', () => {
    it('should resolve gene identifiers to preferred names', (done) => {
      service.resolveIdentifiers(['TP53', 'BRCA1'], 9606).subscribe((mapping) => {
        expect(mapping.size).toBe(2);
        done();
      });

      const req = httpMock.expectOne(request =>
        request.url.includes('string-db.org/api/tsv/get_string_ids')
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResolveIdsTSV);
    });
  });

  describe('filterEdgesByScore', () => {
    const mockEdges: StringDBEdge[] = [
      {
        stringId_A: '1', stringId_B: '2',
        preferredName_A: 'A', preferredName_B: 'B',
        ncbiTaxonId: 9606, score: 0.9,
        nscore: 0.5, fscore: 0.4, pscore: 0.3,
        ascore: 0.6, escore: 0.7, dscore: 0.5, tscore: 0.4
      },
      {
        stringId_A: '2', stringId_B: '3',
        preferredName_A: 'B', preferredName_B: 'C',
        ncbiTaxonId: 9606, score: 0.8,
        nscore: 0.2, fscore: 0.3, pscore: 0.1,
        ascore: 0.4, escore: 0.3, dscore: 0.2, tscore: 0.1
      }
    ];

    it('should filter edges based on score thresholds', () => {
      const filtered = service.filterEdgesByScore(mockEdges, {
        nscore: 0.4,
        escore: 0.5
      });

      expect(filtered.length).toBe(1);
    });
  });

  describe('getImageUrl', () => {
    it('should generate correct image URL', () => {
      const url = service.getImageUrl(['GENE1', 'GENE2'], 9606, 'confidence', 500);
      expect(url).toContain('string-db.org/api/image/network');
    });
  });

  describe('getInteractiveSVGNetwork', () => {
    it('should fetch interactive SVG network', (done) => {
      const params = {
        identifiers: ['GENE1', 'GENE2'],
        species: 9606,
        required_score: 400,
        network_flavor: 'confidence' as const
      };

      const mockSVGResponse = '<svg>Mock SVG Content</svg>';

      service.getInteractiveSVGNetwork(params).subscribe((svg) => {
        expect(svg).toBe(mockSVGResponse);
        done();
      });

      const req = httpMock.expectOne(request =>
        request.url.includes('string-db.org/api/svg/network')
      );
      expect(req.request.method).toBe('POST');
      req.flush(mockSVGResponse);
    });
  });
});
