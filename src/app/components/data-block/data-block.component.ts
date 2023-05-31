import {Component, Input, OnInit} from '@angular/core';
import {DataFrame, IDataFrame} from "data-forge";
import {DataService} from "../../data.service";
import {UniprotService} from "../../uniprot.service";
import {BiomsaService} from "../../biomsa.service";
import {ScrollService} from "../../scroll.service";
import {SettingsService} from "../../settings.service";

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
      this.sourceMap["Experimental Data"] = this.accessionID
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
    console.log(this.accessionID)
    if (this.accessionID !== this.uni["Entry"]) {
      const res = await this.uniprot.getUniprotFasta(this.accessionID).toPromise()
      if (res) {
        this.allSequences[this.accessionID] = this.uniprot.parseFasta(res)
      }
    } else {
      this.allSequences[this.accessionID] = this.uni["Sequence"]
    }
    const unidList: any[] = []
    console.log(this.allSequences)
    for (const r of this._data) {
      console.log(r)
      console.log(this.allSequences[this.accessionID][r[this.dataService.differentialForm.position]-1])
      unidList.push({
        position: r[this.dataService.differentialForm.position],
        residue: this.allSequences[this.accessionID][r[this.dataService.differentialForm.position]-1],
        id: r[this.dataService.differentialForm.primaryIDs],
        score: r[this.dataService.differentialForm.score],
        significant: (r[this.dataService.differentialForm.significant] >= -Math.log10(this.settingsService.settings.pCutoff)) &&
          (Math.abs(r[this.dataService.differentialForm.foldChange]) > this.settingsService.settings.log2FCCutoff),
      })
    }
    this.unidList = unidList
    console.log(unidList)
  }
  accessionID: string = ""
  constructor(public dataService: DataService, private uniprot: UniprotService, private scroll: ScrollService, private settingsService: SettingsService) { }

  ngOnInit(): void {
  }



  scrollTop(toggleUID: string) {
    if (toggleUID !== "") {
      this.toggled = ""
      this.toggled = toggleUID
    }
    this.scroll.scrollToID("volcanoNcyto")
  }
}
