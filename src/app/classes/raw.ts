export class Raw {
  get primaryIDs(): string {
    return this._primaryIDs;
  }

  set primaryIDs(value: string) {
    this._primaryIDs = value;
  }

  get samples(): string[] {
    return this._samples;
  }

  set samples(value: string[]) {
    this._samples = value;
  }
  private _primaryIDs: string = "T: Unique identifier"
  private _samples: string[] = []

  restore(value: any) {
    for (const i in value) {
      // @ts-ignore
      this[i] = value[i]
    }
  }


}
