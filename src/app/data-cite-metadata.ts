export interface DataCiteMetadataCreator {
  "name": string,
  "affiliation": string[],
  "nameIdentifiers": string[]
}

export interface DataCiteMetadataTitle {
  "title": string
}

export interface DataCiteMetadataDate {
  "date": string,
  "dateType": string
}

export interface DataCiteMetadataCitationOverTime {
  "year": string,
  "total": number
}
export interface DataCiteMetadataType {
  ris: string,
  bibtex: string,
  citeproc: string,
  schemaOrg: string,
  resourceType: string,
  resourceTypeGeneral: string
}

export interface DataCiteMetadataRelatedIdentifiers {
  "relationType": string,
  "relatedIdentifier": string,
  "relatedIdentifierType": string
}

export interface DataCiteMetadataRight {
  "rights": string,
  "rigtsUri": string,
  "schemeUri": string,
  "rightsIdentifier": string
  "rightsIdentifierScheme": string
}

export interface DataCiteMetadataFundingReference {
  "funderName": string,
  "funderIdentifier": string,
  "funderIdentifierType": string,
  "awardNumber": string,
}

export interface DataCiteMetadataReferenceData {
  id: string,
  type: string
}

export interface DataCiteMetadataCitationData {
  id: string,
  type: string
}

export interface DataCiteMetadataConstributor {
  "name": string,
  "nameType": string,
  "givenName": string,
  "familyName": string,
  "affiliation": string[],
  "contributorType": string,
  "nameIdentifiers": string[]
}

export interface DataCiteMetadataDescription {
  "description": string,
  "descriptionType": string
}

export interface DataCiteMetadataGeoLocation {
  "geoLocationBox": {
    "westBoundLongitude": number,
    "eastBoundLongitude": number,
    "southBoundLatitude": number,
    "northBoundLatitude": number
  },
  "geoLocationPlace": string,
  "geoLocationPoint": {
    "pointLatitude": number,
    "pointLongitude": number
  }

}

export interface DataCiteMetadata {
  "data": {
    "id": string,
    "type": string,
    "attributes": {
      "doi": string,
      "prefix": string,
      "suffix": string,
      "identifiers": string[],
      "alternateIdentifiers": {
        alternateIdentifier: string,
        alternateIdentifierType: string
      }[],
      "creators": DataCiteMetadataCreator[],
      "titles": DataCiteMetadataTitle[],
      "publisher": string,
      "container": any,
      "publicationYear": number,
      "subjects": string[],
      "contributors": DataCiteMetadataConstributor[],
      "dates": DataCiteMetadataDate[],
      "language": string,
      "types": DataCiteMetadataType,
      "relatedIdentifiers": DataCiteMetadataRelatedIdentifiers[],
      "relatedItems": any[],
      "sizes": string[],
      "formats": string[],
      "version": null,
      "rightsList": DataCiteMetadataRight[],
      "descriptions": DataCiteMetadataDescription[],
      "geoLocations": DataCiteMetadataGeoLocation[],
      "fundingReferences": DataCiteMetadataFundingReference[],
      "xml": string,
      "url": string,
      "contentUrl": string|null,
      "metadataVersion": number,
      "schemaVersion": string|null,
      "source": string|null,
      "isActive": boolean,
      "state": string,
      "reason": string|null,
      "viewCount": number,
      "viewsOverTime": string[],
      "downloadCount": number,
      "downloadsOverTime": any[],
      "referenceCount": number,
      "citationCount": number,
      "citationsOverTime": DataCiteMetadataCitationOverTime[],
      "partCount": number,
      "partOfCount": number,
      "versionCount": number,
      "versionOfCount": number,
      "created": Date,
      "registered": Date,
      "published": string,
      "updated": Date
    },
    "relationships": {
      "client": {
        "data": {
          "id": string,
          "type": string
        }
      },
      "provider": {
        "data": {
          "id": string,
          "type": string
        }
      },
      "media": {
        "data": {
          "id": string,
          "type": string
        }
      },
      "references": {
        "data": DataCiteMetadataReferenceData[]
      },
      "citations": {
        "data": DataCiteMetadataCitationData[]
      },
      "parts": {
        "data": any[]
      },
      "partOf": {
        "data": any[]
      },
      "versions": {
        "data": any[]
      },
      "versionOf": {
        "data": any[]
      }
    }
  }
}
 export interface DataCiteCurtain {
  id: number,
   updated: Date,
   created: Date,
   curtain: string,
   curtain_type: string,
   doi: string,
   status: string,
   user: number,
   title: string,
   form_data: any,
   contact_email: string,
   pii_statement: string,
   lock: boolean,
   local_file?: string | null,
   public_file_url?: string | null,
   collection?: number | null
 }

export interface DataCiteCollectionSession {
  curtain_id: number;
  link_id: string;
  data_url: string;
}

export interface DataCiteCollectionMetadata {
  collection_id: number;
  collection_name: string;
  collection_description: string;
  main_session: {
    curtain_id: number | null;
    link_id: string | null;
  };
  sessions: DataCiteCollectionSession[];
}

export interface ParsedDataCiteData {
  mainSessionUrl?: string;
  alternativeSessionUrls: string[];
  collectionMetadataUrl?: string;
  collectionMetadata?: DataCiteCollectionMetadata;
}
