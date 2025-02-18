var should_print_receipt = true;


$(document).ready(function () {



  if ($('.closeme input').val() == 1) {
    $('#q2').hide();
    $('#q3').hide();
  }



  $('.Submit').hide();
  $('.Submit').click(function (e) {
    if ($('.tid input').val().length > 0) {
      $('.closeme input').val(1);
    }
    else {
      $('.closeme input').val(0);
    }
    $('.print-ticket-id input').val($('.guid input').val());
  });

  $(document).prop('title', 'Gage Calibration');
  $('#q0').append("<div class='hidden' id='print_output'></div>");

  set_print_event();

  $(document).on("lookupcomplete", function (e) {

    if (e.triggerId == 'Field37') {
      if ($('#Field37').val()) {
        if ($('#Field37').val() != "0") {
          print_receipt();
        }
      }
    }

    if ($('.ticket-id input').val().length > 0) {
      $('.Submit').show();
    }
    else {
      $('.Submit').hide();
    }

  });

  $(".pin-table-notes textarea").on("change", function (e) {
    var note_text = $(e.currentTarget).val();
    note_text = note_text.replace(/'/g, '');
    note_text = note_text.replace(/"/g, '');
    $(e.currentTarget).val(note_text);
  });

  $(document).on('keyup', '.ticket-number input', function () {
    this.value = this.value.toLocaleUpperCase();
  });


});


function loadiFrame(src) {
  $("#print_output").html("<iframe id='myiframe' name='myname' src='" + src + "' />");
}


function print_receipt() {

  var domain = document.location.hostname;
  var receipt_url_root = "http://" + domain + "/Forms/";
  var receipt_url = "";



  if ($('#Field34').val() == 1) {
    receipt_url = receipt_url_root + "PinGageReceipt?guid=" + $('#Field37').val();
  }
  if ($('#Field34').val() == 2) {
    receipt_url = receipt_url_root + "ThreadReceipt?guid=" + $('#Field37').val();
  }

  if (should_print_receipt == true) {
    if (receipt_url != "") {
      loadiFrame(receipt_url);
      should_print_receipt == false;
      $('#Field37').val(0).change();
    }
  }
}


function set_print_event() {
  var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
  var printEvent = window[eventMethod];
  var messageEvent = eventMethod === "attachEvent" ? "onmessage" : "message";

  printEvent(messageEvent, function (e) {

    if (e.data === "printme" || e.message === "printme") {
      $("#myiframe").get(0).contentWindow.print();
      if ($('.closeme input').val() == 1) {
        window.parent.postMessage('CloseDialogWithRefresh', '*');
      }

    }
  });
}

