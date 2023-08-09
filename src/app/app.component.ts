import {AfterViewInit, Component, OnDestroy} from '@angular/core';
import {AccountsService} from "./accounts/accounts.service";
import {SwUpdate} from "@angular/service-worker";
import {Subscription} from "rxjs";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit, OnDestroy {
  title = 'CurtainPTM';
  newVersionAvailable: boolean = false;
  newVersionSubscription: Subscription|undefined;
  constructor(private accounts: AccountsService, private swUpdate: SwUpdate) {
    const path = document.URL.replace(window.location.origin+"/", "")
    if (path.startsWith("?code=")) {
      const code = path.split("=")
      this.accounts.ORCIDLogin(code[1])
    }

  }

  ngAfterViewInit(): void {
    if (this.swUpdate.isEnabled) {
      this.newVersionSubscription = this.swUpdate.available.subscribe(() => {
        this.newVersionAvailable = true;
      });
    }
  }

  ngOnDestroy(): void {
    if (this.newVersionSubscription) {
      this.newVersionSubscription.unsubscribe();
    }
  }
}
