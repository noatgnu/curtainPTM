import { Injectable, signal } from '@angular/core';

export type ToastType = 'info' | 'success' | 'warning' | 'error';
export type ToastAction = 'other' | 'download' | 'upload' | 'processing';

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
  private readonly _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();
  private maxToasts = 5

  show(
    header: string,
    body: string,
    delay: number = 5000,
    type: string = 'info',
    action: ToastAction = 'other'
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

    this._toasts.update(toasts => {
      const newToasts = toasts.length >= this.maxToasts ? toasts.slice(1) : [...toasts];
      return [...newToasts, toast];
    });
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
      this._toasts.update(toasts => toasts.filter(t => t.id !== toast.id));
    } else {
      this._toasts.update(toasts => toasts.filter(t => t !== toast));
    }
  }

  removeById(id: string): void {
    this._toasts.update(toasts => toasts.filter(t => t.id !== id));
  }

  clear(): void {
    this._toasts.set([]);
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
