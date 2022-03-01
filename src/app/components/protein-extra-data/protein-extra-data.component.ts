import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'app-protein-extra-data',
  templateUrl: './protein-extra-data.component.html',
  styleUrls: ['./protein-extra-data.component.css']
})
export class ProteinExtraDataComponent implements OnInit {
  _data: any = {}
  proteinFunction: string = ""
  @Input() set data(value: any) {
    this._data = value
    this.proteinFunction = this._data["Function [CC]"].replace("FUNCTION: ", "")
  }
  get data(): any {
    return this._data
  }
  constructor() { }

  ngOnInit(): void {
  }

}
