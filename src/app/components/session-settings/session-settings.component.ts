import {Component, Input, OnInit} from '@angular/core';
import {FormBuilder} from "@angular/forms";
import {WebService} from "../../web.service";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-session-settings',
  templateUrl: './session-settings.component.html',
  styleUrls: ['./session-settings.component.scss']
})
export class SessionSettingsComponent implements OnInit {

  private _currretID: string = ""
  @Input() set currentID(value: string) {
    this._currretID = value
    this.web.getSessionSettings(this.currentID).subscribe((data: any) => {
      for (const i in data) {
        if (i in this.form.value) {
          this.form.controls[i].setValue(data[i])
        }
      }
    })
  }
  get currentID(): string {
    return this._currretID
  }
  form = this.fb.group({
    enable: [true,],
  })
  temporaryLink: string = ""
  constructor(private fb: FormBuilder, private web: WebService, private modal: NgbActiveModal ) {

  }

  ngOnInit(): void {
  }

  generateTemporarySession() {
    this.web.generateTemporarySession(this.currentID).subscribe((data:any) => {
      this.temporaryLink = location.origin + `/#/${data["link_id"]}&${data["token"]}`
    })
  }

  submit() {
    this.web.updateSession(this.form.value, this.currentID).subscribe(data => {
      this.modal.dismiss()
    })
  }

}
