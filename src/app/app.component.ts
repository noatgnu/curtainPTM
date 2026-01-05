import {AfterViewInit, Component, OnDestroy} from '@angular/core';
import {AccountsService} from "./accounts/accounts.service";
import {SwUpdate} from "@angular/service-worker";
import {Subscription} from "rxjs";
import {SettingsService} from "./settings.service";
import {environment} from "../environments/environment";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {CurtainStatsSummaryComponent} from "./components/curtain-stats-summary/curtain-stats-summary.component";
import {AnalyticsService} from "./analytics.service";

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    standalone: false
})
export class AppComponent implements AfterViewInit, OnDestroy {
  title = 'CurtainPTM';
  newVersionSubscription: Subscription|undefined;
  baseURL = environment.apiURL
  constructor(private accounts: AccountsService, private swUpdate: SwUpdate, private settings: SettingsService, private modal: NgbModal, private analytics: AnalyticsService) {
    const path = document.URL.replace(window.location.origin+"/", "")
    if (path.startsWith("?code=")) {
      const code = path.split("=")
      const rememberMe = localStorage.getItem("orcidRememberMe") === "true"
      this.accounts.ORCIDLogin(code[1], rememberMe).then((data: any) => {
        console.log(data)
        localStorage.removeItem("orcidRememberMe")
      })
    }
    this.analytics.initialize()
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
      }, 1000*10)
    }
  }

  ngOnDestroy(): void {
    if (this.newVersionSubscription) {
      this.newVersionSubscription.unsubscribe();
    }
  }
  openStatsSummary() {
    this.modal.open(CurtainStatsSummaryComponent, {size: "xl"})
  }
}
