import { Component } from '@angular/core';
import {FormBuilder, FormControl, Validators} from "@angular/forms";
import {PtmService} from "../../ptm.service";
import {SettingsService} from "../../settings.service";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {DataService} from "../../data.service";

@Component({
  selector: 'app-user-ptm-import-management',
  templateUrl: './user-ptm-import-management.component.html',
  styleUrls: ['./user-ptm-import-management.component.scss']
})
export class UserPtmImportManagementComponent {
  form = this.fb.group({
    name: new FormControl<string>("", Validators.required),
    file: new FormControl<File|null>(null, Validators.required),
  })

  datasetList: string[] = []

  constructor(private fb: FormBuilder, private ptm: PtmService, private settings: SettingsService, private modal: NgbActiveModal, private dataService: DataService) {
    this.datasetList = Object.keys(this.settings.settings.customPTMData)
  }

  setPTMDataFile(e: Event) {
    if (e.target){
      const target = e.target as HTMLInputElement;
      if (target.files) {
        this.form.controls['file'].setValue(target.files[0])
      }
    }
  }

  importData() {
    if (this.form.valid) {
      if (this.form.controls['file'].value && this.form.controls['name'].value) {
        this.form.controls['file'].value.text().then((text: string) => {
          this.ptm.loadCustomPTMData(text, <string>this.form.controls['name'].value)
          this.datasetList = Object.keys(this.settings.settings.customPTMData)
        })
      }
    }
  }

  deleteDataset(dataset: string) {
    this.ptm.deleteCustomPTMData(dataset)
    for (const i in this.dataService.dbIDMap){
      if (this.dataService.dbIDMap[i][dataset]) {
        delete this.dataService.dbIDMap[i][dataset]
      }
    }
    this.datasetList = Object.keys(this.settings.settings.customPTMData)
  }

  cancel() {
    this.modal.dismiss()
  }
}
