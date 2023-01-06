import {Component, Input, OnInit} from '@angular/core';
import {UntypedFormBuilder} from "@angular/forms";
import {WebService} from "../../web.service";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {DataService} from "../../data.service";
import {SettingsService} from "../../settings.service";

@Component({
  selector: 'app-session-settings',
  templateUrl: './session-settings.component.html',
  styleUrls: ['./session-settings.component.scss']
})
export class SessionSettingsComponent implements OnInit {

  private _currretID: string = ""
  owners: any[] = []
  @Input() set currentID(value: string) {
    this._currretID = value
    this.web.getSessionSettings(this.currentID).subscribe((data: any) => {
      this.data.session = data
      this.web.getOwners(this.currentID).subscribe((data:any) => {
        this.owners = data["owners"]
      })
      for (const i in data) {
        if (i in this.form.value) {
          this.form.controls[i].setValue(data[i])
        }
      }
    })
  }
  get currentID(): string {
    return this._currretID
  }
  form = this.fb.group({
    enable: [true,],
    update_content: [false,],
    temporary_link_lifetime: [1,],
    additionalOwner: ["",]
  })
  temporaryLink: string = ""
  constructor(private fb: UntypedFormBuilder, private web: WebService, private modal: NgbActiveModal, private data: DataService, private settings: SettingsService ) {

  }

  ngOnInit(): void {
  }

  generateTemporarySession() {
    if (this.form.value["temporary_link_lifetime"] > 0) {
      this.web.generateTemporarySession(this.currentID, this.form.value["temporary_link_lifetime"]).subscribe((data:any) => {
        this.temporaryLink = location.origin + `/#/${data["link_id"]}&${data["token"]}`
      })
    }
  }

  submit() {
    const payload: any = {enable: this.form.value["enable"]}
    if (this.form.value["update_content"]) {
      payload["file"] = {
        raw: this.data.raw.originalFile,
        rawForm: this.data.rawForm,
        differentialForm: this.data.differentialForm,
        processed: this.data.differential.originalFile,
        settings: this.settings.settings,
        password: "",
        selections: this.data.selected,
        selectionsMap: this.data.selectedMap,
        selectionsName: this.data.selectOperationNames,
        dbIDMap: this.data.dbIDMap,
        fetchUniProt: this.data.fetchUniProt,
        annotatedData: this.data.annotatedData,
        annotatedMap: this.data.annotatedMap
      }
    }
    this.web.updateSession(payload, this.currentID).subscribe(data => {
      this.data.session = data
      this.modal.dismiss()
    })
  }
  addOwner() {
    if (this.form.value["additionalOwer"] !== "") {
      this.web.addOwner(this.currentID, this.form.value["additionalOwner"]).subscribe((resp)=> {
        if (resp.status === 204) {
          this.web.getOwners(this.currentID).subscribe((data:any) => {
            this.owners = data["owners"]
          })
        } else {

        }
      })
    }
  }
}
