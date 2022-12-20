import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SocialLoginModule, SocialAuthServiceConfig } from '@abacritt/angularx-social-login';
import {
  GoogleLoginProvider,
  FacebookLoginProvider
} from '@abacritt/angularx-social-login';
import {AccountsComponent} from "./accounts/accounts.component";
import {LoginModalComponent} from "./login-modal/login-modal.component";
import {ReactiveFormsModule} from "@angular/forms";
import {environment} from "../../environments/environment";


@NgModule({
  declarations: [
    AccountsComponent,
    LoginModalComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SocialLoginModule,

  ],
  providers: [
    {
      provide: 'SocialAuthServiceConfig',
      useValue: {
        autoLogin: false,
        providers: [
          {
            id: GoogleLoginProvider.PROVIDER_ID,
            provider: new GoogleLoginProvider(
              environment.google
            )
          },
          {
            id: FacebookLoginProvider.PROVIDER_ID,
            provider: new FacebookLoginProvider('clientId')
          }
        ],
        onError: (err) => {
          console.error(err);
        }
      } as SocialAuthServiceConfig,
    }
  ]
})
export class AccountsModule { }
