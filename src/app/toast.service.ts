import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  toasts: { header: string, body: string, delay: number, type: string, action: string }[] = []

  constructor() {
  }

  async show(header: string, body: string, delay: number = 5000, type: string = "info", action: "other" | "download" | "upload" = "other") {
    this.toasts.push({header, body, delay, type, action})
  }

  remove(toast: any) {
    this.toasts = this.toasts.filter(t => t != toast)
  }
}
