import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {Subscription} from "rxjs";
import {DataFrame, fromCSV, IDataFrame} from "data-forge";
import {DataService} from "../../data.service";
import {UniprotService} from "../../uniprot.service";
import {SettingsService} from "../../settings.service";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {FdrCurveComponent} from "../fdr-curve/fdr-curve.component";
import {VolcanoColorsComponent} from "../volcano-colors/volcano-colors.component";
import {selectionData} from "../protein-selections/protein-selections.component";
import {WebService} from "../../web.service";
import {PlotlyThemeService} from "../../plotly-theme.service";
import {ThemeService} from "../../theme.service";
import {
  VolcanoPlotTextAnnotationComponent
} from "../volcano-plot-text-annotation/volcano-plot-text-annotation.component";
import {WebLogoComponent} from "../web-logo/web-logo.component";
import {ColorByCategoryModalComponent} from "./color-by-category-modal/color-by-category-modal.component";
import {NearbyPointsModalComponent} from "../nearby-points-modal/nearby-points-modal.component";
import {ReorderTracesModalComponent} from "./reorder-traces-modal/reorder-traces-modal.component";

export interface PlotlyMarker {
  color: string;
  size: number;
  opacity?: number;
}

export interface PlotlyTrace {
  x: number[];
  y: number[];
  text: string[];
  primaryIDs: string[];
  type: 'scatter' | 'scattergl';
  mode: string;
  name: string;
  marker?: PlotlyMarker;
  visible?: boolean | 'legendonly';
  hoverinfo?: string;
  showlegend?: boolean;
  line?: {
    color: string;
    width: number;
    dash?: string;
  };
}

export interface PlotlyAnnotation {
  xref: string;
  yref: string;
  x: number;
  y: number;
  text: string;
  showarrow: boolean;
  arrowhead?: number;
  arrowsize?: number;
  arrowwidth?: number;
  ax?: number;
  ay?: number;
  font: {
    size: number;
    color: string;
    family?: string;
  };
  annotationID?: string;
  xanchor?: string;
  yanchor?: string;
}

export interface PlotlyShape {
  type: string;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  xref?: string;
  yref?: string;
  line: {
    color: string;
    width: number;
    dash?: string;
  };
  fillcolor?: string;
  editable?: boolean;
  label?: {
    text: string;
    texttemplate: string;
    font: {
      size: number | null;
      family: string;
      color: string;
    };
  };
}

export interface AxisConfig {
  title: string | { text: string; font: { size: number; family?: string } };
  tickmode: string;
  ticklen: number;
  showgrid: boolean;
  visible: boolean;
  showticklabels?: boolean;
  zeroline?: boolean;
  range?: [number, number];
  autoscale?: boolean;
  autorange?: boolean;
  zerolinecolor?: string;
  dtick?: number;
}

export interface PlotlyLayout {
  height: number;
  width: number;
  margin: { r: number | null; l: number | null; b: number | null; t: number | null };
  xaxis: AxisConfig;
  yaxis: AxisConfig;
  annotations: PlotlyAnnotation[];
  showlegend: boolean;
  legend: {
    orientation: string;
    x?: number;
    y?: number;
  };
  title: {
    text: string;
    font: { size: number };
  };
  shapes?: PlotlyShape[];
}

export interface LayoutBounds {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

export interface PlotlyConfig {
  editable: boolean;
  toImageButtonOptions: {
    format: string;
    filename: string;
    height: number;
    width: number;
    scale: number;
    margin?: { r: number | null; l: number | null; b: number | null; t: number | null };
  };
  modeBarButtonsToAdd?: string[];
}

@Component({
    selector: 'app-volcano-plot',
    templateUrl: './volcano-plot.component.html',
    styleUrls: ['./volcano-plot.component.scss'],
    standalone: false
})
export class VolcanoPlotComponent implements OnInit, OnDestroy {
  private themeSubscription?: Subscription;
  settingsNav = "parameters"
  editMode: boolean = false
  explorerMode: boolean = false
  @Output() selected: EventEmitter<selectionData> = new EventEmitter<selectionData>()
  revision: number = 0
  isVolcanoParameterCollapsed: boolean = false
  isConditionLabelsCollapsed: boolean = true
  _data!: IDataFrame;
  graphData: PlotlyTrace[] = []
  graphLayout: PlotlyLayout = {
    height: 700, width: 700,
    margin: {r: null, l: null, b: null, t: null},
    xaxis: {
      title: "<b>Log2FC</b>",
      tickmode: "linear",
      ticklen: 5,
      showgrid: false,
      visible: true,
    },
    yaxis: {
      title: "<b>-log10(p-value)</b>",
      tickmode: "linear",
      ticklen: 5,
      showgrid: false,
      visible: true,
      showticklabels: true,
      zeroline: true,
    },
    annotations: [],
    showlegend: true, legend: {
      orientation: 'h'
    },
    title: {
      text: this.settings.settings.volcanoPlotTitle,
      font: {
        size: 24
      },
    }
  }
  config: PlotlyConfig = {
    editable: this.editMode,
    toImageButtonOptions: {
      format: 'svg',
      filename: this.graphLayout.title.text,
      height: this.graphLayout.height,
      width: this.graphLayout.width,
      scale: 1
    }
  }
  layoutMaxMin: LayoutBounds = {
    xMin: 0, xMax: 0, yMin: 0, yMax: 0
  }

  annotated: Record<string, PlotlyAnnotation> = {}



  @Input() set data(value: IDataFrame) {
    this._data = value
    if (this._data.count()) {
      this.drawVolcano();
    }
  }

  breakColor: boolean = false
  markerSize: number = 10

  specialColorMap: Record<string, string> = {}
  repeat: boolean = false
  private currentColorPosition = 0

