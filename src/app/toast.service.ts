import { Injectable } from '@angular/core';

export type ToastType = 'info' | 'success' | 'warning' | 'error';
export type ToastAction = 'other' | 'download' | 'upload';

export interface Toast {
  id: string;
  header: string;
  body: string;
  delay: number;
  type: ToastType;
  action: ToastAction;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  toasts: Toast[] = []
  private maxToasts = 5

  show(
    header: string,
    body: string,
    delay: number = 5000,
    type: string = 'info',
    action: 'other' | 'download' | 'upload' = 'other'
  ): Promise<Toast> {
    const toast: Toast = {
      id: this.generateId(),
      header,
      body,
      delay,
      type: this.normalizeType(type),
      action,
      timestamp: Date.now()
    }

    if (this.toasts.length >= this.maxToasts) {
      this.toasts.shift()
    }

    this.toasts.push(toast)
    return Promise.resolve(toast)
  }

  showInfo(header: string, body: string, delay: number = 5000): Promise<Toast> {
    return this.show(header, body, delay, 'info')
  }

  showSuccess(header: string, body: string, delay: number = 5000): Promise<Toast> {
    return this.show(header, body, delay, 'success')
  }

  showWarning(header: string, body: string, delay: number = 5000): Promise<Toast> {
    return this.show(header, body, delay, 'warning')
  }

  showError(header: string, body: string, delay: number = 8000): Promise<Toast> {
    return this.show(header, body, delay, 'error')
  }

  remove(toast: Toast | any): void {
    if (toast?.id) {
      this.toasts = this.toasts.filter(t => t.id !== toast.id)
    } else {
      this.toasts = this.toasts.filter(t => t !== toast)
    }
  }

  removeById(id: string): void {
    this.toasts = this.toasts.filter(t => t.id !== id)
  }

  clear(): void {
    this.toasts = []
  }

  getToastClasses(toast: Toast): string {
    const typeClasses: Record<ToastType, string> = {
      info: 'bg-primary text-light',
      success: 'bg-success text-light',
      warning: 'bg-warning text-dark',
      error: 'bg-danger text-light'
    }
    return typeClasses[toast.type] || typeClasses.info
  }

  getToastIcon(toast: Toast): string {
    const icons: Record<ToastType, string> = {
      info: 'bi-info-circle-fill',
      success: 'bi-check-circle-fill',
      warning: 'bi-exclamation-triangle-fill',
      error: 'bi-x-circle-fill'
    }
    return icons[toast.type] || icons.info
  }

  isLightBackground(toast: Toast): boolean {
    return toast.type === 'warning'
  }

  private generateId(): string {
    return `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  }

  private normalizeType(type: string): ToastType {
    const validTypes: ToastType[] = ['info', 'success', 'warning', 'error']
    if (validTypes.includes(type as ToastType)) {
      return type as ToastType
    }
    if (type === 'danger') {
      return 'error'
    }
    return 'info'
  }
}
