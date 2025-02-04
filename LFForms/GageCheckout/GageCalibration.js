var should_print_receipt = true;
$.getScript("https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js", function() {
  WebFont.load({
    google: {
      families: ['Montserrat', 'Libre Barcode 128']
    }
  });
});



$(document).ready(
  function () {

    $('.Submit').hide();
    $(document).prop('title', 'Gage Calibration');
    $('#q0').append("<div class='hidden-text' id='print_output'></div>");


    var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
    var printEvent = window[eventMethod];
    var messageEvent = eventMethod === "attachEvent" ? "onmessage" : "message";

    printEvent(messageEvent, function(e) {

      if (e.data === "printme" || e.message === "printme") {
        console.log('Print Event Called');

        $("#myiframe").get(0).contentWindow.print();
      }
    });


    $(document).on("lookupcomplete", function(e) {

      if (e.triggerId == 'Field37'){
        if ($('#Field37').val()){
          if ($('#Field37').val() != "0"){
            print_receipt(); 
          }
        }
      }

      if ($('#Field4').val().length > 0) { 
        $('.Submit').show();
        $('#Field37').val($('#Field4').val())
      }
      else { $('.Submit').hide(); }

    });
  });


function loadiFrame(src){
  $("#print_output").html("<iframe id='myiframe' name='myname' src='" + src + "' />");
}


function print_receipt(){

  var domain = document.location.hostname;
  var receipt_url_root = "http://" + domain + "/Forms/";
  var receipt_url = "";
  
  

  if ($('#Field34').val() == 1){
    receipt_url = receipt_url_root + "PinGageReceipt?TicketID=" + $('#Field37').val();
  }
  if ($('#Field34').val() == 2){
    receipt_url = receipt_url_root + "BinReceipt?TicketID=" + $('#Field37').val();
  }
  if ($('#Field34').val() == 3){
    receipt_url = receipt_url_root + "ThreadReceipt?TicketID=" + $('#Field37').val();
  }

  if (should_print_receipt == true){
    if (receipt_url != ""){
      loadiFrame(receipt_url); 
      should_print_receipt == false;
      $('#Field37').val(0).change();
    }
  }
}
