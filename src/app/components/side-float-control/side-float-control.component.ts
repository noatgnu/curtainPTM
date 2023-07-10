import {Component, ElementRef, EventEmitter, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {WebsocketService} from "../../websocket.service";
import {FormBuilder} from "@angular/forms";
import {debounceTime, distinctUntilChanged, map, Observable, OperatorFunction, Subscription} from "rxjs";
import {DataService} from "../../data.service";
import {SaveStateService} from "../../save-state.service";

interface Message {
  senderID: string,
  senderName: string,
  message: any,
  requestType: string
}

@Component({
  selector: 'app-side-float-control',
  templateUrl: './side-float-control.component.html',
  styleUrls: ['./side-float-control.component.scss']
})

export class SideFloatControlComponent implements OnInit, OnDestroy {
  toggleChatPanel: boolean = false
  messagesList: Message[] = []
  form = this.fb.group({
    message: ['']
  })

  senderMap: {[key: string]: string} = {'system': 'System'}

  @ViewChild("chatbox") chatbox: ElementRef|undefined
  @Output() searchChatSelection: EventEmitter<any> = new EventEmitter()
  webSub: Subscription | undefined
  params = {
    enableAdvanced: false,
    searchLeft: false,
    searchRight: false,
    maxFCRight: 0,
    maxFCLeft: 0,
    minFCRight: 0,
    minFCLeft: 0,
    maxP: 0,
    minP: 0,
    significantOnly: false
  }

  allCommands: string[] = [
    "!searchgene",
    "!searchpid",
    "!rd",
    "!anngene",
    "!annpid",
    "!savestate"
  ]
  constructor(private saveState: SaveStateService, private ws: WebsocketService, private fb: FormBuilder, private data: DataService) {
    this.ws.connection = this.ws.connect()
    if (this.webSub) {
      this.webSub.unsubscribe()
    }
    this.setSubscription();
    this.ws.reSubscribeSubject.asObservable().subscribe((data: boolean) => {
      if (data) {
        this.webSub?.unsubscribe()
        this.setSubscription();
      }
    })
  }
  commandCompleteModel: string = ""
  private setSubscription() {
    console.log("set subscription")
    this.webSub = this.ws.getMessages()?.subscribe((data: any) => {
      data.message.timestamp = new Date(data.message.timestamp)
      this.messagesList = [data].concat(this.messagesList)
      this.senderMap[data.senderID] = data.senderName
      this.chatbox?.nativeElement.scrollTo(0, this.chatbox.nativeElement.scrollHeight)
    }, (error: any) => {
      console.log(error)
    }, () => {
      console.log("complete")
    })
  }

  ngOnInit(): void {
  }

  sendMessage() {
    let message = this.form.value.message?.slice()
    if (this.form.value.message !== this.commandCompleteModel) {
      message = this.commandCompleteModel
    }
    if (message !== "" && !message?.startsWith("@") && !message?.startsWith("!")) {
      this.ws.send({message: {message: message, timestamp: Date.now()}, senderName: this.ws.displayName, requestType: "chat"})
    } else if (message?.startsWith("!")) {
      const command = message.split(" ")
      const firstParameter = command[0]
      switch (firstParameter) {
        case "!searchgene":
          this.searchGene(command);
          break;
        case "!searchpid":
          this.searchPID(command);
          break
        case "!rd":
          this.data.redrawTrigger.next(true)
          this.data.selectionUpdateTrigger.next(true)
          break
        case "!anngene":
          this.annotateGene(command)
          break
        case "!annpid":
          this.annotatePid(command)
          break
        case "!savestate":
          this.saveStateCommand(command)
          break
        default:
          const message = {message: {message: "Command not found", timestamp: Date.now()}, senderID: "system", senderName: "System", requestType: "chat-system"}
          this.messagesList = [message].concat(this.messagesList)
      }

    } else {
      //const message: Message = {message: {message: this.form.value.message, timestamp: Date.now()}, senderID: "system", senderName: "System", requestType: "chat-system"}
      this.ws.send({message: {message: message, timestamp: Date.now()}, senderName: this.ws.displayName, requestType: "chat"})
    }

    this.form.reset()
    this.commandCompleteModel = ""

  }
  saveStateCommand(command: string[]) {
    console.log(command)
    if (command[0] === "!savestate") {
      if (command.length === 1) {
        const stateNumber = this.saveState.saveState()
        const message: Message = {
          message: {message: `Saved state ${stateNumber}`, timestamp: Date.now()},
          senderID: "system",
          senderName: "System",
          requestType: "chat-system-save-state-save"
        }
        this.messagesList = [message].concat(this.messagesList)
      } else if (command.length === 3) {
        if (command[1] === "-l") {
          this.saveState.loadState(parseInt(command[2]))
          const message: Message = {
            message: {message: `Load state ${command[2]}`, timestamp: Date.now()},
            senderID: "system",
            senderName: "System",
            requestType: "chat-system-save-state-load"
          }
          this.messagesList = [message].concat(this.messagesList)
        } else if (command[1] === "-r") {
          this.saveState.removeState(parseInt(command[2]))
          const message: Message = {
            message: {message: `Removed load state ${command[2]}`, timestamp: Date.now()},
            senderID: "system",
            senderName: "System",
            requestType: "chat-system-save-state-load"
          }
          this.messagesList = [message].concat(this.messagesList)
        }
      } else if (command.length === 2) {
        if (command[1] === "-a") {
          const message: Message = {
            message: {message: {data: this.saveState.states}, timestamp: Date.now()},
            senderID: "system",
            senderName: "System",
            requestType: "chat-system-save-state-all"
          }
          this.messagesList = [message].concat(this.messagesList)
        } else if (command[1] === "-ra") {
          this.saveState.removeAllStates()
          const message: Message = {
            message: {message: "All local save states have been removed", timestamp: Date.now()},
            senderID: "system",
            senderName: "System",
            requestType: "chat-system-save-state"
          }
          this.messagesList = [message].concat(this.messagesList)
        }
      }
    }
  }
  private searchPID(command: string[]) {
    if (command.length > 1) {
      const pidList = []
      const dataObject: any = {}
      for (const c of command) {
        if (c.startsWith("@")) {
          const pid = c.substring(1)
          dataObject[pid] = c.substring(1).split(";")
          pidList.push(pid)
        }
      }
      const message: Message = {
        message: {message: `Search for ${pidList.length} PIDs`, timestamp: Date.now()},
        senderID: "system",
        senderName: "System",
        requestType: "chat-system"
      }
      if (pidList.length > 0) {
        this.messagesList = [message].concat(this.messagesList)

        const payload = {
          searchType: "Primary IDs",
          data: dataObject,
          title: `Search #${this.data.selectOperationNames.length}`,
          params: Object.assign(this.params)
        }
        this.data.searchCommandService.next(payload)
      } else {
        message.message.message = "No primary ids found"
        this.messagesList = [message].concat(this.messagesList)
      }
    }
  }
  private searchGene(command: string[]) {
    if (command.length > 1) {
      const geneList = []
      const dataObject: any = {}
      for (const c of command) {
        if (c.startsWith("@")) {
          const gene = c.substring(1)
          dataObject[gene] = c.substring(1).split(";")
          geneList.push(gene)
        }
      }
      const message: Message = {
        message: {message: `Search for ${geneList.length} genes`, timestamp: Date.now()},
        senderID: "system",
        senderName: "System",
        requestType: "chat-system"
      }
      if (geneList.length > 0) {
        this.messagesList = [message].concat(this.messagesList)

        const payload = {
          searchType: "Gene Names",
          data: dataObject,
          title: `Search #${this.data.selectOperationNames.length}`,
          params: Object.assign(this.params)
        }
        this.data.searchCommandService.next(payload)
      } else {
        message.message.message = "No genes found"
        this.messagesList = [message].concat(this.messagesList)
      }
    }
  }

  annotateGene(command: string[]) {
    if (command[0] === "!anngene") {
      const com: {remove: boolean, id: string[]} = {remove: false, id: []}
      for (const c of command.splice(2)) {
        if (c.startsWith("@")) {
          const pids = this.data.getPrimaryFromGeneNames(c.substring(1))
          if (pids.length > 0) {
            com.id = com.id.concat(pids)
          } else {
            for (const gene of c.substring(1).split(";")) {
              const pids = this.data.getPrimaryFromGeneNames(gene)
              if (pids.length > 0) {
                com.id = com.id.concat(pids)
              }
            }
          }
        }
      }
      if (command[1] === "-a") {
        com.remove = false
      } else if (command[1] === "-r") {
        com.remove = true
      }
      if (com.id.length > 0) {
        this.data.annotationService.next(com)
      }
      const message: Message = {
        message: {message: `Annotate ${com.id.length} data points`, timestamp: Date.now()},
        senderID: "system",
        senderName: "System",
        requestType: "chat-system"
      }
      this.messagesList = [message].concat(this.messagesList)
    }
  }

  annotatePid(command: string[]) {
    if (command[0] === "!annpid") {
      const com: {remove: boolean, id: string[]} = {remove: false, id: []}
      for (const c of command.splice(2)) {
        if (c.startsWith("@")) {
          com.id.push(c.substring(1))
        }
      }
      if (command[1] === "-a") {
        com.remove = false
      } else if (command[1] === "-r") {
        com.remove = true
      }
      if (com.id.length > 0) {
        this.data.annotationService.next(com)
      }
      const message: Message = {
        message: {message: `Annotate ${com.id.length} data points`, timestamp: Date.now()},
        senderID: "system",
        senderName: "System",
        requestType: "chat-system"
      }
      this.messagesList = [message].concat(this.messagesList)
    }
  }
  ngOnDestroy() {
    this.webSub?.unsubscribe()
    this.ws.close()
  }

  toggleChat() {
    this.toggleChatPanel = !this.toggleChatPanel
    if (this.toggleChatPanel) {
      this.chatbox?.nativeElement.scrollTo(0, this.chatbox.nativeElement.scrollHeight)
    }
  }

  handleDrop(event: any) {
    event.preventDefault();
    event.stopPropagation();
    const selection = JSON.parse(event.dataTransfer.getData("text/plain"));
    switch (selection.type) {
      case "selection-single":
        this.ws.send({message: {title:selection.title, data: selection.selection, timestamp: Date.now()}, senderName: this.ws.displayName, requestType: "chat-selection-single"})
        break;
      case "selection-group":
        const data: string[] = []
        for (const primaryID in this.data.selectedMap) {
          if (this.data.selectedMap[primaryID][selection.title] !== undefined) {
            data.push(primaryID)
          }
        }
        if (data.length > 0) {
          this.ws.send({message: {title:selection.title, data: data, timestamp: Date.now()}, senderName: this.ws.displayName, requestType: "chat-selection-group"})
        }
        break;
    }

  }

  handleDragOver(event: any) {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'copy';
  }

  searchChatSelectionGroup(event: any) {
    this.searchChatSelection.emit({title:event.title, data: event.data})
  }
  searchChatSelectionSingle(event: any) {
    this.searchChatSelection.emit({title:event.title, data: event.data})
  }

  typeAheadCommandComplete: OperatorFunction<string, string[]> = (text$: Observable<string>) =>
    text$.pipe(
      //debounceTime(200),
      distinctUntilChanged(),
      map((term) => {
        this.commandCompleteModel = term
        const command = term.split(" ")
        const lastParameter = command[command.length - 1]
        console.log(lastParameter)
        if (lastParameter.startsWith("@")) {
          if (lastParameter.length < 3) {
            return []
          } else {
            const searchTerm = lastParameter.replace("@", "")
            if (command[0] === "!searchpid" || command[0]==="!annpid") {
              return this.data.primaryIDsList.filter((v: string) => v.toLowerCase().indexOf(searchTerm.toLowerCase()) > -1).slice(0, 10)
            } else {
              return this.data.allGenes.filter((v: string) => v.toLowerCase().indexOf(searchTerm.toLowerCase()) > -1).slice(0, 10)
            }
          }
        } else if (lastParameter.startsWith("!")) {
          const result = this.allCommands.filter((v: string) => v.startsWith(lastParameter.toLowerCase())).slice(0, 10)
          return result
        } else {
          return []
        }
      })
    )

  formatTypeAheadCommandComplete = (x: string) => {
    const command = this.form.value.message?.split(" ")
    if (command) {
      const lastCommand = command[command.length - 1]
      if (lastCommand.startsWith("@")) {
        command[command.length - 1] = "@" + x
      } else if (lastCommand.startsWith("!")) {
        command[command.length - 1] = x
      }
      this.commandCompleteModel = command.join(" ")
      return this.commandCompleteModel
    }
    return x
  }
  loadStateDirect(state: number) {
    this.saveState.loadState(state)
  }
}
