import {AfterViewInit, Component} from '@angular/core';
import {AccountsService} from "./accounts/accounts.service";
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {
  title = 'CurtainPTM';

  constructor(private accounts: AccountsService) {
    const path = document.URL.replace(window.location.origin+"/", "")
    if (path.startsWith("?code=")) {
      const code = path.split("=")
      this.accounts.ORCIDLogin(code[1])
    }

  }

  ngAfterViewInit(): void {

  }
}
