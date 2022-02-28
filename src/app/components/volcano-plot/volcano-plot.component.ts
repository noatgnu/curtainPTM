import {Component, Input, OnInit} from '@angular/core';
import {DataFrame, IDataFrame} from "data-forge";
import {DataService} from "../../../services/data.service";
import {FormBuilder, FormGroup} from "@angular/forms";
import {SettingsService} from "../../../services/settings.service";

@Component({
  selector: 'app-volcano-plot',
  templateUrl: './volcano-plot.component.html',
  styleUrls: ['./volcano-plot.component.css']
})
export class VolcanoPlotComponent implements OnInit {
  form: FormGroup = this.fb.group({
    pvalueCutoff: 0.05,
    fcCutoff: 0.6,
    setBackgroundDataColor: false
  })
  _data: IDataFrame = new DataFrame()
  colorGroups: string[] = []
  @Input() set data(value: IDataFrame) {
    this._data = value
    if (value.count() > 0) {
      this.drawVolcano()
    }
  }
  layoutMaxMin: any = {
    xMin: 0, xMax: 0, yMin: 0, yMax: 0
  }
  graphData: any[] = []
  graphLayout: any = {
    height: 800, xaxis: {title: "Log2FC", range: [-1, 1]}, yaxis: {title: "-log10(p-value)", range: [-1,1]}, annotations: [],
    showlegend: true, legend: {
      orientation: 'h'
    }
  }
  constructor(private dataService: DataService, private fb: FormBuilder, private settings: SettingsService) {
    this.form = this.fb.group({
      pvalueCutoff: this.settings.settings.pCutoff,
      fcCutoff: this.settings.settings.log2FCCutoff,
      setBackgroundDataColor: this.settings.settings.backGroundColorGrey
    })

    this.dataService.selectionNotifier.asObservable().subscribe(data => {
      if (data) {
        this.drawVolcano()
      }
    })
  }

  drawVolcano() {
    const traces: any = {}
    const x = this._data.getSeries(this.dataService.cols.foldChangeCol).bake()
    this.layoutMaxMin.xMin = x.min()
    this.layoutMaxMin.xMax = x.max()
    const y = this._data.getSeries(this.dataService.cols.significantCol).bake()
    this.layoutMaxMin.yMin = y.min()
    this.layoutMaxMin.yMax = y.max()
    this.graphLayout.xaxis.range = [this.layoutMaxMin.xMin - 0.5, this.layoutMaxMin.xMax + 0.5]
    this.graphLayout.yaxis.range = [0, this.layoutMaxMin.yMax-this.layoutMaxMin.yMin/2]
    traces[""] = {
      x:[],
      y:[],
      type: "scattergl",
      mode: "markers",
      name: "background"
    }
    if (this.form.value.setBackgroundDataColor) {
      traces[""]["marker"] = {
        color: "#a4a2a2"
      }
    }
    for (const r of this._data) {
      if (this.dataService.queryMap.has(r[this.dataService.cols.accessionCol])) {
        const q = this.dataService.queryMap.get(r[this.dataService.cols.accessionCol])
        for (const c in q) {
          if (!(c in traces)) {
            traces[c] = {
              x:[],
              y:[],
              type: "scattergl",
              mode: "markers",
              name: c
            }
          }
          traces[c].x.push(r[this.dataService.cols.foldChangeCol])
          traces[c].y.push(r[this.dataService.cols.significantCol])
        }
      } else if (!(this.form.value.setBackgroundDataColor)) {
        const groups = this.significantGroup(r[this.dataService.cols.foldChangeCol], r[this.dataService.cols.significantCol])
        if (!(groups in traces)) {
          traces[groups] = {
            x:[],
            y:[],
            type: "scattergl",
            mode: "markers",
            name: groups
          }
        }
        traces[groups].x.push(r[this.dataService.cols.foldChangeCol])
        traces[groups].y.push(r[this.dataService.cols.significantCol])
      } else {
        traces[""].x.push(r[this.dataService.cols.foldChangeCol])
        traces[""].y.push(r[this.dataService.cols.significantCol])
      }
    }
    const colorGroups: string[] = []
    this.graphData = []
    for (const t in traces) {
      if (t in this.settings.settings.colorMap) {
        if (this.settings.settings.colorMap[t] !== "") {
          traces[t]["marker"] = {color: this.settings.settings.colorMap[t]}
        }
      }
      this.graphData.push(traces[t])
      if (traces[t].y.length > 0) {
        colorGroups.push(t)
      }
    }
    this.colorGroups = colorGroups
    const cutOff: any[] = []
    cutOff.push({
      type: "line",
      x0: -this.form.value.fcCutoff,
      x1: -this.form.value.fcCutoff,
      y0: 0,
      y1: this.graphLayout.yaxis.range[1],
      line:{
        color: 'rgb(21,4,4)',
        width: 1,
        dash:'dot'
      }
    })
    cutOff.push({
      type: "line",
      x0: this.form.value.fcCutoff,
      x1: this.form.value.fcCutoff,
      y0: 0,
      y1: this.graphLayout.yaxis.range[1],
      line:{
        color: 'rgb(21,4,4)',
        width: 1,
        dash:'dot'
      }
    })
    cutOff.push({
      type: "line",
      x0: this.graphLayout.xaxis.range[0] - 0.5,
      x1: this.graphLayout.xaxis.range[1] + 0.5,
      y0: -Math.log10(this.form.value.pvalueCutoff),
      y1: -Math.log10(this.form.value.pvalueCutoff),
      line:{
        color: 'rgb(21,4,4)',
        width: 1,
        dash:'dot'
      }
    })
    this.graphLayout.shapes = cutOff
    console.log(this.graphData)
  }

  ngOnInit(): void {
  }

  significantGroup(x: number, y: number) {
    const ylog = -Math.log10(this.form.value.pvalueCutoff)
    const groups: string[] = []
    if (ylog > y) {
      groups.push("P-value < " + this.form.value.pvalueCutoff)
    } else {
      groups.push("P-value >= " + this.form.value.pvalueCutoff)
    }

    if (Math.abs(x) > this.form.value.fcCutoff) {
      groups.push("FC > " + this.form.value.fcCutoff)
    } else {
      groups.push("FC <= " + this.form.value.fcCutoff)
    }

    return groups.join(";")
  }

  updateColor(event: any) {
    this.settings.settings.colorMap[event.group] = event.color
  }
}
