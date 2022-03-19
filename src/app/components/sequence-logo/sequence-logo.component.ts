import {Component, OnInit, AfterViewInit, Input} from '@angular/core';
// @ts-ignore
import * as logojs from "logojs-react";
import {DataService} from "../../../services/data.service";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
@Component({
  selector: 'app-sequence-logo',
  templateUrl: './sequence-logo.component.html',
  styleUrls: ['./sequence-logo.component.css']
})
export class SequenceLogoComponent implements OnInit, AfterViewInit {
  _data: any[] = []
  window = 0
  idName = ""
  dataCount = 0
  dataSorted: any[] = []
  Math: Math = Math
  @Input() set data(value: any) {
    if (value) {
      const data: any[] = []
      if (value.window > 0) {
        this.idName = value.id
        this.window = value.window
        for (let i = 0; i < this.window; i ++) {
          const window: any = {}
          for (const a of this.dataService.aaList) {
            window[a.res] = 0
          }
          window["total"] = 0
          data.push(window)
        }

        if (value.data) {
          if (value.data.length > 0) {
            this.dataCount = value.data.length
            for (const s of value.data) {
              for (let i = 0; i < this.window; i ++) {
                if (data[i][s[i]] !== undefined) {
                  data[i][s[i]] = data[i][s[i]] + 1
                  data[i]["total"] = data[i]["total"] + 1
                }
              }
            }
          }
        }
        const finData = []
        const dataSorted = []
        for (const w of data) {
          const wD = []
          const tobeSort = []
          for (const a of this.dataService.aaList) {
            if (w[a.res] !== 0) {
              w[a.res] = w[a.res]/w["total"]
              tobeSort.push([a.res, w[a.res]])
            } else {
              tobeSort.push([a.res, 0])
            }
            wD.push(w[a.res])
          }
          tobeSort.sort(function(a, b) {
            return b[1]-a[1];
          });
          dataSorted.push(tobeSort)
          finData.push(wD)
        }
        this.dataSorted = dataSorted

        console.log(dataSorted)
        this._data = finData
        logojs.embedProteinLogo(document.getElementById("seqLogo"), { ppm: this._data })
        logojs.embedProteinLogo(document.getElementById("seqLogoFreq"), { ppm: this._data, mode: "FREQUENCY" })
      }

    }
  }
  constructor(private dataService: DataService, public modal: NgbActiveModal) { }

  ngOnInit(): void {
  }

  ngAfterViewInit() {

  }

}
