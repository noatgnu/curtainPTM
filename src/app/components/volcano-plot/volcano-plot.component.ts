import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {DataFrame, fromCSV, IDataFrame} from "data-forge";
import {DataService} from "../../data.service";
import {UniprotService} from "../../uniprot.service";
import {SettingsService} from "../../settings.service";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {FdrCurveComponent} from "../fdr-curve/fdr-curve.component";
import {VolcanoColorsComponent} from "../volcano-colors/volcano-colors.component";
import {selectionData} from "../protein-selections/protein-selections.component";
import {WebService} from "../../web.service";

@Component({
  selector: 'app-volcano-plot',
  templateUrl: './volcano-plot.component.html',
  styleUrls: ['./volcano-plot.component.scss']
})
export class VolcanoPlotComponent implements OnInit {
  @Output() selected: EventEmitter<selectionData> = new EventEmitter<selectionData>()
  _data: any;
  nameToID: any = {}
  graphData: any[] = []
  graphLayout: any = {
    height: 700, width: "100%", xaxis: {title: "Log2FC"},
    yaxis: {title: "-log10(p-value)"},
    annotations: [],
    showlegend: true, legend: {
      orientation: 'h'
    }
  }

  layoutMaxMin: any = {
    xMin: 0, xMax: 0, yMin: 0, yMax: 0
  }

  annotated: any = {}



  @Input() set data(value: IDataFrame) {
    this._data = value
    console.log(value)
    if (this._data.count()) {
      console.log(this._data.getSeries(this.dataService.differentialForm.significant).bake())
      this.drawVolcano();
    }
  }

  breakColor: boolean = false

