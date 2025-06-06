import { Component, OnInit } from '@angular/core';
import {WebsocketService} from "../../websocket.service";
import {FormBuilder, FormControl} from "@angular/forms";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {SettingsService} from "../../settings.service";
import {ToastService} from "../../toast.service";
import QRCodeStyling, {Options} from "qr-code-styling";

@Component({
    selector: 'app-collaborate-modal',
    templateUrl: './collaborate-modal.component.html',
    styleUrls: ['./collaborate-modal.component.scss'],
    standalone: false
})
export class CollaborateModalComponent implements OnInit {
  form = this.fb.group({
    sessionID: [""],
    displayName: ['']
  })
  collaborateLink = location.origin + "/#/" + this.settings.settings.currentID + "&&" + this.ws.sessionID

  config: Options = {
    width: 250,
    height: 250,
    data: location.origin + "/#/" + this.settings.settings.currentID + "&&" + this.ws.sessionID,
    image: "assets/favicon.128x128.png",
    margin: 5,
    dotsOptions: {
      color: "#003632",
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
  constructor(private ws: WebsocketService, private fb: FormBuilder, private modal: NgbActiveModal, private settings: SettingsService, private toast: ToastService) {
    this.form.controls['sessionID'].setValue(this.ws.sessionID)
    this.form.controls['sessionID'].disable()
    this.form.controls['displayName'].setValue(this.ws.displayName)
  }

  ngOnInit(): void {
  }
  ngAfterViewInit() {
    const qrCode = new QRCodeStyling(this.config);
    const canvas = document.getElementById("canvas")
    if (canvas) {
      qrCode.append(canvas)
    }
  }

  submit() {
    if (this.form.valid) {
      if (this.form.value.sessionID) {
        this.ws.sessionID = this.form.value.sessionID
      }
      if (this.form.value.displayName) {
        this.ws.displayName = this.form.value.displayName
      }
    }
    this.modal.close()
  }

  cancel() {
    this.modal.dismiss()
  }
  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      this.toast.show("Clipboard", "Session collaborative link has been copied to clipboard").then()
    })
  }
}
