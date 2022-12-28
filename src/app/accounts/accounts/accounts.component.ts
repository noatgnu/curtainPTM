import { Component, OnInit } from '@angular/core';
import {WebService} from "../../web.service";
import {AccountsService} from "../accounts.service";
import {FormBuilder} from "@angular/forms";

@Component({
  selector: 'app-accounts',
  templateUrl: './accounts.component.html',
  styleUrls: ['./accounts.component.scss']
})
export class AccountsComponent implements OnInit {
  data: any = {}
  form = this.fb.group({
    sessionDescription: ["",]
  })
  currentPage: number = 1
  totalItems: number = 0
  pageNumber: number = 0
  base = window.location.origin
  constructor(private web: WebService, public accounts: AccountsService, private fb: FormBuilder) {
    // @ts-ignore
    this.web.getCurtainLinks(this.accounts.user_name, this.form.value["sessionDescription"]).subscribe((data: any) => {
      data.results = data.results.map((a:any) => {
        a.created = new Date(a.created)
        return a
      })
      this.totalItems = data.count
      this.pageNumber = this.totalItems/20
      this.data = data
    })
  }

  ngOnInit(): void {
  }

  submit(page: number = 0) {
    // @ts-ignore
    this.web.getCurtainLinks(this.accounts.user_name, this.form.value["sessionDescription"], page*20).subscribe((data: any) => {
      data.results = data.results.map((a:any) => {
        a.created = new Date(a.created)
        return a
      })
      this.totalItems = data.count
      this.pageNumber = this.totalItems/20
      this.data = data
    })
  }
}