  drawVolcano() {
    let currentColors: string[] = []
    if (this.settings.settings.colorMap) {
      currentColors = Object.values(this.settings.settings.colorMap)
    } else {
      this.settings.settings.colorMap = {}
    }
    let currentPosition = 0
    let fdrCurve: IDataFrame = new DataFrame()
    if (this.settings.settings.fdrCurveTextEnable) {
      if (this.settings.settings.fdrCurveText !== "") {
        fdrCurve = fromCSV(this.settings.settings.fdrCurveText)
      }
    }
    const temp: any = {}

    for (const s of this.dataService.selectOperationNames) {
      if (!this.settings.settings.colorMap[s]) {
        while (true) {
          if (this.breakColor) {
            this.settings.settings.colorMap[s] = this.dataService.defaultColorList[currentPosition]
            break
          }
          if (currentColors.indexOf(this.dataService.defaultColorList[currentPosition]) !== -1) {
            currentPosition ++
          } else if (currentPosition !== this.dataService.defaultColorList.length) {
            this.settings.settings.colorMap[s] = this.dataService.defaultColorList[currentPosition]
            break
          } else {
            this.breakColor = true
            currentPosition = 0
          }
        }

        currentPosition ++
        if (currentPosition === this.dataService.defaultColorList.length) {
          currentPosition = 0
        }
      }

      temp[s] = {
        x: [],
        y: [],
        text: [],
        type: "scattergl",
        mode: "markers",
        name: s,
        marker: {
          color: this.settings.settings.colorMap[s]
        }
      }

    }
    this.layoutMaxMin = {
      xMin: 0, xMax: 0, yMin: 0, yMax: 0
    }

    this.layoutMaxMin.xMin = this.dataService.minMax.fcMin
    this.layoutMaxMin.xMax = this.dataService.minMax.fcMax
    this.layoutMaxMin.yMin = this.dataService.minMax.pMin
    this.layoutMaxMin.yMax = this.dataService.minMax.pMax
    this.graphLayout.xaxis.range = [this.layoutMaxMin.xMin - 0.5, this.layoutMaxMin.xMax + 0.5]
    this.graphLayout.yaxis.range = [0, this.layoutMaxMin.yMax - this.layoutMaxMin.yMin / 2]
    temp["Background"] = {
      x:[],
      y:[],
      text: [],
      type: "scattergl",
      mode: "markers",
      name: "Background"
    }
    if (this.settings.settings.backGroundColorGrey) {
      temp["Background"]["marker"] = {
        color: "#a4a2a2",
        opacity: 0.3,
      }
    }
    for (const r of this._data) {
      let geneNames = ""
      const x = r[this.dataService.differentialForm.foldChange]
      const y = r[this.dataService.differentialForm.significant]
      const primaryID = r[this.dataService.differentialForm.primaryIDs]
      const accID = r[this.dataService.differentialForm.accession]
      let text = primaryID
      if (this.dataService.fetchUniProt) {
        const r = this.uniprot.getUniprotFromAcc(accID)
        if (r) {
          geneNames = r["Gene Names"]
        }
      } else {
        if (this.dataService.differentialForm.geneNames !== "") {
          geneNames = r[this.dataService.differentialForm.geneNames]
        }
      }
      if (geneNames !== "") {
        text = geneNames + "(" + primaryID + ")"
      }
      this.nameToID[text] = primaryID
      if (this.dataService.selectedMap[primaryID]) {
        for (const o in this.dataService.selectedMap[primaryID]) {
          temp[o].x.push(x)
          temp[o].y.push(y)
          temp[o].text.push(text)
        }
      } else if (this.settings.settings.backGroundColorGrey) {
        temp["Background"].x.push(x)
        temp["Background"].y.push(y)
        temp["Background"].text.push(text)
      } else {
        const group = this.dataService.significantGroup(x, y)
        if (!temp[group]) {
          if (!this.settings.settings.colorMap[group]) {
            this.settings.settings.colorMap[group] = this.dataService.defaultColorList[currentPosition]
            currentPosition ++
            if (currentPosition === this.dataService.defaultColorList.length) {
              currentPosition = 0
            }
          }

          temp[group] = {
            x: [],
            y: [],
            text: [],
            type: "scattergl",
            mode: "markers",
            marker: {
              color: this.settings.settings.colorMap[group],
            },
            name: group
          }
        }
        temp[group].x.push(x)
        temp[group].y.push(y)
        temp[group].text.push(text)
      }
    }
    console.log(temp)
    const graphData: any[] = []
    for (const t in temp) {
      if (temp[t].x.length > 0) {
        graphData.push(temp[t])
      }
    }
    if (fdrCurve.count() > 0) {
      if (this.graphLayout.xaxis.range === undefined) {
        this.graphLayout.xaxis.range = [this.layoutMaxMin.xMin - 0.5, this.layoutMaxMin.xMax + 0.5]
        this.graphLayout.xaxis.autoscale = true
        this.graphLayout.yaxis.range = [0, -Math.log10(this.layoutMaxMin.yMin - this.layoutMaxMin.yMin/2)]
        this.graphLayout.yaxis.autoscale = true
      }
      const left: IDataFrame = fdrCurve.where(row => row.x < 0).bake()
      const right: IDataFrame = fdrCurve.where(row => row.x >= 0).bake()
      const fdrLeft: any = {
        x: [],
        y: [],
        hoverinfo: 'skip',
        showlegend: false,
        mode: 'lines',
        line:{
          color: 'rgb(103,102,102)',
          width: 0.5,
          dash:'dot'
        },
        name: "Left Curve"
      }
      const fdrRight: any = {
        x: [],
        y: [],
        hoverinfo: 'skip',
        showlegend: false,
        mode: 'lines',
        line:{
          color: 'rgb(103,102,102)',
          width: 0.5,
          dash:'dot'
        },
        name: "Right Curve"
      }
      for (const l of left) {
        if (l.x < this.graphLayout.xaxis.range[0]) {
          this.graphLayout.xaxis.range[0] = l.x
        }
        if (l.y > this.graphLayout.yaxis.range[1]) {
          this.graphLayout.yaxis.range[1] = l.y
        }
        fdrLeft.x.push(l.x)
        fdrLeft.y.push(l.y)
      }
      for (const l of right) {
        if (l.x < this.graphLayout.xaxis.range[0]) {
          this.graphLayout.xaxis.range[0] = l.x
        }
        if (l.y > this.graphLayout.yaxis.range[1]) {
          this.graphLayout.yaxis.range[1] = l.y
        }
        fdrRight.x.push(l.x)
        fdrRight.y.push(l.y)
      }
      graphData.push(fdrLeft)
      graphData.push(fdrRight)
      this.graphLayout.xaxis.autorange = true
      this.graphLayout.yaxis.autorange = true
    } else {
      const cutOff: any[] = []
      cutOff.push({
        type: "line",
        x0: -this.settings.settings.log2FCCutoff,
        x1: -this.settings.settings.log2FCCutoff,
        y0: 0,
        y1: this.graphLayout.yaxis.range[1],
        line: {
          color: 'rgb(21,4,4)',
          width: 1,
          dash: 'dot'
        }
      })
      cutOff.push({
        type: "line",
        x0: this.settings.settings.log2FCCutoff,
        x1: this.settings.settings.log2FCCutoff,
        y0: 0,
        y1: this.graphLayout.yaxis.range[1],
        line: {
          color: 'rgb(21,4,4)',
          width: 1,
          dash: 'dot'
        }
      })

      cutOff.push({
        type: "line",
        x0: this.layoutMaxMin.xMin - 1,
        x1: this.layoutMaxMin.xMax + 1,
        y0: -Math.log10(this.settings.settings.pCutoff),
        y1: -Math.log10(this.settings.settings.pCutoff),
        line: {
          color: 'rgb(21,4,4)',
          width: 1,
          dash: 'dot'
        }
      })

      this.graphLayout.shapes = cutOff
    }
    this.graphData = graphData.reverse()
    this.removeAnnotatedDataPoints([])
  }

