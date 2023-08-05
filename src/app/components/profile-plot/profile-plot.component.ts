import {Component, Input, OnInit} from '@angular/core';
import {DataFrame, IDataFrame, Series} from "data-forge";
import {DataService} from "../../data.service";
import {UniprotService} from "../../uniprot.service";
import {ToastService} from "../../toast.service";
import {SettingsService} from "../../settings.service";
import {WebService} from "../../web.service";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-profile-plot',
  templateUrl: './profile-plot.component.html',
  styleUrls: ['./profile-plot.component.scss']
})
export class ProfilePlotComponent implements OnInit {
  @Input() divId = "profile"
  boxplot: boolean = true
  _data: IDataFrame = new DataFrame()
  @Input() set data(value: IDataFrame) {
    this._data = value
    if (this._data.count() > 0) {
      this.drawBoxPlot().then(r => {
        this.graphData = this.graphBox
        this.drawSelected().then()
      })
    }
  }

  _selected: string[] = []
  @Input() set selected(value: string[]) {
    this._selected = value
  }

  graphData: any[] = []
  graphBox: any[] = []
  graphLayout: any = {
    margin: {t:50, b:200, l:50, r:25},
    title: "Profile Plot",
    xaxis: {
      title: "Samples",
      tickvals: [],
      ticktext: []
    },
    yaxis: {title: "log2 Intensity Value"},
    annotations: [],
    shapes: [],
    showlegend: true,
    legend: {
      orientation: 'h'
    }
  }
  graphSelected: any[] = []
  constructor(private modal: NgbActiveModal, private toast: ToastService, private dataService: DataService, private uniprot: UniprotService, private settings: SettingsService, private web: WebService) {
    this.dataService.selectionUpdateTrigger.asObservable().subscribe(data => {
      this.drawSelected().then()
    })
    this.dataService.redrawTrigger.subscribe(data => {
      if (data) {
        if (this._data.count() > 0) {
          this.drawBoxPlot().then(r => {
            this.graphData = this.graphBox
            this.drawSelected().then()
          })
        }
      }
    })
  }

  ngOnInit(): void {
  }

  async drawBoxPlot() {
    const graphBox: any[] = []
    const graphBoxData: any = {
      x: [],
      y: [],
      boxpoints: false,
      marker: {
        color: '#9b8f8e'
      },
      type: 'box',
      showlegend: false
    }
    let sampleNumber: number = 0
    const tickval: string[] = []
    const ticktext: string[] = []
    const temp: any = {}
    for (const s in this.settings.settings.sampleMap) {
      if (this.settings.settings.sampleVisible[s]) {
        sampleNumber ++
        const condition = this.settings.settings.sampleMap[s].condition
        if (!temp[condition]) {
          temp[condition] = {
            x: [],
            y: [],
            line: {
              color: 'black'
            },
            fillcolor: this.settings.settings.colorMap[condition],
            boxpoints: false,
            type: 'box',
            showlegend: false
          }
        }
        temp[condition].x = temp[condition].x.concat(Array(this._data.count()).fill(s))
        temp[condition].y = temp[condition].y.concat(this._data.getSeries(s).bake().toArray().map(a=> Math.log2(a)))
      }
    }

    for (const t in temp) {
      tickval.push(temp[t].x[Math.round(temp[t].x.length/2)-1])
      ticktext.push(t)
      graphBox.push(temp[t])
    }
    this.graphLayout.xaxis.tickvals = tickval
    this.graphLayout.xaxis.ticktext = ticktext

    this.graphBox = graphBox
    this.toast.show("Profile Plot", "Completed Constructing Box Plots").then(r => {})
  }

  async drawSelected() {
    const graphData: any[] = []
    let selected = this._data.where(r => this._selected.includes(r[this.dataService.rawForm.primaryIDs])).bake()
    selected = selected.join(this.dataService.currentDF, r1 => r1[this.dataService.rawForm.primaryIDs], r2 => r2[this.dataService.differentialForm.primaryIDs], (r1, r2) => {
      const res = Object.assign({}, r1)
      res[this.dataService.differentialForm.accession] = r2[this.dataService.differentialForm.accession]
      res[this.dataService.differentialForm.peptideSequence] = r2[this.dataService.differentialForm.peptideSequence]
      res[this.dataService.differentialForm.position] = r2[this.dataService.differentialForm.position]
      res[this.dataService.differentialForm.positionPeptide] = r2[this.dataService.differentialForm.positionPeptide]
      return res
    })
    for (const r of selected) {

      let name = r[this.dataService.rawForm.primaryIDs]
      const uni: any = this.uniprot.getUniprotFromAcc(r[this.dataService.differentialForm.accession])
      if (uni) {
        if (uni["Gene Names"] !== "") {
          name = uni["Gene Names"] + "(" + name + ")"
          if (
            this.dataService.differentialForm.peptideSequence !== "" &&
            this.dataService.differentialForm.positionPeptide !== "" &&
            this.dataService.differentialForm.peptideSequence !== ""
          ) {
            const position = r[this.dataService.differentialForm.position]
            const positionInPeptide = r[this.dataService.differentialForm.positionPeptide]
            const peptide = r[this.dataService.differentialForm.peptideSequence]
            name = `${uni["Gene Names"]}(${peptide[positionInPeptide-1]}${position})(${r[this.dataService.rawForm.primaryIDs]})`
          }
        }
      }

      const temp: any = {
        x: [],
        y: [],
        mode: "lines+markers",
        type: "scatter",
        name: name
      }
      for (const i in this.settings.settings.sampleMap) {
        if (this.settings.settings.sampleVisible[i]) {
          temp.x.push(i)
          temp.y.push(Math.log2(r[i]))
        }
      }
      graphData.push(temp)
    }
    this.graphSelected = graphData
    this.graphData = this.graphData.concat(this.graphSelected)
  }

  downloadSVG() {
    this.web.downloadPlotlyImage("svg", "profilePlot", this.divId).then()
  }

  hideBoxPlot() {
    this.boxplot = !this.boxplot
    if (this.boxplot) {
      if (this._data.count() > 0) {
        this.drawBoxPlot().then(r => {
          this.graphData = this.graphBox
          this.drawSelected().then()
        })
      }
    } else {
      this.graphData = []
      this.drawSelected().then()
    }


  }

  close() {
    this.modal.dismiss()
  }
}
