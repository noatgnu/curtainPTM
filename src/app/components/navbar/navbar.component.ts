import {Component, Input, OnInit} from '@angular/core';
import {WebService} from "../../web.service";
import {DataService} from "../../data.service";
import {ScrollService} from "../../scroll.service";
import {SettingsService} from "../../settings.service";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {SampleAnnotationComponent} from "../sample-annotation/sample-annotation.component";
import {SampleOrderAndHideComponent} from "../sample-order-and-hide/sample-order-and-hide.component";
import {DataFrame, IDataFrame} from "data-forge";
import {AccountsService} from "../../accounts/accounts.service";
import {LoginModalComponent} from "../../accounts/login-modal/login-modal.component";
import {SessionSettingsComponent} from "../session-settings/session-settings.component";
import {AccountsComponent} from "../../accounts/accounts/accounts.component";

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  @Input() finished: boolean = false
  @Input() uniqueLink: string = ""
  filterModel: string = ""
  constructor(
    public web: WebService,
    public data: DataService,
    private scroll: ScrollService,
    private settings: SettingsService,
    private modal: NgbModal,
    public accounts: AccountsService) { }

  ngOnInit(): void {
  }

  saveSession() {
    const data: any = {
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
    this.web.putSettings(data).subscribe((data:any) => {
      if (data.body) {
        this.settings.currentID = data.body.link_id
        this.uniqueLink = location.origin +"/#/" + this.settings.currentID
      }
    })
  }

  clearSelections() {
    this.data.selected = []
    this.data.selectedGenes = []
    this.data.selectedAccessions = []
    this.data.selectedMap = {}
    this.data.selectOperationNames = []
    this.settings.settings.colorMap = {}
    this.settings.settings.textAnnotation = {}
    this.data.annotatedData = {}
    this.data.dataClear.next(true)
  }

  scrollTo() {
    let res: string[] = []
    switch (this.data.searchType) {
      case "Gene Names":
        res = this.data.getPrimaryFromGeneNames(this.filterModel)
        break
      case "Accession IDs":
        res = this.data.getPrimaryFromAcc(this.filterModel)
        break
      case "Primary IDs":
        res = [this.filterModel]
        break
    }
    if (res.length > 0) {
      const primaryIDs = res[0]
      const ind = this.data.selected.indexOf(primaryIDs)
      const newPage = ind + 1
      if (this.data.page !== newPage) {
        this.data.page = ind + 1
      }
      this.scroll.scrollToID(primaryIDs+"scrollID")
    }
  }

  openAnnotation() {
    const ref = this.modal.open(SampleAnnotationComponent, {size: "lg"})
    ref.closed.subscribe(data => {
      this.settings.settings.project = data
    })
  }
  openSampleSettings() {
    const ref = this.modal.open(SampleOrderAndHideComponent)
  }

  openLoginModal() {
    const ref = this.modal.open(LoginModalComponent)
    return ref
  }

  openSessionSettings() {
    const ref = this.modal.open(SessionSettingsComponent)
    ref.componentInstance.currentID = this.settings.currentID
  }

  openAccountModal() {
    const ref = this.modal.open(AccountsComponent)
  }
}
