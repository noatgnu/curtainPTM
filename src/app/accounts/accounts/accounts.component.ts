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
  descriptionTrigger: any = {}
  constructor(private web: WebService, public accounts: AccountsService, private fb: FormBuilder) {
    // @ts-ignore
    this.web.getCurtainLinks(this.accounts.user_name, this.form.value["sessionDescription"]).subscribe((data: any) => {
      data.results = data.results.map((a:any) => {
        if (!(a.link_id in this.descriptionTrigger)) {
          this.descriptionTrigger[a.link_id] = false
        }
        a.created = new Date(a.created)
        return a
      })
      this.totalItems = data.count
      this.pageNumber = this.totalItems/20
      this.data = data
    })
    this.accounts.getUser()
  }

  ngOnInit(): void {
  }

  submit(page: number = 0) {
    // @ts-ignore
    this.web.getCurtainLinks(this.accounts.user_name, this.form.value["sessionDescription"], page*20).subscribe((data: any) => {
      data.results = data.results.map((a:any) => {
        if (!(a.link_id in this.descriptionTrigger)) {
          this.descriptionTrigger[a.link_id] = false
        }
        a.created = new Date(a.created)
        return a
      })
      this.totalItems = data.count
      this.pageNumber = this.totalItems/20
      this.data = data
    })
  }

  deleteLink(link_id: string) {
    this.accounts.deleteCurtainLink(link_id).subscribe((res) => {
      this.submit(this.currentPage)
      this.accounts.getUser()
    })
  }

  viewDescription(link_id: string) {
    this.descriptionTrigger[link_id] = !this.descriptionTrigger[link_id]
  }
}
