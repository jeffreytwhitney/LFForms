var should_print_receipt = true;


$(document).ready(function () {
  $('.Submit').show();
  $(document).prop('title', 'Ticket Details');
  $('.Submit').click(function (e) { validateForm(e);  });
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simplePagination.js/1.6/simplePagination.min.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
  var bootstrapButton = $.fn.button.noConflict(); // return $.fn.button to previously assigned value
  $.fn.bootstrapBtn = bootstrapButton;

  $('#q0').append("<div class='hidden' id='popUpDiv'></div>");

  var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
  var printEvent = window[eventMethod];
  var messageEvent = eventMethod === "attachEvent" ? "onmessage" : "message";
  printEvent(messageEvent, function (e) {

    if (e.data === "printme" || e.message === "printme") {
      $("#print-iframe").get(0).contentWindow.print();
      $('.print-ticket-id input').val(null);
      if ($('.closeme input').val() == 1) {
        window.parent.postMessage('CloseDialogWithRefresh', '*');
      }
    }
  });

 

  $(document).on("onloadlookupfinished", function () {


  });


  $(document).on('lookupcomplete', function (e) {
    if (e.triggerId == 'Field23') {
      if ($('#Field23').val()) {
        if ($('#Field23').val() != null) {
          print_receipt();
        }
      }
    }

    var ticketType = Number($('.ticket-type-id input').val());

    if (ticketType == 1) {
      generatePinCalibrationLinkColumn();
      colorCodePinRows();
    }
    else if (ticketType == 2) {
      generateThreadCalibrationLinkColumn();
      setDailyCalValues();
      colorCodeThreadRows();
    }
  });


  $(document).on('change', '[id^="Field41"]', function (e) {
    if ($(e.currentTarget).val() == 'BIN') {
      $(e.currentTarget).closest('tr').find('.add-pins-bins-table-diameter input').val(0).addClass("ui-state-disabled");
      $(e.currentTarget).closest('tr').find('.add-pins-bins-table-number-of-pins input').val(1).addClass("ui-state-disabled");
    }
    else {
      $(e.currentTarget).closest('tr').find('.add-pins-bins-table-diameter input').val(null).removeClass("ui-state-disabled");
      $(e.currentTarget).closest('tr').find('.add-pins-bins-table-number-of-pins input').removeClass("ui-state-disabled");
    }
  });
  $(document).on('keyup', '[id^="Field45"]', function () {
    this.value = this.value.toLocaleUpperCase();
  });


});

function colorCodePinRows() {
  
  var pin_history_rows = $(".pin-history-table table tbody tr");
  var pin_history_event_types = $('.pin-history-event-type input[type="text"]');

  $(pin_history_rows).removeClass('colorCalibrated');


  pin_history_event_types.each(function (index) {
    
    let pin_history_row = pin_history_rows[index];
    let pin_history_event_type = $(this).val();


    if ((pin_history_event_type == 'Calibrated')) {
      $(pin_history_row).addClass('colorCalibrated');
    }

  });
}


function colorCodeThreadRows() {
  var statuses = $('.thread-history-table-status input[type="text"]');
  var thread_history_rows = $(".thread-history-table table tbody tr");
  var thread_history_event_types = $('.thread-history-event-type input[type="text"]');

  $(thread_history_rows).removeClass('colorMissing');
  $(thread_history_rows).removeClass('colorCalibrated');


  statuses.each(function (index) {
    let status = $(statuses[index]).val();
    let thread_history_row = thread_history_rows[index];
    let thread_history_event_type = $(thread_history_event_types[index]).val();

    if (status == 'Missing')  {
      $(thread_history_row).addClass('colorMissing');
      return;
    }
    if ((thread_history_event_type == 'Calibrated')) {
      $(thread_history_row).addClass('colorCalibrated');
    }

  });
}


function generatePinCalibrationLinkColumn() {
  $('.calibration-detail-div').remove();
  var event_type_names = $('.pin-history-event-type input[type="text"]');
  var event_type_ids = $('.pin-history-table-event-id input[type="text"]');
  var calibration_ids = $('.pin-history-table-calibration-id input[type="text"]');
  
  event_type_names.each(function (index) {
    let event_type_id = $(event_type_ids[index]).val();
    let calibration_id = $(calibration_ids[index]).val();

    if (event_type_id == 3) {
      let calibration_div = $("<div>", { class: 'calibration-detail-div' });
      let calibration_link = $("<a>", { text: "Calibrated", class: 'calibration-detail-link', href: 'javascript:void(0);', onclick: `showPinCalibrationHistory(${calibration_id})` });
      calibration_div.append(calibration_link);
      $(this).parent().append(calibration_div);
      if (!$(this).hasClass('hidden')) {
        $(this).addClass('hidden');
      }
    }
  });

}


function generateThreadCalibrationLinkColumn() {
  $('.calibration-detail-div').remove();
  var event_type_names = $('.thread-history-event-type input[type="text"]');
  var event_type_ids = $('.thread-history-table-event-id input[type="text"]');
  var calibration_ids = $('.thread-history-table-calibration-id input[type="text"]');

  event_type_names.each(function (index) {
    let event_type_id = $(event_type_ids[index]).val();
    let calibration_id = $(calibration_ids[index]).val();

    if (event_type_id == 3) {
      let calibration_div = $("<div>", { class: 'calibration-detail-div' });
      let calibration_link = $("<a>", { text: "Calibrated", class: 'calibration-detail-link', href: 'javascript:void(0);', onclick: `showThreadCalibrationHistory(${calibration_id})` });
      calibration_div.append(calibration_link);
      $(this).parent().append(calibration_div);
      if (!$(this).hasClass('hidden')) {
        $(this).addClass('hidden');
      }
    }
  });

}