  drawVolcano(): void {
    this.initializeSettings()
    const currentColors = this.getUsedColors()
    this.currentColorPosition = currentColors.length < this.settings.settings.defaultColorList.length
      ? currentColors.length : 0

    const fdrCurve = this.getFdrCurve()
    const traces = this.initializeTraces(currentColors)

    this.configureAxisRanges()
    this.configureAxisTitles()

    this.populateTraces(traces)
    const graphData = this.buildGraphData(traces)

    if (fdrCurve.count() > 0) {
      this.addFdrCurves(fdrCurve, graphData)
    } else {
      this.graphLayout.shapes = this.buildCutoffShapes()
    }

    this.finalizeGraphData(graphData)
    this.configureLayoutDimensions()
    this.buildConditionLabels()
    this.applyTextAnnotations()
    this.updateConfig()
    this.applyAdditionalShapes()
    this.applyLegendSettings()
    this.applyAxisTickSettings()

    this.revision++
  }

  private initializeSettings(): void {
    if (!this.settings.settings.visible) {
      this.settings.settings.visible = {}
    }
    this.settings.settings.scatterPlotMarkerSize = this.markerSize
    this.graphLayout.title.text = this.settings.settings.volcanoPlotTitle
    if (!this.settings.settings.colorMap) {
      this.settings.settings.colorMap = {}
    }
  }

  private getUsedColors(): string[] {
    const currentColors: string[] = []
    if (this.settings.settings.colorMap) {
      for (const s in this.settings.settings.colorMap) {
        if (!this.dataService.conditions.includes(s)) {
          if (this.settings.settings.colorMap[s]) {
            if (this.settings.settings.defaultColorList.includes(this.settings.settings.colorMap[s])) {
              currentColors.push(this.settings.settings.colorMap[s])
            }
          }
        }
      }
    }
    return currentColors
  }

  private getFdrCurve(): IDataFrame {
    if (this.settings.settings.fdrCurveTextEnable && this.settings.settings.fdrCurveText !== "") {
      return fromCSV(this.settings.settings.fdrCurveText)
    }
    return new DataFrame()
  }

  private assignNextColor(selectionName: string, currentColors: string[]): void {
    if (this.settings.settings.colorMap[selectionName]) return

    while (true) {
      if (this.breakColor) {
        this.settings.settings.colorMap[selectionName] = this.settings.settings.defaultColorList[this.currentColorPosition]
        break
      }
      if (currentColors.indexOf(this.settings.settings.defaultColorList[this.currentColorPosition]) !== -1) {
        this.currentColorPosition++
        if (this.repeat) {
          this.settings.settings.colorMap[selectionName] = this.settings.settings.defaultColorList[this.currentColorPosition]
          break
        }
      } else if (this.currentColorPosition >= this.settings.settings.defaultColorList.length) {
        this.currentColorPosition = 0
        this.settings.settings.colorMap[selectionName] = this.settings.settings.defaultColorList[this.currentColorPosition]
        this.repeat = true
        break
      } else if (this.currentColorPosition !== this.settings.settings.defaultColorList.length) {
        this.settings.settings.colorMap[selectionName] = this.settings.settings.defaultColorList[this.currentColorPosition]
        break
      } else {
        this.breakColor = true
        this.currentColorPosition = 0
      }
    }

    this.currentColorPosition++
    if (this.currentColorPosition === this.settings.settings.defaultColorList.length) {
      this.currentColorPosition = 0
    }
  }

  private initializeTraces(currentColors: string[]): Record<string, any> {
    const traces: Record<string, any> = {}

    for (const s of this.dataService.selectOperationNames) {
      this.assignNextColor(s, currentColors)
      traces[s] = this.createTrace(s, this.settings.settings.colorMap[s])
    }

    traces["Background"] = {
      x: [], y: [], text: [], primaryIDs: [],
      type: "scatter",
      mode: "markers",
      name: "Background"
    }

    if (this.settings.settings.backGroundColorGrey) {
      traces["Background"]["marker"] = {
        color: "#a4a2a2",
        opacity: 0.3,
        size: this.settings.settings.scatterPlotMarkerSize
      }
    }

    return traces
  }

  private createTrace(name: string, color: string): any {
    return {
      x: [], y: [], text: [], primaryIDs: [],
      type: "scatter",
      mode: "markers",
      name: name,
      marker: {
        color: color,
        size: this.settings.settings.markerSizeMap[name] || this.settings.settings.scatterPlotMarkerSize
      }
    }
  }

  private configureAxisRanges(): void {
    this.layoutMaxMin = {
      xMin: this.dataService.minMax.fcMin,
      xMax: this.dataService.minMax.fcMax,
      yMin: this.dataService.minMax.pMin,
      yMax: this.dataService.minMax.pMax
    }

    this.graphLayout.xaxis.range = [this.layoutMaxMin.xMin - 0.5, this.layoutMaxMin.xMax + 0.5]
    if (this.settings.settings.volcanoAxis.minX) {
      this.graphLayout.xaxis.range[0] = this.settings.settings.volcanoAxis.minX
    }
    if (this.settings.settings.volcanoAxis.maxX) {
      this.graphLayout.xaxis.range[1] = this.settings.settings.volcanoAxis.maxX
    }

    this.graphLayout.yaxis.range = [0, this.layoutMaxMin.yMax + this.layoutMaxMin.yMin / 10]
    if (this.settings.settings.volcanoAxis.minY) {
      this.graphLayout.yaxis.range[0] = this.settings.settings.volcanoAxis.minY
    }
    if (this.settings.settings.volcanoAxis.maxY) {
      this.graphLayout.yaxis.range[1] = this.settings.settings.volcanoAxis.maxY
    }
  }

