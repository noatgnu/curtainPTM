import {Component, EventEmitter, Input, Output} from '@angular/core';
import {DataCiteMetadata, ParsedDataCiteData} from "../../data-cite-metadata";
import {DataciteCitationComponent} from "./datacite-citation/datacite-citation.component";
import {NgbModal, NgbTooltip} from "@ng-bootstrap/ng-bootstrap";
import {QuillViewComponent} from "ngx-quill";

@Component({
  selector: 'app-datacite-metadata-display',
  imports: [
    NgbTooltip,
    QuillViewComponent
  ],
  templateUrl: './datacite-metadata-display.component.html',
  styleUrl: './datacite-metadata-display.component.scss'
})
export class DataciteMetadataDisplayComponent {
  private _metadata: DataCiteMetadata|undefined
  contributorsString: string = ""
  getDisplayName(person: any): string {
    if (person.name) {
      return person.name;
    }
    const family = person.familyName || "";
    const given = person.givenName || "";
    if (family && given) {
      return `${family}, ${given}`;
    }
    return family || given || "";
  }

  getAffiliationsString(person: any): string {
    if (!person.affiliation || person.affiliation.length === 0) {
      return "No affiliation";
    }
    return person.affiliation.map((aff: any) => aff.name).join(", ");
  }

  @Input() set metadata(value: DataCiteMetadata|undefined) {
    this._metadata = value
    let authors: string[] = []
    let contributors: string[] = []
    if (this._metadata) {
      if (this._metadata.data.attributes.creators) {
        for (const creator of this._metadata.data.attributes.creators) {
          if (creator.affiliation) {
            creator.affiliation = creator.affiliation.map((aff: any) => {
              if (typeof aff === 'string') {
                return { name: aff };
              }
              return aff;
            });
          }
        }
      }

      if (this._metadata.data.attributes.contributors) {
        for (const contributor of this._metadata.data.attributes.contributors) {
          if (contributor.affiliation) {
            contributor.affiliation = contributor.affiliation.map((aff: any) => {
              if (typeof aff === 'string') {
                return { name: aff };
              }
              return aff;
            });
          }
        }
      }

      if (this._metadata.data.attributes.contributors.length > 0) {
        contributors = this._metadata.data.attributes.contributors.map((a) => {
          return this.getDisplayName(a)
        })
      }
      if (this._metadata.data.attributes.creators.length > 0) {
        authors = this._metadata.data.attributes.creators.map((a) => {
          return this.getDisplayName(a)
        })
      }

      this.creatorsString = authors.join("; ")
      this.contributorsString = contributors.join("; ")
      if (this._metadata.data.relationships.media.data) {
        this.mediaID = encodeURIComponent(this._metadata.data.relationships.media.data.id)

      }
    }


  }

  @Input() parsedData: ParsedDataCiteData | undefined = undefined
  @Input() activeSessionId: string | undefined = undefined

  @Output() clickDownload: EventEmitter<string> = new EventEmitter<string>()
  @Output() navigateToSession: EventEmitter<string> = new EventEmitter<string>()

  get allSessions() {
    const sessions: any[] = [];
    const meta = this.parsedData?.collectionMetadata;
    if (meta) {
      if (meta.main_session && meta.main_session.link_id) {
        sessions.push({
          link_id: meta.main_session.link_id,
          name: (meta.main_session as any).name || this.metadata?.data.attributes.titles[0]?.title || "Main Session",
          description: (meta.main_session as any).description || "Primary Session",
          isMain: true
        });
      }
      if (meta.sessions) {
        for (const s of meta.sessions) {
          sessions.push({
            ...s,
            isMain: false
          });
        }
      }
    }
    return sessions;
  }

  creatorsString: string = ""
  get metadata(): DataCiteMetadata|undefined {
    return this._metadata
  }

  mediaID: string = ""

  constructor(private modal: NgbModal) { }

  openCitation() {
    const ref = this.modal.open(DataciteCitationComponent, {size: "lg"})
    ref.componentInstance.doi = this._metadata?.data.relationships.media.data.id
  }

}
