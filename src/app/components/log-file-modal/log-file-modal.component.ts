import { Component } from '@angular/core';
import {SettingsService} from "../../settings.service";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {FormsModule} from "@angular/forms";

@Component({
  selector: 'app-log-file-modal',
  standalone: true,
  imports: [
    FormsModule
  ],
  templateUrl: './log-file-modal.component.html',
  styleUrl: './log-file-modal.component.scss'
})
export class LogFileModalComponent {
  selectedLogFile: number = -1;

  constructor(public settings: SettingsService, private activeModal: NgbActiveModal) {
  }

  handleAddLogFile(event: any) {
    const target = event.target as HTMLInputElement;
    if (target.files) {
      const file = target.files[0];
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const text = e.target?.result as string
          this.settings.settings.extraData.push({name: file.name, content: text, type: 'log'})
        }
        reader.readAsText(file)
      }
    }
  }

  close() {
    this.activeModal.dismiss()
  }

  removeLogFile(index: number) {
    this.selectedLogFile = -1
    this.settings.settings.extraData.splice(index, 1)
  }

  downloadLogFile(index: number) {
    const log = this.settings.settings.extraData[index]
    const blob = new Blob([log.content], {type: 'text/plain'})
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = log.name
    a.click()
    window.URL.revokeObjectURL(url)
  }
}
