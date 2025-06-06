import {Component, Input, OnInit} from '@angular/core';
import {UntypedFormBuilder} from "@angular/forms";
import {WebService} from "../../web.service";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {DataService} from "../../data.service";
import {SettingsService} from "../../settings.service";
import {AccountsService} from "../../accounts/accounts.service";
import {UniprotService} from "../../uniprot.service";
import {CurtainEncryption} from "curtain-web-api";

@Component({
    selector: 'app-session-settings',
    templateUrl: './session-settings.component.html',
    styleUrls: ['./session-settings.component.scss'],
    standalone: false
})
export class SessionSettingsComponent implements OnInit {

  private _currretID: string = ""
  owners: any[] = []
  @Input() set currentID(value: string) {
    this._currretID = value
    this.accounts.curtainAPI.getSessionSettings(this.currentID).then((resp: any) => {
      this.data.session = resp.data
      this.accounts.curtainAPI.getOwners(this.currentID).then((data:any) => {
        this.owners = data.data["owners"]
      })
      for (const i in resp.data) {
        if (i in this.form.value) {
          this.form.controls[i].setValue(resp.data[i])
        }
      }
    })
  }
  get currentID(): string {
    return this._currretID
  }
  form = this.fb.group({
    enable: [this.data.session.enable,],
    update_content: [false,],
    temporary_link_lifetime: [1,],
    additionalOwner: ["",]
  })
  temporaryLink: string = ""
  constructor(private fb: UntypedFormBuilder, private accounts: AccountsService, private web: WebService, private modal: NgbActiveModal, private data: DataService, private settings: SettingsService, private uniprot: UniprotService ) {

  }

  ngOnInit(): void {
  }

  generateTemporarySession() {
    if (this.form.value["temporary_link_lifetime"] > 0) {
      this.accounts.curtainAPI.generateTemporarySession(this.currentID, this.form.value["temporary_link_lifetime"]).then((data:any) => {
        this.temporaryLink = location.origin + `/#/${data.data["link_id"]}&${data.data["token"]}`
      })
    }
  }

  submit() {
    const extraData: any = {
      uniprot: {
        results: this.uniprot.results,
        dataMap: this.uniprot.dataMap,
        db: this.uniprot.db,
        organism: this.uniprot.organism,
        accMap: this.uniprot.accMap,
        geneNameToPrimary: this.uniprot.geneNameToPrimary,
      },
      data: {
        accessionToPrimaryIDs: this.data.accessionToPrimaryIDs,
        primaryIDsList: this.data.primaryIDsList,
        accessionList: this.data.accessionList,
        accessionMap: this.data.accessionMap,
        genesMap: this.data.genesMap,
        allGenes: this.data.allGenes,
        dataMap: this.data.dataMap,
      }
    }
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
        annotatedMap: this.data.annotatedMap,
        extraData: extraData,
      }
    }
    const encryption: CurtainEncryption = {
      encrypted: this.settings.settings.encrypted,
      e2e: this.settings.settings.encrypted,
      publicKey: this.data.public_key,
    }

    this.accounts.curtainAPI.updateSession(payload, this.currentID, encryption).then(data => {
      this.data.session = data.data
      this.modal.dismiss()
    })
  }
  addOwner() {
    if (this.form.value["additionalOwer"] !== "") {
      this.accounts.curtainAPI.addOwner(this.currentID, this.form.value["additionalOwner"]).then((resp)=> {
        if (resp.status === 204) {
          this.accounts.curtainAPI.getOwners(this.currentID).then((data:any) => {
            this.owners = data.data["owners"]
          })
        } else {

        }
      })
    }
  }
}
