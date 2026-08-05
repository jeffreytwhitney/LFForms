/**
 * JsBarcode type definitions
 * https://github.com/lindell/JsBarcode
 */

type JsBarcodeFormat =
  | 'CODE128'
  | 'CODE128A'
  | 'CODE128B'
  | 'CODE128C'
  | 'CODE39'
  | 'CODE93'
  | 'CODE11'
  | 'MSI'
  | 'CODABAR'
  | 'EAN13'
  | 'EAN8'
  | 'EAN5'
  | 'EAN2'
  | 'UPC'
  | 'UPCE'
  | 'ITF14'
  | 'ITF'
  | 'pharmacoode';

interface JsBarcodeOptions {
  format?: JsBarcodeFormat;
  width?: number;
  height?: number;
  displayValue?: boolean;
  text?: string;
  fontOptions?: string;
  font?: string;
  textAlign?: 'left' | 'center' | 'right';
  textPosition?: 'top' | 'bottom';
  textMargin?: number;
  margin?: number;
  marginTop?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
  lineColor?: string;
  background?: string;
  ean128?: boolean;
  elementTag?: string;
}

interface JsBarcodeStatic {
  (element: string | HTMLElement | HTMLElement[], value: string, options?: JsBarcodeOptions): JsBarcodeStatic;
  (element: string | HTMLElement | HTMLElement[], value: number, options?: JsBarcodeOptions): JsBarcodeStatic;
}

declare global {
  function JsBarcode(element: string | HTMLElement | HTMLElement[], value: string, options?: JsBarcodeOptions): JsBarcodeStatic;
  function JsBarcode(element: string | HTMLElement | HTMLElement[], value: number, options?: JsBarcodeOptions): JsBarcodeStatic;
  const JsBarcode: JsBarcodeStatic;
}

export {};