  private configureAxisTitles(): void {
    if (this.settings.settings.volcanoAxis.x) {
      this.graphLayout.xaxis.title = {
        text: `<b>${this.settings.settings.volcanoAxis.x}</b>`,
        font: { size: 16, family: this.settings.settings.plotFontFamily }
      }
    }
    if (this.settings.settings.volcanoAxis.y) {
      this.graphLayout.yaxis.title = {
        text: `<b>${this.settings.settings.volcanoAxis.y}</b>`,
        font: { size: 16, family: this.settings.settings.plotFontFamily }
      }
    }
  }

  private buildPointLabel(row: any): string {
    const primaryID = row[this.dataService.differentialForm.primaryIDs]
    const accID = row[this.dataService.differentialForm.accession]
    let geneNames = ""

    if (this.dataService.fetchUniProt) {
      const uniprotData: any = this.uniprot.getUniprotFromAcc(accID)
      if (uniprotData) {
        geneNames = uniprotData["Gene Names"]
      }
    } else if (this.dataService.differentialForm.geneNames !== "") {
      geneNames = row[this.dataService.differentialForm.geneNames]
    }

    if (
      this.dataService.differentialForm.peptideSequence !== "" &&
      this.dataService.differentialForm.positionPeptide !== ""
    ) {
      const ptmString = this.buildPTMString(row)
      if (ptmString) {
        return `${geneNames}(${ptmString})(${primaryID})`
      }
    }

    if (geneNames !== "") {
      return `${geneNames}(${primaryID})`
    }

    return primaryID
  }

  private populateTraces(traces: Record<string, any>): void {
    for (const row of this._data) {
      const x = row[this.dataService.differentialForm.foldChange]
      const y = row[this.dataService.differentialForm.significant]
      const primaryID = row[this.dataService.differentialForm.primaryIDs]
      const text = this.buildPointLabel(row)

      if (this.dataService.selectedMap[primaryID]) {
        for (const selectionName in this.dataService.selectedMap[primaryID]) {
          this.addPointToTrace(traces[selectionName], x, y, text, primaryID)
        }
      } else if (this.settings.settings.backGroundColorGrey) {
        this.addPointToTrace(traces["Background"], x, y, text, primaryID)
      } else {
        this.addPointToSignificanceGroup(traces, row, x, y, text, primaryID)
      }
    }
  }

  private addPointToTrace(trace: any, x: number, y: number, text: string, primaryID: string): void {
    trace.x.push(x)
    trace.y.push(y)
    trace.text.push(text)
    trace.primaryIDs.push(primaryID)
  }

  private addPointToSignificanceGroup(
    traces: Record<string, any>, row: any, x: number, y: number, text: string, primaryID: string
  ): void {
    const [group, significanceKey] = this.dataService.significantGroup(x, y)

    if (!traces[group]) {
      this.ensureGroupColor(group, significanceKey)
      traces[group] = this.createTrace(group, this.settings.settings.colorMap[group])
    }

    this.addPointToTrace(traces[group], x, y, text, primaryID)
  }

  private ensureGroupColor(group: string, significanceKey: string): void {
    if (!this.settings.settings.colorMap[group]) {
      if (!this.specialColorMap[significanceKey]) {
        if (this.settings.settings.defaultColorList[this.currentColorPosition]) {
          this.specialColorMap[significanceKey] = this.settings.settings.defaultColorList[this.currentColorPosition].slice()
          this.settings.settings.colorMap[group] = this.settings.settings.defaultColorList[this.currentColorPosition].slice()
        }
      } else {
        this.settings.settings.colorMap[group] = this.specialColorMap[significanceKey].slice()
      }
      this.currentColorPosition++
      if (this.currentColorPosition === this.settings.settings.defaultColorList.length) {
        this.currentColorPosition = 0
      }
    } else {
      this.specialColorMap[significanceKey] = this.settings.settings.colorMap[group].slice()
    }
  }

  private buildGraphData(traces: Record<string, any>): any[] {
    const graphData: any[] = []
    for (const traceName in traces) {
      if (traces[traceName].x.length > 0) {
        traces[traceName].visible = this.settings.settings.visible[traceName] || true
        graphData.push(traces[traceName])
      }
    }
    return graphData
  }

  private addFdrCurves(fdrCurve: IDataFrame, graphData: any[]): void {
    if (this.graphLayout.xaxis.range === undefined) {
      this.graphLayout.xaxis.range = [this.layoutMaxMin.xMin - 0.5, this.layoutMaxMin.xMax + 0.5]
      this.graphLayout.xaxis.autoscale = true
      this.graphLayout.yaxis.range = [0, -Math.log10(this.layoutMaxMin.yMin - this.layoutMaxMin.yMin / 2)]
      this.graphLayout.yaxis.autoscale = true
    }

    const left: IDataFrame = fdrCurve.where(row => row.x < 0).bake()
    const right: IDataFrame = fdrCurve.where(row => row.x >= 0).bake()

    const fdrLeft = this.createFdrCurveTrace("Left Curve")
    const fdrRight = this.createFdrCurveTrace("Right Curve")

    this.populateFdrCurve(left, fdrLeft)
    this.populateFdrCurve(right, fdrRight)

    graphData.push(fdrLeft, fdrRight)
    this.graphLayout.xaxis.autorange = true
    this.graphLayout.yaxis.autorange = true
  }

  private createFdrCurveTrace(name: string): any {
    return {
      x: [], y: [],
      hoverinfo: 'skip',
      showlegend: false,
      mode: 'lines',
      line: { color: 'rgb(103,102,102)', width: 0.5, dash: 'dot' },
      name: name
    }
  }

