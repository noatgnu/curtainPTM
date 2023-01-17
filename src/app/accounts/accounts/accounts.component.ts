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
    this.web.getCurtainLinks(this.accounts.user_name, this.form.value["sessionDescription"]).subscribe((data: any) => {
      data.results = data.results.map((a:any) => {
        if (!(a.link_id in this.descriptionTrigger)) {
          this.descriptionTrigger[a.link_id] = false
          this.selectedLinks[a.link_id] = false
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
          this.selectedLinks[a.link_id] = false
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

  addOwnerToSelectedLinks(owner: string) {
    const actions: Observable<any>[] = []

    for (const i in this.selectedLinks) {
      if (this.selectedLinks[i] === true) {
        console.log(`Adding ${owner} to ${i}`)
        actions.push(this.web.addOwner(i, owner))
      }
    }
    actions[0].subscribe((data) => {
      if (actions.length > 1) {
        forkJoin(actions.slice(1)).subscribe(data => {
          // @ts-ignore
          this.web.getCurtainLinks(this.accounts.user_name, this.form.value["sessionDescription"]).subscribe((data: any) => {
            data.results = data.results.map((a:any) => {
              if (!(a.link_id in this.descriptionTrigger)) {
                this.descriptionTrigger[a.link_id] = false
                this.selectedLinks[a.link_id] = false
              }
              a.created = new Date(a.created)
              return a
            })
            this.totalItems = data.count
            this.pageNumber = this.totalItems/20
            this.data = data
          })
          this.accounts.getUser()
        })
      } else {
        // @ts-ignore
        this.web.getCurtainLinks(this.accounts.user_name, this.form.value["sessionDescription"]).subscribe((data: any) => {
          data.results = data.results.map((a:any) => {
            if (!(a.link_id in this.descriptionTrigger)) {
              this.descriptionTrigger[a.link_id] = false
              this.selectedLinks[a.link_id] = false
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
    })
  }

  removeSelectedLinks() {
    const actions: Observable<any>[] = []
    for (const i in this.selectedLinks) {
      if (this.selectedLinks[i] === true) {
        actions.push(this.accounts.deleteCurtainLink(i))
      }
    }
    forkJoin(actions).subscribe(data => {
      // @ts-ignore
      this.web.getCurtainLinks(this.accounts.user_name, this.form.value["sessionDescription"]).subscribe((data: any) => {
        data.results = data.results.map((a:any) => {
          if (!(a.link_id in this.descriptionTrigger)) {
            this.descriptionTrigger[a.link_id] = false
            this.selectedLinks[a.link_id] = false
          }
          a.created = new Date(a.created)
          return a
        })
        this.totalItems = data.count
        this.pageNumber = this.totalItems/20
        this.data = data
      })
      this.accounts.getUser()
    })
  }

  changePublicitySelectedLinks(status: boolean) {
    const actions: Observable<any>[] = []
    for (const i in this.selectedLinks) {
      if (this.selectedLinks[i] === true) {
        actions.push(this.web.updateSession({enable: status}, i))
      }
    }

    forkJoin(actions).subscribe(data => {
      // @ts-ignore
      this.web.getCurtainLinks(this.accounts.user_name, this.form.value["sessionDescription"]).subscribe((data: any) => {
        data.results = data.results.map((a:any) => {
          if (!(a.link_id in this.descriptionTrigger)) {
            this.descriptionTrigger[a.link_id] = false
            this.selectedLinks[a.link_id] = false
          }
          a.created = new Date(a.created)
          return a
        })
        this.totalItems = data.count
        this.pageNumber = this.totalItems/20
        this.data = data
      })
      this.accounts.getUser()
    })
  }
}
