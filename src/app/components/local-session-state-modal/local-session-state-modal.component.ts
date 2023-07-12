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
  }

  close() {
    this.modal.dismiss()
  }

}
