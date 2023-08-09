import { Injectable } from '@angular/core';
import {Settings} from "../app/classes/settings";

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  currentID: string = ""
  settings: Settings = new Settings();
  newVersionAvailable: boolean = false;
  constructor() { }
}
