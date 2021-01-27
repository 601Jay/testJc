import { AppHubCreater, MicrosoftSignalrHubCreater } from './appHub';

export class ProcessingSystemWs {
  constructor(hub) {
    this.hub = hub;
    this.isConnectLoading = false;
    this.isDisconnected = false;
    this.listOfHub = {
      ManualCheckCrj: null,
      ManualCheckEdz: null,
      ManualCheckJzzJsz: null,
      WaitPortraitVerify: null
    };
  }
}

export class NotifyWs {
  constructor(hub) {
    this.listOfHub = {
      Notify: null
    };
    this.listOfHub.Notify = new MicrosoftSignalrHubCreater().createHub(hub);
    this.listOfHub.Notify.subscribe(this, 'NOTIFYASYNC_EVENT', res => {
      store.commit('app/initNotifyAsync', {
        res
      });
      store.commit('app/alarm', {
        res
      });
    });
  }
}
