$(document).ready(function () {
  $('.Submit').hide();
  $(document).prop('title', 'Ticket');
  $('.hr').append('<hr>');
  $("#Field24").attr("id", "ticket-title");
  $("#Field6").attr("id", "ticket-barcode");

  $(document).on("onloadlookupfinished", function () {

    $('#Field26').val($('#Field26').val().split(" ")[0]);
    $('#Field19').val($('#Field19').val().split(" ")[0]);
    $('#Field18').val(new Date().toLocaleString());
    console.log('Calling Mom');
    parent.postMessage("printme", "*");

  });

  $(document).on("lookupcomplete", function (e) {
    $('#ticket-title').val($('#Field1').val())
    var barcode_value = "*" + $('#Field1').val() + "*";
    $('#ticket-barcode').val(barcode_value);
  });

});