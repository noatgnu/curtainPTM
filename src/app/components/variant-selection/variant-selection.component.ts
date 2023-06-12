import {Component, Input, OnInit} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {FormBuilder} from "@angular/forms";

@Component({
  selector: 'app-variant-selection',
  templateUrl: './variant-selection.component.html',
  styleUrls: ['./variant-selection.component.scss']
})
export class VariantSelectionComponent implements OnInit {
  private _data: string[] = []
  @Input() set data(value: string[]) {
    this._data = value
  }

  get data(): string[] {
    return this._data
  }

  form = this.fb.group({
    isoforms: [""],
    sequence: [""],
    returnToDefault: [false],
  })
  constructor(private modal: NgbActiveModal, private fb: FormBuilder) { }

  ngOnInit(): void {
  }

  close() {
    this.modal.dismiss()
  }

  updateSelection() {
    this.modal.close(this.form.value)
  }

  returnToDefault() {
    this.modal.close({returnToDefault: true})
  }
}
