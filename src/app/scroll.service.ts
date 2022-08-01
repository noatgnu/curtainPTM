import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ScrollService {

  constructor() { }

  scrollToID(id: string) {
    let e = document.getElementById(id)
    if (e) {
      e.scrollIntoView()
    } else {
      let observer = new MutationObserver(mutations => {
        mutations.forEach(function (mutation) {
          let nodes = Array.from(mutation.addedNodes)
          for (const node of nodes) {
            if (node.contains(document.getElementById(id))) {
              e = document.getElementById(id)
              if (e) {
                e.scrollIntoView()
              }
              observer.disconnect()
              break
            }
          }
        })
      })
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true
      })
    }
    return e;
  }
}
