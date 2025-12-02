import { Component, signal } from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {FormsModule} from "@angular/forms";


interface ClearSetting {
  key: string;
  label: string;
  description: string;
  selected: boolean;
}

@Component({
    selector: 'app-are-you-sure-clear-modal',
    imports: [
    FormsModule
],
    templateUrl: './are-you-sure-clear-modal.component.html',
    styleUrl: './are-you-sure-clear-modal.component.scss'
})
export class AreYouSureClearModalComponent {
  remember = signal(false)

  settings: ClearSetting[] = [
    {
      key: 'selections',
      label: 'Data Selections',
      description: 'Selected proteins and genes',
      selected: true
    },
    {
      key: 'textAnnotation',
      label: 'Text Annotations',
      description: 'Text annotations on plots',
      selected: true
    },
    {
      key: 'volcanoShapes',
      label: 'Volcano Plot Shapes',
      description: 'Additional shapes on volcano plots',
      selected: true
    },
    {
      key: 'annotatedData',
      label: 'Annotated Data',
      description: 'All annotated data',
      selected: true
    }
  ]

  constructor(private activeModal: NgbActiveModal) {
    const savedSettings = localStorage.getItem('curtainClearSettingsSelection')
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        this.settings.forEach(setting => {
          if (parsed[setting.key] !== undefined) {
            setting.selected = parsed[setting.key]
          }
        })
      } catch (e) {
        console.error('Failed to parse saved clear settings:', e)
      }
    }
  }

  toggleAll(select: boolean) {
    this.settings.forEach(s => s.selected = select)
  }

  get allSelected(): boolean {
    return this.settings.every(s => s.selected)
  }

  get someSelected(): boolean {
    return this.settings.some(s => s.selected) && !this.allSelected
  }

  get hasSelectedSettings(): boolean {
    return this.settings.some(s => s.selected)
  }

  saveSelection() {
    const selection: any = {}
    this.settings.forEach(s => {
      selection[s.key] = s.selected
    })
    localStorage.setItem('curtainClearSettingsSelection', JSON.stringify(selection))
  }

  close() {
    if (this.remember()) {
      localStorage.setItem('curtainRememberClearSettings', 'true')
      this.saveSelection()
    }
    this.activeModal.dismiss()
  }

  ok() {
    if (this.remember()) {
      localStorage.setItem('curtainRememberClearSettings', 'true')
    }
    this.saveSelection()

    const selectedSettings: {[key: string]: boolean} = {}
    this.settings.forEach(s => {
      selectedSettings[s.key] = s.selected
    })

    this.activeModal.close(selectedSettings)
  }

}
