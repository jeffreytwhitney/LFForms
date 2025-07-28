var should_print_receipt = true;


$(document).ready(function () {
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simplePagination.js/1.6/simplePagination.min.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
  var bootstrapButton = $.fn.button.noConflict(); // return $.fn.button to previously assigned value
  $.fn.bootstrapBtn = bootstrapButton;
  $('.Submit').hide();
  $(document).prop('title', 'Gage Calibration');
  $('#q0').append("<div class='hidden' id='print_output'></div>");

  if ($('.closeme input').val() == 1) {
    $('#q2').hide();
    $('#q3').hide();
  }

  $('.Submit').click(function (e) {
    if ($('.tid input').val().length > 0) {
      $('.closeme input').val(1);
    }
    else {
      $('.closeme input').val(0);
    }
    $('.print-ticket-id input').val($('.guid input').val());
  });

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

    if (Number($('.ticket-type-id input').val()) == 1) {
      generatePinAllGoodButton();
    }
    else if (Number($('.ticket-type-id input').val()) == 2) {
      console.log("Calling formatThreadGageTable");
      formatThreadGageTable();
      generateThreadAllGoodButton();
      threadGageFormatted = true;
    }
  });

  $(".pin-table-notes textarea").on("change", function (e) {
    var note_text = $(e.currentTarget).val();
    note_text = note_text.replace(/'/g, '');
    note_text = note_text.replace(/"/g, '');
    $(e.currentTarget).val(note_text);
  });

  $(".thread-cal-notes-col textarea").on("change", function (e) {
    var note_text = $(e.currentTarget).val();
    note_text = note_text.replace(/'/g, '');
    note_text = note_text.replace(/"/g, '');
    $(e.currentTarget).val(note_text);
  });

  $(document).on('keyup', '.ticket-number input', function () {
    this.value = this.value.toLocaleUpperCase();
  });

  $(document).on('change', '[id^="Field26"]', function (e) {
    
    if (!$(e.currentTarget).is(":checked")) {
      return;
    }
    console.log('Field26 changed');

    var resultID = Number($(e.currentTarget).val());
    var parentRow = $(e.currentTarget).closest('tr');
    var threadTypeID = Number(parentRow.find('.thread-type-id-col input[type="text"]').val());
    var goDiameterField = parentRow.find('.go-pitch-diameter-col input[type="text"]');
    var noGoDiameterField = parentRow.find('.nogo-pitch-diameter-col input[type="text"]');
    var majorDiameterField = parentRow.find('.major-diameter-col input[type="text"]');

    if (threadTypeID == 1) {
      if (resultID == 4) {
        $(goDiameterField).val(0).removeClass("ui-state-disabled").addClass("ui-state-disabled");
        $(noGoDiameterField).val(0).removeClass("ui-state-disabled").addClass("ui-state-disabled");
        $(majorDiameterField).val(0).removeClass("ui-state-disabled").addClass("ui-state-disabled");
      }
      else {
        $(goDiameterField).val(null).removeClass("ui-state-disabled");
        $(noGoDiameterField).val(null).removeClass("ui-state-disabled");
        $(majorDiameterField).val(null).removeClass("ui-state-disabled");
      }
    }
  });

});


function callPinAllGood() {
  
  var threadGageRows = $('.pin-table tbody tr');
  threadGageRows.each(function (index) {
    let adjustedRadioField = $(this).find('.pin-table-result fieldset span.choice').eq(0).find('input[type="radio"]');
    $(adjustedRadioField).prop("checked", true);

  });
}


function callThreadAllGood() {
  var threadGageRows = $('.thread-gage-table tbody tr');
  threadGageRows.each(function (index) {
    let adjustedRadioField = $(this).find('.plug-thread-cal-result-col fieldset span.choice').eq(0).find('input[type="radio"]');
    $(adjustedRadioField).prop("checked", true).change();
  });
}


function generatePinAllGoodButton() {
  $('.all-good-pin-button').remove();
  var btn_html = `<div class='pin-allgood-button ui-button all-good-pin-button' onclick='callPinAllGood()'><span title='All Good' class='ui-button-icon ui-icon ui-icon-check'></span> Mark All as 'Pass'</div>`
  $('.pin-table .cf-section-header').append(btn_html);
}


function generateThreadAllGoodButton() {
  $('.thread-allgood-button').remove();
  var btn_html = `<div class='thread-allgood-button ui-button all-good-thread-button' onclick='callThreadAllGood()'><span title='All Good' class='ui-button-icon ui-icon ui-icon-check'></span> Mark All as 'Pass'</div>`

  $('.thread-gage-table .cf-section-header').append(btn_html);
}


function formatThreadGageTable() {
  $('.thread-nominal').remove();

  var threadGageRows = $('.thread-gage-table tbody tr');
  var threadTypeIDs = $('.thread-type-id-col input[type="text"]');
  var goDiameterCols = $('.go-pitch-diameter-col input[type="text"]');
  var noGoDiameterCols = $('.nogo-pitch-diameter-col input[type="text"]');
  var majorDiameterCols = $('.major-diameter-col input[type="text"]');
  var nominalGoDiameterCols = $('.nominal-go-pitch-diameter-col input[type="text"]');
  var nominalNoGoDiameterCols = $('.nominal-nogo-pitch-diameter-col input[type="text"]');
  var nominalMajorDiameterCols = $('.nominal-major-diameter-col input[type="text"]');

  threadGageRows.each(function (index) {
    let adjustedRadioField = $(this).find('.plug-thread-cal-result-col fieldset span.choice').eq(1);

    let threadTypeIDValue = Number($(threadTypeIDs[index]).val());
    let goDiameterField = goDiameterCols[index];
    
    let noGoDiameterField = noGoDiameterCols[index];
    let majorDiameterField = majorDiameterCols[index];
    let nominalGoDiameterValue = nominalGoDiameterCols[index].value;
    let nominalNoGoDiameterValue = nominalNoGoDiameterCols[index].value;
    let nominalMajorDiameterValue = nominalMajorDiameterCols[index].value;
    if (threadTypeIDValue == 1) {
      $(adjustedRadioField).removeClass("hidden").addClass("hidden");
      $(goDiameterField).parent().append(`<span class='thread-nominal'>${nominalGoDiameterValue}</span>`);
      $(noGoDiameterField).parent().append(`<span class='thread-nominal'>${nominalNoGoDiameterValue}</span>`);
      $(majorDiameterField).parent().append(`<span class='thread-nominal'>${nominalMajorDiameterValue}</span>`);
    }
    else {
      $(goDiameterField).val(0).removeClass("hidden").addClass("hidden");
      $(noGoDiameterField).val(0).removeClass("hidden").addClass("hidden");
      $(majorDiameterField).val(0).removeClass("hidden").addClass("hidden");
    }

  });
}


function loadiFrame(src) {
  $("#print_output").html("<iframe id='myiframe' name='myname' src='" + src + "' />");
}


function print_receipt() {
  var calForReturn = Number($('.cal-for-return input').val()); 
  if (calForReturn == 1) {
    should_print_receipt = false;
    return;
  }

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
  var calForReturn = Number($('.cal-for-return input').val());
  if (calForReturn == 1) {
    if ($('.closeme input').val() == 1) {
      window.parent.postMessage('CloseDialogWithRefresh', '*');
    }
    return;
  }


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

