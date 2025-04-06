var should_print_receipt = true;
$(document).ready(function () {
  $(document).prop('title', 'Gage Checkout');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js');

  $('.Submit').click(function (e) { validateForm(e); });

  $('#q0').append("<div class='hidden' id='print_output'></div>");

  var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
  var printEvent = window[eventMethod];
  var messageEvent = eventMethod === "attachEvent" ? "onmessage" : "message";
  printEvent(messageEvent, function (e) {

    if (e.data === "printme" || e.message === "printme") {
      $("#myiframe").get(0).contentWindow.print();
      $('.print-ticket-id input').val(null);
    }
  });

  $(document).on('lookupcomplete', function (e) {
    validateForm();
    if (e.triggerId == 'Field152') {
      if ($('#Field152').val()) {
        if ($('#Field152').val() != null) {
          print_receipt();
        }
      }
    }
  });

  $(document).on("onloadlookupfinished", function () {
    var sitename = $.cookie('site_name');
    if (sitename != null) {
      $('#Field162').val(sitename).change();
    }
  });

  $(document).on('change', '.pin-table-pin-type select', function (e) {
    if ($(e.currentTarget).val() == 'BIN') {
      $(e.currentTarget).closest('tr').find('.pin-table-diameter input').val(1).addClass("ui-state-disabled");
      $(e.currentTarget).closest('tr').find('.pin-table-number-of-pins input').val(1).addClass("ui-state-disabled");
    }
    else {
      $(e.currentTarget).closest('tr').find('.pin-table-diameter input').removeClass("ui-state-disabled");
      $(e.currentTarget).closest('tr').find('.pin-table-number-of-pins input').removeClass("ui-state-disabled");
    }
  });

  $('.ticket-type-radio fieldset input[type="radio"]').change(function (e) {
    $('.pin-table-bin-number input').removeClass('parsley-error');
    $('.thread-gage-name input').removeClass('parsley-error');
    $('#bad-pin-name-error').remove();
    $('#preexisting-bin-error').remove();
    $('#bad-thread-gage-error').remove();
    $('#preexisting-thread-gage-error').remove();
    $('#missing-thread-gage-error').remove();
    $('.pin-table-bin-number input').val('');
    $('.thread-gage-table-name input').val('');
    $('.existing-missing-thread-ticket-number input').val('');
  });

  $('.existing-missing-thread-ticket-number input').change(function (e) {
    validateForm();
  });

  $('.thread-gage-table-existing-ticket-id input').change(function (e) {
    validateForm();
  });

  $(document).on('change', '#Field162', function () {
    var sitename = $('#Field162').val();
    $.cookie('site_name', sitename, { expires: 365, path: '/' });
  });


});


function loadiFrame(src) {
  $("#print_output").html("<iframe id='myiframe' name='myname' src='" + src + "' />");
}


function print_receipt() {

  var domain = document.location.hostname;
  var receipt_url_root = "http://" + domain + "/Forms/";
  var receipt_url = "";



  if ($('.print-ticket-type-id input').val() == 1) {
    receipt_url = receipt_url_root + "PinGageReceipt?guid=" + $('.print-ticket-id input').val();
  }
  if ($('.print-ticket-type-id input').val() == 2) {
    receipt_url = receipt_url_root + "ThreadReceipt?guid=" + $('.print-ticket-id input').val();
  }

  if (should_print_receipt == true) {
    if (receipt_url != "") {
      loadiFrame(receipt_url);
      should_print_receipt == false;
      $('.print-ticket-id input').val(null).change();
    }
  }
}


