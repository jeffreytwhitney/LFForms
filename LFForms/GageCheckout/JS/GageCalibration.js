let should_print_receipt = true;


$(function () {
  $('.Submit').hide();

  $.when(
    $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js'),
    $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js')
  ).done(function () {
    $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
    $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simplePagination.js/1.6/simplePagination.min.css">');
    $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');

    $.fn.bootstrapBtn = $.fn.button.noConflict(); // return $.fn.button to previously assigned value

    $(document).prop('title', 'Gage Calibration');
    $('#q0').append("<div class='hidden' id='print_output'></div>");

  }).fail(function () {
    console.error('Failed to load required scripts - Gage Calibration');
  });

  if ($('.closeme input').val() === 1) {
    $('#q2').hide();
    $('#q3').hide();
  }

  $('.Submit').on("click", function () {
    if ($('.tid input').val().length > 0) {
      $('.closeme input').val(1);
    }
    else {
      $('.closeme input').val(0);
    }
    $('.print-ticket-id input').val($('.guid input').val());
  });

  $(document).on("lookupcomplete", function (e) {
    if (e.triggerId === 'Field37') {
      if ($('#Field37').val()) {
        if ($('#Field37').val() !== "0") {
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

    generatePinAllGoodButton();

  });

  $(".pin-table-notes textarea").on("change", function (e) {
    let note_text = $(e.currentTarget).val();
    note_text = note_text.replace(/'/g, '');
    note_text = note_text.replace(/"/g, '');
    $(e.currentTarget).val(note_text);
  });

  $(".thread-cal-notes-col textarea").on("change", function (e) {
    let note_text = $(e.currentTarget).val();
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

    const resultID = Number($(e.currentTarget).val());
    const parentRow = $(e.currentTarget).closest('tr');
    const threadTypeID = Number(parentRow.find('.thread-type-id-col input[type="text"]').val());
    const goDiameterField = parentRow.find('.go-pitch-diameter-col input[type="text"]');
    const noGoDiameterField = parentRow.find('.nogo-pitch-diameter-col input[type="text"]');
    const majorDiameterField = parentRow.find('.major-diameter-col input[type="text"]');

    if (threadTypeID === 1) {
      if (resultID === 4) {
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

  $('.ticket-number input').on('keypress', function () {
    const input = $(this);
    setTimeout(function () {
      const val = String(input.val()).replace(/^\*+|\*+$/g, '');
      input.val(val);
    }, 0);
  });

  set_print_event();
});


function callPinAllGood() {
  
  const threadGageRows = $('.pin-table tbody tr');
  threadGageRows.each(function () {
    const adjustedRadioField = $(this).find('.pin-table-result fieldset span.choice').eq(0).find('input[type="radio"]');
    $(adjustedRadioField).prop("checked", true);

  });
}


function generatePinAllGoodButton() {
  $('.all-good-pin-button').remove();
  const btn_html = `<div class='pin-allgood-button ui-button all-good-pin-button' onclick='callPinAllGood()'><span title='All Good' class='ui-button-icon ui-icon ui-icon-check'></span> Mark All as 'Pass'</div>`
  $('.pin-table .cf-section-header').append(btn_html);
}


function loadiFrame(src) {
  $("#print_output").html("<iframe id='myiframe' name='myname' src='" + src + "' />");
}


function print_receipt() {
  const calForReturn = Number($('.cal-for-return input').val()); 
  if (calForReturn === 1) {
    should_print_receipt = false;
    return;
  }

  const receipt_url_root = `${window.location.origin}/Forms/`;
  let receipt_url = "";

  if ($('#Field34').val() === 1) {
    receipt_url = receipt_url_root + "PinGageReceipt?guid=" + $('#Field37').val();
  }
  if ($('#Field34').val() === 2) {
    receipt_url = receipt_url_root + "ThreadReceipt?guid=" + $('#Field37').val();
  }

  if (should_print_receipt === true) {
    if (receipt_url !== "") {
      loadiFrame(receipt_url);
      should_print_receipt = false;
      $('#Field37').val(0).trigger("change");
    }
  }
}


function set_print_event() {
  const calForReturn = Number($('.cal-for-return input').val());
  if (calForReturn === 1) {
    if ($('.closeme input').val() === 1) {
      window.parent.postMessage('CloseDialogWithRefresh', '*');
    }
    return;
  }


  const eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
  const printEvent = window[eventMethod];
  const messageEvent = eventMethod === "attachEvent" ? "onmessage" : "message";

  printEvent(messageEvent, function (e) {

    if (e.data === "printme" || e.message === "printme") {
      $("#myiframe").get(0).contentWindow.print();
      if ($('.closeme input').val() === 1) {
        window.parent.postMessage('CloseDialogWithRefresh', '*');
      }

    }
  });
}


