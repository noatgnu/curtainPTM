import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {environment} from "../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class AccountsService {
  get is_owner(): boolean {
    return this._is_owner;
  }

  set is_owner(value: boolean) {
    this._is_owner = value;
  }

  private _is_owner: boolean = false

  get user_id(): number {
    return this._user_id;
  }

  set user_id(value: number) {
    localStorage.setItem("userId", `${value}`)
    this._user_id = value;
  }

  get user_name(): string {
    return this._user_name;
  }

  set user_name(value: string) {
    localStorage.setItem("userName", `${value}`)
    this._user_name = value;
  }

  get user_staff(): boolean {
    return this._user_staff;
  }

  set user_staff(value: boolean) {
    localStorage.setItem("userStaff", `${value}`)
    this._user_staff = value;
  }
  get loggedIn(): boolean {
    return this._loggedIn;
  }

  private _user_id: number = 0
  private _user_name: string = ""
  private _user_staff: boolean = false

  set loggedIn(value: boolean) {
    this._loggedIn = value;
  }
  get lastRefreshTokenUpdateTime(): Date {
    return this._lastRefreshTokenUpdateTime;
  }

  set lastRefreshTokenUpdateTime(value: Date) {
    localStorage.setItem("lastRefreshTokenUpdateTime", value.getTime().toString())
    this._lastRefreshTokenUpdateTime = value;
  }
  get lastTokenUpdateTime(): Date {
    return this._lastTokenUpdateTime;
  }

  set lastTokenUpdateTime(value: Date) {
    this._lastTokenUpdateTime = value;
    localStorage.setItem("lastTokenUpdateTime", value.getTime().toString())
  }
  get accessToken(): string {
    return this._accessToken;
  }

  set accessToken(value: string) {
    this._accessToken = value;
    localStorage.setItem("accessToken", value)
  }

  get refreshToken(): string {
    return this._refreshToken;
  }

  set refreshToken(value: string) {
    this._refreshToken = value;
    localStorage.setItem("refreshToken", value)
  }

  host = environment.apiURL
  private _loggedIn = false
  private _accessToken = ""
  private _refreshToken = ""

  private _lastTokenUpdateTime = new Date()
  private _lastRefreshTokenUpdateTime = new Date()

  constructor(private http: HttpClient) {

  }

  reload() {
    if (localStorage.getItem("lastTokenUpdateTime")) {
      this._lastTokenUpdateTime = new Date(parseInt(localStorage.getItem("lastTokenUpdateTime") as string))
    }
    if (localStorage.getItem("lastRefreshTokenUpdateTime")) {
      this._lastRefreshTokenUpdateTime = new Date(parseInt(localStorage.getItem("lastRefreshTokenUpdateTime") as string))
      const expiry = this.checkRefreshTokenExpiry()
      if (expiry) {
        this.removeLocalStorage()
        this._accessToken = ""
        this._refreshToken = ""
      } else {
        if (localStorage.getItem("accessToken")) {
          this._accessToken = localStorage.getItem("accessToken") as string
        }
        if (localStorage.getItem("refreshToken")) {
          this._refreshToken = localStorage.getItem("refreshToken") as string
        }
        if (localStorage.getItem("userId")) {
          this._user_id = parseInt(localStorage.getItem("userId") as string)
        }
        if (localStorage.getItem("userName")) {
          this._user_name = localStorage.getItem("userName") as string
        }
        if (localStorage.getItem("userStaff")) {
          if (localStorage.getItem("userStaff") as string === "true") {
            this._user_staff = true
          }
        }
        this.loggedIn = true
        console.log("Logged in")
      }
    }
  }

  login(username: string, password: string) {
    let headers = new HttpHeaders()
    headers = headers.set("Accept", "application/json")
    headers = headers.set("withCredentials", "true")
    return this.http.post(this.host + "token/", {username, password}, {responseType: "json", observe: "body", headers})
  }

  refresh() {
    let headers = new HttpHeaders()
    headers = headers.set("Accept", "application/json")
    return this.http.post(this.host + "token/refresh/", {"refresh": this._refreshToken}, {responseType: "json", observe: "body", headers})
  }

  logout() {
    this.removeLocalStorage()
    let headers = new HttpHeaders()
    headers = headers.set("Accept", "application/json")
    headers = headers.set("Authorization", `Bearer ${this._accessToken}`)
    const refresh_token = this._refreshToken.slice()
    this._accessToken = ""
    this._refreshToken = ""
    this._loggedIn = false
    return this.http.post(this.host + "logout/", {refresh_token}, {responseType: "json", observe: "body", headers})
  }

  removeLocalStorage() {
    localStorage.clear()
    console.log("Storage data cleared.")
    //localStorage.removeItem("lastTokenUpdateTime")
    //localStorage.removeItem("lastRefreshTokenUpdateTime")
    //localStorage.removeItem("accessToken")
    //localStorage.removeItem("refreshToken")
    //localStorage.removeItem("userId")
  }

  checkRefreshTokenExpiry() {
    this._lastRefreshTokenUpdateTime = new Date(parseInt(localStorage.getItem("lastRefreshTokenUpdateTime") as string))
    const currentTime = new Date()
    const diffTime = Math.floor(currentTime.getTime() - this._lastRefreshTokenUpdateTime.getTime())/1000/60/60
    console.log(diffTime)
    if (diffTime > 24) {
      return true
    } else {
      return false
    }
  }

  getSessionPermission(): boolean {
    if (this.user_staff) {
      return true
    } else if (this.is_owner) {
      return true
    }
    return false
  }
}
