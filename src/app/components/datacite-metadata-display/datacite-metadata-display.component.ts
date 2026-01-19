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
  @Input() set metadata(value: DataCiteMetadata|undefined) {
    this._metadata = value
    let authors: string[] = []
    let contributors: string[] = []
    if (this._metadata) {
      if (this._metadata.data.attributes.contributors.length > 0) {
        contributors = this._metadata.data.attributes.contributors.map((a) => {
          return a.name
        })
      }
      if (this._metadata.data.attributes.creators.length > 0) {
        authors = this._metadata.data.attributes.creators.map((a) => {
          return a.name
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

  @Output() clickDownload: EventEmitter<string> = new EventEmitter<string>()
  @Output() navigateToSession: EventEmitter<string> = new EventEmitter<string>()
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
