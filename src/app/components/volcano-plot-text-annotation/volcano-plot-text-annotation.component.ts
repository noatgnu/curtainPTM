import { Component, OnInit } from '@angular/core';
import {SettingsService} from "../../settings.service";
import {DataService} from "../../data.service";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-volcano-plot-text-annotation',
  templateUrl: './volcano-plot-text-annotation.component.html',
  styleUrls: ['./volcano-plot-text-annotation.component.scss']
})
export class VolcanoPlotTextAnnotationComponent implements OnInit {
  annotationText: any[] = []

  constructor(public settings: SettingsService, public data: DataService, public modal: NgbActiveModal) {
    for (const i in this.data.annotatedData) {
      this.annotationText.push(this.settings.settings.textAnnotation[i])
    }
  }
  ngOnInit(): void {
  }

}
