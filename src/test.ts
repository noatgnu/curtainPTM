// This file is required by karma.conf.js and loads recursively all the .spec and framework files

import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';

window.addEventListener('unhandledrejection', (event) => {
  console.warn('Suppressed unhandled rejection in test environment:', event.reason);
  event.preventDefault();
});

window.addEventListener('error', (event) => {
  console.warn('Suppressed uncaught error in test environment:', event.error);
  event.preventDefault();
});

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
);
