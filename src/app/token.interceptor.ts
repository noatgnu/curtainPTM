import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import {concatMap, delay, Observable, of, retryWhen, throwError} from 'rxjs';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {

  retryTimes = 3
  retryDelay = 3000
  constructor() {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    console.log(request)
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
}
