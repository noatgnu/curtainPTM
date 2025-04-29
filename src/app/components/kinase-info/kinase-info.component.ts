import {Component, Input, OnInit} from '@angular/core';
import {WebService} from "../../web.service";
import {UniprotService} from "../../uniprot.service";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
    selector: 'app-kinase-info',
    templateUrl: './kinase-info.component.html',
    styleUrls: ['./kinase-info.component.scss'],
    standalone: false
})
export class KinaseInfoComponent implements OnInit {
  private _name: string = ""
  _uni: any = {}
  data: any = {}
  otherUni: any = {}
  @Input() set uni(value: any) {
    this._uni = value
    if (this._uni) {
      this.web.getUniProtNew(this._uni["Entry"]).subscribe(data => {
        if (data) {
          this.otherUni = data
          console.log(this.otherUni)
        }
      })
    }
    console.log(this._uni)
  }

  get name(): string {
    return this._name
  }
  constructor(private web: WebService, private uniprot: UniprotService, public modal: NgbActiveModal) { }

  ngOnInit(): void {
  }

}
