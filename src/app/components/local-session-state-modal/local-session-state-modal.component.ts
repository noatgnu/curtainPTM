import { Component, OnInit } from '@angular/core';
import {SaveStateService} from "../../save-state.service";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-local-session-state-modal',
  templateUrl: './local-session-state-modal.component.html',
  styleUrls: ['./local-session-state-modal.component.scss']
})
export class LocalSessionStateModalComponent implements OnInit {

  states: any[] = []
  constructor(private saveState: SaveStateService, private modal: NgbActiveModal) {
    this.getStates()
  }

  ngOnInit(): void {
  }

  loadState(stateNumber: number) {
    this.saveState.loadState(stateNumber)
    this.modal.dismiss()
  }

  deleteState(stateNumber: number) {
    this.saveState.removeState(stateNumber)
    this.getStates()
  }

  getStates() {
    this.states = []
    for (const i of this.saveState.states) {
      const state = this.saveState.getSaveState(i)
      if (state) {
        this.states = [state].concat(this.states)
      }
    }
    console.log(this.states)
  }

  close() {
    this.modal.dismiss()
  }
  loadFromFile(event: any) {
    const files: FileList = event.target.files
    if (files.length > 0) {
      const file = files[0]
      const reader = new FileReader()
      reader.onload = (e) => {
        const contents = e.target?.result
        if (contents) {
          const state = JSON.parse(contents.toString())
          this.saveState.loadStateFromObject(state)
          this.modal.dismiss()
        }
      }
      reader.readAsText(file)
    }
  }

  downloadState(stateNumber: number) {
    this.saveState.downloadState(stateNumber)
  }
}
