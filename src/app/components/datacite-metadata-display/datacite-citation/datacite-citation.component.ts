import {Component, Input, OnInit} from '@angular/core';
// @ts-ignore
import * as citation from "@citation-js/core";
// @ts-ignore
import '@citation-js/plugin-doi';
// @ts-ignore
import '@citation-js/plugin-csl';
// @ts-ignore
import '@citation-js/plugin-ris';
import {FormsModule} from "@angular/forms";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-datacite-citation',
  imports: [
    FormsModule
  ],
  templateUrl: './datacite-citation.component.html',
  styleUrl: './datacite-citation.component.scss'
})
export class DataciteCitationComponent implements OnInit {
  private _doi: string = ""
  templates: string[] = ["apa", "harvard1", "vancouver"]
  private _template: string = "apa"
  set template(value: string) {
    this._template = value
    this.fetchCitation().then()
  }

  get template(): string {
    return this._template
  }

  lang: string = "en-US"

  data: string = ""

  @Input() set doi(value: string) {
    this._doi = value
    if (value) {
      if (value) {
        this.fetchCitation().then()
      }
    }
  }

  get doi(): string {
    return this._doi
  }

  constructor(private modal: NgbActiveModal) {

  }

  ngOnInit() {
    console.log(citation.Cite)
  }

  async fetchCitation() {
    console.log(this._doi)
    console.log(this.template)
    try {
      const cite = new citation.Cite(this._doi)
      console.log(cite)
      let output = cite.format('bibliography', {
        format: 'html',
        template: this.template,
        lang: this.lang
      })
      this.data = output
      console.log(output)
    } catch (error) {
      console.error("Error formatting citation:", error)
    }
  }

  exportCitation() {
    const cite = new citation.Cite(this._doi)
    let output = cite.format('ris', {
      format: 'text',
      template: this.template,
      lang: this.lang
    })
    console.log(output)
    //download output as .ris file
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(output));
    element.setAttribute('download', "citation.ris");
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  close() {
    this.modal.close()
  }

}