function validateForm(e) {

  if (!$('.print-ticket-id input').val()) {
    $('.print-ticket-id input').val($('.guid input').val());
  }

  $('.Submit').prop("disabled", false);
  $('.cell-leader-id input').removeClass('parsley-error');
  $('.pin-table-bin-number input').removeClass('parsley-error');
  $('.thread-gage-table-name input').removeClass('parsley-error');

  $('#cell-leader-error').remove();
  $('#bad-pin-name-error').remove();
  $('#preexisting-bin-error').remove();
  $('#bad-thread-gage-error').remove();
  $('#preexisting-thread-gage-error').remove();
  $('#missing-thread-gage-error').remove();

  var ticketType = $('.ticket-type-radio fieldset input[type="radio"]:checked').val();
  var cellLeaderID = $('.cell-leader-id input');
  var cellLeaderName = $('.cell-leader-name input');

  var pinRows = $('.pin-table table tbody tr');
  var threadRows = $('.thread-gage-table table tbody tr');


  if ((cellLeaderName.val().length > 0) && (cellLeaderID.val().length === 0)) {
    cellLeaderName.parent().append("<ul id='cell-leader-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>You must select a valid Cell Leader.</li></ul>");
    cellLeaderName.addClass('parsley-error');
    $('.Submit').prop("disabled", true);
    if (arguments.length === 1) {
      e.preventDefault();
    }
  }

  if (ticketType == 1) {
    pinRows.each(function (index) {
      let pinTypeValue = Number($(this).find('.pin-table-pin-type-id input').val());
      let binName = $(this).find('.pin-table-bin-number input');
      let existingBinTicketNumber = $(this).find('.pin-table-existing-bin-ticket-id input');
      let binID = $(this).find('.pin-table-bin-id input');
      if ((pinTypeValue == 5) && ((binName.val().length > 0) && binID.val().length == 0)) {
        console.log('pins!');
        binName.parent().find('#bad-pin-name-error').remove();
        binName.parent().append("<ul id='bad-pin-name-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>Invalid Bin Name.</li></ul>");
        binName.addClass('parsley-error');
        $('.Submit').prop("disabled", true);
        if (arguments.length === 1) {
          e.preventDefault();
        }
      }
      if (existingBinTicketNumber.val().length > 0) {
        binName.parent().find('#preexisting-bin-error').remove();
        binName.parent().append("<ul id='preexisting-bin-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>Bin already marked as 'Checked Out'. See Metrology Calibration.</li></ul>");
        binName.addClass('parsley-error');
        $('.Submit').prop("disabled", true);
        if (arguments.length === 1) {
          e.preventDefault();
        }
      }
    });
  }
  else {
    threadRows.each(function (index) {
      let threadGageName = $(this).find('.thread-gage-table-name input');
      let threadGageID = $(this).find('.thread-gage-table-id input');
      let missingThreadGageTicketNumber = $(this).find('.existing-missing-thread-ticket-number input');
      let existingThreadGageTicketNumber = $(this).find('.thread-gage-table-existing-ticket-id input');

      if ((threadGageID.val().length == 0) && (threadGageName.val().length > 0)) {
        threadGageName.parent().find('#bad-thread-gage-error').remove();
        threadGageName.parent().append("<ul id='bad-thread-gage-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>Invalid Thread Gage Name.</li></ul>");
        threadGageName.addClass('parsley-error');
        $('.Submit').prop("disabled", true);
        if (arguments.length === 1) {
          e.preventDefault();
        }
      }
      if (existingThreadGageTicketNumber.val().length > 0) {
        threadGageName.parent().find('#preexisting-thread-gage-error').remove();
        threadGageName.parent().append("<ul id='preexisting-thread-gage-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>Thread Gage already marked as 'Checked Out'. See Metrology Calibration.</li></ul>");
        threadGageName.addClass('parsley-error');
        $('.Submit').prop("disabled", true);
        if (arguments.length === 1) {
          e.preventDefault();
        }
      }
      if (missingThreadGageTicketNumber.val().length > 0) {
        threadGageName.parent().find('#missing-thread-gage-error').remove();
        threadGageName.parent().append("<ul id='missing-thread-gage-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>Thread Gage marked as 'Missing' on another ticket. Bring gage to Metrology Calibration.</li></ul>");
        threadGageName.addClass('parsley-error');
        $('.Submit').prop("disabled", true);
        if (arguments.length === 1) {
          e.preventDefault();
        }
      }
    });

  }
}

