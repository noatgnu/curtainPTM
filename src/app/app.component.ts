import {AfterViewInit, Component, OnDestroy} from '@angular/core';
import {AccountsService} from "./accounts/accounts.service";
import {SwUpdate} from "@angular/service-worker";
import {Subscription} from "rxjs";
import {SettingsService} from "./settings.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit, OnDestroy {
  title = 'CurtainPTM';
  newVersionSubscription: Subscription|undefined;
  constructor(private accounts: AccountsService, private swUpdate: SwUpdate, private settings: SettingsService) {
    const path = document.URL.replace(window.location.origin+"/", "")
    if (path.startsWith("?code=")) {
      const code = path.split("=")
      this.accounts.ORCIDLogin(code[1])
    }

  }

  ngAfterViewInit(): void {
    if (this.swUpdate.isEnabled) {
      setInterval(() => {
        this.swUpdate.checkForUpdate().then((available) => {
          if (available) {
            console.log("New version available")
            this.settings.newVersionAvailable = true;
          }
        })
      }, 1000*60)
    }
  }

  ngOnDestroy(): void {
    if (this.newVersionSubscription) {
      this.newVersionSubscription.unsubscribe();
    }
  }
}
