import {Component, Input} from '@angular/core';
import {ToastService} from "../../toast.service";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {DataService} from "../../data.service";
import {
  arrayBufferToBase64String,
  exportPrivateKey,
  exportPublicKey,
  generateKeyPair,
  importPrivateKey,
  importPublicKey,
  pemToArrayBuffer
} from "curtain-web-api";
import {AccountsService} from "../../accounts/accounts.service";
import {WebService} from "../../web.service";

@Component({
  selector: 'app-encryption-settings',
  templateUrl: './encryption-settings.component.html',
  styleUrls: ['./encryption-settings.component.scss']
})
export class EncryptionSettingsComponent {
  public_key: CryptoKey|undefined = undefined
  private_key: CryptoKey|undefined = undefined
  public_key_string: string = ""
  private_key_string: string = ""
  testString: string = "This is a test string"

  savePublicKey: boolean = false
  savePrivateKey: boolean = false

  @Input() enabled: boolean = false
  constructor(private toastService: ToastService, private modal: NgbActiveModal, private dataService: DataService, private accounts: AccountsService, private web: WebService) { }

  async handleFileImport(e: Event, fileType: "Public Key"|"Private Key") {
    if (e.target){
      const target = e.target as HTMLInputElement;
      if (target.files) {
        const fileString = await target.files[0].text()
        const buffer = pemToArrayBuffer(fileString)
        if (fileType === "Public Key") {
          const publicKey = await importPublicKey(buffer)
          this.public_key = publicKey
          this.public_key_string = fileString
        } else {
          const privateKey = await importPrivateKey(buffer)
          this.private_key = privateKey
          this.private_key_string = fileString
        }
      }
    }
  }

  async testEncryption() {
    if (this.public_key && this.private_key) {
      try {
        const encoder = new TextEncoder()
        const data = await crypto.subtle.encrypt({name: 'RSA-OAEP'}, this.public_key, encoder.encode(this.testString))
        const decoder = new TextDecoder()
        const decrypted = await crypto.subtle.decrypt({name: 'RSA-OAEP'}, this.private_key, data)
        const decoded = decoder.decode(decrypted)
        if (decoded === this.testString) {
          await this.toastService.show("Encryption", "Encryption test successful")
          return true
        } else {
          await this.toastService.show("Encryption", "Encryption test failed")
        }
        return false
      } catch (e) {
        await this.toastService.show("Encryption", "Encryption test failed")
        return false
      }
    }
    return false
  }

  save() {
    this.modal.close({enabled: this.enabled, public_key: this.public_key, private_key: this.private_key, public_key_string: this.public_key_string, private_key_string: this.private_key_string, savePublicKey: this.savePublicKey, savePrivateKey: this.savePrivateKey})
  }
  cancel() {
    this.modal.dismiss()
  }

  async generateKeys() {
    const pair = await generateKeyPair()
    //export and download key pairs in pem format
    const publicKey = await exportPublicKey(pair.publicKey)
    const privateKey = await exportPrivateKey(pair.privateKey)
    this.public_key = pair.publicKey
    this.private_key = pair.privateKey
    this.public_key_string = arrayBufferToBase64String(publicKey)
    this.private_key_string = arrayBufferToBase64String(privateKey)
    const public_pem = ['-----BEGIN PUBLIC KEY-----', this.public_key_string, '-----END PUBLIC KEY-----'].join('\n')
    const private_pem = ['-----BEGIN PRIVATE KEY-----', this.private_key_string, '-----END PRIVATE KEY-----'].join('\n')
    this.web.downloadFile("public_key.pem", public_pem)
    this.web.downloadFile("private_key.pem", private_pem)

  }

  clearKeys() {
    // remove keys from memory
    this.public_key = undefined
    this.private_key = undefined
    this.public_key_string = ""
    this.private_key_string = ""
    // remove keys from local storage
    localStorage.removeItem("public_key")
    localStorage.removeItem("private_key")
  }
}
