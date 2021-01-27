import { ProcessingSystemWsExtendAppHub, NotifyExtendAppHub } from '../extendAppHub';
const signalR = require('@microsoft/signalr');

export class AppHubCreater {
  createHub(host, connection, type) {
    var hub;
    var proxy;
    var connection = (connection || $.hubConnection)(host, { gateway: 'gateway', transportConnectTimeout: 1000 });
    connection.reconnected(() => {
      hub._reconnected();
    });
    connection.disconnected(() => {
      hub._disconnectd();
    });
    proxy = connection.createHubProxy(type);
    hub = new AppHub(proxy);
    const startTime = new Date().getTime();
    connection.start()
      .done(() => {
        const time = new Date().getTime() - startTime;
        console.log('processingSystem connected, connection ID=' + connection.id + `, time: ${time}ms`);
        hub._onconnect();
      })
      .fail(() => {
        hub.timerCount++;
        if (hub.timerCount >= 3) {
          window.alert('当前登录未能成功，请刷新页面后重新登录!');
          return;
        }
        clearTimeout(hub.timer);
        hub.timer = setTimeout(() => {
          connection.start();
        }, 5000);
        console.info('Could not connect');
      });
    return hub;
  }
}

export class MicrosoftSignalrHubCreater {
  createHub(hub) {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hub)
      .withAutomaticReconnect()
      .build();
    hub = new NotifyHub(connection);
    connection.onreconnecting(error => {
      console.assert(connection.state === signalR.HubConnectionState.Reconnecting);
      window.alert(`Connection lost due to error "${error}". Reconnecting.`);
    });
    connection.onreconnected(connectionId => {
      console.assert(connection.state === signalR.HubConnectionState.Connected);
      window.alert(`Connection reestablished. Connected with connectionId "${connectionId}".`);
    });
    connection.onclose(() => {
      console.assert(connection.state === signalR.HubConnectionState.Disconnected);
      window.alert('当前连接因意外被关闭，请重新登录!');
      window.location.reload();
    });
    const startTime = new Date().getTime();
    connection.start()
      .then(
        () => {
          const time = new Date().getTime() - startTime;
          console.log(`notify connected, time: ${time}ms`);
          hub._onconnect();
        }
      ).catch((err) => {
        console.log(err);
        setTimeout(() => connection.start(), 5000);
      });
    return hub;
  }
}

export class AppHub extends ProcessingSystemWsExtendAppHub {
  constructor(proxy) {
    super(proxy);
    this.proxy = proxy;
    this.events = [];
    this.callbackfns = [];
    this.timer = null;
    this.timerCount = 0;
  }

  disconnected(callback) {
    console.log('disconnected');
    this.proxy.connection.stateChanged((state) => {
      if (state.newState === 2 && state.oldState === 1) {
        callback();
      }
    });
  }

  _onconnect() {
    if (this.callbackfns.length > 0) {
      this.proxy.isReady = true;
      this.callbackfns.forEach(fn => fn());
    }
  }

  _reconnected() {
    this._extra({
      event: 'RECONNECTED_EVENT'
    });
  }

  _disconnectd() {
    this._extra({
      event: 'DISCONNECTED_EVENT'
    });
  }

  ready(callback) {
    if (this.proxy.isReady) {
      callback();
    } else {
      this.callbackfns.push(callback);
    }
  }

  _extra(res) {
    if (res.code > 200 && res.code < 300) {
      alert(res.message);
    }
    if ((res.code > 100 && res.code < 200) || res.code == -1) {
      alert(res.message);
      console.error(res);
      throw res.message;
    }
    this._hander(res);
  }

  _hander(res) {
    this.events.filter(e => e.event === res.event).forEach(item => {
      item.callback(res);
    });
  }

  /**
   * 订阅事件，每个订阅者只能订阅同一个事件一次，重复订阅会被覆盖
   * @param {object} subscriber 订阅者
   * @param {string} event 事件
   * @param {Function} callback 回调
   */
  subscribe(subscriber, event, callback) {
    this.removeEvent(subscriber, event);
    this.events.push({
      event: event,
      callback: callback,
      subscriber: subscriber
    });
  }

  removeEvent(subscriber, event) {
    let index = -1;

    this.events.forEach((item, i) => {
      if (item.event === event && item.subscriber === subscriber) {
        index = i;
      }
    });

    if (index >= 0) {
      const arr = this.events;
      this.events = arr.slice(0, index).concat(arr.slice(index + 1, arr.length));
    }
  }

  register(info) {
    return new Promise((res, rej) => {
      this.proxy.invoke('register', info).done((r) => {
        if (r.Code === 1) {
          res(r.Data);
        } else {
          rej(r.Message);
        }
      }).fail((err) => {
        rej(err);
      });
    });
  }
}

export class NotifyHub extends NotifyExtendAppHub {
  constructor(connection) {
    super(connection);
    this.proxy = connection;
    this.callbackfns = [];
    this.events = [];
    this.isReady = false;
  }

  _onconnect() {
    this.init();
  }

  _extra(res) {
    this._hander(res);
  }

  _hander(res) {
    this.events.filter(e => e.event === res.event).forEach(item => {
      item.callback(res);
    });
  }

  subscribe(subscriber, event, callback) {
    this.removeEvent(subscriber, event);
    this.events.push({
      event: event,
      callback: callback,
      subscriber: subscriber
    });
  }

  removeEvent(subscriber, event) {
    let index = -1;

    this.events.forEach((item, i) => {
      if (item.event === event && item.subscriber === subscriber) {
        index = i;
      }
    });

    if (index >= 0) {
      const arr = this.events;
      this.events = arr.slice(0, index).concat(arr.slice(index + 1, arr.length));
    }
  }
}
