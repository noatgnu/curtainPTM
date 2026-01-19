import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from "@angular/common/http";
import {environment} from "../../environments/environment";
import {ToastService} from "../toast.service";
import {CurtainWebAPI, User} from "curtain-web-api";
import {SessionExpiredModalComponent} from "../components/session-expired-modal/session-expired-modal.component";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";

@Injectable({
  providedIn: 'root'
})
export class AccountsService {

  curtainAPI: CurtainWebAPI = new CurtainWebAPI(environment.apiURL)

  isOwner: boolean = false

  constructor(private http: HttpClient, private toast: ToastService, private modal: NgbModal) {
    this.curtainAPI.axiosInstance.interceptors.request.use((config) => {
      if (config.url) {
        if (this.curtainAPI.checkIfRefreshTokenExpired() && this.curtainAPI.user.loginStatus) {
          this.curtainAPI.user.loginStatus = false
          this.curtainAPI.user.clearDB().then((data: any) => {
            this.curtainAPI.user = new User()
          })
          const ref = this.modal.open(SessionExpiredModalComponent, {backdrop: 'static'})
        }
        if (
          //config.url === this.refereshURL ||
          config.url === this.curtainAPI.logoutURL ||
          config.url === this.curtainAPI.userInfoURL ||
          config.url.startsWith(this.curtainAPI.baseURL + "curtain/") ||
          config.url.startsWith(this.curtainAPI.baseURL + "data_filter_list/") ||
          config.url.startsWith(this.curtainAPI.baseURL + "datacite/") ||
          config.url.startsWith(this.curtainAPI.baseURL + "api_key/") ||
          config.url.startsWith(this.curtainAPI.baseURL + "permanent-link-requests/") ||
          config.url.startsWith(this.curtainAPI.baseURL + "curtain-chunked-upload/") ||
          config.url.startsWith(this.curtainAPI.baseURL + "curtain-collections/") ||
          config.url.startsWith(this.curtainAPI.baseURL + "stats/summary/") ||
          config.url.startsWith(this.curtainAPI.baseURL + "job/")) {
          if (this.curtainAPI.user.loginStatus) {
            config.headers["Authorization"] = "Bearer " + this.curtainAPI.user.access_token;
          }
        }
      }

      return config;
    }, (error) => {
      return Promise.reject(error);
    });
    this.curtainAPI.axiosInstance.interceptors.response.use((response) => {
      return response
    } , async (error) => {
      console.log(error.response)
      if (error.response.status === 401) {
        if (error.config.url !== this.curtainAPI.refereshURL &&
          error.config.url !== this.curtainAPI.loginURL &&
          error.config.url !== this.curtainAPI.orcidLoginURL) {
          if (!this.curtainAPI.checkIfRefreshTokenExpired() && this.curtainAPI.user.loginStatus) {
            console.log("refreshing token")
            if (!this.curtainAPI.isRefreshing) {
              try {
                await this.refresh();
                this.curtainAPI.isRefreshing = false;
                return this.curtainAPI.axiosInstance.request(error.config);
              } catch (error1) {
                this.curtainAPI.isRefreshing = false;
                this.curtainAPI.user = new User();
                return error1;
              }
            }
          }
        }
      }
      return Promise.reject(error);
    });
  }

  reload() {
    return this.curtainAPI.user.loadFromDB().then((data: any) => {
      return data;
    })
  }

  getUser(reNavigate: boolean = false) {
    return this.curtainAPI.getUserInfo().then((data: any) => {
      this.toast.show("Login Information", "User information updated.").then(() => {
        const url = localStorage.getItem("urlAfterLogin")
        if (url && reNavigate) {
          window.location.assign(url)
        }
      })
    }).catch((error: any) => {
      this.toast.show("Error", "User data retrieval error.").then()
      return error
    })
  }

  login(username: string, password: string, remember_me: boolean = false) {
    return this.curtainAPI.login(username, password, remember_me).then((data: any) => {return data}).catch((error: any) => {
      this.toast.show("Login Error", "Incorrect Login Credential.").then()
      return error
    })
  }

  refresh() {
    return this.curtainAPI.refresh().then((data: any) => {return data}).catch((error: any) => {
      this.toast.show("Error", "User data update error.").then()
      return error
    })
  }

  logout() {
    return this.curtainAPI.logout().then((data: any) => {
      this.toast.show("Login Information", "Logout Successful.").then()
    }).catch((error: any) => {
      return error
    })
  }
  removeLocalStorage() {
    localStorage.removeItem("lastTokenUpdateTime")
    localStorage.removeItem("lastRefreshTokenUpdateTime")
    localStorage.removeItem("accessToken")
    localStorage.removeItem("refreshToken")
    localStorage.removeItem("userName")
    localStorage.removeItem("userId")
    localStorage.removeItem("userStaff")
    console.log("Storage data cleared.")
  }


  getSessionPermission(): boolean {
    if (this.curtainAPI.user.isStaff) {
      return true
    } else if (this.isOwner) {
      return true
    }
    return false
  }


  postORCIDCode(data: string, remember_me: boolean = false) {
    return this.curtainAPI.ORCIDLogin(data, window.location.origin+"/", remember_me).then((data: any) => {return data}).catch((error: any) => {
      return error
    })
  }

  ORCIDLogin(data: string, remember_me: boolean = false) {
    return this.postORCIDCode(data, remember_me).then((data:any) => {
      return data
    }).catch((error: any) => {
      return error
    })
  }


