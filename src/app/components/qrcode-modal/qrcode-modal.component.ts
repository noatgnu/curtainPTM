import {Component, Input, OnInit} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {Options} from "ngx-qrcode-styling";

@Component({
  selector: 'app-qrcode-modal',
  templateUrl: './qrcode-modal.component.html',
  styleUrls: ['./qrcode-modal.component.scss']
})
export class QrcodeModalComponent implements OnInit {
  private _url: string = ""
  @Input() set url(value: string) {
    this.config.data = value
    this._url = value
  }
  config: Options = {
    width: 250,
    height: 250,
    data: this.url,
    //image: "assets/favicon.png",
    margin: 5,
    dotsOptions: {
      color: "#2E2D62",
      type: "dots",
    },
    backgroundOptions: {
      color: "#ffffff",
    },
    imageOptions: {
      crossOrigin: "anonymous",
      margin: 0
    }
    //image: "assets/favicon.png",
  }
  constructor(public modal: NgbActiveModal) { }

  ngOnInit(): void {
  }
  close() {
    this.modal.dismiss()
  }
}
