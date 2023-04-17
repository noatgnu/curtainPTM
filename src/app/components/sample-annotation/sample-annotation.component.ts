import { Component, OnInit } from '@angular/core';
import {DataService} from "../../data.service";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {SettingsService} from "../../settings.service";
import {WebService} from "../../web.service";
import {Project} from "../../classes/project";
import {getPrideData} from "curtain-web-api";

@Component({
  selector: 'app-sample-annotation',
  templateUrl: './sample-annotation.component.html',
  styleUrls: ['./sample-annotation.component.scss']
})
export class SampleAnnotationComponent implements OnInit {
  samples: any[] = []

  project: Project = new Project()
  prideID: string = ""

  constructor(private data: DataService, public modal: NgbActiveModal, private settings: SettingsService, private web: WebService) {
    for (const s in this.data.sampleMap) {
      if (!this.samples.includes(this.data.sampleMap[s].condition)) {
        this.samples.push(this.data.sampleMap[s].condition)
        if (this.settings.settings.project.sampleAnnotations[this.data.sampleMap[s].condition]) {
          this.project.sampleAnnotations[this.data.sampleMap[s].condition] = this.settings.settings.project.sampleAnnotations[this.data.sampleMap[s].condition].slice()
        } else {
          this.project.sampleAnnotations[this.data.sampleMap[s].condition] = this.data.sampleMap[s].condition
        }
      }
    }


  }

  ngOnInit(): void {
  }

  getPride() {
    getPrideData(this.prideID).then(data => {
      for (const i in data.data) {
        switch (i) {
          case "affiliations":
            const affiliations = []
            // @ts-ignore
            for (const v of data.data[i]) {
              affiliations.push({name: v})
            }
            // @ts-ignore
            this.project.affiliations = affiliations
            break
          case "_links":
            // @ts-ignore
            this.project[i] = data.data[i]
            if (Object.keys(this.project[i]).length>0) {
              this.project.hasLink = true
            }
            break
          default:
            // @ts-ignore
            this.project[i] = data.data[i]
            break
        }
      }
    })
  }

  addOrganism() {
    this.project.organisms.push({name: ""})
  }

  addOrganismPart() {
    this.project.organismParts.push({name: ""})
  }

  addInstruments() {
    this.project.instruments.push({cvLabel: "", name: ""})
  }

  addAffiliations() {
    this.project.affiliations.push({name: ""})
  }

  addPTMs() {
    this.project.identifiedPTMStrings.push({name: ""})
  }
}
