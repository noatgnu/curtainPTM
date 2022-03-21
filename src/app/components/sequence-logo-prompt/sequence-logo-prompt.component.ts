import {Component, Input, OnInit} from '@angular/core';
import {FormBuilder, FormGroup} from "@angular/forms";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {SettingsService} from "../../../services/settings.service";

@Component({
  selector: 'app-sequence-logo-prompt',
  templateUrl: './sequence-logo-prompt.component.html',
  styleUrls: ['./sequence-logo-prompt.component.css']
})
export class SequenceLogoPromptComponent implements OnInit {
  _id: string = ""

  @Input() set Id(value: string) {
    this._id = value
    this.form = this.fb.group({
      "minfc": 0,
      "maxfc": 0,
      "minP" : 0,
      "maxP": 0,
      "minScore": this.settings.settings.probabilityFilterMap[this._id],
      "id": this._id,
      "direction": "both",
    })
  }

  form: FormGroup = this.fb.group({
    "minfc": 0,
    "maxfc": 0,
    "minP" : 0,
    "maxP": 0,
    "minScore": 0,
    "id": "",
    "direction": "both"
  })
  constructor(private fb: FormBuilder, public modal: NgbActiveModal, private settings: SettingsService) { }

  ngOnInit(): void {
  }

}
