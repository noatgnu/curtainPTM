import {AfterViewInit, Component, OnInit} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import QRCodeStyling from "qr-code-styling";
import {Options} from "qr-code-styling";
@Component({
    selector: 'app-qrcode-modal',
    templateUrl: './qrcode-modal.component.html',
    styleUrls: ['./qrcode-modal.component.scss'],
    standalone: false
})
export class QrcodeModalComponent implements OnInit, AfterViewInit {
  url: string = ""
  config: Options = {
    width: 250,
    height: 250,
    data: "",
    //image: "assets/favicon.128x128.png",
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

  qrCode?: QRCodeStyling
  constructor(public modal: NgbActiveModal) {
  }

  ngOnInit(): void {
  }

  ngAfterViewInit() {
    this.config.data = this.url || ""
    const qrCode = new QRCodeStyling(this.config);
    const canvas = document.getElementById("canvas")
    if (canvas) {
      qrCode.append(canvas)
    }
    this.qrCode = qrCode
  }

  close() {
    this.modal.dismiss()
  }

  download() {
    if (this.qrCode) {
      this.qrCode.download({
        name: "qrcode",
        extension: "svg"
      }).then(() => {

      })
    }
  }
}
