import { Component, OnInit, signal, computed } from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {SettingsService} from "../../settings.service";
import {FormBuilder} from "@angular/forms";
import {ToastService} from "../../toast.service";

@Component({
    selector: 'app-volcano-colors',
    templateUrl: './volcano-colors.component.html',
    styleUrls: ['./volcano-colors.component.scss'],
    standalone: false
})
export class VolcanoColorsComponent implements OnInit {
  colorGroups = signal<any[]>([])
  form = this.fb.group({
    colors: [""],
  })

  constructor(private modal: NgbActiveModal, private settings: SettingsService, private fb: FormBuilder, private toast: ToastService) {
    const groups: any[] = []
    for (const g in this.settings.settings.colorMap) {
      const size = this.settings.settings.markerSizeMap[g] || this.settings.settings.scatterPlotMarkerSize
      groups.push({color: this.settings.settings.colorMap[g], group: g, remove: false, size: size})
    }
    this.colorGroups.set(groups)
  }

  ngOnInit(): void {
  }

  updateColorGroup() {
    for (const g of this.colorGroups()) {
      if (this.settings.settings.colorMap[g.group] !== g.color) {
        this.settings.settings.colorMap[g.group] = g.color
      }
      if (g.size !== undefined && g.size !== null) {
        this.settings.settings.markerSizeMap[g.group] = g.size
      }
      if (g.remove) {
        delete this.settings.settings.colorMap[g.group]
        delete this.settings.settings.markerSizeMap[g.group]
      }
    }
    this.modal.close()
  }

  closeModal() {
    this.modal.dismiss()
  }

  copyColorArray() {
    const colorArray: any[] = this.colorGroups().map(x => {
      return {group: x.group, color: x.color, size: x.size}
    })
    navigator.clipboard.writeText(JSON.stringify(colorArray)).then(
      () => {
        this.toast.show("Clipboard", "Color and size data copied to clipboard").then()
      }
    )
  }

  pasteColorArray() {
    if (this.form.value["colors"] !== "" && this.form.value["colors"] !== null && this.form.value["colors"] !== undefined) {
      try {
        const colorArray = JSON.parse(this.form.value["colors"])
        if (Array.isArray(colorArray)) {
          let matchCount = 0
          const groups = this.colorGroups()
          for (const c of colorArray) {
            for (const g of groups) {
              if (g.group === c.group) {
                g.color = c.color
                if (c.size !== undefined) {
                  g.size = c.size
                }
                matchCount++
              }
            }
          }
          this.colorGroups.set([...groups])
          this.toast.show("Success", `Imported ${matchCount} item(s) successfully`).then()
        } else {
          this.toast.show("Error", "Invalid format. Expected an array of objects.").then()
        }
      } catch (error) {
        this.toast.show("Error", "Failed to parse JSON").then()
      }
    }
  }

  getContrastColor(hexColor: string): string {
    if (!hexColor) return '#000000'
    const hex = hexColor.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000
    return brightness > 155 ? '#000000' : '#ffffff'
  }
}
