import { Component, OnInit } from '@angular/core';
import {WebService} from "../../web.service";
import {AccountsService} from "../accounts.service";

@Component({
  selector: 'app-accounts',
  templateUrl: './accounts.component.html',
  styleUrls: ['./accounts.component.scss']
})
export class AccountsComponent implements OnInit {
  data: any = {}
  constructor(private web: WebService, private accounts: AccountsService) {
    this.web.getCurtainLinks(this.accounts.user_name).subscribe((data: any) => {
      data.results = data.results.map((a:any) => {
        a.created = new Date(a.created)
        return a
      })
      this.data = data
    })
  }

  ngOnInit(): void {
  }

}
