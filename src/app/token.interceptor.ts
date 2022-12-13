import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor, HttpErrorResponse
} from '@angular/common/http';
import {catchError, concatMap, delay, Observable, of, retryWhen, switchMap, throwError} from 'rxjs';
import {AccountsService} from "./accounts.service";

@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  isRefreshing = false
  retryTimes = 3
  retryDelay = 3000
  constructor(private accounts: AccountsService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (!request.url.endsWith("/token/refresh/")) {
      if (request.url.endsWith("/logout/")) {
        return next.handle(request)
      }
      if (this.accounts.loggedIn) {
        const currentTime = new Date()
        const diffTime = currentTime.getTime() - this.accounts.lastTokenUpdateTime.getTime()
        const minDiffTime = Math.floor(diffTime/60000)
        if (minDiffTime > 5) {
          return this.accounts.refresh().pipe(switchMap((token: any) => {
              this.accounts.accessToken = token.access
              this.accounts.lastTokenUpdateTime = new Date()
              return next.handle(this.addTokenHeader(request))
            }),
            catchError((err) => {
              this.isRefreshing = false
              this.accounts.logout().subscribe(data => {
                console.log("logged out")
              })
              return throwError(err)
            })
          )
        }
        request = this.addTokenHeader(request);
      }
    }

    return next.handle(request).pipe(catchError(err => {
      if (request.url.startsWith("https://rest.uniprot.org") && err.status === 500) {
        return this.uniprotErrorRetry(request, next)
      }
      if (request.url.endsWith("/token/refresh/")) {
        this.accounts.removeLocalStorage()
        this.accounts.loggedIn = false
        this.accounts.accessToken = ""
        this.accounts.refreshToken = ""
        console.log("logged out")
      } else if (err instanceof HttpErrorResponse && !request.url.endsWith("/token/")) {
        if (err.status === 401) {
          return this.handle401Error(request, next)
        }
      }
      return throwError(err)
    }));


  }

  uniprotErrorRetry(request: HttpRequest<unknown>, next: HttpHandler) {
    return next.handle(request).pipe(retryWhen(err => err.pipe(
        concatMap((error, count) => {
          if (count <= this.retryTimes && error.status === 500) {
            return of(error)
          }
          return throwError(error)
        }), delay(this.retryDelay)
      )
    ));
  }

  private addTokenHeader(request: HttpRequest<unknown>) {
    console.log(this.accounts.accessToken)
    if (!request.url.endsWith("/token")) {
      if (this.accounts.accessToken !== "") {
        request = request.clone({
          headers:
            request.headers
              .set("Authorization", `Bearer ${this.accounts.accessToken}`)
        })
        // request = request.clone({
        //   headers:
        //     request.headers
        //       .set("HTTP_X_XSRF_TOKEN", `${this.csrfTokenExtractor.getToken() as string}`)
        // })
      }
    }
    return request;
  }

  handle401Error(request: HttpRequest<unknown>, next: HttpHandler) {
    if (!this.isRefreshing) {
      this.isRefreshing = true
      this.accounts.accessToken = ""
      if (this.accounts.refreshToken !== "") {
        return this.accounts.refresh().pipe(
          switchMap((token: any) => {
            this.isRefreshing = false
            this.accounts.accessToken = token.access
            this.accounts.lastTokenUpdateTime = new Date()
            return next.handle(this.addTokenHeader(request))
          }),
          catchError((err) => {
            this.isRefreshing = false
            this.accounts.logout().subscribe()
            return throwError(err)
          })
        )
      }
    }
    return this.accounts.refresh().pipe(switchMap((token: any) => {
      this.accounts.accessToken = token.access
      this.accounts.lastTokenUpdateTime = new Date()
      return next.handle(this.addTokenHeader(request))
    }))
  }
}