  constructor(private web: WebService, private dataService: DataService, private uniprot: UniprotService, public settings: SettingsService, private modal: NgbModal) {
    this.annotated = this.dataService.annotatedData
    this.dataService.selectionUpdateTrigger.asObservable().subscribe(data => {
      if (data) {
        this.drawVolcano()
      }
    })
    this.dataService.annotationService.asObservable().subscribe(data => {
      console.log(data)
      if (data) {
        if (data.remove) {
          this.removeAnnotatedDataPoints([data.id])
        } else {
          this.annotateDataPoints([data.id])
        }
        console.log(this.annotated)
        this.dataService.annotatedData = this.annotated
      }
    })
  }

  ngOnInit(): void {
  }

  selectData(e: any) {
    if ("points" in e) {
      const selected: string[] = []
      for (const p of e["points"]) {
        if (this.nameToID[p.text] !== "") {
          selected.push(this.nameToID[p.text])
        }
      }
      if (selected.length === 1) {
        this.selected.emit(
          {
            data: selected,
            title: e["points"][0].text
          }
        )
      } else {
        this.selected.emit(
          {
            data: selected,
            title: "Selected " + selected.length + " data points."
          }
        )
      }

    }
  }

  FDRCurveSettings() {
    this.modal.open(FdrCurveComponent)
  }

  openCustomColor() {
    this.modal.open(VolcanoColorsComponent)
  }

  annotateDataPoints(data: string[]) {
    const annotations: any[] = []
    const annotatedData = this.dataService.currentDF.where(r => data.includes(r[this.dataService.differentialForm.primaryIDs])).bake()
    for (const a of annotatedData) {
      let title = a[this.dataService.differentialForm.primaryIDs]
      const uni = this.uniprot.getUniprotFromAcc(a[this.dataService.differentialForm.primaryIDs])
      if (uni) {
        if (uni["Gene Names"] !== "") {
          title = uni["Gene Names"] + "(" + title + ")"
        }
      }
      if (!this.annotated[title]) {
        const ann: any = {
          xref: 'x',
          yref: 'y',
          x: a[this.dataService.differentialForm.foldChange],
          y: a[this.dataService.differentialForm.significant],
          text: "<b>"+title+"</b>",
          showarrow: true,
          arrowhead: 0.5,
          font: {
            size: 15
          }
        }
        annotations.push(ann)
        this.annotated[title] = ann
      }
    }
    console.log(this.annotated)
    if (annotations.length > 0) {
      console.log(annotations)
      this.graphLayout.annotations = annotations.concat(this.graphLayout.annotations)
      console.log(this.graphLayout.annotations)
    }
    console.log(this.annotated)
  }

  removeAnnotatedDataPoints(data: string[]) {
    const annotatedData = this.dataService.currentDF.where(r => data.includes(r[this.dataService.differentialForm.primaryIDs])).bake()
    for (const d of annotatedData) {
      let title = d[this.dataService.differentialForm.primaryIDs]
      const uni = this.uniprot.getUniprotFromAcc(d[this.dataService.differentialForm.primaryIDs])
      if (uni) {
        if (uni["Gene Names"] !== "") {
          title = uni["Gene Names"] + "(" + title + ")"
        }
      }
      if (this.annotated[title]) {
        delete this.annotated[title]
      }
    }
    this.graphLayout.annotations = Object.values(this.annotated)
  }

  download() {
    this.web.downloadPlotlyImage('svg', 'volcano', 'volcanoPlot')
  }
}
