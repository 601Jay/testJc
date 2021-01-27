import { Component, OnInit } from '@angular/core';
import { ProcessingSystemWs, NotifyWs } from './utils/ws';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent implements OnInit {
  title = 'notifyTest';

  ngOnInit() {
    Array.prototype.slice.call(document.querySelectorAll('.config')).forEach((item) => {
      this.init({
        id: item.getAttribute('id'),
        hub: item.getAttribute('hub')
      });
    });
  }

  init(payLoad) {
    const { id, hub } = payLoad;
    const res = id === 'Notify' ? new NotifyWs(hub) : new ProcessingSystemWs(hub);

  }
}
