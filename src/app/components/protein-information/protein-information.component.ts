import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'app-protein-information',
  templateUrl: './protein-information.component.html',
  styleUrls: ['./protein-information.component.scss']
})
export class ProteinInformationComponent implements OnInit {
  _data: any = {}
  @Input() set data(value: any) {
    this._data = value
  }
  constructor() { }

  ngOnInit(): void {
  }

}
