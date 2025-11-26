import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';

export interface StringDBNode {
  stringId: string;
  preferredName: string;
  ncbiTaxonId: number;
  taxonName: string;
  annotation: string;
}

export interface StringDBEdge {
  stringId_A: string;
  stringId_B: string;
  preferredName_A: string;
  preferredName_B: string;
  ncbiTaxonId: number;
  score: number;
  nscore: number;
  fscore: number;
  pscore: number;
  ascore: number;
  escore: number;
  dscore: number;
  tscore: number;
}

export interface StringDBNetworkResponse {
  nodes: StringDBNode[];
  edges: StringDBEdge[];
}

export interface StringDBEnrichmentTerm {
  category: string;
  term: string;
  number_of_genes: number;
  number_of_genes_in_background: number;
  ncbiTaxonId: number;
  inputGenes: string;
  preferredNames: string;
  pvalue: number;
  fdr: number;
  description: string;
}

export interface NetworkRequestParams {
  identifiers: string[];
  species: number;
  required_score?: number;
  network_type?: 'functional' | 'physical';
  add_nodes?: number;
  show_query_node_labels?: 0 | 1;
}

export interface InteractiveSVGParams extends NetworkRequestParams {
  network_flavor?: 'evidence' | 'confidence' | 'actions';
}

@Injectable({
  providedIn: 'root',
})
export class StringNetworkService {
  private readonly STRING_DB_BASE_URL = 'https://string-db.org/api';
  private readonly STRING_DB_CGI_URL = 'https://string-db.org/cgi';
  private readonly DEFAULT_SCORE = 400;
  private readonly DEFAULT_NETWORK_TYPE = 'functional';

  constructor(private http: HttpClient) { }

  getNetwork(params: NetworkRequestParams): Observable<StringDBNetworkResponse> {
    const url = `${this.STRING_DB_BASE_URL}/tsv/network`;

    const httpParams = new HttpParams({
      fromObject: {
        identifiers: params.identifiers.join('\n'),
        species: params.species.toString(),
        required_score: (params.required_score || this.DEFAULT_SCORE).toString(),
        network_type: params.network_type || this.DEFAULT_NETWORK_TYPE,
        ...(params.add_nodes !== undefined && { add_nodes: params.add_nodes.toString() }),
        ...(params.show_query_node_labels !== undefined && {
          show_query_node_labels: params.show_query_node_labels.toString()
        })
      }
    });

    return this.http.get(url, {
      params: httpParams,
      responseType: 'text'
    }).pipe(
      map(response => this.parseNetworkResponse(response)),
      catchError(error => {
        console.error('Error fetching STRING-DB network:', error);
        return of({ nodes: [], edges: [] });
      })
    );
  }

  getInteractionPartners(
    identifiers: string[],
    species: number,
    requiredScore: number = this.DEFAULT_SCORE,
    limit: number = 10
  ): Observable<string[]> {
    const url = `${this.STRING_DB_BASE_URL}/tsv/interaction_partners`;

    const httpParams = new HttpParams({
      fromObject: {
        identifiers: identifiers.join('\n'),
        species: species.toString(),
        required_score: requiredScore.toString(),
        limit: limit.toString()
      }
    });

    return this.http.get(url, {
      params: httpParams,
      responseType: 'text'
    }).pipe(
      map(response => this.parseInteractionPartners(response)),
      catchError(error => {
        console.error('Error fetching interaction partners:', error);
        return of([]);
      })
    );
  }

  getEnrichment(
    identifiers: string[],
    species: number,
    categories?: string[]
  ): Observable<StringDBEnrichmentTerm[]> {
    const url = `${this.STRING_DB_BASE_URL}/tsv/enrichment`;

    const params: any = {
      identifiers: identifiers.join('\n'),
      species: species.toString()
    };

    if (categories && categories.length > 0) {
      params.category = categories.join(',');
    }

    const httpParams = new HttpParams({ fromObject: params });

    return this.http.get(url, {
      params: httpParams,
      responseType: 'text'
    }).pipe(
      map(response => this.parseEnrichmentResponse(response)),
      catchError(error => {
        console.error('Error fetching STRING-DB enrichment:', error);
        return of([]);
      })
    );
  }

  resolveIdentifiers(
    identifiers: string[],
    species: number
  ): Observable<Map<string, string>> {
    const url = `${this.STRING_DB_BASE_URL}/tsv/get_string_ids`;

    const httpParams = new HttpParams({
      fromObject: {
        identifiers: identifiers.join('\n'),
        species: species.toString(),
        limit: '1',
        echo_query: '1'
      }
    });

    return this.http.get(url, {
      params: httpParams,
      responseType: 'text'
    }).pipe(
      map(response => this.parseResolveResponse(response)),
      catchError(error => {
        console.error('Error resolving identifiers:', error);
        return of(new Map());
      })
    );
  }

  getInteractiveSVGNetwork(params: InteractiveSVGParams): Observable<string> {
    const url = `${this.STRING_DB_BASE_URL}/svg/network`;

    const formData = new FormData();
    formData.append('identifiers', params.identifiers.join('\n'));
    formData.append('species', params.species.toString());
    formData.append('required_score', (params.required_score || this.DEFAULT_SCORE).toString());
    formData.append('network_type', params.network_type || this.DEFAULT_NETWORK_TYPE);

    if (params.network_flavor) {
      formData.append('network_flavor', params.network_flavor);
    }
    if (params.add_nodes !== undefined) {
      formData.append('add_nodes', params.add_nodes.toString());
    }

    return this.http.post(url, formData, {
      responseType: 'text'
    }).pipe(
      catchError(error => {
        console.error('Error fetching interactive SVG network:', error);
        return of('');
      })
    );
  }