  private populateFdrCurve(curveData: IDataFrame, trace: any): void {
    for (const point of curveData) {
      if (point.x < this.graphLayout.xaxis.range![0]) {
        this.graphLayout.xaxis.range![0] = point.x
      }
      if (point.y > this.graphLayout.yaxis.range![1]) {
        this.graphLayout.yaxis.range![1] = point.y
      }
      trace.x.push(point.x)
      trace.y.push(point.y)
    }
  }

  private buildCutoffShapes(): PlotlyShape[] {
    const yMax = this.graphLayout.yaxis.range![1]
    let x0 = this.settings.settings.volcanoAxis.minX
      ? this.settings.settings.volcanoAxis.minX - 1
      : this.layoutMaxMin.xMin - 1
    let x1 = this.settings.settings.volcanoAxis.maxX
      ? this.settings.settings.volcanoAxis.maxX + 1
      : this.layoutMaxMin.xMax + 1

    return [
      this.createCutoffLine(-this.settings.settings.log2FCCutoff, 0, yMax),
      this.createCutoffLine(this.settings.settings.log2FCCutoff, 0, yMax),
      this.createHorizontalCutoffLine(x0, x1, -Math.log10(this.settings.settings.pCutoff))
    ]
  }

  private createCutoffLine(xValue: number, y0: number, y1: number): PlotlyShape {
    return {
      type: "line",
      x0: xValue, x1: xValue, y0: y0, y1: y1,
      line: { color: 'rgb(21,4,4)', width: 1, dash: 'dot' }
    }
  }

  private createHorizontalCutoffLine(x0: number, x1: number, yValue: number): PlotlyShape {
    return {
      type: "line",
      x0: x0, x1: x1, y0: yValue, y1: yValue,
      line: { color: 'rgb(21,4,4)', width: 1, dash: 'dot' }
    }
  }

  private finalizeGraphData(graphData: any[]): void {
    const sortedGraphData = this.sortGraphDataByOrder(graphData)
    this.graphData = (!this.settings.settings.volcanoTraceOrder || this.settings.settings.volcanoTraceOrder.length === 0)
      ? sortedGraphData.reverse()
      : sortedGraphData

    this.graphLayout.annotations = []

    if (this.settings.settings.volcanoPlotYaxisPosition.includes("left")) {
      if (!this.graphLayout.shapes) {
        this.graphLayout.shapes = []
      }
      this.graphLayout.shapes.push({
        type: "line",
        x0: this.graphLayout.xaxis.range![0],
        x1: this.graphLayout.xaxis.range![0],
        y0: this.graphLayout.yaxis.range![0],
        y1: this.graphLayout.yaxis.range![1],
        line: { color: 'rgb(21,4,4)', width: 1 }
      })
    }
  }

  private configureLayoutDimensions(): void {
    if (this.settings.settings.volcanoPlotDimension.height) {
      this.graphLayout.height = this.settings.settings.volcanoPlotDimension.height
    }
    if (this.settings.settings.volcanoPlotDimension.width) {
      this.graphLayout.width = this.settings.settings.volcanoPlotDimension.width
    }
    if (this.settings.settings.volcanoPlotDimension.margin) {
      this.graphLayout.margin = this.settings.settings.volcanoPlotDimension.margin
    }

    this.graphLayout.xaxis.zerolinecolor = this.settings.settings.volcanoPlotYaxisPosition.includes("middle")
      ? "#000000" : "#ffffff"
  }

  private buildConditionLabels(): void {
    if (!this.settings.settings.volcanoConditionLabels.enabled) return

    const labelY = this.settings.settings.volcanoConditionLabels.yPosition
    const fontConfig = {
      size: this.settings.settings.volcanoConditionLabels.fontSize,
      family: this.settings.settings.plotFontFamily,
      color: this.settings.settings.volcanoConditionLabels.fontColor
    }

    if (this.settings.settings.volcanoConditionLabels.leftCondition) {
      this.graphLayout.annotations.push(this.createConditionLabel(
        this.settings.settings.volcanoConditionLabels.leftCondition,
        this.settings.settings.volcanoConditionLabels.leftX,
        labelY, fontConfig
      ))
    }

    if (this.settings.settings.volcanoConditionLabels.rightCondition) {
      this.graphLayout.annotations.push(this.createConditionLabel(
        this.settings.settings.volcanoConditionLabels.rightCondition,
        this.settings.settings.volcanoConditionLabels.rightX,
        labelY, fontConfig
      ))
    }

    if (this.settings.settings.volcanoConditionLabels.showBracket &&
        this.settings.settings.volcanoConditionLabels.leftCondition &&
        this.settings.settings.volcanoConditionLabels.rightCondition) {
      this.addConditionBrackets(labelY)
    }
  }

  private createConditionLabel(text: string, x: number, y: number, font: any): any {
    return {
      text: text, xref: 'paper', yref: 'paper',
      x: x, y: y, xanchor: 'center', yanchor: 'top',
      showarrow: false, font: font
    }
  }

  private addConditionBrackets(labelY: number): void {
    const bracketY = labelY + this.settings.settings.volcanoConditionLabels.bracketHeight
    const leftX = this.settings.settings.volcanoConditionLabels.leftX
    const rightX = this.settings.settings.volcanoConditionLabels.rightX
    const bracketLine = {
      color: this.settings.settings.volcanoConditionLabels.bracketColor,
      width: this.settings.settings.volcanoConditionLabels.bracketWidth
    }

    if (!this.graphLayout.shapes) {
      this.graphLayout.shapes = []
    }

    this.graphLayout.shapes.push(
      { type: 'line', xref: 'paper', yref: 'paper', x0: leftX, y0: labelY, x1: leftX, y1: bracketY, line: bracketLine },
      { type: 'line', xref: 'paper', yref: 'paper', x0: leftX, y0: bracketY, x1: rightX, y1: bracketY, line: bracketLine },
      { type: 'line', xref: 'paper', yref: 'paper', x0: rightX, y0: bracketY, x1: rightX, y1: labelY, line: bracketLine }
    )
  }

