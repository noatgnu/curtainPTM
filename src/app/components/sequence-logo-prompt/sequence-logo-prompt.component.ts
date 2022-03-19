import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup} from "@angular/forms";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-sequence-logo-prompt',
  templateUrl: './sequence-logo-prompt.component.html',
  styleUrls: ['./sequence-logo-prompt.component.css']
})
export class SequenceLogoPromptComponent implements OnInit {
  form: FormGroup = this.fb.group({
    "minfc": 0,
    "maxfc": 0,
    "minP" : 0,
    "maxP": 0,
    "minScore": 0,
  })
  constructor(private fb: FormBuilder, public modal: NgbActiveModal) { }

  ngOnInit(): void {
  }

}
