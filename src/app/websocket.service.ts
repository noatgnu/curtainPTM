import { Injectable, signal } from '@angular/core';
import { Observable } from "rxjs";
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import * as readableIDs from "uuid-readable";
import { AccountsService } from "./accounts/accounts.service";

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  baseUrl = ""
  connection: WebSocketSubject<any> | undefined
  sessionID: string = readableIDs.short(crypto.randomUUID()).replace(/\s/g, "")
  personalID: string = readableIDs.short(crypto.randomUUID()).replace(/\s/g, "")
  displayName: string = "Anonymous"

  private readonly _resubscribeCounter = signal(0);
  readonly resubscribe = this._resubscribeCounter.asReadonly();

  connecting: boolean = false

  constructor(private accounts: AccountsService) {}

  connect(): WebSocketSubject<any> {
    this.connecting = true
    this.baseUrl = this.accounts.curtainAPI.baseURL.replace("http", "ws")
    const url = this.baseUrl + "ws/curtain/" + this.sessionID + "/" + this.personalID + "/"
    if (!this.connection) {
      this.connection = webSocket({
        url,
        closeObserver: {
          next: () => {
            this.connection = undefined
            setTimeout(() => this.reconnect(), 3000)
          }
        }
      })
      this.connecting = false
      return this.connection
    } else {
      this.connecting = false
      return this.connection
    }
  }

  send(message: any) {
    this.connection?.next(message)
  }

  close() {
    this.connection?.complete()
    this.connection = undefined
  }

  reconnect() {
    this.close()
    this.connection = this.connect()
    if (this.connection) {
      this._resubscribeCounter.update(v => v + 1)
    }
  }

  getMessages(): Observable<any> | undefined {
    return this.connection?.asObservable()
  }
}
