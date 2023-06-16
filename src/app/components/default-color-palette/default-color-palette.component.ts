import { Component, OnInit } from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {DataService} from "../../data.service";
import {SettingsService} from "../../settings.service";
import {FormBuilder} from "@angular/forms";
import {ToastService} from "../../toast.service";

@Component({
  selector: 'app-default-color-palette',
  templateUrl: './default-color-palette.component.html',
  styleUrls: ['./default-color-palette.component.scss']
})
export class DefaultColorPaletteComponent implements OnInit {

  currentColor: string[] = []
  colorPaletteList: string[] = []
  form = this.fb.group(
    {
      colorPalette: [""],
      resetBarChartColor: [false],
    }
  )
  selectedColor: string[] = []
  customPalette: string[] = []
  constructor(private modal: NgbActiveModal, public data: DataService, private settings: SettingsService, private fb: FormBuilder, private toast: ToastService) {
    this.currentColor = this.settings.settings.defaultColorList.slice()
    this.colorPaletteList = Object.keys(this.data.palette)
    this.form.controls["colorPalette"].valueChanges.subscribe(value => {
      if (value && value !=="") {
        if (this.data.palette[value]) {
          this.selectedColor = this.data.palette[value].slice()
        }
      } else {
        this.selectedColor = []
      }

    })
  }

  ngOnInit(): void {
  }

  updateColor() {

    if (this.customPalette.length > 0) {
      this.settings.settings.defaultColorList = this.customPalette.slice()
    } else {
      if (this.form.value["colorPalette"] !=="" && this.form.value["colorPalette"]!== null && this.form.value["colorPalette"]!== undefined) {
        if (this.data.palette[this.form.value["colorPalette"]]) {
          this.settings.settings.defaultColorList = this.data.palette[this.form.value["colorPalette"]].slice()
        }
      }
    }
    let currentPosition = 0
    if (this.form.value["resetBarChartColor"]) {
      for (const s of this.settings.settings.conditionOrder) {
        if (this.settings.settings.defaultColorList[currentPosition] !== this.data.colorMap[s]) {
          this.settings.settings.barchartColorMap[s] = this.settings.settings.defaultColorList[currentPosition].slice()
          this.data.colorMap[s] = this.settings.settings.defaultColorList[currentPosition].slice()
        }
        currentPosition += 1
        if (currentPosition >= this.settings.settings.defaultColorList.length) {
          currentPosition = 0
        }
      }
    }
    this.data.redrawTrigger.next(true)
    this.modal.close()
  }

  close() {
    this.modal.dismiss()
  }

  openCustomPalette(palette: string | null | undefined) {
    if (palette) {
      if (palette === "current") {
        this.customPalette = this.currentColor.slice()
      } else if (this.colorPaletteList.includes(palette)) {
        this.customPalette = this.data.palette[palette].slice()
      }
    }

  }

  clearCustomPalette() {
    this.customPalette = []
  }

  addCustomColor() {
    this.customPalette.push("#ffffff")
  }

  removeCustomColor(index: number) {
    this.customPalette.splice(index, 1)
  }

  copyColorListToClipboard() {
    let copyText = ""
    if (this.customPalette.length > 0) {
      copyText = JSON.stringify(this.customPalette)
    } else {
      if (this.form.value["colorPalette"] !=="" && this.form.value["colorPalette"]!== null && this.form.value["colorPalette"]!== undefined) {
        if (this.data.palette[this.form.value["colorPalette"]]) {
          copyText = JSON.stringify(this.data.palette[this.form.value["colorPalette"]])
        }
      } else {
        copyText = JSON.stringify(this.currentColor)
      }
    }
    if (copyText !== "") {
      navigator.clipboard.writeText(copyText).then(() => {
        this.toast.show("Clipboard", "Color list copied to clipboard").then()
      })
    }
  }

  parseConfig(value: string) {
    this.customPalette = JSON.parse(value)
  }
}
