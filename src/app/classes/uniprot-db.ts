import PouchDB from "pouchdb";

export class UniprotDb {
  db = new PouchDB("uniprot");
  constructor() {
    this.db.info().then((info) => {
      console.log(info);
    });
  }

  init() {
    return this.db.destroy().then(() => {
      console.log("Database destroyed");
      this.db = new PouchDB("uniprot");
      console.log("Database created");
    });
  }

  set(key: string, value: any) {
    value["_id"] = key;
    return this.db.put(value);
  }

  get(key: string) {
    return this.db.get(key);
  }

  has(key: string) {
    return this.db.get(key);
  }

}
