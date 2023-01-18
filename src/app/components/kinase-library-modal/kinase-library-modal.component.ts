import {Component, Input, OnInit} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {WebService} from "../../web.service";
import {KinaseLibraryService} from "../../kinase-library.service";

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

  private _directData: any[] = []

  @Input() set directData(value: any[]) {
    this._directData = value.sort((a, b) => {
      return b.scoreRank - a.scoreRank
    })
  }

  get directData(): any[] {
    return this._directData
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

  constructor(public modal: NgbActiveModal, private kinaseLibrary: KinaseLibraryService) { }

  ngOnInit(): void {
  }

}
