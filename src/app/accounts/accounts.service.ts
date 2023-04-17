import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {environment} from "../../environments/environment";
import {ToastService} from "../toast.service";
import {CurtainWebAPI} from "curtain-web-api";

@Injectable({
  providedIn: 'root'
})
export class AccountsService {

  curtainAPI: CurtainWebAPI = new CurtainWebAPI(environment.apiURL)

  isOwner: boolean = false

  constructor(private http: HttpClient, private toast: ToastService) {

  }

  reload() {
    return this.curtainAPI.user.loadFromDB().then((data: any) => {
      return data;
    })
  }

  getUser(reNavigate: boolean = false) {
    return this.curtainAPI.getUserInfo().then((data: any) => {
      this.toast.show("Login Information", "User information updated.").then(() => {
        const url = localStorage.getItem("urlAfterLogin")
        if (url && reNavigate) {
          window.location.assign(url)
        }
      })
    }).catch((error: any) => {
      this.toast.show("Error", "User data retrieval error.").then()
      return error
    })
  }

  login(username: string, password: string) {
    return this.curtainAPI.login(username, password).then((data: any) => {return data}).catch((error: any) => {
      this.toast.show("Login Error", "Incorrect Login Credential.").then()
      return error
    })
  }

  refresh() {
    return this.curtainAPI.refresh().then((data: any) => {return data}).catch((error: any) => {
      this.toast.show("Error", "User data update error.").then()
      return error
    })
  }

  logout() {
    return this.curtainAPI.logout().then((data: any) => {
      this.toast.show("Login Information", "Logout Successful.").then()
    }).catch((error: any) => {
      return error
    })
  }
  removeLocalStorage() {
    localStorage.removeItem("lastTokenUpdateTime")
    localStorage.removeItem("lastRefreshTokenUpdateTime")
    localStorage.removeItem("accessToken")
    localStorage.removeItem("refreshToken")
    localStorage.removeItem("userName")
    localStorage.removeItem("userId")
    localStorage.removeItem("userStaff")
    console.log("Storage data cleared.")
  }


  getSessionPermission(): boolean {
    if (this.curtainAPI.user.isStaff) {
      return true
    } else if (this.isOwner) {
      return true
    }
    return false
  }


  postORCIDCode(data: string) {
    return this.curtainAPI.ORCIDLogin(data, window.location.origin+"/").then((data: any) => {return data}).catch((error: any) => {
      return error
    })
  }

  ORCIDLogin(data: string) {
    return this.postORCIDCode(data).then((data:any) => {
      return data
    }).catch((error: any) => {
      return error
    })
  }


  deleteCurtainLink(link_id: string) {
    return this.curtainAPI.deleteCurtainLink(link_id).then((data: any) => {
      return data
    }).catch((error: any) => {
      return error
    })
  }
}
