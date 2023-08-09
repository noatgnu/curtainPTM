import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {AccountsComponent} from "./accounts/accounts.component";
import {LoginModalComponent} from "./login-modal/login-modal.component";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {
  NgbDropdown,
  NgbDropdownItem,
  NgbDropdownMenu,
  NgbDropdownToggle,
  NgbPaginationModule
} from "@ng-bootstrap/ng-bootstrap";


@NgModule({
  declarations: [
    AccountsComponent,
    LoginModalComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgbPaginationModule,
    FormsModule,
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownMenu,
    NgbDropdownItem,
  ],
  providers: [
  ]
})
export class AccountsModule { }
