import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {SettingsService} from "../../settings.service";
import {DataService} from "../../data.service";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {FormBuilder, FormGroup} from "@angular/forms";

@Component({
    selector: 'app-volcano-plot-text-annotation',
    templateUrl: './volcano-plot-text-annotation.component.html',
    styleUrls: ['./volcano-plot-text-annotation.component.scss'],
    standalone: false
})
export class VolcanoPlotTextAnnotationComponent implements OnInit {
  private _data:any = {}
  @Input() set data(value: any) {
    this._data = value
    for (const i in value.annotation) {
      this.forms.push(this.fb.group({
        annotationID: [i],
        text: [value.annotation[i].data.text],
        showarrow: [value.annotation[i].data.showarrow],
        arrowhead: [value.annotation[i].data.arrowhead],
        arrowsize: [value.annotation[i].data.arrowsize],
        arrowwidth: [value.annotation[i].data.arrowwidth],
        ax: [value.annotation[i].data.ax],
        ay: [value.annotation[i].data.ay],
        fontsize: [value.annotation[i].data.font.size],
        fontcolor: [value.annotation[i].data.font.color],
        showannotation: [value.annotation[i].data.showannotation],
      }))
      this.colorMap[i] = value.annotation[i].data.font.color.slice()
    }
  }

  onApply: ((data: any) => void) | null = null
  colorMap: any = {}

  forms: FormGroup[] = []
  formAll = this.fb.group({
    fontsize: [12],
    fontcolor: ["#000000"]
  })
  constructor(public modal: NgbActiveModal, private fb: FormBuilder) {

  }

  ngOnInit(): void {
  }

  updateColor(event: any, id: string) {
    this.forms.find((f) => f.controls["annotationID"].value === id)?.controls["fontcolor"].setValue(event)
  }

  submitFormAll() {
    for (const f of this.forms) {
      f.controls["fontsize"].setValue(this.formAll.controls["fontsize"].value)
    }
  }

  applyChanges() {
    if (this.onApply) {
      this.onApply(this.forms)
    }
  }
}
