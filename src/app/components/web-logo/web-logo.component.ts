import {AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {UniprotService} from "../../uniprot.service";
import {DataService} from "../../data.service";
import {DataFrame, IDataFrame} from "data-forge";
declare const logojs: any;

@Component({
  selector: 'app-web-logo',
  templateUrl: './web-logo.component.html',
  styleUrls: ['./web-logo.component.scss']
})
export class WebLogoComponent implements OnInit, AfterViewInit {
  private _data: IDataFrame = new DataFrame()
  countMatrix: number[][] = []
  @ViewChild("logoElement") logoElement: ElementRef|undefined
  @Input() set data(value: IDataFrame) {
    this._data = value
    const pos: any = {}
    if (this._data.count() > 0) {
      for (let i = 1; i < 12; i++) {
        pos[i] = {
          A: 0,
          B: 0,
          C: 0,
          D: 0,
          E: 0,
          F: 0,
          G: 0,
          H: 0,
          I: 0,
          K: 0,
          L: 0,
          M: 0,
          N: 0,
          P: 0,
          Q: 0,
          R: 0,
          S: 0,
          T: 0,
          V: 0,
          W: 0,
          //X: 0,
          Y: 0,
          //Z: 0,
        }
      }
      const noSeq = []
      for (const r of this._data) {
        if (r[this.dataService.differentialForm.accession].indexOf("-") !== -1) {
          noSeq.push(r)
        } else {
          const uni = this.uniprot.getUniprotFromAcc(r[this.dataService.differentialForm.accession])
          const aa = uni["Sequence"][r[this.dataService.differentialForm.position]-1]

          const seqLength = uni["Sequence"].length
          const seq = uni["Sequence"].slice(r[this.dataService.differentialForm.position] -6, r[this.dataService.differentialForm.position] + 5)
          for (let i =0; i< seq.length; i++) {
            const aa = seq[i]
            if (aa in pos[i + 1]) {
              pos[i + 1][aa] += 1
            } else {
              console.log(aa, r[this.dataService.differentialForm.position] -1 + i)
              console.log(uni)
            }
          }
        }
      }

      const getSeq = []

      for (const s of noSeq) {
        getSeq.push(this.uniprot.getUniprotFasta(s[this.dataService.differentialForm.accession]))
      }

      const countMatrix: number[][] = []
      console.log(pos)
      for (const k in pos) {
        const row = []
        // sum of aa in position
        // @ts-ignore
        const total: number = Object.values(pos[k]).reduce((a, b) => {
          // @ts-ignore
          return a + b;
        }, 0)
        for (const aa in pos[k]) {
          if (total === 0) {
            row.push(0)
          } else {
            row.push(pos[k][aa] / total)
          }
          //row.push(pos[k][aa])
        }
        countMatrix.push(row)
      }
      this.countMatrix = countMatrix
      console.log(this.countMatrix)
      if (document.getElementById("logo")) {
        logojs.embedProteinLogo(document.getElementById("logo"), {
          ppm: this.countMatrix, mode: "FREQUENCY"
        });
      }
    }
  }

  get data(): any {
    return this._data
  }


  constructor(private modal: NgbActiveModal, private uniprot: UniprotService, private dataService: DataService) {

  }

  ngOnInit(): void {

  }

  ngAfterViewInit(): void {
    const CAP_PPM = [
      [0.01,0,0.02,0,0,0.04,0,0,0.21,0,0.55,0,0,0,0,0,0,0,0.07,0,0,0],
      [0.03,0,0,0.03,0,0,0,0,0,0.19,0,0,0.05,0.35,0.01,0.11,0.02,0.16,0.03,0,0.01,0],
      [0.01,0,0.01,0,0,0,0,0,0.2,0,0.35,0.39,0,0,0,0,0,0,0.05,0,0,0],
      [0.02,0,0.01,0,0.01,0,0.01,0,0,0.04,0,0,0.01,0.02,0,0,0.37,0.51,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0.02,0.01,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0.02,0,0,0,0.01,0,0,0,0,0],
      [0.01,0,0,0,0,0,0,0.16,0.01,0.02,0.02,0.01,0.03,0,0.08,0.63,0.01,0.01,0,0.01,0,0],
      [0.13,0,0,0.01,0.11,0,0.18,0.01,0,0.04,0.01,0.01,0.04,0,0.4,0.04,0,0.03,0,0,0,0],
      [0.09,0,0,0.44,0.4,0,0,0,0,0,0,0.02,0.01,0,0.03,0,0,0,0.01,0,0.01,0],
      [0,0,0,0,0,0,0,0,0.74,0,0.18,0.06,0,0,0,0,0,0.01,0.01,0,0,0],
      [0.58,0,0,0,0,0,0.38,0,0,0,0,0,0,0,0,0,0.04,0,0,0,0,0],
      [0.03,0,0,0.27,0.14,0,0,0.01,0,0.04,0,0.01,0.24,0,0.15,0.04,0.07,0.01,0,0,0,0],
      [0.12,0,0,0,0,0.15,0,0.04,0.11,0,0.08,0.11,0,0,0,0.03,0.01,0,0.01,0,0.35,0],
      [0,0,0.03,0,0,0,0,0,0.13,0,0.52,0,0,0,0,0,0.05,0.04,0.23,0,0,0],
      [0.03,0,0,0,0,0,0.95,0,0,0,0,0,0,0,0,0,0.02,0,0,0,0,0],
      [0.07,0,0.14,0,0,0,0,0,0,0,0.5,0.02,0,0,0.01,0,0.12,0.13,0.02,0,0,0],
      [0.09,0,0.01,0,0,0,0,0,0,0.02,0,0,0,0,0,0.01,0.21,0.66,0,0,0,0],
      [0.01,0,0,0,0,0,0,0,0.19,0,0.11,0,0.01,0.06,0,0.41,0,0.01,0.21,0,0,0],
      [0,0,0,0,0.77,0,0,0.03,0.01,0,0,0,0,0,0.04,0,0.02,0,0.13,0,0,0],
      [0,0,0,0,0,0,0,0.02,0,0,0,0.03,0,0,0,0,0.03,0.91,0,0.01,0,0],
      [0.04,0,0,0,0,0.01,0,0,0.24,0,0.01,0.01,0,0,0,0,0,0.02,0.67,0,0,0],
      [0.02,0,0.01,0,0,0,0.14,0,0.01,0,0,0,0.08,0,0,0,0.58,0.16,0,0,0,0],
      [0.01,0,0,0,0,0,0,0.04,0,0.04,0,0.01,0,0,0,0.89,0,0.01,0,0,0,0],
      [0.05,0,0.01,0,0,0,0,0,0.15,0.05,0.27,0.05,0,0,0.1,0,0.02,0.12,0.15,0,0,0],
      [0,0,0,0,0,0.09,0,0,0.08,0,0.65,0.08,0,0,0,0,0,0,0.06,0,0,0],
      [0.04,0,0,0,0,0,0.28,0,0,0.22,0,0,0.03,0,0,0.04,0.14,0.22,0,0,0,0],
      [0.08,0,0,0.14,0.06,0,0.01,0,0.01,0.18,0.03,0.11,0,0,0.03,0.29,0.01,0,0.01,0,0.01,0],
      [0,0,0,0,0,0.27,0,0,0,0,0.65,0,0,0,0,0,0,0,0,0.04,0,0],
      [0.08,0,0,0,0.25,0,0.01,0.04,0,0.08,0,0,0,0,0.22,0.27,0.01,0.01,0,0,0,0],
      [0.07,0,0.01,0.13,0.16,0,0.01,0.02,0,0.28,0,0,0.01,0,0.13,0.08,0.02,0.05,0,0,0,0],
      [0.01,0,0,0.12,0.17,0,0.02,0.01,0.01,0.07,0.04,0.01,0.06,0,0.18,0.1,0.14,0,0.01,0.01,0.01,0],
      [0,0,0,0.01,0.06,0,0.62,0.03,0,0.06,0,0,0.15,0,0.02,0,0.01,0,0,0,0,0],
      [0.02,0,0,0,0,0.03,0,0,0.09,0.01,0.41,0.12,0,0,0,0.01,0,0.01,0.21,0.05,0.01,0],
      [0,0,0,0,0,0,0,0,0.65,0,0.17,0,0,0,0,0,0,0,0.14,0,0,0]
    ];
    //logojs.embedProteinLogo(document.getElementById("logo"), { ppm: CAP_PPM });
  }

  close() {
    this.modal.dismiss()
  }

  downloadSVG() {
    if (this.logoElement) {
      console.log(this.logoElement.nativeElement.innerHTML)
      const svg = this.logoElement.nativeElement.getElementsByTagName("svg")
      const blob = new Blob([svg[0].outerHTML], {type:"image/svg+xml;charset=utf-8"});
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a")
      a.href = url
      a.download = "weblogo.svg"
      document.body.appendChild(a)
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url)
    }
  }

}
