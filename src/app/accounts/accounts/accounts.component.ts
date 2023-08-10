import { Component, OnInit } from '@angular/core';
import {WebService} from "../../web.service";
import {AccountsService} from "../accounts.service";
import {FormBuilder} from "@angular/forms";
import {forkJoin, Observable} from "rxjs";

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
  selectedLinks: any = {}
  selectedCount: number = 0
  constructor(private web: WebService, public accounts: AccountsService, private fb: FormBuilder) {
    // @ts-ignore

    this.accounts.getUser().then((data: any) => {
      this.accounts.curtainAPI.getCurtainLinks(this.accounts.curtainAPI.user.username, "").then((data: any) => {
        this.updateShowingLink(data)
      })
    })
  }

  ngOnInit(): void {
  }

  submit(page: number = 0) {
    // @ts-ignore
    this.accounts.curtainAPI.getCurtainLinks(this.accounts.curtainAPI.user.username, this.form.value["sessionDescription"], page*20).then((data: any) => {
      this.updateShowingLink(data);
    })
  }

  private updateShowingLink(data: any) {
    data.data.results = data.data.results.map((a: any) => {
      if (!(a.link_id in this.descriptionTrigger)) {
        this.descriptionTrigger[a.link_id] = false
        this.selectedLinks[a.link_id] = false
      }
      a.created = new Date(a.created)
      return a
    })
    this.totalItems = data.data.count
    this.pageNumber = this.totalItems / 20
    this.data = data.data
  }

  deleteLink(link_id: string) {
    this.accounts.deleteCurtainLink(link_id).then((res) => {
      this.submit(this.currentPage)
      this.accounts.getUser().then((res) => {})
    })
  }

  viewDescription(link_id: string) {
    this.descriptionTrigger[link_id] = !this.descriptionTrigger[link_id]
  }

  addOrRemoveFromSelected(link: string) {
    if (link in this.selectedLinks) {
      this.selectedLinks[link] = !this.selectedLinks[link]
    } else {
      this.selectedLinks[link] = false
    }
    if (this.selectedLinks[link]===true) {
      this.selectedCount ++
    } else {
      this.selectedCount --
    }
  }

  async addOwnerToLinks(owner: string) {
    for (const i in this.selectedLinks) {
      if (this.selectedLinks[i] === true) {
        console.log(`Adding ${owner} to ${i}`)
        await this.accounts.curtainAPI.addOwner(i, owner)
      }
    }
    // @ts-ignore
    const data: any = await this.accounts.curtainAPI.getCurtainLinks(this.accounts.curtainAPI.user.username, this.form.value["sessionDescription"])
    this.updateShowingLink(data);
    await this.accounts.getUser()

  }

  addOwnerToSelectedLinks(owner: string) {
    this.addOwnerToLinks(owner).then()
  }

  async removeLinks() {
    for (const i in this.selectedLinks) {
      if (this.selectedLinks[i] === true) {
        await this.accounts.deleteCurtainLink(i)
      }
    }

    // @ts-ignore
    const data: any = this.accounts.curtainAPI.getCurtainLinks(this.accounts.curtainAPI.user.username, this.form.value["sessionDescription"])
    this.updateShowingLink(data);
    await this.accounts.getUser()
  }

  removeSelectedLinks() {
    this.removeLinks().then()
  }

  async changePublicity(status: boolean) {
    for (const i in this.selectedLinks) {
      if (this.selectedLinks[i] === true) {
        await this.accounts.curtainAPI.updateSession({enable: status}, i)
      }
    }
    // @ts-ignore
    const data: any = this.accounts.curtainAPI.getCurtainLinks(this.accounts.curtainAPI.user.username, this.form.value["sessionDescription"])
    this.updateShowingLink(data);
    await this.accounts.getUser()
  }
  changePublicitySelectedLinks(status: boolean) {
    this.changePublicity(status).then()
  }
}
