export interface FunderQuery {
  status: string;
  "message-type": string;
  "message-version": string;
  "message": {
    "items-per-page": number;
    "query": {
      "start-index": number;
      "search-terms": string;
    },
    "total-results": number;
    "items": {
      "id": string;
      "location": string;
      "name": string;
      "alt-names": string[];
      "uri": string;
      replaces: string[];
      "replace-by": string[];
      tokens: string[];
    }[]
  }
}
