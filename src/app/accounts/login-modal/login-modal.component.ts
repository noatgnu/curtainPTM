import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {UntypedFormBuilder, Validators} from "@angular/forms";
import {AccountsService} from "../accounts.service";
import {WebService} from "../../web.service";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {Subject, Subscription} from "rxjs";
import {ToastService} from "../../toast.service";
import {environment} from "../../../environments/environment";
import {DataService} from "../../data.service";

@Component({
  selector: 'app-login-modal',
  templateUrl: './login-modal.component.html',
  styleUrls: ['./login-modal.component.scss'],
  standalone: false
})
export class LoginModalComponent implements OnInit, OnDestroy {
  allowOrcid = true
  @ViewChild('orcidWidget') orcidWidget: ElementRef|undefined
  orcid: string = environment.orcid
  form = this.fb.group({
    username: [null, Validators.required],
    password: [null, Validators.required],
    remember_me: [false]
  })

  loginStatus: Subject<boolean> = new Subject<boolean>()
  loginWatcher: NodeJS.Timeout|undefined
  isLoading: boolean = false
  showPassword: boolean = false
  loginError: string = ''
  rememberMeDays: number = 0

  constructor(private dataService: DataService, public modal: NgbActiveModal, private fb: UntypedFormBuilder, private accounts: AccountsService, private web: WebService, private toast: ToastService) {

  }

  ngOnInit(): void {
    this.accounts.curtainAPI.getSiteProperties().then(response => {
      if (response.data) {
        this.rememberMeDays = response.data.jwt_remember_me_refresh_token_lifetime_days
      }
    }).catch(err => {
      console.error('Failed to load site properties:', err)
    })
  }

  login() {
    if (this.form.valid) {
      this.isLoading = true
      this.loginError = ''

      this.accounts.login(this.form.value["username"], this.form.value["password"], this.form.value["remember_me"] || false).then((data: any) => {
        this.processLogin(data)
      }).catch((error: any) => {
        this.isLoading = false
        this.loginError = 'Invalid username or password. Please try again.'
        this.toast.show("Login Error", "Incorrect Login Credential.").then()
      })
    } else {
      Object.keys(this.form.controls).forEach(key => {
        this.form.get(key)?.markAsTouched()
      })
    }
  }

  processLogin(data: any) {
    this.accounts.curtainAPI.getUserInfo().then((data: any) => {
      this.form.reset()
      this.loginStatus.next(true)
      this.isLoading = false
      this.modal.dismiss()
      this.toast.show("Login Information","Login Successful.").then()
    }, error =>{
      this.isLoading = false
      this.loginError = 'Failed to retrieve user information. Please try again.'
      this.toast.show("Login Error", "Incorrect Login Credential.").then()
    })
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword
  }

  clickOrcid() {
    localStorage.setItem("urlAfterLogin", document.URL)
    localStorage.setItem("orcidRememberMe", this.form.value["remember_me"] ? "true" : "false")
    this.loginWatcher = setInterval(()=> {
      console.log("ORCID LOGIN CHECK")
      this.accounts.reload().then(() => {
        if (this.accounts.curtainAPI.user.access_token && this.accounts.curtainAPI.user.access_token.length > 0) {
          console.log("ORCID LOGIN SUCCESSFUL")
          if (this.accounts.curtainAPI.user.isStaff) {
            this.accounts.curtainAPI.getDataCites(undefined, undefined, "draft", 10, 0, true, "PTM").then((data: any) => {
              this.dataService.draftDataCiteCount = data.data.count
            })
          }
          localStorage.removeItem("orcidRememberMe")
          this.modal.dismiss()
          clearInterval(this.loginWatcher)
        }

      })

    }, 1000)
  }

  ngOnDestroy() {
    if (this.loginWatcher) {
      clearInterval(this.loginWatcher)
    }
  }
}
