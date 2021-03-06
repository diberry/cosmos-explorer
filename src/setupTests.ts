import Adapter from "enzyme-adapter-react-16";
import { configure } from "enzyme";
import "jest-canvas-mock";
configure({ adapter: new Adapter() });

if (typeof window.URL.createObjectURL === "undefined") {
  Object.defineProperty(window.URL, "createObjectURL", { value: () => {} });
}

// TODO Remove when jquery and documentdbclient SDK are removed
(<any>window).$ = (<any>window).jQuery = require("jquery");
(<any>global).$ = (<any>global).$.jQuery = require("jquery");
require("jquery-ui-dist/jquery-ui");
