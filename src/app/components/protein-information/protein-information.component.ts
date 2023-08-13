import {Component, Input, OnInit} from '@angular/core';
import {PtmDiseasesService} from "../../ptm-diseases.service";

@Component({
  selector: 'app-protein-information',
  templateUrl: './protein-information.component.html',
  styleUrls: ['./protein-information.component.scss']
})
export class ProteinInformationComponent implements OnInit {
  _data: any = {}

  diseases: string[] = []
  pharmaUse: string[] = []
  ptmDiseases: any[] = []
  @Input() set data(value: any) {
    this._data = value
    console.log(this._data)
    if (this._data["Involvement in disease"] && this._data["Involvement in disease"] !== "") {
      this.diseases = this._data["Involvement in disease"].split(';').map((x: string) => x.replace(/DISEASE:/g, "").trim())
    }
    if (this._data["Pharmaceutical use"] && this._data["Pharmaceutical use"] !== "") {
      this.pharmaUse = this._data["Pharmaceutical use"].split(';').map((x: string) => x.replace(/PHARMACEUTICAL:/g, "").trim())
    }
    if (this.ptmd.getPTMDiseases(this._data["Entry"])) {
        this.ptmDiseases = this.ptmd.getPTMDiseases(this._data["Entry"])
    }
  }
  constructor(private ptmd: PtmDiseasesService) { }

  ngOnInit(): void {
  }

}
