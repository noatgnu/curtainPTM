import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup} from "@angular/forms";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {SettingsService} from "../../settings.service";
import {DataService} from "../../data.service";

@Component({
  selector: 'app-data-selection-management',
  templateUrl: './data-selection-management.component.html',
  styleUrls: ['./data-selection-management.component.scss']
})
export class DataSelectionManagementComponent implements OnInit {

  selectionForms: {[key: string]: FormGroup} = {}
  selectionMap: {[key: string]: string[]} = {}
  selectOperationNames: string[] = []
  constructor(private modal: NgbActiveModal, private settings: SettingsService, public data: DataService, private fb: FormBuilder) {
    this.selectOperationNames = this.data.selectOperationNames.slice()
    for (const s of this.data.selectOperationNames) {
      this.selectionForms[s] = this.fb.group({
        enabled: [true],
        title: [s],
        markForDeletion: [false],
      })
      this.selectionMap[s] = []
    }
    for (const s in this.data.selectedMap) {
      for (const selection in this.data.selectedMap[s]) {
        this.selectionMap[selection].push(s)
      }
    }
  }

  ngOnInit(): void {
  }

  save() {
    const newList = this.data.selectOperationNames.filter(s => !this.selectionForms[s].value["markForDeletion"])
    const listRemoved = this.data.selectOperationNames.filter(s => this.selectionForms[s].value["markForDeletion"])
    for (const s of listRemoved) {
      if (this.settings.settings.colorMap[s]) {
        delete this.settings.settings.colorMap[s]
      }
    }
    for (const sel in this.data.selectedMap) {
      listRemoved.forEach((s:string) => {
        if (this.data.selectedMap[sel][s]) {
          delete this.data.selectedMap[sel][s]
        }
      })

      if (Object.keys(this.data.selectedMap[sel]).length === 0) {
        delete this.data.selectedMap[sel]
      } else {
        for (const s in this.data.selectedMap[sel]) {
          if (this.selectionForms[s].value["title"] !== s && this.selectionForms[s].value["title"] !== "" && this.selectionForms[s].value["title"]) {
            this.data.selectedMap[sel][this.selectionForms[s].value["title"]] = this.data.selectedMap[sel][s]
            delete this.data.selectedMap[sel][s]
          }
        }
      }
    }
    const renamedList: string[] = []
    for (const s of newList) {
      if (this.selectionForms[s].value["title"] !== s && this.selectionForms[s].value["title"] !== "" && this.selectionForms[s].value["title"]) {
        renamedList.push(this.selectionForms[s].value["title"])
      } else {
        renamedList.push(s)
      }
    }
    this.data.selectOperationNames = renamedList
    this.data.selected = Object.keys(this.data.selectedMap)
    this.modal.close(true)
  }

  close() {
    this.modal.dismiss()
  }

}