  private applyTextAnnotations(): void {
    for (const key in this.settings.settings.textAnnotation) {
      if (this.settings.settings.textAnnotation[key].showannotation === true) {
        this.annotated[this.settings.settings.textAnnotation[key].title] = this.settings.settings.textAnnotation[key].data
        this.graphLayout.annotations.push(this.settings.settings.textAnnotation[key].data)
      }
    }
  }

  private updateConfig(): void {
    this.config = {
      editable: this.editMode,
      toImageButtonOptions: {
        format: 'svg',
        filename: this.graphLayout.title.text,
        height: this.graphLayout.height,
        width: this.graphLayout.width,
        scale: 1,
        margin: this.graphLayout.margin
      },
      modeBarButtonsToAdd: ["drawline", "drawcircle", "drawrect", "eraseshape"]
    }
  }

  private applyAdditionalShapes(): void {
    if (!this.settings.settings.volcanoAdditionalShapes) return

    if (!this.graphLayout.shapes) {
      this.graphLayout.shapes = []
    }
    for (const shape of this.settings.settings.volcanoAdditionalShapes) {
      this.graphLayout.shapes.push(shape)
    }
  }

  private applyLegendSettings(): void {
    if (this.settings.settings.volcanoPlotLegendX) {
      this.graphLayout.legend.x = this.settings.settings.volcanoPlotLegendX
    }
    if (this.settings.settings.volcanoPlotLegendY) {
      this.graphLayout.legend.y = this.settings.settings.volcanoPlotLegendY
    }
  }

  private applyAxisTickSettings(): void {
    this.graphLayout.xaxis.dtick = this.settings.settings.volcanoAxis.dtickX || undefined
    this.graphLayout.yaxis.dtick = this.settings.settings.volcanoAxis.dtickY || undefined
    this.graphLayout.xaxis.ticklen = this.settings.settings.volcanoAxis.ticklenX || 5
    this.graphLayout.yaxis.ticklen = this.settings.settings.volcanoAxis.ticklenY || 5
  }

  constructor(private web: WebService, public dataService: DataService, private uniprot: UniprotService, public settings: SettingsService, private modal: NgbModal, private plotlyTheme: PlotlyThemeService, private themeService: ThemeService) {
    this.annotated = {}
    for (const i in this.settings.settings.textAnnotation) {
      if (this.settings.settings.textAnnotation[i].showannotation === undefined || this.settings.settings.textAnnotation[i].showannotation === null) {
        this.settings.settings.textAnnotation[i].showannotation = true
      }
      this.annotated[i] = this.settings.settings.textAnnotation[i]
    }

    this.dataService.resetVolcanoColor.asObservable().subscribe(data => {
      if (data) {
        this.specialColorMap = {}
      }
    })
    this.dataService.selectionUpdateTrigger.asObservable().subscribe(data => {
      if (data) {
        this.drawVolcano()
      }
    })
    this.dataService.annotationService.asObservable().subscribe(data => {
      if (data) {
        if (data.remove) {
          if (typeof data.id === "string") {
            this.removeAnnotatedDataPoints([data.id]).then(() => {
              this.dataService.annotatedData = this.annotated
            })
          } else {
            this.removeAnnotatedDataPoints(data.id).then(() => {
              this.dataService.annotatedData = this.annotated
            })
          }

        } else {
          if (typeof data.id === "string") {
            this.annotateDataPoints([data.id]).then(() => {
              this.dataService.annotatedData = this.annotated
            })
          } else {
            this.annotateDataPoints(data.id).then(() => {
              this.dataService.annotatedData = this.annotated
            })
          }

        }
      }
    })
  }

