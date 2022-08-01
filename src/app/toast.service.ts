import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  toasts: any[] = []
  constructor() { }

  show(header: string, body: string) {
    this.toasts.push({header, body})
  }

  remove(toast: any) {
    this.toasts = this.toasts.filter(t => t!=toast)
  }
}
