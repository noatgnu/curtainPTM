import { Component, OnInit } from '@angular/core';
import {UniprotService} from "../../../services/uniprot.service";
import {Event} from "@angular/router";
import {DataService} from "../../../services/data.service";
import {SettingsService} from "../../../services/settings.service";
import {WebService} from "../../../services/web.service";
import {fromCSV} from "data-forge";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  constructor(private uniprot: UniprotService, public dataService: DataService, private settings: SettingsService, private web: WebService) {
    this.web.postSettings("bf1b14ee-dac3-48e3-89bd-93e672dd28e6", "").subscribe(data => {
      if (data.body) {
        const a = JSON.parse(<string>data.body, this.web.reviver)
        this.restoreSettings(a)
      }
    })
    this.uniprot.uniprotParseStatusObserver.subscribe(data => {
      if (data) {

      }
    })
  }


  ngOnInit(): void {
  }

  handleRes(e: any[], selectionTitle: string = "Selected") {
    for (const i of e) {
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
    }
    console.log(this.dataService.queryMap)
    this.dataService.selectionNotifier.next(true)
  }

  saveSession() {
    const data: any = {
      raw: this.dataService.rawDataFile.data.toCSV(),
      cols: this.dataService.cols,
      processed: this.dataService.dataFile.data.toCSV(),
      settings: this.settings.settings,
      password: "",
      selections: this.dataService.queryProtein,
      selectionsMap: this.dataService.queryMap
    }
    this.web.putSettings(data).subscribe(data => {
      if (data.body) {
        this.settings.currentID = data.body
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
    this.dataService.restoreTrigger.next(true)
  }
}
