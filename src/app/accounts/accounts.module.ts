import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {AccountsComponent} from "./accounts/accounts.component";
import {LoginModalComponent} from "./login-modal/login-modal.component";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {
  NgbDropdown,
  NgbDropdownItem,
  NgbDropdownMenu,
  NgbDropdownToggle, NgbNav, NgbNavContent, NgbNavItem, NgbNavLink, NgbNavOutlet,
  NgbPaginationModule
} from "@ng-bootstrap/ng-bootstrap";
import {UserListsManagementComponent} from "./user-lists-management/user-lists-management.component";


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
    NgbNav,
    NgbNavItem,
    NgbNavLink,
    NgbNavContent,
    NgbNavOutlet,
    UserListsManagementComponent
  ],
  providers: [
  ]
})
export class AccountsModule { }
