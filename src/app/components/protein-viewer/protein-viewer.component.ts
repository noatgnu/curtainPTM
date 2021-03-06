import {Component, Input, OnDestroy, OnInit, ViewChildren} from '@angular/core';
import {DataFrame, IDataFrame} from "data-forge";
import {DataService} from "../../../services/data.service";
import {UniprotService} from "../../../services/uniprot.service";
import {FormBuilder, FormGroup} from "@angular/forms";
import {BehaviorSubject, debounceTime, distinctUntilChanged} from "rxjs";
import {SettingsService} from "../../../services/settings.service";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {SequenceLogoPromptComponent} from "../sequence-logo-prompt/sequence-logo-prompt.component";
import {SequenceLogoComponent} from "../sequence-logo/sequence-logo.component";
import {ToastService} from "../../../services/toast.service";

@Component({
  selector: 'app-protein-viewer',
  templateUrl: './protein-viewer.component.html',
  styleUrls: ['./protein-viewer.component.css']
})
export class ProteinViewerComponent implements OnInit, OnDestroy {
  _data = ""
  selectedUID: any[] = []
  df: IDataFrame = new DataFrame()
  sequence: string = ""
  descending = false
  residueMap: any = {}
  uniprotData: any = {}
  enableBar: any = {}
  averageBar: any = {}
  form: FormGroup = this.fb.group({
    probability: 0
  })
  sequenceWindows: string[] = []
  sortReverse: any = {}

  @Input() set data(value: string)  {
    if (!this.dataService.observableTriggerMap[value] && value !== "") {
      this.dataService.observableTriggerMap[value] = new BehaviorSubject<boolean>(false)
    }
    this._data = value

    if (this.settings.settings.probabilityFilterMap[this._data]) {
      this.form.setValue({
        probability: this.settings.settings.probabilityFilterMap[this._data]*100
      })
    }
    this.processData();

  }

  private processData() {
    const d = this.uniprot.getUniprotFromPrimary(this._data)
    if (!(this.settings.settings.probabilityFilterMap[this._data])) {
      this.settings.settings.probabilityFilterMap[this._data] = 0
    }
    if (d) {
      this.residueMap = {}
      const q = this.dataService.queryMap.get(this._data)
      this.sequence = d["Sequence"]
      this.uniprotData = d
      if (q) {
        this.queries = q
        this.selectedUID = []
        for (const c in this.queries) {
          for (const s of this.queries[c]) {
            if (!this.selectedUID.includes(s)) {
              this.selectedUID.push(s)
            }
          }
        }
        this.df = this.dataService.dataFile.data.where(row => (row[this.dataService.cols.accessionCol] === this._data) &&
          (row[this.dataService.cols.comparisonCol] === this.settings.settings.currentComparison)).bake()
        this.sequenceWindows = []
        this.changeDF = this.df.where(row => this.selectedUID.includes(row[this.dataService.cols.primaryIDComparisonCol]) &&
          (row[this.dataService.cols.comparisonCol] === this.settings.settings.currentComparison)).bake()
        for (const r of this.df) {
          this.averageBar[r[this.dataService.cols.primaryIDComparisonCol]] = false
          if (r[this.dataService.cols.score] >= (this.settings.settings.probabilityFilterMap[this._data])) {
            this.sequenceWindows.push(r[this.dataService.cols.sequenceCol])
            if (this.dataService.highlights[r[this.dataService.cols.primaryIDComparisonCol]]) {
              this.enableBar[r[this.dataService.cols.primaryIDComparisonCol]] = this.dataService.highlights[r[this.dataService.cols.primaryIDComparisonCol]].selected
            } else {
              this.enableBar[r[this.dataService.cols.primaryIDComparisonCol]] = false
            }

            const seq = {prefix: "", site: "", suffix: "", seq: ""}
            if (this.dataService.cols.positionPeptideCol && this.dataService.cols.peptideSequenceCol) {
              if (r[this.dataService.cols.positionPeptideCol] && r[this.dataService.cols.peptideSequenceCol]) {
                seq.site = r[this.dataService.cols.peptideSequenceCol][r[this.dataService.cols.positionPeptideCol] -1]
                seq.prefix = r[this.dataService.cols.peptideSequenceCol].slice(0, r[this.dataService.cols.positionPeptideCol] - 1)
                seq.suffix = r[this.dataService.cols.peptideSequenceCol].slice(r[this.dataService.cols.positionPeptideCol], r[this.dataService.cols.peptideSequenceCol].length)
              } else {
                seq.site = this.sequence[r[this.dataService.cols.positionCol] - 1]
              }
            } else {
              seq.site = this.sequence[r[this.dataService.cols.positionCol] - 1]
            }
            this.residueMap[r[this.dataService.cols.positionCol]] = seq
          }
        }
      }
    }
  }

