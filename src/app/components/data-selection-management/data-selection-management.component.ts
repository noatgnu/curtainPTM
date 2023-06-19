import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup} from "@angular/forms";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {SettingsService} from "../../settings.service";
import {DataService} from "../../data.service";
import {UniprotService} from "../../uniprot.service";
import {InputFile} from "../../classes/input-file";
import {fromCSV} from "data-forge";

@Component({
  selector: 'app-data-selection-management',
  templateUrl: './data-selection-management.component.html',
  styleUrls: ['./data-selection-management.component.scss']
})
export class DataSelectionManagementComponent implements OnInit {
  fastaFileName: string = ""
  selectionForms: {[key: string]: FormGroup} = {}
  selectionMap: {[key: string]: string[]} = {}
  selectOperationNames: string[] = []
  primaryIDForms: any = {}
  geneNameMap: {[key: string]: string} = {}
  selectionToggle: {[key:string]: boolean} = {}
  constructor(private uniprot: UniprotService, private modal: NgbActiveModal, private settings: SettingsService, public data: DataService, private fb: FormBuilder) {
    this.selectOperationNames = this.data.selectOperationNames.slice()

    for (const s of this.data.selectOperationNames) {
      this.selectionForms[s] = this.fb.group({
        enabled: [true],
        title: [s],
        markForDeletion: [false],
      })
      this.selectionMap[s] = []
      this.selectionToggle[s] = false
      this.primaryIDForms[s] = {}
    }
    const textAnnotationList: string[] = []
    for (const a in this.settings.settings.textAnnotation) {
      textAnnotationList.push(this.settings.settings.textAnnotation[a].primary_id)
    }
    for (const s in this.data.selectedMap) {
      if (this.settings.settings.fetchUniprot) {

        const uni = this.uniprot.getUniprotFromAcc(s)
        if (uni) {
          if (uni["Gene Names"] !== "") {
            this.geneNameMap[s] = uni["Gene Names"]
          }
        }
      }
      for (const selection in this.data.selectedMap[s]) {
        this.selectionMap[selection].push(s)
        const f = this.fb.group({
          annotate: [false],
          remove: [false],
        })

        if (textAnnotationList.includes(s)) {
          f.controls["annotate"].setValue(true)
        }

        f.markAsPristine()

        this.primaryIDForms[selection][s] = f
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
    const annotateList: string[] = []
    const removeAnnotateList: string[] = []

    for (const s in this.primaryIDForms) {
      if (newList.includes(s)) {
        for (const p in this.primaryIDForms[s]) {
          if (this.primaryIDForms[s][p].dirty) {
            if (this.primaryIDForms[s][p].value["remove"]) {
              delete this.data.selectedMap[p][s]
            } else {
              if (this.primaryIDForms[s][p].value["annotate"]) {
                annotateList.push(p)
              } else {
                removeAnnotateList.push(p)
              }
            }
          }
        }
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
    if (annotateList.length > 0) {
      this.data.annotationService.next({id: annotateList, remove: false})
      this.data.batchAnnotateAnnoucement.next({id: annotateList, remove: false})
    }
    if (removeAnnotateList.length > 0) {
      this.data.annotationService.next({id: removeAnnotateList, remove: true})
      this.data.batchAnnotateAnnoucement.next({id: removeAnnotateList, remove: true})
    }
    this.modal.close(true)
  }

  close() {
    this.modal.dismiss()
  }
  handleFile(e: Event) {
    if (e.target) {
      const target = e.target as HTMLInputElement;
      if (target.files) {
        const reader = new FileReader();
        this.fastaFileName = target.files[0].name
        reader.onload = (event) => {
          const loadedFile = reader.result;
          for (const {id, seq} of this.uniprot.parseMultiFasta(<string>loadedFile)) {
            this.settings.settings.customSequences[id] = seq
          }
          this.data.updateVariantCorrection.next(true)
        }
        reader.readAsText(target.files[0]);
      }
    }
  }

}
