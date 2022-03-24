import { Component, OnInit } from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {FormBuilder, FormGroup} from "@angular/forms";

@Component({
  selector: 'app-advance-highlights',
  templateUrl: './advance-highlights.component.html',
  styleUrls: ['./advance-highlights.component.css']
})
export class AdvanceHighlightsComponent implements OnInit {
  form: FormGroup = this.fb.group({
    minfc: 0,
    maxfc: 0,
    minP: 0,
    maxP: 0,
    direction: "both"
  })
  constructor(public activeModal: NgbActiveModal, private fb: FormBuilder) { }

  ngOnInit(): void {
  }

}
