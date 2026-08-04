$(function () {
  $('.Submit').hide();
  $.when(
    $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jsbarcode/3.11.6/JsBarcode.all.min.js')
  ).done(function () {
    
  }).fail(function () {
    console.error('Failed to load required scripts');
  });
  $('.hr').append('<hr>');
  $("#Field21").attr("id", "ticket-title");
  


  $(document).on("onloadlookupfinished", function () {
    $('.last-cal-date input').val($('.last-cal-date input').val().split(" ")[0]);
    $('.cal-due-date input').val($('.cal-due-date input').val().split(" ")[0]);
    $('.print-date input').val(new Date().toLocaleString());
    parent.postMessage("printme", "*");

  });

  $(document).on("lookupcomplete", function () {
    $('#ticket-title').val($('.ticket-number input').val());
    
    const barcode_value = "*" + $('.ticket-number input').val() + "*";
    if ($('#barcode').length === 0) {
      $('.ticket-number-barcode input').parent().append('<svg id="barcode"></svg>');
      JsBarcode("#barcode", barcode_value, {
        height: 20,
        width: 1,
        marginLeft: 60,
        displayValue: false
      });
    }



  });

});
