import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'app-protein-domain',
  templateUrl: './protein-domain.component.html',
  styleUrls: ['./protein-domain.component.css']
})
export class ProteinDomainComponent implements OnInit {
  _data: any[] = []
  @Input() set data(value: any) {
    let last = 1
    const waterfallPlot: any = {
      type: "waterfall",
      orientation: "h",
      measure: [],
      y: [],
      x: [],
      connector: {
        mode: "between"
      },
      text: [],
      hoverinfo: "text",
      base: 1
    }
    for (const d of value["Domain [FT]"]) {
      if (d.start-1 > last) {
        waterfallPlot.measure.push("relative")
        waterfallPlot.y.push("Other")
        waterfallPlot.x.push(d.start-last)
        if (last !== 1) {
          waterfallPlot.text.push((last+1) + " - " + (d.start-1) + "; " + "Other")
        } else {
          waterfallPlot.text.push(1 + " - " + (d.start-1) + "; " + "Other")
        }

        last = d.start-1

      }
      waterfallPlot.measure.push("relative")
      waterfallPlot.y.push(d.name)
      waterfallPlot.x.push(d.end-last)
      waterfallPlot.text.push(d.start + " - " + (d.end) + "; " + d.name)
      last = d.end
    }
    if (parseInt(value["Length"]) - 1 > last) {
      waterfallPlot.measure.push("relative")
      waterfallPlot.y.push("Other")
      waterfallPlot.x.push(parseInt(value["Length"])-last)
      if (last !== 1) {
        waterfallPlot.text.push((last+1) + " - " + parseInt(value["Length"])+ "; " + "Other")
      } else {
        waterfallPlot.text.push(1 + " - " + parseInt(value["Length"]) + "; " + "Other")
      }
    }
    this._data = [waterfallPlot]
  }

  get data(): any[] {
    return this._data
  }

  layout: any = {
    title: {
      text: "Protein Domains"
    },
    yaxis: {
      type: "category"
    },
    xaxis: {
      type: "linear",
      showgrid: false,
      zeroline: false,
      showline: false,
      autotick: true,
      ticks: '',
      showticklabels: false
    }, margin: {t: 25, b: 25, r: 125, l: 125},
    showlegend: false
  }
  constructor() { }

  ngOnInit(): void {
  }

}
