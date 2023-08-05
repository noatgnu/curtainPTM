import { Component, OnInit } from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {SettingsService} from "../../settings.service";
import {FormBuilder, FormGroup} from "@angular/forms";
import {DataService} from "../../data.service";

@Component({
  selector: 'app-sample-condition-assignment-modal',
  templateUrl: './sample-condition-assignment-modal.component.html',
  styleUrls: ['./sample-condition-assignment-modal.component.scss']
})
export class SampleConditionAssignmentModalComponent implements OnInit {
  samples: string[] = []
  formMap: {[key: string]: FormGroup} = {}
  conditions: string[] = []
  sampleMap: {[key: string]: any} = JSON.parse(JSON.stringify(this.settings.settings.sampleMap))
  constructor(private modal: NgbActiveModal, private settings: SettingsService, private fb: FormBuilder, public dataService: DataService) {
    this.samples = Object.keys(this.sampleMap)
  }

  ngOnInit(): void {
  }

  close() {
    this.modal.dismiss()
  }

  createCondition(conditionName: string) {
    this.formMap[conditionName] = this.fb.group({
      samples: [[]]
    })
    this.conditions.push(conditionName)
  }

  save() {
    const conditions: string[] = []
    for (const s in this.sampleMap) {
      if (!conditions.includes(this.sampleMap[s].condition)) {
        conditions.push(this.sampleMap[s].condition)
      }
      if (this.sampleMap[s].condition !== this.settings.settings.sampleMap[s].condition) {
        this.settings.settings.colorMap[this.sampleMap[s].condition] = this.settings.settings.colorMap[this.settings.settings.sampleMap[s].condition]
      }
    }
    this.settings.settings.sampleMap = this.sampleMap
    this.dataService.conditions = conditions.slice()
    this.dataService.redrawTrigger.next(true)
    this.modal.close()
  }

  removeCondition(conditionName: string) {
    delete this.formMap[conditionName]
    this.conditions.splice(this.conditions.indexOf(conditionName), 1)
  }
}
