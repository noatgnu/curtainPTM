import { Component, OnInit } from '@angular/core';
import {DataService} from "../../data.service";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {SettingsService} from "../../settings.service";

@Component({
  selector: 'app-sample-order-and-hide',
  templateUrl: './sample-order-and-hide.component.html',
  styleUrls: ['./sample-order-and-hide.component.scss']
})
export class SampleOrderAndHideComponent implements OnInit {
  samples: any = {}
  samplesVisible: any = {}
  condition: string[] = []

  colorMap: any = {}
  constructor(public dataService: DataService, public modal: NgbActiveModal, private settings: SettingsService) {
    for (const s in dataService.sampleMap) {
      const condition = dataService.sampleMap[s].condition
      this.samplesVisible[s] = true
      if (s in this.settings.settings.sampleVisible) {
        this.samplesVisible[s] = this.settings.settings.sampleVisible[s]
      }
      if (!this.samples[condition]) {
        this.samples[condition] = []
      }
      this.samples[condition].push(s)
    }
    if (this.settings.settings.conditionOrder.length === 0) {
      for (const s in dataService.sampleMap) {
        const condition = dataService.sampleMap[s].condition
        if (!this.condition.includes(condition)) {
          this.condition.push(condition)
        }
      }
    } else {
      this.condition = this.settings.settings.conditionOrder.slice()
    }
    for (const c of this.condition) {
      if (this.settings.settings.barchartColorMap[c]) {
        this.colorMap[c] = this.settings.settings.barchartColorMap[c].slice()
      } else {
        this.colorMap[c] = this.dataService.colorMap[c].slice()
      }
    }
  }

  ngOnInit(): void {
  }

  moveUp(sample: string, condition: string) {
    const ind = this.samples[condition].indexOf(sample)
    const sampleA = this.samples[condition][ind].slice()
    if (ind !== 0) {
      const sampleB = this.samples[condition][ind-1].slice()
      this.samples[condition][ind-1] = sampleA
      this.samples[condition][ind] = sampleB
    }
  }

  moveDown(sample: string, condition: string) {
    const ind = this.samples[condition].indexOf(sample)
    const sampleA = this.samples[condition][ind].slice()
    if (ind !== (this.samples[condition].length - 1)) {
      const sampleB = this.samples[condition][ind+1].slice()
      this.samples[condition][ind+1] = sampleA
      this.samples[condition][ind] = sampleB
    }
  }

  submit() {
    this.settings.settings.sampleVisible = this.samplesVisible
    this.settings.settings.sampleOrder = this.samples
    this.settings.settings.conditionOrder = this.condition
    const sampleMap: any = {}
    for (const c of this.condition) {
      for (const s of this.settings.settings.sampleOrder[c]) {
        sampleMap[s] = this.dataService.sampleMap[s]
      }
      if (this.colorMap[c] !== this.dataService.colorMap[c]) {
        this.settings.settings.barchartColorMap[c] = this.colorMap[c].slice()
      }
    }
    this.dataService.sampleMap = sampleMap
    this.dataService.redrawTrigger.next(true)
    this.modal.close()
  }

  moveUpCondition(condition: string){
    const ind = this.condition.indexOf(condition)
    const sampleA = this.condition[ind].slice()
    if (ind !== 0) {
      const sampleB = this.condition[ind-1].slice()
      this.condition[ind-1] = sampleA
      this.condition[ind] = sampleB
    }
  }

  moveDownCondition(condition: string){
    const ind = this.condition.indexOf(condition)
    const sampleA = this.condition[ind].slice()
    if (ind !== (this.condition.length - 1)) {
      const sampleB = this.condition[ind+1].slice()
      this.condition[ind+1] = sampleA
      this.condition[ind] = sampleB
    }
  }

  check(cond: boolean) {
    for (const s in this.samplesVisible) {
      this.samplesVisible[s] = cond
    }
  }
}
