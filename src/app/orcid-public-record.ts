interface Visibility {
  errors: any[];
  required: boolean;
  getRequiredMessage: any;
  visibility: string;
}

interface Name {
  errors: any[];
  value: string;
  required: boolean;
  getRequiredMessage: any;
}

interface Names {
  visibility: Visibility;
  errors: any[];
  givenNames: Name;
  familyName: Name;
  creditName: Name;
}

interface Date {
  errors: any[];
  month: string;
  day: string;
  year: string;
  timestamp: any;
  required: boolean;
  getRequiredMessage: any;
}

interface OtherName {
  visibility: Visibility;
  errors: any[];
  content: string;
  putCode: string;
  displayIndex: number;
  createdDate: Date;
  lastModified: Date;
  source: string;
  sourceName: string;
  assertionOriginOrcid: any;
  assertionOriginClientId: any;
  assertionOriginName: any;
}

interface OtherNames {
  errors: any[];
  otherNames: OtherName[];
  visibility: any;
}

interface Iso2Country {
  errors: any[];
  required: boolean;
  getRequiredMessage: any;
  value: string;
}

interface Address {
  visibility: Visibility;
  errors: any[];
  iso2Country: Iso2Country;
  countryName: string;
  putCode: string;
  displayIndex: number;
  createdDate: Date;
  lastModified: Date;
  source: string;
  sourceName: string;
  assertionOriginOrcid: any;
  assertionOriginClientId: any;
  assertionOriginName: any;
}

interface Countries {
  errors: any[];
  addresses: Address[];
  visibility: any;
}

interface Keyword {
  visibility: Visibility;
  errors: any[];
  putCode: string;
  content: string;
  displayIndex: number;
  createdDate: Date;
  lastModified: Date;
  source: string;
  sourceName: string;
  assertionOriginOrcid: any;
  assertionOriginClientId: any;
  assertionOriginName: any;
}

interface Keywords {
  errors: any[];
  keywords: Keyword[];
  visibility: any;
}

interface Emails {
  emails: any;
  emailDomains: any;
  errors: any[];
}

interface ExternalIdentifier {
  errors: any[];
  externalIdentifiers: any[];
  visibility: any;
}

interface Website {
  errors: any[];
  websites: any[];
  visibility: any;
}

export interface OrcidPublicRecord {
  title: string;
  displayName: string;
  names: Names;
  biography: any;
  otherNames: OtherNames;
  countries: Countries;
  keyword: Keywords;
  emails: Emails;
  externalIdentifier: ExternalIdentifier;
  website: Website;
  lastModifiedTime: number;
}
