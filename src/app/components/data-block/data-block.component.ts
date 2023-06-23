import {Component, Input, OnInit} from '@angular/core';
import {DataFrame, IDataFrame} from "data-forge";
import {DataService} from "../../data.service";
import {UniprotService} from "../../uniprot.service";
import {BiomsaService} from "../../biomsa.service";
import {ScrollService} from "../../scroll.service";
import {SettingsService} from "../../settings.service";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {VariantSelectionComponent} from "../variant-selection/variant-selection.component";

@Component({
  selector: 'app-data-block',
  templateUrl: './data-block.component.html',
  styleUrls: ['./data-block.component.scss']
})
export class DataBlockComponent implements OnInit {
  _data: IDataFrame = new DataFrame()
  uni: any = {}
  title: string = ""
  unidList: any[] = []
  active: number = 2
  sequence: string = ""
  allSequences: any = {}
  aligned: boolean = false
  sourceMap: any = {}

  toggled: string = ""

  @Input() set data(value: IDataFrame) {
    this._data = value.orderBy(r => r[this.dataService.differentialForm.position]).bake()
    if (this._data.count() > 0) {
      const first = this._data.first()
      this.accessionID = first[this.dataService.differentialForm.accession]
      this.title = this.accessionID
      this.sourceMap["Experimental Data"] = this.accessionID.slice()
      const uni = this.uniprot.getUniprotFromAcc(this.accessionID)
      if (uni) {
        this.uni = uni
        if (this.uni["Gene Names"] !== "") {
          this.title = this.uni["Gene Names"]
          this.allSequences[this.uni["Entry"]] = this.uni["Sequence"]
          this.sourceMap["UniProt"] = this.uni["Entry"]
        }
      }
      this.getSequence().then()
    }
  }

  get data(): IDataFrame {
    return this._data
  }
  async getSequence() {
    if (this.settingsService.settings.customSequences[this.accessionID] && this.settingsService.settings.customSequences[this.accessionID] !== "") {
      this.allSequences[this.sourceMap["Experimental Data"]] = this.settingsService.settings.customSequences[this.accessionID].slice()
    } else {
      if (this.settingsService.settings.variantCorrection[this.accessionID]) {
        const res = await this.uniprot.getUniprotFasta(this.settingsService.settings.variantCorrection[this.accessionID]).toPromise()
        if (res) {
          this.allSequences[this.sourceMap["Experimental Data"]] = this.uniprot.parseFasta(res)
        }
      } else {
        if (this.accessionID !== this.uni["Entry"]) {
          const res = await this.uniprot.getUniprotFasta(this.accessionID).toPromise()
          if (res) {
            this.allSequences[this.accessionID] = this.uniprot.parseFasta(res)
          }
        } else {
          this.allSequences[this.accessionID] = this.uni["Sequence"]
        }
      }
    }

    const unidList: any[] = []
    for (const r of this._data) {
      let items = {
        position: "",
        residue: "",
        id: r[this.dataService.differentialForm.primaryIDs],
        score: "",
        significant: (r[this.dataService.differentialForm.significant] >= -Math.log10(this.settingsService.settings.pCutoff)) &&
          (Math.abs(r[this.dataService.differentialForm.foldChange]) > this.settingsService.settings.log2FCCutoff),
      };

      if (this.dataService.differentialForm.position !== "" && this.dataService.differentialForm.position !== undefined) {
        items["position"] = r[this.dataService.differentialForm.position]
        items["residue"] = this.allSequences[this.accessionID][r[this.dataService.differentialForm.position]-1]
      }
      if (this.dataService.differentialForm.score !== "" && this.dataService.differentialForm.score !== undefined) {
        items["score"] = r[this.dataService.differentialForm.score]
      }

      unidList.push(items)

    }
    this.unidList = unidList
  }
  accessionID: string = ""
  constructor(private modal: NgbModal, public dataService: DataService, private uniprot: UniprotService, private scroll: ScrollService, private settingsService: SettingsService) {
    this.dataService.updateVariantCorrection.asObservable().subscribe((value) => {
      if (value) {
        if (this.settingsService.settings.variantCorrection[this.accessionID]) {
          this.sourceMap["Experimental Data"] = `${this.accessionID} (custom)`
          this.getSequence().then()
        }

      }
    })
  }

  ngOnInit(): void {
  }



  scrollTop(toggleUID: string) {
    if (toggleUID !== "") {
      this.toggled = ""
      this.toggled = toggleUID
    }
    this.scroll.scrollToID("volcanoNcyto")
  }

  openVariantSelectionModal() {
    const ref = this.modal.open(VariantSelectionComponent)
    ref.componentInstance.data = this.uni["Alternative products (isoforms)"]
    ref.closed.subscribe((result) => {
      if (result.returnToDefault) {
        if (this.settingsService.settings.variantCorrection[this.accessionID]) {
          delete this.settingsService.settings.variantCorrection[this.accessionID]
        }
        if (this.settingsService.settings.customSequences[this.accessionID]) {
          delete this.settingsService.settings.customSequences[this.accessionID]
        }
        this.sourceMap["Experimental Data"] = this.accessionID.slice()
      } else {
        if (result.sequence && result.sequence !== "") {
          this.settingsService.settings.customSequences[this.accessionID] = this.uniprot.parseFasta(result.sequence)
          this.sourceMap["Experimental Data"] = `${this.accessionID} (custom)`
        } else {
          this.settingsService.settings.variantCorrection[this.accessionID] = result.isoforms
          this.sourceMap["Experimental Data"] = result.isoforms.slice()
        }
      }
      this.getSequence().then()
    })
  }

}