  queries: any[] = []
  changeDF: IDataFrame = new DataFrame()

  get data(): string {
    return this._data
  }
  constructor(public dataService: DataService, private modal: NgbModal, private uniprot: UniprotService, private fb: FormBuilder, public settings: SettingsService, private toastService: ToastService) {

    this.form.valueChanges.pipe(debounceTime(1000), distinctUntilChanged()).subscribe(data=> {
      this.settings.settings.probabilityFilterMap[this._data] = this.form.value["probability"]/100
      this.processData()
      this.dataService.observableTriggerMap[this._data].next(true)
    })
  }

  ngOnInit(): void {
  }

  ngOnDestroy() {
    this.dataService.observableTriggerMap[this._data] = null
  }

  sortHeader(headerName: string) {
    if (!(headerName in this.sortReverse)) {
      this.sortReverse[headerName] = false
    }

    if (this.sortReverse[headerName]) {
      this.df = this.df.orderBy(row => row[headerName]).bake()
    } else {
      this.df = this.df.orderByDescending(row => row[headerName]).bake()
    }

    this.sortReverse[headerName] = !this.sortReverse[headerName]
  }

  getResidue(position: number) {
    return this.sequence[position-1]
  }

  viewBar(primaryIDs: string) {
    this.enableBar[primaryIDs] = !this.enableBar[primaryIDs]
    if (this.enableBar[primaryIDs]) {
      this.dataService.addSelected(primaryIDs)
    } else {
      this.dataService.removeSelected(primaryIDs)
    }
  }

  viewAverageBar(primaryIDs: string) {
    this.averageBar[primaryIDs] = !this.averageBar[primaryIDs]
  }

  volcanoAnnotate(r: any) {
    this.dataService.annotateService.next(r)
  }

  openLogo() {
    const dialogRef = this.modal.open(SequenceLogoPromptComponent)
    dialogRef.componentInstance.Id = this._data
    dialogRef.dismissed.subscribe(result => {
      let rows = this.dataService.dataFile.data.where(row =>
        (row[this.dataService.cols.accessionCol] === this._data) &&
        (row[this.dataService.cols.significantCol] <= result["maxP"]) &&
        (row[this.dataService.cols.significantCol] >= result["minP"]) && (row[this.dataService.cols.score] >= result["minScore"]) &&
        (row[this.dataService.cols.comparisonCol] === this.settings.settings.currentComparison)
      ).bake()
      switch (result["direction"]) {
        case "both":
          rows = rows.where(row => (Math.abs(row[this.dataService.cols.foldChangeCol]) <= result["maxfc"]) &&
            (Math.abs(row[this.dataService.cols.foldChangeCol]) >= result["minfc"])).bake()
          break
        case "left":
          rows = rows.where(row => (row[this.dataService.cols.foldChangeCol] >= -result["maxfc"]) &&
            (row[this.dataService.cols.foldChangeCol] <= -result["minfc"])).bake()
          break
        case "right":
          rows = rows.where(row => (row[this.dataService.cols.foldChangeCol] <= result["maxfc"]) &&
            (row[this.dataService.cols.foldChangeCol] >= result["minfc"])).bake()
          break
      }
      const data = rows.getSeries(this.dataService.cols.sequenceCol).bake().toArray()
      if (data.length > 0) {
        const ref = this.modal.open(SequenceLogoComponent, {size: "xl"})
        ref.componentInstance.data = {window: data[0].length, data: data, id: "SequenceLogo"}
      } else {
        this.toastService.show("Sequence Logo", "No sequence met the filtering criteria.")
      }
    })
    // this.dataService.openSequenceLogo({window: this.sequenceWindows[0].length, data: this.sequenceWindows, id: this._data+"logo"})
  }

  openNetphos(pos: number) {
    this.dataService.openNetphos(this._data, pos)
  }
}
