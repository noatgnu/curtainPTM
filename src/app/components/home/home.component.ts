import { Component, OnInit } from '@angular/core';
import {ToastService} from "../../toast.service";
import {DataFrame, fromCSV, IDataFrame, ISeries, Series} from "data-forge";
import {DataService} from "../../data.service";
import {UniprotService} from "../../uniprot.service";
import {selectionData} from "../protein-selections/protein-selections.component";
import {WebService} from "../../web.service";
import {PtmService} from "../../ptm.service";
import {ActivatedRoute} from "@angular/router";
import {Differential} from "../../classes/differential";
import {Raw} from "../../classes/raw";
import {InputFile} from "../../classes/input-file";
import {SettingsService} from "../../settings.service";
import {Project} from "../../classes/project";
import {LoginModalComponent} from "../login-modal/login-modal.component";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {AccountsService} from "../../accounts.service";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  finished: boolean = false
  rawFiltered: IDataFrame = new DataFrame()
  differentialFiltered:  ISeries<number, IDataFrame<number, any>> = new Series()
  uniqueLink: string = ""
  filterModel: string = ""
  currentID: string = ""
  constructor(private accounts: AccountsService, private modal: NgbModal, public settings: SettingsService, private data: DataService, private route: ActivatedRoute, private toast: ToastService, private uniprot: UniprotService, private web: WebService, private ptm: PtmService) {
    this.accounts.reload()
    this.ptm.getDatabase("PSP_PHOSPHO")
    this.ptm.getDatabase("PLMD_UBI")
    this.ptm.getDatabase("CDB_CARBONYL")
    // if (location.protocol === "https:" && location.hostname === "curtainptm.proteo.info") {
    //   this.toast.show("Initialization", "Error: The webpage requires the url protocol to be http instead of https")
    // }
    this.data.dataClear.asObservable().subscribe(data => {
      if (data) {
        console.log(this.rawFiltered)
        this.rawFiltered = new DataFrame()
        this.differentialFiltered = new Series()
      }
    })

    this.route.params.subscribe(params => {
      if (params) {
        if (params["settings"] && params["settings"].length > 0) {
          const settings = params["settings"].split("&")
          let token: string = ""
          if (settings.length > 1) {
            token = settings[1]
            this.data.tempLink = true
          } else {
            this.data.tempLink = false
          }
          this.toast.show("Initialization", "Fetching data from session " + params["settings"])
          if (this.currentID !== settings[0]) {
            this.currentID = settings[0]
            this.web.postSettings(settings[0], token).subscribe(data => {
              if (data.body) {
                const a = JSON.parse(<string>data.body, this.web.reviver)
                this.restoreSettings(a).then()
              }
            },error => {
              const login = this.openLoginModal()
              login.componentInstance.loginStatus.asObservable().subscribe((data:boolean) => {
                if (data) {
                  location.reload()
                }
              })
            })
            this.web.getOwnership(settings[0]).subscribe((data:any) => {
              if (data.ownership) {
                this.accounts.is_owner = true
              } else {
                this.accounts.is_owner = false
              }
            }, error => {
              this.accounts.is_owner = false
            })
          }
        }
      }
    })
  }

  openLoginModal() {
    const ref = this.modal.open(LoginModalComponent)
    return ref
  }
  async restoreSettings(object: any) {
    if (typeof object.settings === "string") {
      object.settings = JSON.parse(object.settings)
    }
    if (/\t/.test(object.raw)) {
      // @ts-ignore
      this.data.raw = new InputFile(fromCSV(object.raw, {delimiter: "\t"}), "rawFile.txt", object.raw)
    } else {
      // @ts-ignore
      this.data.raw = new InputFile(fromCSV(object.raw), "rawFile.txt", object.raw)
    }
    if (/\t/.test(object.processed)) {
      // @ts-ignore
      this.data.differential = new InputFile(fromCSV(object.processed, {delimiter: "\t"}), "processedFile.txt", object.processed)
    } else {
      this.data.differential = new InputFile(fromCSV(object.processed), "processedFile.txt", object.processed)
    }
    if (!object.settings.volcanoPlotTitle) {
      object.settings.volcanoPlotTitle = ""
    }
    if (!object.settings.textAnnotation) {
      object.settings.textAnnotation = {}
    }
    if (!object.settings.barchartColorMap) {
      object.settings.barchartColorMap = {}
    }
    if (!object.settings.volcanoAxis) {
      object.settings.volcanoAxis = {minX: null, maxX: null, minY: null, maxY: null}
    }

    if (!object.settings.project) {
      object.settings.project = new Project()
    }
    if (!object.settings.sampleOrder) {
      object.settings.sampleOrder = {}
    }
    if (!object.settings.sampleVisible) {
      object.settings.sampleVisible = {}
    }
    if (!object.settings.conditionOrder) {
      object.settings.conditionOrder = []
    }
    if (object.settings.version) {
      if (object.settings.version === 2) {

        this.data.selected = object.selections
        this.data.selectedMap = object.selectionsMap
        this.data.selectOperationNames = object.selectionsName
        this.data.differentialForm = new Differential()
        this.data.differentialForm.restore(object.differentialForm)
        this.data.rawForm = new Raw()
        this.data.rawForm.restore(object.rawForm)
        this.data.fetchUniProt = object.fetchUniProt
        if (object.annotatedData) {
          this.data.annotatedData = object.annotatedData
        }
        if (object.annotatedMap) {
          this.data.annotatedMap = object.annotatedMap
        }
        if (object.dbIDMap) {
          this.data.dbIDMap = object.dbIDMap
        }
      }
    } else {
      console.log(object)
      if (object.selections) {
        this.data.differentialForm.accession = object.cols.accessionCol
        this.data.differentialForm.comparison = object.cols.comparisonCol
        this.data.differentialForm.foldChange = object.cols.foldChangeCol
        this.data.differentialForm.transformFC = object.cols.log2transform
        this.data.differentialForm.transformSignificant = object.cols.log10transform
        this.data.differentialForm.peptideSequence = object.cols.peptideSequenceCol
        this.data.differentialForm.position = object.cols.positionCol
        this.data.differentialForm.positionPeptide = object.cols.positionPeptideCol
        this.data.differentialForm.primaryIDs = object.cols.primaryIDComparisonCol
        this.data.rawForm.primaryIDs = object.cols.primaryIDRawCol
        this.data.rawForm.samples = object.cols.rawValueCols
        this.data.differentialForm.score = object.cols.score
        this.data.differentialForm.sequence = object.cols.sequenceCol
        this.data.differentialForm.significant = object.cols.significantCol
        const selections = Object.keys(object.highlights)
        const df = this.data.differential.df.where(r => selections.includes(r[this.data.differentialForm.primaryIDs])).bake()
        for (const r of df) {
          this.data.selected.push(r[this.data.differentialForm.primaryIDs])
          if (!this.data.selectOperationNames.includes(r[this.data.differentialForm.accession])) {
            this.data.selectOperationNames.push(r[this.data.differentialForm.accession])
          }
          if (!this.data.selectedMap[r[this.data.differentialForm.primaryIDs]]) {
            this.data.selectedMap[r[this.data.differentialForm.primaryIDs]] = {}
          }
          this.data.selectedMap[r[this.data.differentialForm.primaryIDs]][r[this.data.differentialForm.accession]] = true
        }
      }
    }
    this.settings.settings = object.settings;
    this.data.restoreTrigger.next(true)
  }

  ngOnInit(): void {
  }

  handleFinish(e: boolean) {
    this.finished = e
    if (this.finished) {
      if (this.data.selected.length > 0) {
        console.log(this.data.selected)
        this.data.finishedProcessingData.next(e)
        const differentialFiltered = this.data.currentDF.where(r => this.data.selected.includes(r[this.data.differentialForm.primaryIDs])).bake()
        for (const s of differentialFiltered) {
          this.addGeneToSelected(s);
        }
        for (const s of this.rawFiltered) {
          this.addGeneToSelected(s);
        }
        const differential = this.data.currentDF.where(r => this.data.selectedAccessions.includes(r[this.data.differentialForm.accession])).bake()
        this.differentialFiltered = differential.groupBy(r => r[this.data.differentialForm.accession]).bake()
      }
    }
  }

  private addGeneToSelected(s: any) {
    if (!this.data.selectedAccessions.includes(s[this.data.differentialForm.accession])) {
      this.data.selectedAccessions.push(s[this.data.differentialForm.accession])
      const uni = this.uniprot.getUniprotFromAcc(s[this.data.differentialForm.accession])
      if (uni) {
        if (uni["Gene Names"] !== "") {
          if (!this.data.selectedGenes.includes(uni["Gene Names"])) {
            this.data.selectedGenes.push(uni["Gene Names"])
          }
        }
      }
    }
  }

  handleSearch(e: selectionData) {
    this.data.selected = this.data.selected.concat(e.data)
    if (!this.data.selectOperationNames.includes(e.title)) {
      this.data.selectOperationNames.push(e.title)
    }
    console.log(e)
    const differentialFiltered = this.data.currentDF.where(r => e.data.includes(r[this.data.differentialForm.primaryIDs])).bake()
    for (const s of differentialFiltered) {
      if (!this.data.selectedMap[s[this.data.differentialForm.primaryIDs]]) {
        this.data.selectedMap[s[this.data.differentialForm.primaryIDs]] = {}
      }
      this.addGeneToSelected(s);
      this.data.selectedMap[s[this.data.differentialForm.primaryIDs]][e.title] = true
    }
    const differential = this.data.currentDF.where(r => this.data.selectedAccessions.includes(r[this.data.differentialForm.accession])).bake()
    const groups = differential.groupBy(r => r[this.data.differentialForm.accession]).bake()
    this.differentialFiltered = groups
    console.log(this.differentialFiltered)
    this.data.selectionUpdateTrigger.next(true)
  }
}
