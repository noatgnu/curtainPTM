import { Component, OnInit } from '@angular/core';
import {UniprotService} from "../../../services/uniprot.service";
import {ActivatedRoute, Event} from "@angular/router";
import {DataService} from "../../../services/data.service";
import {SettingsService} from "../../../services/settings.service";
import {WebService} from "../../../services/web.service";
import {fromCSV} from "data-forge";
import {PspService} from "../../../services/psp.service";
import {NgbModal, NgbModalRef} from "@ng-bootstrap/ng-bootstrap";
import {AdvanceHighlightsComponent} from "../advance-highlights/advance-highlights.component";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  uniqueLink: string = ""
  unidSelection: string = ""

  constructor(private dialog: NgbModal, private psp: PspService, private uniprot: UniprotService, public dataService: DataService, public settings: SettingsService, private web: WebService, private route: ActivatedRoute) {
    this.psp.getPSP()
    this.route.params.subscribe(params => {
      if (params) {
        console.log(params)
        if (params["settings"]) {
          this.web.postSettings(params["settings"], "").subscribe(data => {
            if (data.body) {
              const a = JSON.parse(<string>data.body, this.web.reviver)
              this.restoreSettings(a)

            }
          })
        }
      }
    })
    // this.web.postSettings("bf1b14ee-dac3-48e3-89bd-93e672dd28e6", "").subscribe(data => {
    //   if (data.body) {
    //     const a = JSON.parse(<string>data.body, this.web.reviver)
    //     this.restoreSettings(a)
    //   }
    // })
    this.uniprot.uniprotParseStatusObserver.subscribe(data => {
      if (data) {

      }
    })
  }


  ngOnInit(): void {
  }

  handleRes(e: any[], selectionTitle: string = "Selected") {
    let acc = ""
    for (const i of e) {
      if (selectionTitle === "Selected") {
        selectionTitle = i["Gene names"]
      }
      if (!(this.dataService.queryMap.has(i[this.dataService.cols.accessionCol]))) {
        this.dataService.queryMap.set(i[this.dataService.cols.accessionCol], {})
        this.dataService.queryProtein.push(i[this.dataService.cols.accessionCol])
      }
      const d = this.dataService.queryMap.get(i[this.dataService.cols.accessionCol])
      if (!(selectionTitle in d)) {
        d[selectionTitle] = []
      }
      if (d) {
        d[selectionTitle].push(i[this.dataService.cols.primaryIDComparisonCol])
        this.dataService.queryMap.set(i[this.dataService.cols.accessionCol], d)
      }
      acc = i[this.dataService.cols.accessionCol]
    }
    this.dataService.selectionNotifier.next(true)
    if (acc !== "") {
      let e = this.dataService.scrollToID(acc+"scrollid");
    }

  }

  clearSelections() {
    this.dataService.queryProtein = []
    this.dataService.queryMap = new Map<string, any>()
    this.dataService.highlights = {}
    this.dataService.justSelected = ""
    this.dataService.clearSelections.next(true)
    this.dataService.pspIDMap = {}
    this.dataService.highlightMap =  {}
  }


  saveSession() {
    const data: any = {
      raw: this.dataService.rawDataFile.data.toCSV(),
      cols: this.dataService.cols,
      processed: this.dataService.dataFile.data.toCSV(),
      settings: this.settings.settings,
      password: "",
      selections: this.dataService.queryProtein,
      selectionsMap: this.dataService.queryMap,
      highlights: this.dataService.highlights,
      pspIDMap: this.dataService.pspIDMap,
      highlightMap: this.dataService.highlightMap
    }
    this.web.putSettings(data).subscribe(data => {
      if (data.body) {
        this.settings.currentID = data.body
        this.uniqueLink = location.origin +"/#/" + this.settings.currentID
      }
    })
  }

  restoreSettings(object: any) {
    for (const s of object.selections) {
      this.dataService.queryProtein.push(s)
    }
    for (const s of this.dataService.queryProtein) {
      this.dataService.queryMap.set(s, object.selectionsMap.get(s))
    }
    this.dataService.queryProtein = object.selections;
    this.settings.settings = object.settings;
    this.dataService.cols = object.cols;
    this.dataService.dataFile.data = fromCSV(object.processed)
    this.dataService.rawDataFile.data = fromCSV(object.raw)
    if (object.highlights) {
      this.dataService.highlights = object.highlights
    }
    if (object.pspIDMap) {
      this.dataService.pspIDMap = object.pspIDMap
    }
    if (object.highlightMap) {
      this.dataService.highlightMap = object.highlightMap
    }
    this.dataService.restoreTrigger.next(true)
  }

  volcanoSelection(e: string) {
    this.unidSelection = e
    this.dataService.selectionService.next({data: this.unidSelection, type: "Primary IDs"})
  }

  openAdvancedHighlight() {
    const dialogRef = this.dialog.open(AdvanceHighlightsComponent)
    dialogRef.result.then((result) => {
      if (result) {
        this.dataService.highlightMap = {}
        const rows = this.dataService.dataFile.data.where(row =>
          (Math.abs(row[this.dataService.cols.foldChangeCol]) <= result["maxfc"]) &&
          (Math.abs(row[this.dataService.cols.foldChangeCol]) >= result["minfc"]) &&
          (row[this.dataService.cols.significantCol] <= result["maxP"]) &&
          (row[this.dataService.cols.significantCol] >= result["minP"])
        ).bake()

        const proteins = rows.getSeries(this.dataService.cols.accessionCol).distinct().bake().toArray()
        this.dataService.progressBarEvent.next({event: "Find proteins with fitting filter parameters", value: 1, maxValue: 3})
        for (const r of rows) {
          this.dataService.highlightMap[r[this.dataService.cols.primaryIDComparisonCol]] = true
        }
        const rowP = this.dataService.dataFile.data.where(row => proteins.includes(row[this.dataService.cols.accessionCol])).bake()
        this.dataService.progressBarEvent.next({event: "Find IDs from the selected proteins", value: 2, maxValue: 3})
        for (const i of rowP) {
          if (i[this.dataService.cols.primaryIDComparisonCol]) {
            if (!(this.dataService.queryMap.has(i[this.dataService.cols.accessionCol]))) {
              this.dataService.queryMap.set(i[this.dataService.cols.accessionCol], {})
              this.dataService.queryProtein.push(i[this.dataService.cols.accessionCol])
            }
            const d = this.dataService.queryMap.get(i[this.dataService.cols.accessionCol])
            if (!(i["Gene names"] in d)) {
              d[i["Gene names"]] = []
            }
            if (d) {
              d[i["Gene names"]].push(i[this.dataService.cols.primaryIDComparisonCol])
              this.dataService.queryMap.set(i[this.dataService.cols.accessionCol], d)
            }
          }
        }
        this.dataService.progressBarEvent.next({event: "Processing completed!", value: 3, maxValue: 3})
      }
    }, (reason) => {
      if (reason) {
        console.log(reason)
      }
    })
  }
}