function loadiFrame(src) {
  $("#popUpDiv").html("<iframe id='print-iframe' name='myname' src='" + src + "' />");
}


function popUpIframe(src, title, height, width) {
  //var iframe_height = height - 100;

  $("#popupIFrame").remove();
  $("#popUpDiv").html(`<div height='${height}' width='${width}'><iframe id='popupIFrame' name='myname' src='${src}' height='${height}' width='${width}'/></div>`);
  $("#popupIFrame").dialog({
    title: title,
    height: height,
    width: width,
    autoOpen: false,
    resizable: true,
    modal: true,
    close: function (event, ui) {
    }
  });


  $("#popupIFrame").dialog("open");
  $('#popupIFrame').attr('style', `width: 100%; height: ${height}px;`);
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


function resetValidationErrors() {
  $('.add-pins-bins-table-new-bin-number input').removeClass('parsley-error');
  $('.add-thread-gages-new-thread-gage-name input').removeClass('parsley-error');

  $('#bad-pin-name-error').remove();
  $('#preexisting-bin-error').remove();

  $('#bad-thread-gage-error').remove();
  $('#preexisting-thread-gage-error').remove();


}


function setDailyCalValues() {
  var dailyCalValues = $('.existing-thread-gages-daily-cal-value input');
  var dailyCalDisplay = $('.existing-thread-gages-daily-cal fieldset');

  dailyCalValues.each(function (i) {
    let dailyCalValue = $(this).val();
    let dailyCalDisplayField = dailyCalDisplay[i];
    let dailyDisplayInputs = $(dailyCalDisplayField).find('input');
    dailyDisplayInputs.each(function (ii) {
      let inputValue = $(this).val();
      if (dailyCalValue == inputValue) {
        $(this).attr('checked', 'checked');
      }
    });
  });
}


function showPinCalibrationHistory(calibration_id) {
  popUpIframe(`http://rmslf/Forms/RMS-GAGE-PinCalibrationHistory?pcid=${calibration_id}`, 'Calibration History', 600, 1100);
}


function showThreadCalibrationHistory(calibration_id) {
  popUpIframe(`http://rmslf/Forms/RMS-GAGE-ThreadCalibrationHistory?pcid=${calibration_id}`, 'Calibration History', 600, 900);
}


function validateForm(e) {
  
  var isValid = true;
  resetValidationErrors();
  

  var ticketType = Number($('.ticket-type-id input').val());
  var pinRows = $('.add-pins-bins-table table tbody tr');
  var threadRows = $('.add-thread-gages-table table tbody tr');

  if (ticketType == 1) {
    pinRows.each(function (index) {

      let pinTypeValue = Number($(this).find('.add-pins-bins-table-pin-type-id input').val());
      let binName = $(this).find('.add-pins-bins-table-new-bin-number input');
      let existingBinTicketNumber = $(this).find('.add-pins-bins-table-existing-bin-id input');
      let binID = $(this).find('.add-pins-bins-table-new-bin-id input');
      if ((pinTypeValue == 5) && ((binName.val().length > 0) && binID.val().length == 0)) {
        binName.parent().find('#bad-pin-name-error').remove();
        binName.parent().append("<ul id='bad-pin-name-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>Invalid Pin Name.</li></ul>");
        binName.addClass('parsley-error');
        isValid = false;
      }
      if (existingBinTicketNumber.val().length > 0) {
        binName.parent().find('#preexisting-bin-error').remove();
        binName.parent().append("<ul id='preexisting-bin-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>Bin already marked as 'Checked Out'. See Metrology Calibration.</li></ul>");
        binName.addClass('parsley-error');
        isValid = false;
      }
    });
  }
  else if (ticketType == 2) {
    threadRows.each(function (index) {
      let threadGageName = $(this).find('.add-thread-gages-table-thread-gage-name input');
      let threadGageID = $(this).find('.add-thread-gages-table-new-thread-gage-id input');
      let existingThreadGageTicketNumber = $(this).find('.add-thread-gages-table-existing-thread-gage-id input');

      if ((threadGageID.val().length == 0) && (threadGageName.val().length > 0)) {
        threadGageName.parent().find('#bad-thread-gage-error').remove();
        threadGageName.parent().append("<ul id='bad-thread-gage-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>Invalid Thread Gage Name.</li></ul>");
        threadGageName.addClass('parsley-error');
        isValid = false;
      }
      if (existingThreadGageTicketNumber.val().length > 0) {
        threadGageName.parent().find('#preexisting-thread-gage-error').remove();
        threadGageName.parent().append("<ul id='preexisting-thread-gage-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>Thread Gage already marked as 'Checked Out'. See Metrology Calibration.</li></ul>");
        threadGageName.addClass('parsley-error');
        isValid = false;
      }
    });
  }

  if (isValid == true) {
    $('.closeme input').val(1);
    $('.print-ticket-id input').val($('.guid input').val());
  }
  else {
    e.preventDefault();
  }


}