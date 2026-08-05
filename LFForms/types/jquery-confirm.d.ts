/// <reference types="jquery" />

declare global {
  namespace JQuery {
    interface JQueryStatic {
      /**
       * jQuery Confirm (jquery-confirm) plugin
       * https://craftpip.github.io/jquery-confirm/
       */
      confirm(options: JQueryConfirmOptions): void;
      alert(options: JQueryConfirmOptions): void;
      dialog(options: JQueryConfirmOptions): void;
    }
  }

  interface JQueryConfirmOptions {
    title?: string;
    content?: string;
    contentLoaded?: (data: any, statusText: string, xhr: XMLHttpRequest) => void;
    icon?: string;
    closeIcon?: boolean;
    animation?: string;
    closeAnimation?: string;
    animationSpeed?: number;
    animationBounce?: number;
    rtl?: boolean;
    container?: string;
    backgroundDismiss?: boolean;
    escapeKey?: boolean;
    backgroundDismissAnimation?: string;
    theme?: 'light' | 'dark' | string;
    typeAnimated?: boolean;
    typeSpeed?: number;
    buttons?: {
      [key: string]: {
        text?: string;
        btnClass?: string;
        keys?: string[];
        isHidden?: boolean;
        isDisabled?: boolean;
        action?: (this: any) => void | false;
      };
    };
    defaultButtons?: {
      ok: {
        action?: (this: any) => void;
      };
      cancel: {
        action?: (this: any) => void;
      };
    };
    onContentReady?: (this: any) => void;
    onClosing?: (key: string) => void | boolean;
    onAction?: (btnKey: string) => void;
    onDestroy?: () => void;
    autoClose?: number | string;
    columnClass?: string;
    boxWidth?: string;
    scrollToPrevious?: boolean;
    smoothContent?: boolean;
    draggable?: boolean;
    dragWindowGap?: number;
    offsetTop?: number;
    offsetBottom?: number;
    watchInterval?: number;
    useBootstrap?: boolean;
  }
}

export {};

