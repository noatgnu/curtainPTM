export interface RORQuery {
  number_of_results: number;
  time_taken: number;
  items: RORItem[],
  meta: {
    types: {id: string, title: string, count: number}[],
    countries: {id: string, title: string, count: number}[],
    statuses: {id: string, title: string, count: number}[],
  }
}

export interface RORItem {
  id: string;
  name: string,
  email_address: string,
  ip_addresses: string[],
  established: number,
  types: string[],
  relationships: {label: string, type: string, id: string}[],
  addresses: RORAddress[],
  links: string[],
  aliases: string[],
  acronyms: string[],
  status: string,
  wikipedia_url: string,
  labels: string[],
  country: {
    country_code: string,
    country_name: string
  },
  external_ids: {
    ISNI: {
      preferred: string,
      all: string[]|string
    },
    OrgRef: {
      preferred: string,
      all: string[]|string
    },
    GRID: {
      preferred: string,
      all: string[]|string
    },
    Wikidata: {
      preferred: string,
      all: string[]|string
    },
  }
}

export interface RORAddress {
  lat: number;
  lng: number;
  state: string;
  state_code: string;
  city: string;
  [key: string]: any;
}