  deleteCurtainLink(link_id: string) {
    return this.curtainAPI.deleteCurtainLink(link_id).then((data: any) => {
      return data
    }).catch((error: any) => {
      return error
    })
  }

  getCollections(page: number = 1, pageSize: number = 20, search: string = '', owned: boolean = false, linkId?: string) {
    const params: any = {
      limit: pageSize,
      offset: (page - 1) * pageSize
    }
    if (search) {
      params.search = search
    }
    if (owned) {
      params.owned = 'true'
    }
    if (linkId) {
      params.link_id = linkId
    }
    return this.curtainAPI.axiosInstance.get(this.curtainAPI.baseURL + 'curtain-collections/', {params}).then((response: any) => {
      return response.data
    }).catch((error: any) => {
      this.toast.show("Error", "Failed to load collections.").then()
      return error
    })
  }

  createCollection(name: string, description: string = '') {
    return this.curtainAPI.axiosInstance.post(this.curtainAPI.baseURL + 'curtain-collections/', {
      name,
      description
    }).then((response: any) => {
      this.toast.show("Success", "Collection created successfully.").then()
      return response.data
    }).catch((error: any) => {
      this.toast.show("Error", "Failed to create collection.").then()
      return error
    })
  }

  updateCollection(id: number, name: string, description: string = '') {
    return this.curtainAPI.axiosInstance.patch(this.curtainAPI.baseURL + `curtain-collections/${id}/`, {
      name,
      description
    }).then((response: any) => {
      this.toast.show("Success", "Collection updated successfully.").then()
      return response.data
    }).catch((error: any) => {
      this.toast.show("Error", "Failed to update collection.").then()
      return error
    })
  }

  updateCollectionEnable(id: number, enable: boolean) {
    return this.curtainAPI.axiosInstance.patch(this.curtainAPI.baseURL + `curtain-collections/${id}/`, {
      enable
    }).then((response: any) => {
      return response.data
    }).catch((error: any) => {
      this.toast.show("Error", "Failed to update collection sharing.").then()
      throw error
    })
  }

  deleteCollection(id: number) {
    return this.curtainAPI.axiosInstance.delete(this.curtainAPI.baseURL + `curtain-collections/${id}/`).then((response: any) => {
      this.toast.show("Success", "Collection deleted successfully.").then()
      return response.data
    }).catch((error: any) => {
      this.toast.show("Error", "Failed to delete collection.").then()
      return error
    })
  }

  addCurtainToCollection(collectionId: number, linkId: string) {
    return this.curtainAPI.axiosInstance.post(this.curtainAPI.baseURL + `curtain-collections/${collectionId}/add_curtain/`, {
      link_id: linkId
    }).then((response: any) => {
      this.toast.show("Success", "Session added to collection.").then()
      return response.data
    }).catch((error: any) => {
      this.toast.show("Error", error.response?.data?.error || "Failed to add session to collection.").then()
      return error
    })
  }

  removeCurtainFromCollection(collectionId: number, linkId: string) {
    return this.curtainAPI.axiosInstance.post(this.curtainAPI.baseURL + `curtain-collections/${collectionId}/remove_curtain/`, {
      link_id: linkId
    }).then((response: any) => {
      this.toast.show("Success", "Session removed from collection.").then()
      return response.data
    }).catch((error: any) => {
      this.toast.show("Error", error.response?.data?.error || "Failed to remove session from collection.").then()
      return error
    })
  }

  async parseDataCiteAlternateIdentifiers(dataCite: any) {
    const result: {mainSessionUrl?: string, alternativeSessionUrls: string[], collectionMetadataUrl?: string, collectionMetadata?: any} = {
      alternativeSessionUrls: []
    }

    if (dataCite.form_data && dataCite.form_data.alternateIdentifiers) {
      for (const identifier of dataCite.form_data.alternateIdentifiers) {
        if (identifier.alternateIdentifierType === 'Curtain Main Session Data') {
          result.mainSessionUrl = identifier.alternateIdentifier;
        } else if (identifier.alternateIdentifierType === 'Curtain Alternative Session Data') {
          result.alternativeSessionUrls.push(identifier.alternateIdentifier);
        } else if (identifier.alternateIdentifierType === 'Curtain Collection Metadata') {
          result.collectionMetadataUrl = identifier.alternateIdentifier;
        }
      }
    }

    if (result.collectionMetadataUrl) {
      try {
        const response = await this.curtainAPI.axiosInstance.get(result.collectionMetadataUrl);
        result.collectionMetadata = response.data;
      } catch (error) {
        console.error('Failed to fetch collection metadata:', error);
      }
    }

    return result;
  }

  async loadDataCiteSession(url: string) {
    try {
      const response = await this.curtainAPI.axiosInstance.get(url);
      return response.data;
    } catch (error) {
      console.error('Failed to load session data:', error);
      throw error;
    }
  }

  async loadAllDataCiteSessions(parsedData: any) {
    const sessions: {main?: any, alternatives: any[]} = {
      alternatives: []
    };

    if (parsedData.mainSessionUrl) {
      sessions.main = await this.loadDataCiteSession(parsedData.mainSessionUrl);
    }

    for (const url of parsedData.alternativeSessionUrls) {
      try {
        const session = await this.loadDataCiteSession(url);
        sessions.alternatives.push(session);
      } catch (error) {
        console.error(`Failed to load alternative session from ${url}:`, error);
      }
    }

    return sessions;
  }
}
