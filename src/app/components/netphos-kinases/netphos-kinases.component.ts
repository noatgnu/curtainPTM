import {Component, Input, OnInit} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-netphos-kinases',
  templateUrl: './netphos-kinases.component.html',
  styleUrls: ['./netphos-kinases.component.css']
})
export class NetphosKinasesComponent implements OnInit {
  _data: any[] = []
  graphData: any[] = []
  graphLayout: any = {}
  @Input() set data(result: any[]) {
    this._data = result.slice().reverse()
    this.drawScore();
  }

  private drawScore() {
    const temp: any = {
      x: [],
      y: [],
      type: "bar",
      orientation: "h"
    }

    const graphLayout = {
      title: {
        text: "",
        font: {
          family: "Arial Black",
          size: 24,
        }
      },
      margin: {l: 100, r: 50, t: 50, b: 50},
      height: 400,
      xaxis: {
        "title": "<b>Score</b>"
      },
      yaxis: {
        "title": "<b>Kinases</b>",
        "type": "category",
        "tickmode": "array",
        "tickvals": [],
        "tickfont": {
          "size": 17,
          "color": 'black'
        }
      }
    }
    for (const d of this._data) {
      temp.x.push(d.score)
      temp.y.push(d.kinase)
    }
    graphLayout.yaxis.tickvals = temp.y
    graphLayout.height = 400 + 30 * temp.y.length
    this.graphLayout = graphLayout
    this.graphData = [temp]
    console.log(this.graphData)
  }

  constructor(public modal: NgbActiveModal) { }

  ngOnInit(): void {
  }

}
