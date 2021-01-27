const config = {
  score: 50,
  SubscribeItemAsync: [{
    Item: 'ProcessingSystem.Online'
  }, {
    Item: 'ProcessingSystem.ProcessingTimeout'
  }, {
    Item: 'ProcessingSystem.CurrentPending'
  }, {
    Item: 'ProcessingSystem.Offline'
  }]
}

export class ProcessingSystemWsExtendAppHub {
  constructor(proxy) {
    proxy.on('OnError', err => {
      console.log(err);
    });
    proxy.on('close', err => {
      console.log(err);
    });
    proxy.on('OnDispatch', res => {
      this._extra({
        ...res,
        event: 'DISPATCH_EVENT'
      });
    });
    proxy.on('NotifyAsync', res => {
      this._extra({
        ...res,
        event: 'NOTIFYASYNC_EVENT'
      });
    });
    proxy.on('OnNotify', (state, res) => {
      const result = {
        state,
        res
      };
      this._extra({
        ...result,
        event: 'NOTIFY_EVENT'
      });
    });
    proxy.on('OnSystemInformationReceived', res => {
      this._extra({
        ...res,
        event: 'SYSTEMINFORMATIONRECEIVED_EVENT'
      });
    });
    this.init();
    this.initInvoke(['online', 'offline', 'Ping']);
  }

  initInvoke(listOfInvoke) {
    listOfInvoke.map((ik) => {
      this[ik] = () => {
        return new Promise((res, rej) => {
          this.proxy.invoke(ik).done((r) => {
            if (r.Code === 1) {
              res(r.Data);
            } else {
              rej(r.Message);
            }
          }).fail((err) => {
            rej(err);
          });
        });
      };
    });
  }

  init() {
    this.Commit = (info) => {
      return new Promise((res, rej) => {
        this.proxy.invoke('Commit', info).done((r) => {
          if (r.Code === 1) {
            res(r.Data);
          } else {
            rej(r.Message);
          }
        }).fail((err) => {
          rej(err);
        });
      });
    };
  }
}

export class NotifyExtendAppHub {
  constructor(connection) {
    this.connection = connection;
    connection.on('NotifyAsync', res => {
      console.log(res);
      this._extra({
        ...res,
        event: 'NOTIFYASYNC_EVENT'
      });
    });
  }
  init() {
    this.connection.invoke('BatchSubscribeItemAsync', config.SubscribeItemAsync);
    setInterval(() => {
      this.connection.invoke('Ping');
    }, 5000);
  }
}
