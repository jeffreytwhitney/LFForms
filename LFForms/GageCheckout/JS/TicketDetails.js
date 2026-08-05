let should_print_receipt = true;


$(function () {

  
  $(document).prop('title', 'Ticket Details');
  $('.Submit').on("click", function (e) { validateForm(e);  });
  $.when(
    $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js'),
    $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js')
  ).done(function () {
    
  }).fail(function () {
    console.error('Failed to load required scripts');
  });

  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simplePagination.js/1.6/simplePagination.min.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
  $.fn.bootstrapBtn = $.fn.button.noConflict(); // return $.fn.button to previously assigned value


  $('#q0').append("<div class='hidden' id='popUpDiv'></div>");

  const eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
  const printEvent = window[eventMethod];
  const messageEvent = eventMethod === "attachEvent" ? "onmessage" : "message";
  printEvent(messageEvent, function (e) {

    if (e.data === "printme" || e.message === "printme") {
      $("#print-iframe").get(0).contentWindow.print();
      $('.print-ticket-id input').val(null);
      if ($('.closeme input').val() === 1) {
        window.parent.postMessage('CloseDialogWithRefresh', '*');
      }
    }
  });
  
  $(document).on("onloadlookupfinished", function () {


  });

  $(document).on('lookupcomplete', function (e) {

    const readonly = Number($('.ro input').val());
    if (readonly !== 1) {
      if (isActiveUser() === true) {
        $('.Submit').show();
      }
      else {
        $('.Submit').hide();
      }
    }
    else {
      $('.Submit').hide();
    }


    if (e.triggerId === 'Field23') {
      if ($('#Field23').val()) {
        if ($('#Field23').val() !== null) {
          print_receipt();
        }
      }
    }

    const ticketType = Number($('.ticket-type-id input').val());

    fillMachineNameCombos();

    if (ticketType === 1) {
      generatePinCalibrationLinkColumn();
      colorCodePinRows();
    }
    else if (ticketType === 2) {
      generateThreadCalibrationLinkColumn();
      setDailyCalValues();
      colorCodeThreadRows();
    }
  });

  $(document).on('change', '[id^="Field41"]', function (e) {
    if ($(e.currentTarget).val() === 'BIN') {
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

  $(document).on('change', '[id^="Field109"]', function () {
    generateMachineList();
  });

  $(document).on('click', '.cf-collection-delete', function () {
    generateMachineList();
  });

  });


function colorCodePinRows() {
  
  const pin_history_rows = $(".pin-history-table table tbody tr");
  const pin_history_event_types = $('.pin-history-event-type input[type="text"]');

  $(pin_history_rows).removeClass('colorCalibrated');


  pin_history_event_types.each(function (index) {
    
    const pin_history_row = pin_history_rows[index];
    const pin_history_event_type = $(this).val();


    if ((pin_history_event_type === 'Calibrated')) {
      $(pin_history_row).addClass('colorCalibrated');
    }

  });
}


function colorCodeThreadRows() {
  const statuses = $('.thread-history-table-status input[type="text"]');
  const thread_history_rows = $(".thread-history-table table tbody tr");
  const thread_history_event_types = $('.thread-history-event-type input[type="text"]');

  $(thread_history_rows).removeClass('colorMissing');
  $(thread_history_rows).removeClass('colorCalibrated');


  statuses.each(function (index) {
    const status = $(statuses[index]).val();
    const thread_history_row = thread_history_rows[index];
    const thread_history_event_type = $(thread_history_event_types[index]).val();

    if (status === 'Missing')  {
      $(thread_history_row).addClass('colorMissing');
      return;
    }
    if ((thread_history_event_type === 'Calibrated')) {
      $(thread_history_row).addClass('colorCalibrated');
    }

  });
}


function fillMachineNameCombos() {
  const machineNameInputs = $('[id^="Field106"]');

  $('[id^="Field109"]').each(function (index, element) {
    if ($(element).val() === '') {
      const machineNameInput = machineNameInputs[index];
      const machineNameInputVal = $(machineNameInput).val();
      $(element).val(machineNameInputVal).trigger("change");
    }

  });
}


function generateMachineList() {
  let machineList = '';

  $('[id^="Field109"]').each(function (index, element) {
    const machineName = $(element).val();
    if (machineName !== '') {
      if (machineList.length > 0) {
        machineList += ', ' + machineName;
      }
      else {
        machineList = machineName;
      }
    }
  });

  $('.machine-name-list input').val(machineList);
}


function generatePinCalibrationLinkColumn() {
  $('.calibration-detail-div').remove();
  const event_type_names = $('.pin-history-event-type input[type="text"]');
  const event_type_ids = $('.pin-history-table-event-id input[type="text"]');
  const calibration_ids = $('.pin-history-table-calibration-id input[type="text"]');
  
  event_type_names.each(function (index) {
    const event_type_id = $(event_type_ids[index]).val();
    const calibration_id = $(calibration_ids[index]).val();

    if (event_type_id === 3) {
      const calibration_div = $("<div>", { class: 'calibration-detail-div' });
      const calibration_link = $("<a>", { text: "Calibrated", class: 'calibration-detail-link', href: 'javascript:void(0);', onclick: `showPinCalibrationHistory(${calibration_id})` });
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
  const event_type_names = $('.thread-history-event-type input[type="text"]');
  const event_type_ids = $('.thread-history-table-event-id input[type="text"]');
  const calibration_ids = $('.thread-history-table-calibration-id input[type="text"]');

  event_type_names.each(function (index) {
    const event_type_id = $(event_type_ids[index]).val();
    const calibration_id = $(calibration_ids[index]).val();

    if (event_type_id === 3) {
      const calibration_div = $("<div>", { class: 'calibration-detail-div' });
      const calibration_link = $("<a>", { text: "Calibrated", class: 'calibration-detail-link', href: 'javascript:void(0);', onclick: `showThreadCalibrationHistory(${calibration_id})` });
      calibration_div.append(calibration_link);
      $(this).parent().append(calibration_div);
      if (!$(this).hasClass('hidden')) {
        $(this).addClass('hidden');
      }
    }
  });

}


function isActiveUser() {
  const userStatus = Number($('.user-is-active input').val());
  return userStatus === 1;
}


function loadiFrame(src) {
  $("#popUpDiv").html("<iframe id='print-iframe' name='myname' src='" + src + "' />");
}


function popUpIframe(src, title, height, width) {
  //var iframe_height = height - 100;

  $("#popupIFrame").remove();
  $("#popUpDiv").html(`<div style='height:${height}px; width:${width}px;'><iframe id='popupIFrame' name='myname' src='${src}' height='${height}' width='${width}'/></div>`);
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

  const domain = document.location.hostname;
  const receipt_url_root = "http://" + domain + "/Forms/";
  let receipt_url = "";



  if ($('.print-ticket-type-id input').val() === 1) {
    receipt_url = receipt_url_root + "PinGageReceipt?guid=" + $('.print-ticket-id input').val();
  }
  if ($('.print-ticket-type-id input').val() === 2) {
    receipt_url = receipt_url_root + "ThreadReceipt?guid=" + $('.print-ticket-id input').val();
  }

  if (should_print_receipt === true) {
    if (receipt_url !== "") {
      loadiFrame(receipt_url);
      should_print_receipt = false;
      $('.print-ticket-id input').val(null).trigger("change");
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
  const dailyCalValues = $('.existing-thread-gages-daily-cal-value input');
  const dailyCalDisplay = $('.existing-thread-gages-daily-cal fieldset');

  dailyCalValues.each(function (i) {
    const dailyCalValue = $(this).val();
    const dailyCalDisplayField = dailyCalDisplay[i];
    const dailyDisplayInputs = $(dailyCalDisplayField).find('input');
    dailyDisplayInputs.each(function () {
      const inputValue = $(this).val();
      if (dailyCalValue === inputValue) {
        $(this).attr('checked', 'checked');
      }
    });
  });
}


function showPinCalibrationHistory(calibration_id) {
  popUpIframe(`${window.location.origin}/Forms//RMS-GAGE-TicketPinCalHistory?pcid=${calibration_id}`, 'Calibration History', 600, 1100);
}


function showThreadCalibrationHistory(calibration_id) {
  popUpIframe(`${window.location.origin}/Forms//RMS-GAGE-TicketThreadCalHistory?pcid=${calibration_id}`, 'Calibration History', 600, 1000);
}


function submitForm(e) {
  const isValid = validateForm(e);
  const ticketType = Number($('.ticket-type-id input').val());
  const pinRows = $('.add-pins-bins-table table tbody tr');
  const statusID = Number($('.sid input').val());
  const stagedMachineNameVal = $('.staged-machine-name input').val();
  const machineListVal = $('.machine-name-list input').val();
  const newMachineGroupID = Number($('.new-machine-group-id input').val());
  if (newMachineGroupID === 0) {
    $('.new-machine-group-id input').val(0);
  }

  if (isValid === false) {
    e.preventDefault();
    return;
  }

  if (statusID > 1) {
    if (stagedMachineNameVal.length === 0) {
      if (machineListVal.length > 0) {
        $('.staged-machine-name input').val(machineListVal);
      }
    }

  }


  if (ticketType === 1) {
    if (pinRows.length > 0) {
      pinRows.each(function () {
        
        const pinTypeValue = Number($(this).find('.add-pins-bins-table-pin-type-id input').val());
        const newBinID = $(this).find('.add-pins-bins-table-new-bin-id input');
        const numberOfPins = $(this).find('.add-pins-bins-table-new-bin-number input');
        const pinDiameter = $(this).find('.add-pins-bins-table-diameter input');

        if (pinTypeValue === 5) {
          numberOfPins.val(1);
          pinDiameter.val(0);
        }
        else {
          newBinID.val(0);
        }
      });
    }
  }

}


function validateForm(e) {
  
  let isValid = true;
  resetValidationErrors();
  

  const pinRows = $('.add-pins-bins-table table tbody tr');

  pinRows.each(function () {

    const pinTypeValue = Number($(this).find('.add-pins-bins-table-pin-type-id input').val());
    const binName = $(this).find('.add-pins-bins-table-new-bin-number input');
    const existingBinTicketNumber = $(this).find('.add-pins-bins-table-existing-bin-id input');
    const binID = $(this).find('.add-pins-bins-table-new-bin-id input');
    if ((pinTypeValue === 5) && (binName.val() && !binID.val())) {
      binName.parent().find('#bad-pin-name-error').remove();
      binName.parent().append("<ul id='bad-pin-name-error' aria-live='assertive' aria-atomic='true' class='parsley-errors-list filled'><li class='parsley-required'>Invalid Pin Name.</li></ul>");
      binName.addClass('parsley-error');
      isValid = false;
    }
    if (existingBinTicketNumber.val()) {
      binName.parent().find('#preexisting-bin-error').remove();
      binName.parent().append("<ul id='preexisting-bin-error' aria-live='assertive' aria-atomic='true' class='parsley-errors-list filled'><li class='parsley-required'>Bin already marked as 'Checked Out'. See Metrology Calibration.</li></ul>");
      binName.addClass('parsley-error');
      isValid = false;
    }
  });


  if (isValid === true) {
    $('.closeme input').val(1);
    $('.print-ticket-id input').val($('.guid input').val());
  }
  else {
    e.preventDefault();
  }

  return isValid;


}
