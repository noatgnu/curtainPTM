import { Component, OnInit } from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-session-expired-modal',
  templateUrl: './session-expired-modal.component.html',
  styleUrls: ['./session-expired-modal.component.scss']
})
export class SessionExpiredModalComponent implements OnInit {

  constructor(private modal: NgbActiveModal) { }

  ngOnInit(): void {
  }
  close() {
    this.modal.dismiss()
  }

}
