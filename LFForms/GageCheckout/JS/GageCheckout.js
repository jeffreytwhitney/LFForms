const should_print_receipt = true;
$(document).ready(function () {
  $(document).prop('title', 'Gage Checkout');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js');

  $('.Submit').on("click", function (e) { validateForm(e); });

  $('#q0').append("<div class='hidden' id='print_output'></div>");

  const eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
  const printEvent = window[eventMethod];
  const messageEvent = eventMethod === "attachEvent" ? "onmessage" : "message";
  printEvent(messageEvent, function (e) {

    if (e.data === "printme" || e.message === "printme") {
      $("#myiframe").get(0).contentWindow.print();
      $('.print-ticket-id input').val(null);
    }
  });

  $(document).on('lookupcomplete', function (e) {
    validateForm();
    if (e.triggerId === 'Field152') {
      if ($('#Field152').val()) {
        if ($('#Field152').val() !== null) {
          setTimeout(print_receipt, 2000);
        }
      }
    }
  });

  $(document).on("onloadlookupfinished", function () {
    const sitename = $.cookie('site_name');
    if (sitename !== null) {
      $('#Field162').val(sitename).trigger("change");
    }
  });

  $(document).on('change', '[id^="Field176"]', function (e) {
    generateMachineList();
  });

  $(document).on('click', '.cf-collection-delete', function (e) {
    generateMachineList();
  });



  $(document).on('change', '.pin-table-pin-type select', function (e) {
    if ($(e.currentTarget).val() === 'BIN') {
      $(e.currentTarget).closest('tr').find('.pin-table-diameter input').val(1).addClass("ui-state-disabled");
      $(e.currentTarget).closest('tr').find('.pin-table-number-of-pins input').val(1).addClass("ui-state-disabled");
    }
    else {
      $(e.currentTarget).closest('tr').find('.pin-table-diameter input').removeClass("ui-state-disabled");
      $(e.currentTarget).closest('tr').find('.pin-table-number-of-pins input').removeClass("ui-state-disabled");
    }
  });

  $('.ticket-type-radio fieldset input[type="radio"]').on("change", function (e) {
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

  $('.existing-missing-thread-ticket-number input').on("change", function (e) {
    validateForm();
  });

  $('.thread-gage-table-existing-ticket-id input').on("change", function (e) {
    validateForm();
  });

  $(document).on('change', '#Field162', function () {
    const sitename = $('#Field162').val();
    $.cookie('site_name', sitename, { expires: 365, path: '/' });
  });


});


function generateMachineList() {
  let machineList = '';
  $('[id^="Field176"]').each(function (index, element) {
    machineName = $(element).val();
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


function loadiFrame(src) {
  $("#print_output").html("<iframe id='myiframe' name='myname' src='" + src + "' />");
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
      should_print_receipt === false;
      $('.print-ticket-id input').val(null).trigger("change");
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

  const ticketType = $('.ticket-type-radio fieldset input[type="radio"]:checked').val();
  const cellLeaderID = $('.cell-leader-id input');
  const cellLeaderName = $('.cell-leader-name input');

  const pinRows = $('.pin-table table tbody tr');
  const threadRows = $('.thread-gage-table table tbody tr');

  const siteID = Number($('.site-id input').val());
  const submitEmployeeName = $('.submit-employee-name input');
  const crEmployeeName = $('.cr-employee-name input');
  const anokaEmployeeName = $('.anoka-employee-name input');

  const submitEmployeeNumber = $('.submit-employee-number input');
  const crEmployeeNumber = $('.cr-employee-number input');
  const anokaEmployeeNumber = $('.anoka-employee-number input');

  if (siteID === 1) {
    submitEmployeeNumber.val(crEmployeeNumber.val());
    submitEmployeeName.val(crEmployeeName.val());
    
  }
  if (siteID === 2) {
    submitEmployeeNumber.val(anokaEmployeeNumber.val());
    submitEmployeeName.val(anokaEmployeeName.val());
   
  }
  

  if ((cellLeaderName.val().length > 0) && (cellLeaderID.val().length === 0)) {
    cellLeaderName.parent().append("<ul id='cell-leader-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>You must select a valid Cell Leader.</li></ul>");
    cellLeaderName.addClass('parsley-error');
    $('.Submit').prop("disabled", true);
    if (arguments.length === 1) {
      e.preventDefault();
    }
  }

  if (ticketType === 1) {
    pinRows.each(function (index) {
      const pinTypeValue = Number($(this).find('.pin-table-pin-type-id input').val());
      const binName = $(this).find('.pin-table-bin-number input');
      const existingBinTicketNumber = $(this).find('.pin-table-existing-bin-ticket-id input');
      const binID = $(this).find('.pin-table-bin-id input');
      if ((pinTypeValue === 5) && ((binName.val().length > 0) && binID.val().length === 0)) {
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
        binName.parent().append("<ul id='preexisting-bin-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>Bin already is already checked out. See Metrology Calibration.</li></ul>");
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
      const threadGageName = $(this).find('.thread-gage-table-name input');
      const threadGageID = $(this).find('.thread-gage-table-id input');
      const missingThreadGageTicketNumber = $(this).find('.existing-missing-thread-ticket-number input');
      const existingThreadGageTicketNumber = $(this).find('.thread-gage-table-existing-ticket-id input');

      if ((threadGageID.val().length === 0) && (threadGageName.val().length > 0)) {
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
        threadGageName.parent().append("<ul id='preexisting-thread-gage-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>Thread Gage is already checked out. See Metrology Calibration.</li></ul>");
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

