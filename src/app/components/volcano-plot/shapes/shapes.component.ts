import {Component, EventEmitter, Output} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule} from "@angular/forms";
import {SettingsService} from "../../../settings.service";
import {ColorPickerModule} from "ngx-color-picker";
import {DataService} from "../../../data.service";

@Component({
  selector: 'app-shapes',
  standalone: true,
  imports: [
    ColorPickerModule,
    ReactiveFormsModule
  ],
  templateUrl: './shapes.component.html',
  styleUrl: './shapes.component.scss'
})
export class ShapesComponent {
  colorMapFill: any = {}
  colorMapLine: any = {}
  colorMapFont: any = {}
  forms: FormGroup<any>[] = []
  @Output() updateShapes: EventEmitter<any> = new EventEmitter<any>()
  constructor(public settings: SettingsService, private fb: FormBuilder, private dataService: DataService) {
    this.updateForms();
    this.dataService.volcanoAdditionalShapesSubject.subscribe((value) => {
      this.updateForms()
    })
  }

  private updateForms() {
    const forms: FormGroup<any>[] = []
    for (let i = 0; i < this.settings.settings.volcanoAdditionalShapes.length; i++) {
      const s = this.settings.settings.volcanoAdditionalShapes[i]
      if (s.editable) {
        const form: FormGroup<any> = this.fb.group({
          text: s.label.text,
          fillcolor: s.fillcolor,
          linecolor: s.line.color,
          linewidth: s.line.width,
          index: i,
          fontsize: s.label.font.size,
          fontcolor: s.label.font.color,
          fontfamily: s.label.font.family
        })

        this.colorMapLine[i] = s.line.color
        this.colorMapFill[i] = s.fillcolor
        forms.push(form)
      }
    }
    this.forms = forms
  }

  updateData() {
    const shapes = []
    for (const f of this.forms) {
      shapes.push({
        label: {
          text: f.controls["text"].value,
          texttemplate: "",
          font: {
            size: f.controls["fontsize"].value,
            color: f.controls["fontcolor"].value,
            family: f.controls["fontfamily"].value
          }
        },
        fillcolor: f.controls["fillcolor"].value,
        line: {
          color: f.controls["linecolor"].value,
          width: f.controls["linewidth"].value
        },
        index: f.controls["index"].value
      })
    }
    this.updateShapes.emit(shapes)
  }
  updateColorLine(event: any, id: number) {
    this.forms.find((f) => f.controls["index"].value === id)?.controls["linecolor"].setValue(event)
  }
  updateColorFill(event: any, id: number) {
    this.forms.find((f) => f.controls["index"].value === id)?.controls["fillcolor"].setValue(event)
  }
  updateColorFont(event: any, id: number) {
    this.forms.find((f) => f.controls["index"].value === id)?.controls["fontcolor"].setValue(event)
  }
}
