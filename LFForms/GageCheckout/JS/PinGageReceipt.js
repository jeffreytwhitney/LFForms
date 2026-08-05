let jsbarScriptLoaded = false;
let barcodeGenerated = false;
let printPosted = false;
let printRetryTimer = null;
let field29Seen = false;
let field4Seen = false;

$(function () {
  $('.Submit').hide();

  $.when(
    $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jsbarcode/3.11.6/JsBarcode.all.min.js')
  ).done(function () {
    jsbarScriptLoaded = true;
    $(document).prop('title', 'Ticket');
    $('.hr').append('<hr>');
    $(".ticket-number-display input").attr("id", "ticket-title");
    tryPostPrint();
  }).fail(function () {
    console.error('Failed to load required scripts');
  });



  $(document).on("onloadlookupfinished", function () {

    $('.last-cal-date input').val($('.last-cal-date input').val().split(" ")[0]);
    $('.cal-due-date input').val($('.cal-due-date input').val().split(" ")[0]);
    $('.print-date input').val(new Date().toLocaleString());

    const totalPins = $('.pin-table table tbody tr').length
    $('#Field21').prepend(`<div class='pin-count'>Number of Pins/Bins: ${totalPins}</div>`);
    tryPostPrint();
  });

  $(document).on("lookupcomplete", function (e) {
    if (e.triggerId === 'Field29') {
      field29Seen = true;
    }
    if (e.triggerId === 'Field4') {
      field4Seen = true;
    }
    $('#ticket-title').val($('.ticket-number input').val());
    const barcode_value = "*" + $('.ticket-number input').val() + "*";

    if ($('#barcode').length === 0) {
      $('.ticket-number-barcode input').parent().append('<svg id="barcode"></svg>');
      generateBarcode(barcode_value, jsbarScriptLoaded, function() {
        barcodeGenerated = true;
        tryPostPrint();
      });
    }

  });

});

function tryPostPrint() {
  if (printPosted) {
    return;
  }

  const pinRowsReady = $('.pin-table table tbody tr').length > 0;

  if (!jsbarScriptLoaded || !barcodeGenerated || !pinRowsReady || !field29Seen || !field4Seen) {
    if (printRetryTimer === null) {
      printRetryTimer = window.setTimeout(function () {
        printRetryTimer = null;
        tryPostPrint();
      }, 100, 20);
    }
    return;
  }

  if (printRetryTimer !== null) {
    window.clearTimeout(printRetryTimer);
    printRetryTimer = null;
  }

  printPosted = true;
  parent.postMessage("printme", "*");
}

function generateBarcode(barcode_value, scriptLoaded, onSuccess) {
  if (typeof JsBarcode === 'undefined') {
    if (scriptLoaded) {
      console.error('JsBarcode script loaded but function not available');
      return;
    }
    // Script not yet loaded, retry in 100ms
    setTimeout(function() {
      generateBarcode(barcode_value, true, onSuccess);
    }, 100);
    return;
  }

  JsBarcode("#barcode", barcode_value, {
    height: 20,
    width: 1,
    marginLeft: 50,
    displayValue: false
  });
  onSuccess();
}

