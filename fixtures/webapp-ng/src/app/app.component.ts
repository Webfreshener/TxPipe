import {Component} from '@angular/core';
// import {TxPipe} from "./lib/txPipe";
// import Ajv, {JSONSchemaType, DefinedError} from "ajv";
// window["Ajv"] = Ajv;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'webapp-ng';
  protected tx: any;
  protected data = [];

  ngOnInit() {
    this.tx = new window["TxPipe"].TxPipe({
      type: "array",
      items: {
        type: "string",
      }
    });

    this.tx.subscribe(data => console.log(this.data = data));
    this.tx.txWrite(["a", "b", "c"]);
  }
}
