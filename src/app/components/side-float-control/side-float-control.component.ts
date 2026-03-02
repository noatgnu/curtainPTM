import {Component, signal, ElementRef, EventEmitter, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {WebsocketService} from "../../websocket.service";
import {FormBuilder, NgForm} from "@angular/forms";
import {distinctUntilChanged, map, Observable, OperatorFunction, Subscription} from "rxjs";
import {DataService} from "../../data.service";
import {SaveStateService} from "../../save-state.service";
import {SettingsService} from "../../settings.service";
import {ToastService} from "../../toast.service";

interface Message {
  senderID: string,
  senderName: string,
  message: any,
  requestType: string
}

interface CommandHelp {
  command: string,
  aliases: string[],
  description: string,
  usage: string,
  examples: string[]
}

@Component({
    selector: 'app-side-float-control',
    templateUrl: './side-float-control.component.html',
    styleUrls: ['./side-float-control.component.scss'],
    standalone: false
})

export class SideFloatControlComponent implements OnInit, OnDestroy {
  toggleChatPanel = signal(false)
  showHelpPanel = signal(false)
  unreadCount = signal(0)
  messagesList: Message[] = []
  form = this.fb.group({
    message: ['']
  })
  commandCompleteModel = signal("")

  senderMap: {[key: string]: string} = {'system': 'System'}
  @ViewChild("chatForm") chatForm: NgForm|undefined
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

  commandHistory: string[] = []
  historyIndex = -1

  commandAliases: {[key: string]: string} = {
    '!sg': '!searchgene',
    '!sp': '!searchpid',
    '!ag': '!anngene',
    '!ap': '!annpid',
    '!ss': '!savestate',
    '!sel': '!select',
    '!f': '!filter'
  }

  allCommands: string[] = [
    "!searchgene",
    "!searchpid",
    "!rd",
    "!anngene",
    "!annpid",
    "!savestate",
    "!help",
    "!clear",
    "!select",
    "!filter",
    "!count",
    "!sg",
    "!sp",
    "!ag",
    "!ap",
    "!ss",
    "!sel",
    "!f"
  ]

  commandHelpData: CommandHelp[] = [
    {
      command: '!help',
      aliases: [],
      description: 'Show available commands',
      usage: '!help [command]',
      examples: ['!help', '!help select']
    },
    {
      command: '!searchgene',
      aliases: ['!sg'],
      description: 'Search for proteins by gene names',
      usage: '!searchgene @gene1 @gene2',
      examples: ['!searchgene @TP53', '!sg @BRCA1 @BRCA2']
    },
    {
      command: '!searchpid',
      aliases: ['!sp'],
      description: 'Search for proteins by primary IDs',
      usage: '!searchpid @id1 @id2',
      examples: ['!searchpid @P04637', '!sp @P38398']
    },
    {
      command: '!anngene',
      aliases: ['!ag'],
      description: 'Add or remove annotations by gene names',
      usage: '!anngene -a|-r @gene1 @gene2',
      examples: ['!anngene -a @TP53', '!ag -r @BRCA1']
    },
    {
      command: '!annpid',
      aliases: ['!ap'],
      description: 'Add or remove annotations by primary IDs',
      usage: '!annpid -a|-r @id1 @id2',
      examples: ['!annpid -a @P04637', '!ap -r @P38398']
    },
    {
      command: '!select',
      aliases: ['!sel'],
      description: 'Quick selection operations',
      usage: '!select -sig|-up|-down|-clear|-invert',
      examples: ['!select -sig', '!sel -up', '!select -clear']
    },
    {
      command: '!filter',
      aliases: ['!f'],
      description: 'Filter data by criteria',
      usage: '!filter -fc <min> <max> | -p <max>',
      examples: ['!filter -fc 1 2', '!f -p 0.05']
    },
    {
      command: '!count',
      aliases: [],
      description: 'Count proteins matching criteria',
      usage: '!count -sig|-selected|-all',
      examples: ['!count -sig', '!count -selected']
    },
    {
      command: '!savestate',
      aliases: ['!ss'],
      description: 'Save, load, or manage states',
      usage: '!savestate [-l|-r|-a|-ra|-p] [id]',
      examples: ['!savestate', '!ss -l 0', '!savestate -a']
    },
    {
      command: '!rd',
      aliases: [],
      description: 'Redraw all plots',
      usage: '!rd',
      examples: ['!rd']
    },
    {
      command: '!clear',
      aliases: [],
      description: 'Clear chat messages',
      usage: '!clear',
      examples: ['!clear']
    },
    {
      command: '!instructor',
      aliases: [],
      description: 'Toggle instructor mode',
      usage: '!instructor',
      examples: ['!instructor']
    }
  ]

  constructor(
    private saveState: SaveStateService,
    public ws: WebsocketService,
    private fb: FormBuilder,
    public data: DataService,
    private settings: SettingsService,
    private toast: ToastService
  ) {
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
    if (this.ws.connection) {
      const message = {message: {message: "Connected to server", timestamp: Date.now()}, senderID: "system", senderName: "System", requestType: "chat-system"}
      this.messagesList = [message].concat(this.messagesList)
    }
  }

  private setSubscription() {
    this.webSub = this.ws.getMessages()?.subscribe((data: any) => {
      data.message.timestamp = new Date(data.message.timestamp)
      this.messagesList = [data].concat(this.messagesList)
      this.senderMap[data.senderID] = data.senderName
      if (data.requestType === "push-state-all-force") {
        this.loadSentState(data.message.data)
      }
      if (!this.toggleChatPanel()) {
        this.unreadCount.set(this.unreadCount() + 1)
      }
      this.chatbox?.nativeElement.scrollTo(0, this.chatbox.nativeElement.scrollHeight)
    }, (error: any) => {
      console.log(error)
    }, () => {
      const message = {message: {message: "Disconnected from server", timestamp: Date.now()}, senderID: "system", senderName: "System", requestType: "chat-system"}
      this.messagesList = [message].concat(this.messagesList)
    })
  }

  triggerEnter() {
    if (this.chatForm) {
      if (this.form.valid) {
        this.chatForm.ngSubmit.emit()
      }
    }
  }

  ngOnInit(): void {
  }

  sendMessage() {
    let message = this.form.value.message?.slice()
    if (this.form.value.message !== this.commandCompleteModel()) {
      message = this.commandCompleteModel()
    }

    if (!message || message.trim() === '') {
      return
    }

    if (message.startsWith("!")) {
      this.commandHistory.unshift(message)
      if (this.commandHistory.length > 50) {
        this.commandHistory.pop()
      }
      this.historyIndex = -1
    }

    if (message !== "" && !message?.startsWith("@") && !message?.startsWith("!")) {
      this.ws.send({message: {message: message, timestamp: Date.now()}, senderName: this.ws.displayName, requestType: "chat"})
    } else if (message?.startsWith("!")) {
      const command = message.split(" ")
      let firstParameter = command[0].toLowerCase()

      if (this.commandAliases[firstParameter]) {
        firstParameter = this.commandAliases[firstParameter]
      }

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
          this.addSystemMessage("Plots redrawn")
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
        case "!instructor":
          this.data.instructorMode = !this.data.instructorMode
          this.addSystemMessage(`Instructor mode ${this.data.instructorMode ? "enabled" : "disabled"}`)
          break
        case "!help":
          this.showHelp(command)
          break
        case "!clear":
          this.clearMessages()
          break
        case "!select":
          this.selectCommand(command)
          break
        case "!filter":
          this.filterCommand(command)
          break
        case "!count":
          this.countCommand(command)
          break
        default:
          this.addSystemMessage(`Unknown command: ${firstParameter}. Type !help for available commands.`)
      }

    } else {
      this.ws.send({message: {message: message, timestamp: Date.now()}, senderName: this.ws.displayName, requestType: "chat"})
    }

    this.form.reset()
    this.commandCompleteModel.set("")
  }

  private addSystemMessage(text: string, type: string = "chat-system") {
    const message: Message = {
      message: {message: text, timestamp: Date.now()},
      senderID: "system",
      senderName: "System",
      requestType: type
    }
    this.messagesList = [message].concat(this.messagesList)
  }

  navigateHistory(direction: 'up' | 'down') {
    if (this.commandHistory.length === 0) return

    if (direction === 'up') {
      if (this.historyIndex < this.commandHistory.length - 1) {
        this.historyIndex++
        this.form.patchValue({message: this.commandHistory[this.historyIndex]})
        this.commandCompleteModel.set(this.commandHistory[this.historyIndex])
      }
    } else {
      if (this.historyIndex > 0) {
        this.historyIndex--
        this.form.patchValue({message: this.commandHistory[this.historyIndex]})
        this.commandCompleteModel.set(this.commandHistory[this.historyIndex])
      } else if (this.historyIndex === 0) {
        this.historyIndex = -1
        this.form.patchValue({message: ''})
        this.commandCompleteModel.set('')
      }
    }
  }

  private showHelp(command: string[]) {
    if (command.length === 1) {
      this.showHelpPanel.set(true)
      this.addSystemMessage("Help panel opened. Available commands: " + this.commandHelpData.map(c => c.command).join(", "))
    } else {
      const searchCmd = command[1].startsWith('!') ? command[1] : '!' + command[1]
      const help = this.commandHelpData.find(h =>
        h.command === searchCmd || h.aliases.includes(searchCmd)
      )
      if (help) {
        const aliasText = help.aliases.length > 0 ? ` (aliases: ${help.aliases.join(", ")})` : ''
        this.addSystemMessage(`${help.command}${aliasText}: ${help.description}. Usage: ${help.usage}`)
      } else {
        this.addSystemMessage(`Unknown command: ${searchCmd}`)
      }
    }
  }

  private clearMessages() {
    this.messagesList = []
    this.addSystemMessage("Chat cleared")
  }

  private selectCommand(command: string[]) {
    if (command.length < 2) {
      this.addSystemMessage("Usage: !select -sig|-up|-down|-clear|-invert")
      return
    }

    const flag = command[1].toLowerCase()
    let count = 0

    switch (flag) {
      case '-sig':
        for (const row of this.data.differential.df) {
          const pid = row[this.data.differentialForm.primaryIDs]
          const fc = Math.abs(row[this.data.differentialForm.foldChange])
          const pval = row[this.data.differentialForm.significant]
          if (fc >= this.settings.settings.log2FCCutoff && pval <= this.settings.settings.pCutoff) {
            if (!this.data.selected.includes(pid)) {
              this.data.selected.push(pid)
              count++
            }
          }
        }
        this.data.selectionUpdateTrigger.next(true)
        this.addSystemMessage(`Selected ${count} significant proteins`)
        break

      case '-up':
        for (const row of this.data.differential.df) {
          const pid = row[this.data.differentialForm.primaryIDs]
          const fc = row[this.data.differentialForm.foldChange]
          const pval = row[this.data.differentialForm.significant]
          if (fc >= this.settings.settings.log2FCCutoff && pval <= this.settings.settings.pCutoff) {
            if (!this.data.selected.includes(pid)) {
              this.data.selected.push(pid)
              count++
            }
          }
        }
        this.data.selectionUpdateTrigger.next(true)
        this.addSystemMessage(`Selected ${count} upregulated proteins`)
        break

      case '-down':
        for (const row of this.data.differential.df) {
          const pid = row[this.data.differentialForm.primaryIDs]
          const fc = row[this.data.differentialForm.foldChange]
          const pval = row[this.data.differentialForm.significant]
          if (fc <= -this.settings.settings.log2FCCutoff && pval <= this.settings.settings.pCutoff) {
            if (!this.data.selected.includes(pid)) {
              this.data.selected.push(pid)
              count++
            }
          }
        }
        this.data.selectionUpdateTrigger.next(true)
        this.addSystemMessage(`Selected ${count} downregulated proteins`)
        break

      case '-clear':
        count = this.data.selected.length
        this.data.selected = []
        this.data.selectedMap = {}
        this.data.selectOperationNames = []
        this.data.selectionUpdateTrigger.next(true)
        this.addSystemMessage(`Cleared ${count} selections`)
        break

      case '-invert':
        const allPids: string[] = []
        for (const row of this.data.differential.df) {
          allPids.push(row[this.data.differentialForm.primaryIDs])
        }
        const newSelection = allPids.filter((pid: string) => !this.data.selected.includes(pid))
        this.data.selected = newSelection
        this.data.selectionUpdateTrigger.next(true)
        this.addSystemMessage(`Inverted selection: ${newSelection.length} proteins now selected`)
        break

      default:
        this.addSystemMessage(`Unknown select flag: ${flag}. Use -sig, -up, -down, -clear, or -invert`)
    }
  }

  private filterCommand(command: string[]) {
    if (command.length < 2) {
      this.addSystemMessage("Usage: !filter -fc <min> <max> | -p <max>")
      return
    }

    const flag = command[1].toLowerCase()

    switch (flag) {
      case '-fc':
        if (command.length < 4) {
          this.addSystemMessage("Usage: !filter -fc <min> <max>")
          return
        }
        const fcMin = parseFloat(command[2])
        const fcMax = parseFloat(command[3])
        if (isNaN(fcMin) || isNaN(fcMax)) {
          this.addSystemMessage("Invalid fold change values")
          return
        }
        let fcCount = 0
        for (const row of this.data.differential.df) {
          const pid = row[this.data.differentialForm.primaryIDs]
          const fc = row[this.data.differentialForm.foldChange]
          if (fc >= fcMin && fc <= fcMax) {
            if (!this.data.selected.includes(pid)) {
              this.data.selected.push(pid)
              fcCount++
            }
          }
        }
        this.data.selectionUpdateTrigger.next(true)
        this.addSystemMessage(`Selected ${fcCount} proteins with FC between ${fcMin} and ${fcMax}`)
        break

      case '-p':
        if (command.length < 3) {
          this.addSystemMessage("Usage: !filter -p <max>")
          return
        }
        const pMax = parseFloat(command[2])
        if (isNaN(pMax)) {
          this.addSystemMessage("Invalid p-value")
          return
        }
        let pCount = 0
        for (const row of this.data.differential.df) {
          const pid = row[this.data.differentialForm.primaryIDs]
          const pval = row[this.data.differentialForm.significant]
          if (pval <= pMax) {
            if (!this.data.selected.includes(pid)) {
              this.data.selected.push(pid)
              pCount++
            }
          }
        }
        this.data.selectionUpdateTrigger.next(true)
        this.addSystemMessage(`Selected ${pCount} proteins with p-value <= ${pMax}`)
        break

      default:
        this.addSystemMessage(`Unknown filter flag: ${flag}. Use -fc or -p`)
    }
  }

  private countCommand(command: string[]) {
    if (command.length < 2) {
      this.addSystemMessage("Usage: !count -sig|-selected|-all")
      return
    }

    const flag = command[1].toLowerCase()

    switch (flag) {
      case '-sig':
        let sigCount = 0
        for (const row of this.data.differential.df) {
          const fc = Math.abs(row[this.data.differentialForm.foldChange])
          const pval = row[this.data.differentialForm.significant]
          if (fc >= this.settings.settings.log2FCCutoff && pval <= this.settings.settings.pCutoff) {
            sigCount++
          }
        }
        this.addSystemMessage(`Significant proteins: ${sigCount} (FC >= ${this.settings.settings.log2FCCutoff}, p <= ${this.settings.settings.pCutoff})`)
        break

      case '-selected':
        this.addSystemMessage(`Selected proteins: ${this.data.selected.length}`)
        break

      case '-all':
        let totalCount = 0
        for (const _ of this.data.differential.df) {
          totalCount++
        }
        this.addSystemMessage(`Total proteins: ${totalCount}`)
        break

      default:
        this.addSystemMessage(`Unknown count flag: ${flag}. Use -sig, -selected, or -all`)
    }
  }

  saveStateCommand(command: string[]) {
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
        } else if (command[1] === "-p") {
          const save = this.saveState.createNewState()
          const message: Message = {
            message: {data: save, timestamp: Date.now()},
            senderID: this.ws.personalID,
            senderName: this.ws.displayName,
            requestType: "push-state-all"
          }
          this.ws.send(message)
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
      const message: Message = {
        message: {message: `Add annotations to ${com.id.length} data points`, timestamp: Date.now()},
        senderID: "system",
        senderName: "System",
        requestType: "chat-system"
      }
      if (command[1] === "-a") {
        com.remove = false
      } else if (command[1] === "-r") {
        com.remove = true
        message.message.message = `Remove annotations from ${com.id.length} data points`
      }
      if (com.id.length > 0) {
        this.data.annotationService.next(com)
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
      const message: Message = {
        message: {message: `Annotate ${com.id.length} data points`, timestamp: Date.now()},
        senderID: "system",
        senderName: "System",
        requestType: "chat-system"
      }
      if (command[1] === "-a") {
        com.remove = false
      } else if (command[1] === "-r") {
        com.remove = true
        message.message.message = `Remove annotations from ${com.id.length} data points`
      }
      if (com.id.length > 0) {
        this.data.annotationService.next(com)
      }
      this.messagesList = [message].concat(this.messagesList)
    }
  }

  ngOnDestroy() {
    this.webSub?.unsubscribe()
    this.ws.close()
  }

  toggleChat() {
    this.toggleChatPanel.set(!this.toggleChatPanel())
    if (this.toggleChatPanel()) {
      this.unreadCount.set(0)
      this.chatbox?.nativeElement.scrollTo(0, this.chatbox.nativeElement.scrollHeight)
    }
  }

  toggleHelp() {
    this.showHelpPanel.set(!this.showHelpPanel())
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
      distinctUntilChanged(),
      map((term) => {
        this.commandCompleteModel.set(term)
        const command = term.split(" ")
        const lastParameter = command[command.length - 1]
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
      this.commandCompleteModel.set(command.join(" "))
      return this.commandCompleteModel()
    }
    return x
  }

  loadStateDirect(state: number) {
    this.saveState.loadState(state)
  }

  loadSentState(state: any) {
    this.saveState.loadStateFromObject(state)
  }

  forcePushState() {
    const save = this.saveState.createNewState()
    const message: Message = {
      message: {data: save, timestamp: Date.now()},
      senderID: this.ws.personalID,
      senderName: this.ws.displayName,
      requestType: "push-state-all-force"
    }
    this.ws.send(message)
  }
}