  ngOnInit(): void {
    this.themeSubscription = this.themeService.theme$.subscribe(() => {
      if (this._data && this._data.count()) {
        this.graphLayout = this.plotlyTheme.applyThemeToLayout(this.graphLayout);
        this.revision++;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
  }

  selectData(e: any) {
    if ("points" in e) {
      const selected: string[] = []
      for (const p of e["points"]) {
        selected.push(p.data.primaryIDs[p.pointNumber])
      }

      // If explorer mode is enabled and only one point is selected, open nearby points modal
      if (this.explorerMode && selected.length === 1) {
        this.openNearbyPointsModal(e);
        return;
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
    const ref = this.modal.open(VolcanoColorsComponent)
    ref.componentInstance.closed.subscribe(() => {
      this.drawVolcano()
    })
  }

  autoAdjustConditionLabels() {
    const legendY = this.settings.settings.volcanoPlotLegendY || -0.15
    const labelY = this.settings.settings.volcanoConditionLabels.yPosition

    if (legendY < 0 && labelY < 0 && Math.abs(legendY - labelY) < 0.1) {
      this.settings.settings.volcanoConditionLabels.yPosition = legendY + 0.1
      this.drawVolcano()
    }
  }

  get availableConditions(): string[] {
    const conditions = new Set<string>()
    for (const sample in this.settings.settings.sampleMap) {
      if (this.settings.settings.sampleMap[sample].condition) {
        conditions.add(this.settings.settings.sampleMap[sample].condition)
      }
    }
    return Array.from(conditions).sort()
  }

  selectLeftCondition(condition: string) {
    this.settings.settings.volcanoConditionLabels.leftCondition = condition
    this.drawVolcano()
  }

  selectRightCondition(condition: string) {
    this.settings.settings.volcanoConditionLabels.rightCondition = condition
    this.drawVolcano()
  }

  openNearbyPointsModal(clickEvent: any) {
    if (!clickEvent.points || clickEvent.points.length === 0) {
      return;
    }

    const point = clickEvent.points[0];
    const primaryId = point.data.primaryIDs[point.pointNumber];

    // Find the full data for this point
    const fullData = this.dataService.currentDF.where(r =>
      r[this.dataService.differentialForm.primaryIDs] === primaryId
    ).first();

    if (!fullData) {
      return;
    }

    // Get gene name
    let geneName = '';
    if (this.dataService.fetchUniProt) {
      const uniprotData = this.uniprot.getUniprotFromAcc(primaryId);
      if (uniprotData && uniprotData['Gene Names']) {
        geneName = uniprotData['Gene Names'];
      }
    } else if (this.dataService.differentialForm.geneNames !== '') {
      geneName = fullData[this.dataService.differentialForm.geneNames];
    }

    // Determine trace group and color for target point (same logic as nearby points)
    let targetTraceGroup = 'Background';
    let targetTraceColor = '#a4a2a2';

    if (this.dataService.selectedMap[primaryId]) {
      // For selected points, use the first group name
      for (const groupName in this.dataService.selectedMap[primaryId]) {
        targetTraceGroup = groupName;
        break;
      }
    } else if (!this.settings.settings.backGroundColorGrey) {
      const significanceGroup = this.dataService.significantGroup(
        fullData[this.dataService.differentialForm.foldChange],
        fullData[this.dataService.differentialForm.significant]
      );
      targetTraceGroup = significanceGroup[0];
    }

    // Get color from settings
    if (this.settings.settings.colorMap && this.settings.settings.colorMap[targetTraceGroup]) {
      targetTraceColor = this.settings.settings.colorMap[targetTraceGroup];
    }

    // Create target point object
    const targetPoint = {
      primaryId: primaryId,
      geneName: geneName,
      foldChange: fullData[this.dataService.differentialForm.foldChange],
      significance: fullData[this.dataService.differentialForm.significant],
      distance: 0,
      comparison: fullData[this.dataService.differentialForm.comparison] || '',
      traceGroup: targetTraceGroup,
      traceColor: targetTraceColor,
      text: point.text || primaryId,
      residue: this.getModifiedResidue(fullData) || '',
      position: fullData[this.dataService.differentialForm.position] || 0,
      sequenceWindow: fullData[this.dataService.differentialForm.sequence] || '',
      peptideSequence: fullData[this.dataService.differentialForm.peptideSequence] || '',
      positionPeptide: fullData[this.dataService.differentialForm.positionPeptide] || 0,
      localizationScore: fullData[this.dataService.differentialForm.score] || 0,
      ...fullData // Include all original data
    };

    // Open the modal
    const ref = this.modal.open(NearbyPointsModalComponent, {
      size: 'xl',
      scrollable: true,
      windowClass: 'modal-extra-large'
    });

    ref.componentInstance.targetPoint = targetPoint;
    ref.componentInstance.nearbyPoints = []; // Will be calculated by the modal

    // Handle modal result
    ref.result.then((result) => {
      if (result && result.action) {
        switch (result.action) {
          case 'select':
            this.selected.emit({
              data: result.data,
              title: result.title || 'Selected from nearby points'
            });
            break;
          case 'annotate':
            // Handle single annotation
            this.dataService.annotationService.next({
              id: result.data[0],
              remove: false
            });
            break;
          case 'annotateMultiple':
            // Handle multiple annotations
            this.dataService.annotationService.next({
              id: result.data,
              remove: false
            });
            break;
          case 'createSelection':
            // Handle new selection creation
            this.selected.emit({
              data: result.data,
              title: result.title
            });
            break;
          case 'addToSelection':
            // Handle adding to existing selection
            this.selected.emit({
              data: result.data,
              title: result.existingSelection
            });
            break;
        }
      }
    }).catch(() => {
      // Modal dismissed
    });
  }

  getModifiedResidue(data: any): string {
    const peptideSequences = Array.isArray(data[this.dataService.differentialForm.peptideSequence])
      ? data[this.dataService.differentialForm.peptideSequence]
      : [data[this.dataService.differentialForm.peptideSequence]];

    const positionsInPeptide = Array.isArray(data[this.dataService.differentialForm.positionPeptide])
      ? data[this.dataService.differentialForm.positionPeptide]
      : [data[this.dataService.differentialForm.positionPeptide]];

    for (let i = 0; i < peptideSequences.length; i++) {
      const peptide = peptideSequences[i];
      const position = positionsInPeptide[i] || positionsInPeptide[0] || 1;
      if (peptide && position > 0 && position <= peptide.length) {
        return peptide[position - 1];
      }
    }

    return '';
  }

  async annotateDataPoints(data: string[]) {
    const annotations: any[] = []
    const annotatedData = this.dataService.currentDF.where(r => data.includes(r[this.dataService.differentialForm.primaryIDs])).bake()
    for (const a of annotatedData) {
      let title = a[this.dataService.differentialForm.primaryIDs]
      const uni: any = this.uniprot.getUniprotFromAcc(a[this.dataService.differentialForm.primaryIDs])
      if (uni) {
        title = uni["Gene Names"] + "(" + title + ")"
      }
      let text = title.slice()
      if (
        this.dataService.differentialForm.peptideSequence !== "" &&
        this.dataService.differentialForm.positionPeptide !== "" &&
        this.dataService.differentialForm.peptideSequence !== ""
      ) {
        const ptmString = this.buildPTMString(a)
        if (ptmString) {
          text = `${ uni["Gene Names"]}(${ptmString})`
        }
      }

      if (!this.annotated[title]) {
        const ann: any = {
          xref: 'x',
          yref: 'y',
          x: a[this.dataService.differentialForm.foldChange],
          y: a[this.dataService.differentialForm.significant],
          text: "<b>"+text+"</b>",
          showarrow: true,
          arrowhead: 1,
          arrowsize: 1,
          arrowwidth: 1,
          ax: -20,
          ay: -20,
          font: {
            size: 15,
            color: "#000000"
          },
          annotationID: title,
        }
        if (this.settings.settings.customVolcanoTextCol !== "") {
          ann.text = "<b>"+a[this.settings.settings.customVolcanoTextCol]+"</b>"
        }
        if (title in this.settings.settings.textAnnotation) {

        } else {
          this.settings.settings.textAnnotation[title] = {
            primary_id: a[this.dataService.differentialForm.primaryIDs],
            data: ann,
            title: title,
            showannotation: true
          }
        }
        annotations.push(ann)
        this.annotated[title] = ann
      }
    }

    if (annotations.length > 0) {
      this.graphLayout.annotations = annotations.concat(this.graphLayout.annotations)
    }
  }

  async removeAnnotatedDataPoints(data: string[]) {
    const annotatedData = this.dataService.currentDF.where(r => data.includes(r[this.dataService.differentialForm.primaryIDs])).bake()
    for (const d of annotatedData) {
      let title = d[this.dataService.differentialForm.primaryIDs]
      const uni:any = this.uniprot.getUniprotFromAcc(d[this.dataService.differentialForm.primaryIDs])
      if (uni) {
        if (uni["Gene Names"] !== "") {
          title = uni["Gene Names"] + "(" + title + ")"
        }
      }
      if (this.annotated[title]) {
        delete this.annotated[title]
        delete this.settings.settings.textAnnotation[title]
      }
    }
    this.graphLayout.annotations = Object.values(this.annotated)
  }

  download() {
    this.web.downloadPlotlyImage('svg', 'volcano', 'volcanoPlot')
  }

  updateAnnotation(data: any) {
    this.graphLayout.annotations = []
    this.annotated = {}
    for (const f of data) {
      this.settings.settings.textAnnotation[f.value.annotationID].data.showarrow = f.value.showarrow
      this.settings.settings.textAnnotation[f.value.annotationID].data.arrowhead = f.value.arrowhead
      this.settings.settings.textAnnotation[f.value.annotationID].data.arrowsize = f.value.arrowsize
      this.settings.settings.textAnnotation[f.value.annotationID].data.arrowwidth = f.value.arrowwidth
      this.settings.settings.textAnnotation[f.value.annotationID].data.ax = f.value.ax
      this.settings.settings.textAnnotation[f.value.annotationID].data.ay = f.value.ay
      this.settings.settings.textAnnotation[f.value.annotationID].data.font.size = f.value.fontsize
      this.settings.settings.textAnnotation[f.value.annotationID].data.font.color = f.value.fontcolor
      this.settings.settings.textAnnotation[f.value.annotationID].data.text = f.value.text
      this.settings.settings.textAnnotation[f.value.annotationID].data.showannotation = f.value.showannotation
      this.settings.settings.textAnnotation[f.value.annotationID].data.annotationID = f.value.annotationID
      this.annotated[f.value.annotationID] = this.settings.settings.textAnnotation[f.value.annotationID].data
      this.graphLayout.annotations.push(this.annotated[f.value.annotationID])
    }
    this.drawVolcano()
  }

  openTextEditor() {
    const ref = this.modal.open(VolcanoPlotTextAnnotationComponent, {size: "xl", scrollable: true})
    ref.componentInstance.data = {annotation: this.settings.settings.textAnnotation}
    ref.componentInstance.onApply = (data: any) => {
      this.updateAnnotation(data)
    }
    ref.closed.subscribe(data => {
      this.updateAnnotation(data)
    })
  }

  legendClickHandler(event: any) {
    if (event.event.srcElement.__data__[0].trace.visible === "legendonly") {
      this.settings.settings.visible[event.event.srcElement.__data__[0].trace.name] = true
    } else {
      this.settings.settings.visible[event.event.srcElement.__data__[0].trace.name] = "legendonly"
    }
  }

  openWebLogo() {
    const ref = this.modal.open(WebLogoComponent, {size: "lg"})
    ref.componentInstance.data = this.dataService.currentDF.where(r => r[this.dataService.differentialForm.primaryIDs] in this.dataService.selectedMap).bake()
  }

  handleLayoutChange(data: any) {
    const keys = Object.keys(data)
    if (data.shapes) {
      this.settings.settings.volcanoAdditionalShapes = data.shapes

      for (let i=0; i<this.settings.settings.volcanoAdditionalShapes.length; i++) {
        if (this.settings.settings.volcanoAdditionalShapes[i].editable) {
          this.settings.settings.volcanoAdditionalShapes[i].label = {
            text: "",
            texttemplate: "",
            font: {
              size: null,
              family: "Arial, sans-serif",
              color: "#000000"
            }
          }
        }
      }
      this.dataService.volcanoAdditionalShapesSubject.next(true)
    }
    if (data["legend.x"]) {
      this.settings.settings.volcanoPlotLegendX = data["legend.x"]
    }
    if (data["legend.y"]) {
      this.settings.settings.volcanoPlotLegendY = data["legend.y"]
    }
    if (data["title.text"]) {
      this.settings.settings.volcanoPlotTitle = data["title.text"]
    }
    if (data["yaxis.title.text"]) {
      this.settings.settings.volcanoAxis.y = data["yaxis.title.text"]
    }
    if (data["xaxis.title.text"]) {
      this.settings.settings.volcanoAxis.x = data["xaxis.title.text"]
    }
    if (keys[0].startsWith("annotations")) {
      for (const k of keys) {
        const index = parseInt(keys[0].split("[")[1].split("]")[0])
        const annotationID = this.graphLayout.annotations[index]?.annotationID
        if (!annotationID) continue

        if (`annotations[${index}].ax` === k) {
          this.settings.settings.textAnnotation[annotationID].ax = data[k]
        } else if (`annotations[${index}].ay` === k) {
          this.settings.settings.textAnnotation[annotationID].ay = data[k]
        } else if (`annotations[${index}].text` === k) {
          this.settings.settings.textAnnotation[annotationID].text = data[k]
        }
      }
    } else if (keys[0].startsWith("shapes")) {
      for (const k of keys) {
        const index = parseInt(keys[0].split("[")[1].split("]")[0])
        const shape = this.settings.settings.volcanoAdditionalShapes[index]
        if (`shapes[${index}].x0` === k) {
          shape.x0 = data[k]
        } else if (`shapes[${index}].x1` === k) {
          shape.x1 = data[k]
        } else if (`shapes[${index}].y0` === k) {
          shape.y0 = data[k]
        } else if (`shapes[${index}].y1` === k) {
          shape.y1 = data[k]
        }
      }
      this.dataService.volcanoAdditionalShapesSubject.next(true)
    }
  }

  updateShapes(data: any[]) {
    for (const i of data) {
      this.settings.settings.volcanoAdditionalShapes[i.index].label = i.label
      this.settings.settings.volcanoAdditionalShapes[i.index].fillcolor = i.fillcolor
      this.settings.settings.volcanoAdditionalShapes[i.index].line.color = i.line.color
      this.settings.settings.volcanoAdditionalShapes[i.index].line.width = i.line.width
    }
    this.drawVolcano()
  }

  openColorByCategoryModal() {
    const ref = this.modal.open(ColorByCategoryModalComponent, {scrollable: true})
    ref.componentInstance.data = this.dataService.currentDF
    ref.componentInstance.primaryIDColumn = this.dataService.differentialForm.primaryIDs
    ref.componentInstance.comparisonCol = this.dataService.differentialForm.comparison
    ref.closed.subscribe((data: {column: string, categoryMap: {[key: string]: {count: number, color: string, primaryIDs: string[], comparison: string}}}) => {
      if (data) {
        for (const c in data.categoryMap) {
          if (!this.dataService.selectOperationNames.includes(c)) {
            this.dataService.selectOperationNames.push(c)
          }
          this.settings.settings.colorMap[c] = data.categoryMap[c].color
          for (const p of data.categoryMap[c].primaryIDs) {
            if (!this.dataService.selectedMap[p]) {
              this.dataService.selectedMap[p] = {}
            }
            this.dataService.selectedMap[p][c] = true
          }
        }
        this.drawVolcano()
      }
    })
  }

  getFirstArrayValue(value: any): any {
    if (Array.isArray(value)) {
      return value.length > 0 ? value[0] : null
    }
    return value
  }

  buildPTMString(row: any): string {
    const positions = Array.isArray(row[this.dataService.differentialForm.position])
      ? row[this.dataService.differentialForm.position]
      : [row[this.dataService.differentialForm.position]]

    const positionsInPeptide = Array.isArray(row[this.dataService.differentialForm.positionPeptide])
      ? row[this.dataService.differentialForm.positionPeptide]
      : [row[this.dataService.differentialForm.positionPeptide]]

    const peptideSequences = Array.isArray(row[this.dataService.differentialForm.peptideSequence])
      ? row[this.dataService.differentialForm.peptideSequence]
      : [row[this.dataService.differentialForm.peptideSequence]]

    const ptmParts: string[] = []

    for (let i = 0; i < positions.length; i++) {
      const position = positions[i]
      const positionInPeptide = positionsInPeptide[i] || positionsInPeptide[0]
      const peptide = peptideSequences[i] || peptideSequences[0]

      if (position && positionInPeptide && peptide && positionInPeptide > 0 && positionInPeptide <= peptide.length) {
        const residue = peptide[positionInPeptide - 1]
        ptmParts.push(`${residue}${position}`)
      }
    }

    return ptmParts.join(';')
  }

  sortGraphDataByOrder(graphData: any[]): any[] {
    const order = this.settings.settings.volcanoTraceOrder
    if (!order || order.length === 0) {
      return graphData
    }

    const orderedTraces: any[] = []
    const unorderedTraces: any[] = []

    order.forEach(name => {
      const trace = graphData.find(t => t.name === name)
      if (trace) {
        orderedTraces.push(trace)
      }
    })

    graphData.forEach(trace => {
      if (!orderedTraces.find(t => t.name === trace.name)) {
        unorderedTraces.push(trace)
      }
    })

    return [...orderedTraces, ...unorderedTraces]
  }

  openReorderTracesModal() {
    const ref = this.modal.open(ReorderTracesModalComponent, {scrollable: true})
    ref.componentInstance.traces = this.graphData
    ref.closed.subscribe(() => {
      this.drawVolcano()
    })
  }

  getPlotAriaLabel(): string {
    const totalPoints = this.graphData.reduce((sum, trace) => sum + (trace.x?.length || 0), 0)
    const significantGroups = this.graphData.filter(trace =>
      trace.name !== 'Background' && !trace.name.includes('Curve')
    ).length

    let label = `Interactive volcano plot with ${totalPoints} data points across ${significantGroups} groups.`

    if (this.editMode) {
      label += ' Edit mode is active, allowing drag and drop of annotations and legends.'
    }

    if (this.explorerMode) {
      label += ' Explorer mode is active, click on points to view nearby PTM data.'
    }

    return label
  }
}