  private parseNetworkResponse(tsvData: string): StringDBNetworkResponse {
    const lines = tsvData.trim().split('\n');
    if (lines.length === 0) {
      return { nodes: [], edges: [] };
    }

    const headers = lines[0].split('\t');
    const edges: StringDBEdge[] = [];
    const nodeMap = new Map<string, StringDBNode>();

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split('\t');
      if (values.length !== headers.length) continue;

      const edge: any = {};
      headers.forEach((header, index) => {
        const value = values[index];
        if (header.includes('score') || header === 'ncbiTaxonId') {
          edge[header] = parseFloat(value) || 0;
        } else {
          edge[header] = value;
        }
      });

      edges.push(edge as StringDBEdge);

      if (!nodeMap.has(edge.stringId_A)) {
        nodeMap.set(edge.stringId_A, {
          stringId: edge.stringId_A,
          preferredName: edge.preferredName_A,
          ncbiTaxonId: edge.ncbiTaxonId,
          taxonName: '',
          annotation: ''
        });
      }

      if (!nodeMap.has(edge.stringId_B)) {
        nodeMap.set(edge.stringId_B, {
          stringId: edge.stringId_B,
          preferredName: edge.preferredName_B,
          ncbiTaxonId: edge.ncbiTaxonId,
          taxonName: '',
          annotation: ''
        });
      }
    }

    return {
      nodes: Array.from(nodeMap.values()),
      edges: edges
    };
  }

  private parseInteractionPartners(tsvData: string): string[] {
    const lines = tsvData.trim().split('\n');
    if (lines.length <= 1) return [];

    const partners: string[] = [];
    for (let i = 1; i < lines.length; i++) {
      const columns = lines[i].split('\t');
      if (columns.length >= 2) {
        partners.push(columns[1]);
      }
    }

    return partners;
  }

  private parseEnrichmentResponse(tsvData: string): StringDBEnrichmentTerm[] {
    const lines = tsvData.trim().split('\n');
    if (lines.length === 0) return [];

    const headers = lines[0].split('\t');
    const terms: StringDBEnrichmentTerm[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split('\t');
      if (values.length !== headers.length) continue;

      const term: any = {};
      headers.forEach((header, index) => {
        const value = values[index];
        if (header.includes('number_of') || header === 'ncbiTaxonId') {
          term[header] = parseInt(value) || 0;
        } else if (header === 'pvalue' || header === 'fdr') {
          term[header] = parseFloat(value) || 0;
        } else {
          term[header] = value;
        }
      });

      terms.push(term as StringDBEnrichmentTerm);
    }

    return terms;
  }

  private parseResolveResponse(tsvData: string): Map<string, string> {
    const lines = tsvData.trim().split('\n');
    const mapping = new Map<string, string>();

    if (lines.length <= 1) return mapping;

    for (let i = 1; i < lines.length; i++) {
      const columns = lines[i].split('\t');
      if (columns.length >= 3) {
        const queryTerm = columns[0];
        const stringId = columns[1];
        const preferredName = columns[2];
        mapping.set(queryTerm, preferredName);
      }
    }

    return mapping;
  }

  filterEdgesByScore(
    edges: StringDBEdge[],
    scoreThresholds: Partial<{
      nscore: number;
      fscore: number;
      pscore: number;
      ascore: number;
      escore: number;
      dscore: number;
      tscore: number;
    }>
  ): StringDBEdge[] {
    const validScoreKeys = ['nscore', 'fscore', 'pscore', 'ascore', 'escore', 'dscore', 'tscore'];

    return edges.filter(edge => {
      for (const [scoreType, threshold] of Object.entries(scoreThresholds)) {
        if (validScoreKeys.includes(scoreType)) {
          const scoreValue = edge[scoreType as keyof Pick<StringDBEdge, 'nscore' | 'fscore' | 'pscore' | 'ascore' | 'escore' | 'dscore' | 'tscore'>];
          if (typeof scoreValue === 'number' && typeof threshold === 'number' && scoreValue < threshold) {
            return false;
          }
        }
      }
      return true;
    });
  }

  getImageUrl(
    identifiers: string[],
    species: number,
    networkFlavor: 'evidence' | 'confidence' | 'actions' = 'confidence',
    requiredScore: number = this.DEFAULT_SCORE
  ): string {
    const params = new HttpParams({
      fromObject: {
        identifiers: identifiers.join('\n'),
        species: species.toString(),
        network_flavor: networkFlavor,
        required_score: requiredScore.toString()
      }
    });

    return `${this.STRING_DB_BASE_URL}/image/network?${params.toString()}`;
  }

  getProteinInfo(proteinId: string): Observable<string> {
    const url = `${this.STRING_DB_CGI_URL}/showiteminfo?node=${proteinId}&noAction=1&search_string_link=1&node_type=P&referer=embedded_svg`;
    return this.http.get(url, { responseType: 'text' });
  }

  getEdgeInfo(node1: string, node2: string): Observable<string> {
    const url = `${this.STRING_DB_CGI_URL}/showedgepopup?node1=${node1}&node2=${node2}&referer=embedded_svg`;
    return this.http.get(url, { responseType: 'text' });
  }
}
