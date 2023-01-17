import {Component, Input, OnInit} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-kinase-library-modal',
  templateUrl: './kinase-library-modal.component.html',
  styleUrls: ['./kinase-library-modal.component.scss']
})
export class KinaseLibraryModalComponent implements OnInit {
  private _data: any = {data: []}
  @Input() set data (value: any) {
    if (value) {
      this._data = value
    }
  }

  get data(): any {
    return this._data
  }
  private _sequenceWindow: string = ""
  @Input() set sequenceWindow(value: string) {
    this._sequenceWindow = value
  }
  get sequenceWindow(): string {
    return this._sequenceWindow
  }

  constructor(public modal: NgbActiveModal) { }

  ngOnInit(): void {
  }

}
