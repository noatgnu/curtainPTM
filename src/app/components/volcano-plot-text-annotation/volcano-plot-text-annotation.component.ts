import { Component, OnInit } from '@angular/core';
import {SettingsService} from "../../settings.service";
import {DataService} from "../../data.service";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {FormBuilder, FormGroup} from "@angular/forms";

@Component({
  selector: 'app-volcano-plot-text-annotation',
  templateUrl: './volcano-plot-text-annotation.component.html',
  styleUrls: ['./volcano-plot-text-annotation.component.scss']
})
export class VolcanoPlotTextAnnotationComponent implements OnInit {
  annotationText: any[] = []
  colorMap: any = {}

  forms: FormGroup[] = []
  constructor(public settings: SettingsService, public data: DataService, public modal: NgbActiveModal, private fb: FormBuilder) {
    for (const i in this.settings.settings.textAnnotation) {
      //this.annotationText.push(this.settings.settings.textAnnotation[i])
      this.forms.push(this.fb.group({
        annotationID: [i],
        text: [this.settings.settings.textAnnotation[i].data.text],
        showarrow: [this.settings.settings.textAnnotation[i].data.showarrow],
        arrowhead: [this.settings.settings.textAnnotation[i].data.arrowhead],
        arrowsize: [this.settings.settings.textAnnotation[i].data.arrowsize],
        arrowwidth: [this.settings.settings.textAnnotation[i].data.arrowwidth],
        ax: [this.settings.settings.textAnnotation[i].data.ax],
        ay: [this.settings.settings.textAnnotation[i].data.ay],
        fontsize: [this.settings.settings.textAnnotation[i].data.font.size],
        fontcolor: [this.settings.settings.textAnnotation[i].data.font.color],
        showannotation: [this.settings.settings.textAnnotation[i].showannotation],
      }))
      this.colorMap[i] = this.settings.settings.textAnnotation[i].data.font.color.slice()
    }
  }
  ngOnInit(): void {
  }

  updateColor(event: any, id: string) {
    this.forms.find((f) => f.controls["annotationID"].value === id)?.controls["fontcolor"].setValue(event)
  }
}
