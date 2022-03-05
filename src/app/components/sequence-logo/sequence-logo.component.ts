import {Component, OnInit, AfterViewInit, Input} from '@angular/core';
// @ts-ignore
import * as logojs from "logojs-react";
@Component({
  selector: 'app-sequence-logo',
  templateUrl: './sequence-logo.component.html',
  styleUrls: ['./sequence-logo.component.css']
})
export class SequenceLogoComponent implements OnInit, AfterViewInit {
  _data: any = {}
  @Input() set data(value: any) {
    if (value) {
      this._data = value
    }
  }
  constructor() { }

  ngOnInit(): void {
  }

  ngAfterViewInit() {
    const CTCF_PPM = [
      [0.09, 0.31, 0.08, 0.50], [0.18, 0.15, 0.45, 0.20], [0.30, 0.05, 0.49, 0.14],
      [0.06, 0.87, 0.02, 0.03], [0.00, 0.98, 0.00, 0.02], [0.81, 0.01, 0.07, 0.09],
      [0.04, 0.57, 0.36, 0.01], [0.11, 0.47, 0.05, 0.35], [0.93, 0.01, 0.03, 0.01],
      [0.00, 0.00, 0.99, 0.01], [0.36, 0.00, 0.64, 0.00], [0.05, 0.01, 0.55, 0.37],
      [0.03, 0.00, 0.97, 0.00], [0.06, 0.00, 0.85, 0.07], [0.11, 0.80, 0.00, 0.07],
      [0.40, 0.01, 0.55, 0.01], [0.09, 0.53, 0.33, 0.04], [0.12, 0.35, 0.08, 0.43],
      [0.44, 0.19, 0.29, 0.06]
    ];
    logojs.embedDNALogo(document.getElementById("logo"), { ppm: CTCF_PPM });
  }

}