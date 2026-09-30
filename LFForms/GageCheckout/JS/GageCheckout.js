let should_print_receipt = true;
$(function () {
  const refreshTimeoutMs = 60000;
  let lastActivityAt = Date.now();
  let isTyping = false;

  function scheduleInactivityRefresh() {
    setTimeout(function () {
      const isInactive = (Date.now() - lastActivityAt) >= refreshTimeoutMs;
      if (isInactive && !isTyping) {
        window.location.reload();
        return;
      }
      scheduleInactivityRefresh();
    }, refreshTimeoutMs);
  }

  $.when(
    $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js')
  ).done(function () {
    $('#q0').append("<div class='hidden' id='print_output'></div>");
    $(document).prop('title', 'Gage Checkout');
  }).fail(function () {
    console.error('Failed to load required scripts');
  });

  $('.Submit').on("click", function (e) { validateForm(e); });

  const eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
  const printEvent = window[eventMethod];
  const messageEvent = eventMethod === "attachEvent" ? "onmessage" : "message";
  printEvent(messageEvent, function (e) {

    if (e.data === "printme" || e.message === "printme") {
      console.log("printme");
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

  $(document).on('change', '[id^="Field176"]', function () {
    generateMachineList();
  });

  $(document).on('click', '.cf-collection-delete', function () {
    generateMachineList();
  });

  $('.stage-ticket fieldset input[type="radio"]').on("change", function () {
    if ($('.stage-ticket fieldset input[type="radio"]:checked').val() === '1') {
      $('#Field171-1').parent().append('<span class="stage-warning"><span class="slow-blink">Are you sure?</span> Stageing a ticket means the pins will not be used yet.</span>')
    }
    else {
      $('.stage-warning').remove();
    }
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

  $(document).on('change', '#Field162', function () {
    const sitename = $('#Field162').val();
    $.cookie('site_name', sitename, { expires: 365, path: '/' });
  });

  $(document).on('keydown click scroll touchstart', function () {
    lastActivityAt = Date.now();
  });

  $(document).on('keydown', 'input, textarea, [contenteditable="true"]', function () {
    isTyping = true;
    lastActivityAt = Date.now();
  });

  $(document).on('blur', 'input, textarea, [contenteditable="true"]', function () {
    isTyping = false;
  });

  scheduleInactivityRefresh();

});


function generateMachineList() {
  let machineList = '';
  $('[id^="Field176"]').each(function (index, element) {
    let machineName = $(element).val();
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

  const receipt_url_root = `${window.location.origin}/Forms/`;
  let receipt_url = "";

  receipt_url = receipt_url_root + "PinGageReceipt?guid=" + $('.print-ticket-id input').val();
  console.log(receipt_url);
  if (should_print_receipt === true) {
    if (receipt_url !== "") {
      loadiFrame(receipt_url);
      should_print_receipt = false;
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

  $('#cell-leader-error').remove();
  $('#bad-pin-name-error').remove();
  $('#preexisting-bin-error').remove();

  const cellLeaderID = $('.cell-leader-id input');
  const cellLeaderName = $('.cell-leader-name input');

  const pinRows = $('.pin-table table tbody tr');

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
  

  if ((cellLeaderName.val()) && (!cellLeaderID.val())) {
    cellLeaderName.parent().append("<ul id='cell-leader-error' aria-live='assertive' aria-atomic='true' class='parsley-errors-list filled'><li class='parsley-required'>You must select a valid Cell Leader.</li></ul>");
    cellLeaderName.addClass('parsley-error');
    $('.Submit').prop("disabled", true);
    if (arguments.length === 1) {
      e.preventDefault();
    }
  }

    pinRows.each(function (index) {
      const pinTypeValue = Number($(this).find('.pin-table-pin-type-id input').val());
      const binName = $(this).find('.pin-table-bin-number input');
      const existingBinTicketNumber = $(this).find('.pin-table-existing-bin-ticket-id input');
      const binID = $(this).find('.pin-table-bin-id input');
      if ((pinTypeValue === 5) && ((binName.val()) && !binID.val())) {
        binName.parent().find('#bad-pin-name-error').remove();
        binName.parent().append("<ul id='bad-pin-name-error' aria-live='assertive' aria-atomic='true' class='parsley-errors-list filled'><li class='parsley-required'>Invalid Bin Name.</li></ul>");
        binName.addClass('parsley-error');
        $('.Submit').prop("disabled", true);
        if (arguments.length === 1) {
          e.preventDefault();
        }
      }
      if (existingBinTicketNumber.val()) {
        binName.parent().find('#preexisting-bin-error').remove();
        binName.parent().append("<ul id='preexisting-bin-error' aria-live='assertive' aria-atomic='true' class='parsley-errors-list filled'><li class='parsley-required'>Bin is already checked out. See Metrology Calibration.</li></ul>");
        binName.addClass('parsley-error');
        $('.Submit').prop("disabled", true);
        if (arguments.length === 1) {
          e.preventDefault();
        }
      }
    });

}
