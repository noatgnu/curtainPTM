import {Component, Input, OnInit} from '@angular/core';
import {IDataFrame, ISeries, Series} from "data-forge";

@Component({
  selector: 'app-data-viewer',
  templateUrl: './data-viewer.component.html',
  styleUrls: ['./data-viewer.component.scss']
})
export class DataViewerComponent implements OnInit {
  _data: ISeries<number, IDataFrame<number, any>> = new Series()
  @Input() set data(value: ISeries<number, IDataFrame<number, any>>) {
    this._data = value
  }

  get data(): ISeries<number, IDataFrame<number, any>> {
    return this._data
  }
  constructor() { }

  ngOnInit(): void {
  }

}
