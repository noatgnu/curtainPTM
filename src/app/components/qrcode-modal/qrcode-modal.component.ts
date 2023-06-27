import {Component, Input, OnInit} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-qrcode-modal',
  templateUrl: './qrcode-modal.component.html',
  styleUrls: ['./qrcode-modal.component.scss']
})
export class QrcodeModalComponent implements OnInit {
  @Input() url: string = ""
  constructor(public modal: NgbActiveModal) { }

  ngOnInit(): void {
  }
  close() {
    this.modal.dismiss()
  }
}
