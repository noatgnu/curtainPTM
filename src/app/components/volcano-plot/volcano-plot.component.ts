import {Component, ElementRef, EventEmitter, Input, OnInit, Output} from '@angular/core';
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
  @Output() selected: EventEmitter<string> = new EventEmitter<string>()
  nameToIDMap: any = {}
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
    height: 900, width: 900, xaxis: {title: "Log2FC", range: [-1, 1]}, yaxis: {title: "-log10(p-value)", range: [-1,1]}, annotations: [],
    showlegend: true, legend: {
      orientation: 'h'
    }
  }
  annotated: any[] = []
  constructor(public dataService: DataService, private fb: FormBuilder, private settings: SettingsService, private elementRef: ElementRef) {
    this.dataService.clearSelections.subscribe(data => {
      if (data) {
        this.annotated = []
        this.drawVolcano()
      }
    })

    this.dataService.annotateService.subscribe(data => {
      if (data) {
        const annotated: any[] = []
        annotated.push({
          xref: 'x',
          yref: 'y',
          x: data[dataService.cols.foldChangeCol],
          y: data[dataService.cols.significantCol],
          text: "<b>"+data["Gene names"]+ "("+ data[dataService.cols.primaryIDComparisonCol]+")"+"</b>",
          showarrow: true,
          arrowhead: 0.5,
          font: {
            size: 16,
            color: "black"
          }
        })
        this.annotated = annotated
        this.drawVolcano()
        this.elementRef.nativeElement.scrollIntoView()
      }
    })

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

  selectData(e: any) {
    if ("points" in e) {
      const unid = this.nameToIDMap[e["points"][0].text]
      this.selected.emit(unid)
    }
  }

  drawVolcano() {
    this.settings.settings.pCutoff = this.form.value.pvalueCutoff
    this.settings.settings.log2FCCutoff = this.form.value.fcCutoff
    this.settings.settings.backGroundColorGrey = this.form.value.setBackgroundDataColor
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
      text: [],
      type: "scattergl",
      mode: "markers",
      name: "background"
    }
    if (this.form.value.setBackgroundDataColor) {
      traces[""]["marker"] = {
        color: "#a4a2a2"
      }
    }

    const backgroundTraces: string[] = []

    for (const r of this._data) {
      if (this.dataService.queryMap.has(r[this.dataService.cols.accessionCol])) {
        const q = this.dataService.queryMap.get(r[this.dataService.cols.accessionCol])
        for (const c in q) {
          if (!(c in traces)) {
            traces[c] = {
              x:[],
              y:[],
              text: [],
              type: "scattergl",
              mode: "markers",
              name: c
            }
          }
          traces[c].x.push(r[this.dataService.cols.foldChangeCol])
          traces[c].y.push(r[this.dataService.cols.significantCol])
          traces[c].text.push(r["Gene names"] + "(" + r[this.dataService.cols.primaryIDComparisonCol]+ ")")
          this.nameToIDMap[r["Gene names"] + "(" + r[this.dataService.cols.primaryIDComparisonCol]+ ")"] = r[this.dataService.cols.primaryIDComparisonCol]
        }
      } else if (!(this.form.value.setBackgroundDataColor)) {
        const groups = this.significantGroup(r[this.dataService.cols.foldChangeCol], r[this.dataService.cols.significantCol])
        if (!(groups in traces)) {
          traces[groups] = {
            x:[],
            y:[],
            text: [],
            type: "scattergl",
            mode: "markers",
            name: groups
          }
          backgroundTraces.push(groups)
        }
        traces[groups].x.push(r[this.dataService.cols.foldChangeCol])
        traces[groups].y.push(r[this.dataService.cols.significantCol])
        traces[groups].text.push(r["Gene names"] + "(" + r[this.dataService.cols.primaryIDComparisonCol]+ ")")
        this.nameToIDMap[r["Gene names"] + "(" + r[this.dataService.cols.primaryIDComparisonCol]+ ")"] = r[this.dataService.cols.primaryIDComparisonCol]

      } else {
        traces[""].x.push(r[this.dataService.cols.foldChangeCol])
        traces[""].y.push(r[this.dataService.cols.significantCol])
        traces[""].text.push(r["Gene names"] + "(" + r[this.dataService.cols.primaryIDComparisonCol]+ ")")
        this.nameToIDMap[r["Gene names"] + "(" + r[this.dataService.cols.primaryIDComparisonCol]+ ")"] = r[this.dataService.cols.primaryIDComparisonCol]
      }
    }
    const colorGroups: string[] = []
    this.graphData = []
    for (const b of backgroundTraces) {
      if (traces[b]) {
        if (this.settings.settings.colorMap[b]) {
          if (this.settings.settings.colorMap[b] !== "") {
            traces[b]["marker"] = {color: this.settings.settings.colorMap[b]}
          }
        }
        this.graphData.push(traces[b])
        if (traces[b].y.length > 0) {
          colorGroups.push(b)
        }
      }
    }
    for (const t in traces) {
      if (!backgroundTraces.includes(t)) {
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
    this.graphLayout.annotations = this.annotated
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
