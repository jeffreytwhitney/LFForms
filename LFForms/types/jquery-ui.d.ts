/// <reference types="jquery" />

declare global {
  interface JQuery {
    dialog(options?: any): JQuery;
    dialog(methodName: string, ...args: any[]): JQuery;
    datepicker(options?: any): JQuery;
    datepicker(methodName: string, ...args: any[]): JQuery;
    button: JQueryButton;
  }

  interface JQueryButton {
    (...args: any[]): JQuery;
    noConflict(): JQueryButton;
  }

  interface JQueryUIDatepickerStatic {
    parseDate(format: string, value: string, settings?: any): Date;
    formatDate(format: string, date: Date, settings?: any): string;
  }

  type JQueryStaticWithDatepicker = JQueryStatic & {
    datepicker: JQueryUIDatepickerStatic;
  };

  function moment(fdmax: any | jQuery | string | number | string[]): any;
}

export {};
