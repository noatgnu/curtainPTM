import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {DataFrame, IDataFrame} from "data-forge";
import {DataService} from "../../data.service";
import {SettingsService} from "../../settings.service";
//import {ContextMenuComponent} from "ngx-contextmenu";

@Component({
  selector: 'app-raw-data',
  templateUrl: './raw-data.component.html',
  styleUrls: ['./raw-data.component.scss']
})
export class RawDataComponent implements OnInit {
  _data: any[] = []
  unidList: string[] = []
  positionMap: any = {}
  differentialData: IDataFrame = new DataFrame()
  barChartState: any = {}
  rawDataMap: any = {}
  //@ViewChild(ContextMenuComponent)
  //public basicMenu!: ContextMenuComponent;
  @Input() set data(value: any[]) {
    this._data = value
    this._data.forEach(u => {
      this.unidList.push(u.id)
      this.positionMap[u.id] = u
      this.barChartState[u.id] = false
      this.annotateMap[u.id] = false
      this.profilePlotMap[u.id] = false
      for (const i in this.settings.settings.textAnnotation) {
        if (this.settings.settings.textAnnotation[i].primary_id === u.id) {
          this.annotateMap[u.id] = true
          break
        }
      }
      if (this.settings.settings.selectedComparison.includes(u.id)) {
        this.profilePlotMap[u.id] = true
      }
    })
    this.differentialData = this.dataService.currentDF.where(r => this.unidList.includes(r[this.dataService.differentialForm.primaryIDs])).bake()
    const rawData = this.dataService.raw.df.where(r => this.unidList.includes(r[this.dataService.rawForm.primaryIDs])).bake()
    rawData.forEach(row => this.rawDataMap[row[this.dataService.rawForm.primaryIDs]] = row)
  }

  @Input() set toggle(value: string) {
    if (value !== "") {
      this.annotateMap[value] = !this.annotateMap[value]
      console.log(this.annotateMap[value])
      this.annotate(value)
    }
  }
  sortReverse: any = {}

  get data(): any[] {
    return this._data
  }
  annotateMap: any = {}
  profilePlotMap: any = {}
  constructor(public dataService: DataService, private settings: SettingsService) {
    this.dataService.batchAnnotateAnnoucement.subscribe((data: any) => {
      for (const i of data.id) {
        if (i in this.annotateMap) {
          this.annotateMap[i] = !data.remove
        }
      }
    })
  }

  ngOnInit(): void {
  }

  sortHeader(headerName: string) {
    if (!(headerName in this.sortReverse)) {
      this.sortReverse[headerName] = false
    }

    if (this.sortReverse[headerName]) {
      this.differentialData = this.differentialData.orderBy(row => row[headerName]).bake()
    } else {
      this.differentialData = this.differentialData.orderByDescending(row => row[headerName]).bake()
    }

    this.sortReverse[headerName] = !this.sortReverse[headerName]
  }

  viewBarChartToggle(unid: string) {
    this.barChartState[unid] = !this.barChartState[unid]
  }

  annotate(uid: string) {
    let remove = false
    if (!this.annotateMap[uid]) {
      remove = true
    }
    this.dataService.annotationService.next({
      id: uid,
      remove: remove
    })
    this.dataService.annotatedMap[uid] = this.annotateMap[uid]
  }

  profilePlotToggle(uid: string) {
    if (this.settings.settings.selectedComparison.includes(uid)) {
      this.settings.settings.selectedComparison = this.settings.settings.selectedComparison.filter(u => u !== uid)
    } else {
      this.settings.settings.selectedComparison.push(uid)
    }
  }
}
