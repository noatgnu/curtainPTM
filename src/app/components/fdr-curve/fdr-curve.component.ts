import { Component, OnInit } from '@angular/core';
import {SettingsService} from "../../settings.service";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-fdr-curve',
  templateUrl: './fdr-curve.component.html',
  styleUrls: ['./fdr-curve.component.scss']
})
export class FdrCurveComponent implements OnInit {
  fdrCurveText: string = ""
  fdrCurveTextEnable: boolean = false
  constructor(public settings: SettingsService, private modal: NgbActiveModal) {
    this.fdrCurveText = settings.settings.fdrCurveText
    this.fdrCurveTextEnable = settings.settings.fdrCurveTextEnable
  }

  ngOnInit(): void {
  }

  updateFDRCurveText() {
    this.settings.settings.fdrCurveTextEnable = this.fdrCurveTextEnable
    this.settings.settings.fdrCurveText = this.fdrCurveText
    this.modal.dismiss()
  }

  closeModal() {
    this.modal.dismiss()
  }
}
