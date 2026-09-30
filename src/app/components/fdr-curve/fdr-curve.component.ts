import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import {SettingsService} from "../../settings.service";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {DataService} from "../../data.service";
import {VolcanoCurveParameters} from "../../classes/volcano-curve";

@Component({
    selector: 'app-fdr-curve',
    templateUrl: './fdr-curve.component.html',
    styleUrls: ['./fdr-curve.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class FdrCurveComponent implements OnInit {
  fdrCurveText: string = ""
  fdrCurveTextEnable: boolean = false
  cutoffMode: string = "normal"
  curve: VolcanoCurveParameters
  constructor(public settings: SettingsService, private modal: NgbActiveModal, private data: DataService) {
    this.fdrCurveText = settings.settings.fdrCurveText
    this.fdrCurveTextEnable = settings.settings.fdrCurveTextEnable
    this.cutoffMode = settings.settings.volcanoCutoffMode
    this.curve = {...settings.settings.volcanoCurve}
  }

  ngOnInit(): void {
  }

  /**
   * Returns true when the pasted curve points are used, either as a drawn overlay in normal mode or as the curve in curve mode.
   */
  get curvePointsEditable(): boolean {
    return this.cutoffMode === "curve" ? this.curve.type === "points" : this.fdrCurveTextEnable
  }

  updateFDRCurveText() {
    this.settings.settings.fdrCurveTextEnable = this.fdrCurveTextEnable
    this.settings.settings.fdrCurveText = this.fdrCurveText
    this.settings.settings.volcanoCutoffMode = this.cutoffMode
    this.settings.settings.volcanoCurve = {...this.curve}
    this.data.triggerSelectionUpdate()
    this.modal.dismiss()
  }

  closeModal() {
    this.modal.dismiss()
  }
}
