const departmentMap = new Map();
const departmentNameMap = new Map();
const machineGroupMap = new Map();
const machineGroupNameMap = new Map();
const cellLeaderMap = new Map();
const cellLeaderNameMap = new Map();

let should_print_receipt = true;


$(function () {

  $('.Submit').hide();
  $('.Submit').on("click", function (e) {
    submitForm(e);
  });
  $.when(
    $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js'),
    $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js')
  ).done(function () {
    $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
    $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simplePagination.js/1.6/simplePagination.min.css">');
    $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
    $(document).prop('title', 'Gage Maintenance');
    $('#q0').append("<div class='hidden' id='popUpDiv'></div>");
  })
    .fail(function () {console.error('Failed to load required scripts');  })
    .then(function () {});

  $.fn.bootstrapBtn = $.fn.button.noConflict();

  const eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
  const printEvent = window[eventMethod];
  const messageEvent = eventMethod === "attachEvent" ? "onmessage" : "message";
  printEvent(messageEvent, function (e) {
    const returnTicketID = Number($('.return-ticket-id input').val());
    if (returnTicketID === 0) {
      if (e.data === "printme" || e.message === "printme") {
        $("#print-iframe").get(0).contentWindow.print();
        $('.print-ticket-id input').val(null);
      }
    }
  });

  window.onmessage = function (event) {
    const shouldClosePopup =
      event.data === "Close Dialog" ||
      event.data === "CloseDialog" ||
      event.data === "CloseDialogWithRefresh";

    if (shouldClosePopup) {
      const popupIFrame = $("#popupIFrame");
      if (popupIFrame.length > 0) {
        const dialogInstance = popupIFrame.dialog("instance");
        if (dialogInstance) {
          popupIFrame.dialog("destroy");
        }
        popupIFrame.remove();
      }
    }

    if (event.data === "CloseDialogWithRefresh") {
      const returnTicketID = Number($('.return-ticket-id input').val());
      if (returnTicketID > 0) {
        removeRow(returnTicketID);
        $('.return-ticket-id input').val(0);
      } else {
        refreshPage();
      }
    }

    if (event.data === "RefreshAfterMissing") {
      const missingTicketID = Number($('.return-ticket-id input').val());
      const tableRowCount = getTicketRowCount();
      if (missingTicketID > 0 && tableRowCount > 19) {
        removeRow(missingTicketID);
        $('.return-ticket-id input').val(0);
      } else {
        $('.return-ticket-id input').val(0);
        refreshPage();
      }

    }

  };

  $(document).on("onloadlookupfinished", function () {
    $('.Submit').hide();
    const sitename = $.cookie('site_name');
    if (sitename !== null) {
      $('.site-name select').val(sitename).trigger("change");
    }
    generateFormButtons();
    generateGoBackButtons();
    $('.ticket-table').show();
    generateVersionLink();
  });

  $(document).on('lookupcomplete', function (e) {

    if (e.triggerId === 'Field219') {
      if ($('.print-ticket-id input').val()) {
        if ($('.print-ticket-id input').val() !== null) {
          if ($('.print-ticket-type-id input').val()) {
            print_receipt();
          }
        }
      }
    }


    if ($('.pg input').val() === '999') {
      $('.pg input').val(1).trigger("change");
    }

    loadDepartmentMap();
    loadMachineGroupMap();
    loadCellLeaderMap();


    $('.creation-date-col input').each((i, dateField) => $(dateField).val($(dateField).val().split(" ")[0]));
    $('.latest-cal-date-col input').each((i, dateField) => $(dateField).val($(dateField).val().split(" ")[0]));
    $('.cal-due-date-col input').each((i, dateField) => $(dateField).val($(dateField).val().split(" ")[0]));

    generateFilterRow();
    reApplyFilterValues();
    generateFormButtons();
    appendPagination();
    colorCodeRows();
    generateTitleInfo();

    $('.ticket-table').show();

  });

  $(document).on('change', '.site-name select', function () {
    const sitename = $('.site-name select').val();
    $.cookie('site_name', sitename, {expires: 365, path: '/'});
  });

  $(document).on('change', '[id^="Field269"]', function () {
    generateMachineList();
  });

  $(document).on('click', '.cf-collection-delete', function () {
    generateMachineList();
  });

  $(document).on('keypress', '#txtFilter_TicketNumber', function () {
    const input = $(this);
    setTimeout(function () {
      const val = String(input.val()).replace(/^\*+|\*+$/g, '');
      input.val(val);
    }, 0);
  });


});


function appendPagination() {

  const current_page = Number($('.pg input').val());
  if (current_page === 999) {
    return;
  }

  const row_count = getTicketRowCount();

  if (row_count > 0) {
    $('#ticket-table-pagination').remove();
    if ((current_page === 1) && (row_count < 25)) {
      $('.ticket-table table').parent().append("<div id='ticket-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled'>&laquo;</a></li><li><a class='page-link prev isDisabled'>&lsaquo;</a></li><li><a class='page-link next isDisabled'>&rsaquo;</a></li></ul></div>");
      return;
    }
    if ((current_page === 1) && (row_count === 25)) {
      $('.ticket-table table').parent().append("<div id='ticket-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled'>&laquo;</a></li><li><a class='page-link prev isDisabled'>&lsaquo;</a></li><li><a class='page-link next' onclick='callNextPage();' href='javascript:void(0);'>&rsaquo;</a></li></ul></div>")
      return;
    }
    if ((current_page > 1) && (row_count === 25)) {
      $('.ticket-table table').parent().append("<div id='ticket-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev' onclick='resetPageNumber();' href='javascript:void(0);'>&laquo;</a></li><li><a class='page-link prev' onclick='callPrevPage();' href='javascript:void(0);'>&lsaquo;</a></li><li><a class='page-link next' onclick='callNextPage();' href='javascript:void(0);'>&rsaquo;</a></li></ul></div>")
      return;
    }
    if ((current_page > 1) && (row_count < 25)) {
      $('.ticket-table table').parent().append("<div id='ticket-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev' onclick='resetPageNumber();' href='javascript:void(0);'>&laquo;</a></li><li><a class='page-link prev' onclick='callPrevPage();' href='javascript:void(0);'>&lsaquo;</a></li><li><a class='page-link next isDisabled'>&rsaquo;</a></li></ul></div>")
    }
  } else {
    $('#ticket-table-pagination').remove();
    $('.ticket-table table').parent().append("<div id='ticket-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled' href='javascript:void(0);'>&laquo;</a></li><li><a class='page-link prev isDisabled' href='javascript:void(0);'>&lsaquo;</a></li><li><a class='page-link next isDisabled'>&rsaquo;</a></li></ul></div>")
  }
}


function callActivate(ticket_id) {
  $('.activate-ticket-id input').val(ticket_id).trigger("change");
  $('.Submit').show();
}


function callCalibrate(ticket_id, calForReturn = 0) {
  const has_permissions = checkPermissions();
  if (has_permissions) {
    let widowHeight = $(window).height();
    widowHeight = widowHeight - 50;
    if (calForReturn === 0) {
      popUpIframe(`${window.location.origin}/Forms//GageCalibration?tid=${ticket_id}`, 'Calibrate Ticket', widowHeight, 1200);
    } else {
      popUpIframe(`${window.location.origin}/Forms//GageCalibration?tid=${ticket_id}&CalForReturn=1`, 'Calibrate Ticket', widowHeight, 1200);
    }
  } else {
    alert("Sorry, you do not have permissions to do this.");
  }
}


function callGoBack() {
  $('.activate-ticket-id input').val(null).trigger("change");
  $('.Submit').hide();
}


function callNextPage() {
  $('.pg').hide();
  removeAppendedFields();
  let current_page = Number($('.pg input').val());
  $('.pg input').val(current_page + 1).trigger("change");
}


function callPrevPage() {
  $('.pg').hide();
  removeAppendedFields();
  let current_page = Number($('.pg input').val());
  if (current_page === 1) {
    return;
  }
  $('.pg input').val(current_page - 1).trigger("change");
}


function callPrint(ticket_id) {
  should_print_receipt = true;
  const ticketTypeID = getTicketTypeIDByTicketID(ticket_id);
  const ticketGuid = getTicketGuidByTicketID(ticket_id);
  $('.print-ticket-id input').val(ticketGuid);
  $('.print-ticket-type-id input').val(ticketTypeID);
  print_receipt();
}


function callSetMissing(ticket_id) {
  if (typeof ticket_id === 'undefined') {
    return;
  }

  const has_permissions = checkPermissions();
  if (has_permissions) {
    const confirmDialogId = 'set-missing-confirm-dialog';
    $(`#${confirmDialogId}`).remove();

    $("#popUpDiv").append(`<div id='${confirmDialogId}' title='Confirm Set Missing'><p>Are you sure you want to set this ticket as missing?</p></div>`);

    $(`#${confirmDialogId}`).dialog({
      modal: true,
      resizable: false,
      width: 420,
      buttons: {
        Yes: function () {
          $('.return-ticket-id input').val(ticket_id);
          const execute_url = `${window.location.origin}/Forms//RMS-GAGE-SetTicketAsMissing?tid=${ticket_id}`;
          $("#popupIFrame").remove();
          $("#popUpDiv").html(`<iframe id='popupIFrame' name='myname' src='${execute_url}'/>`);
          $(this).dialog("destroy").remove();
        },
        No: function () {
          $(this).dialog("destroy").remove();
        }
      }
    });
  } else {
    alert("Sorry, you do not have permissions to do this.");
  }
}


function callReturn(ticket_id) {
  callCalibrate(ticket_id, 1);
}


function checkPermissions() {

  const employee_number = $("#Field87").val();
  const is_active_user = $("#Field88").val().toString();
  let return_val = true;

  if (is_active_user === "False") {
    return_val = false;
  }

  if (employee_number === '') {
    return_val = false;
  }

  return return_val
}


function colorCodeRows() {
  const current_date = new Date();
  const ticket_rows = $(".ticket-table table tbody tr");
  const cal_due_dates = $('.cal-due-date-col input[type="text"]');

  $(ticket_rows).removeClass('colorOverdue');

  cal_due_dates.each(function (index) {

    const ticket_row = ticket_rows[index];
    const cal_due_date = new Date($(this).val());


    if ((cal_due_date <= current_date)) {
      $(ticket_row).addClass('colorOverdue');
    }

  });
}


function filterTicketTable() {

  if ($('#filterRow').length === 0) {
    return;
  }

  $('.ticket-table').hide();
  removeAppendedFields();


  const ticketNumberFilterValue = $('#txtFilter_TicketNumber').val();
  const partNumberFilterValue = $('#txtFilter_PartNumber').val();
  const machineNumberFilterValue = $('#txtFilter_MachineNumber').val();
  const gageDiameterFilterValue = Number($('#txtFilter_GageDiameter').val());

  const departmentFilterVal = $('#cboFilter_Department').val();
  const machineGroupFilterVal = $('#cboFilter_MachineGroup').val();
  const operatorFilterVal = $('#cboFilter_Operator').val();
  const cellLeaderFilterVal = $('#cboFilter_CellLeader').val();
  const statusFilterVal = $('#cboFilter_Status').val();

  $('.ftname input').val(ticketNumberFilterValue);
  $('.fpnum input').val(partNumberFilterValue);
  $('.fmname input').val(machineNumberFilterValue);
  $('.fsid input').val(statusFilterVal);
  $('.fpdia input').val(gageDiameterFilterValue);


  if ((departmentFilterVal !== 0) && (departmentFilterVal.length > 0)) {
    const taskDepartmentID = departmentNameMap.get(departmentFilterVal);
    $('.fdid input').val(taskDepartmentID);
  } else {
    $('.fdid input').val(0);
  }

  if ((machineGroupFilterVal !== 0) && (machineGroupFilterVal.length > 0)) {
    const machineGroupID = machineGroupNameMap.get(machineGroupFilterVal);
    $('.fmgid input').val(machineGroupID);
  } else {
    $('.fmgid input').val(null);
  }

  if ((operatorFilterVal !== null) && (operatorFilterVal.length > 0)) {
    $('.fopname input').val(operatorFilterVal);
  } else {
    $('.fopname input').val(null);
  }

  if ((cellLeaderFilterVal !== 0) && (cellLeaderFilterVal.length > 0)) {
    const cellLeaderID = cellLeaderNameMap.get(cellLeaderFilterVal);
    $('.fclid input').val(cellLeaderID);
  } else {
    $('.fclid input').val(0);
  }

  $('.ticket-table').hide();
  $('.ticket-detail-link').remove();
  $('.pg input').val(1).trigger("change");

}


// Ensures the button inside `container` matching `buttonClass` reflects `btn_html`.
// If no button exists yet, it is appended. If one exists but its markup (and therefore
// its onclick/ticket-id) no longer matches what this row currently calls for, it is
// replaced in place. This prevents stale buttons from continuing to reference a ticket
// id from a previous render pass (e.g. when lookupcomplete fires multiple times while
// the table data is still being refreshed).
function syncButton(container, buttonClass, btn_html) {
  const existing_button = container.find(`.${buttonClass}`);
  if (existing_button.length === 0) {
    container.append(btn_html);
  } else if (existing_button.get(0).outerHTML !== btn_html) {
    existing_button.replaceWith(btn_html);
  }
}


// Removes the button matching `buttonClass` from `container` if it exists. Used when a
// row no longer qualifies for a button it may have previously had (e.g. ticket status
// changed) so a stale, incorrectly-targeted button isn't left behind.
function removeButtonIfExists(container, buttonClass) {
  container.find(`.${buttonClass}`).remove();
}


function generateActivateButtons() {
  const activate_textboxes = $(".activate-ticket-button input[type=text]");
  activate_textboxes.each(function () {
    const row = $(this).closest('tr');
    const ticket_id = row.find('.ticket-id-col input[type=text]').val();
    const ticket_status_id = row.find('.ticket-status-id-col input[type=text]').val();
    const parent = $(this).parent();
    if (ticket_status_id === '1') {
      const btn_html = `<div class='table-button ui-button activate-button' onclick='callActivate(${ticket_id})'><span title='Activate Staged Ticket' class='ui-button-icon ui-icon ui-icon-power'/></div>`
      syncButton(parent, 'activate-button', btn_html);
    } else {
      removeButtonIfExists(parent, 'activate-button');
    }
  });
}


function generateCalibrateButtons() {
  const calibrate_textboxes = $(".ticket-table-calibrate-button input[type=text]");
  calibrate_textboxes.each(function () {
    const row = $(this).closest('tr');
    const ticket_id = row.find('.ticket-id-col input[type=text]').val();
    const ticket_status_id = row.find('.ticket-status-id-col input[type=text]').val();
    const parent = $(this).parent();
    if (ticket_status_id < 3) {
      const btn_html = `<div class='table-button ui-button cal-button' onclick='callCalibrate(${ticket_id})'><span title='Calibrate Ticket' class='ui-button-icon ui-icon ui-icon-wrench'/></div>`
      syncButton(parent, 'cal-button', btn_html);
    } else {
      removeButtonIfExists(parent, 'cal-button');
    }
  });
}


function generateGoBackButtons() {
  const gobackactivate_buttons = $(".goback_activate");
  gobackactivate_buttons.each(function () {
    $(this).parent().append("<div id='go-back' class='ui-button ui-corner-all ui-widget' onclick='callGoBack()'><span class='ui-icon ui-icon-arrowreturnthick-1-w'></span>Go Back</div>");
  });
  $(".goback_activate").remove();
}


function generateFilterRow() {

  if ($('#filterRow').length === 0) {

    const filter_row = "<TR id='filterRow'><TH/><TH/><TH/><TH/><TH/><TH><input type='text' id='txtFilter_TicketNumber'></TH><TH><select id='cboFilter_Status'/></TH><TH><select id='cboFilter_Department'/></TH><TH><input type='text' id='txtFilter_MachineNumber'></TH><TH><select id='cboFilter_MachineGroup'/></TH><TH><select id='cboFilter_Operator'/></TH><TH><select id='cboFilter_CellLeader'/></TH><TH><input type='text' id='txtFilter_PartNumber'></TH><TH/><TH/><TH/><TH/><TH><input type='text' id='txtFilter_GageDiameter'></TH><TH/><TH/>"
    $('.ticket-table table thead').append(filter_row);
    $("#txtFilter_TicketNumber").on("change", function () {
      filterTicketTable();
    });
    $("#txtFilter_PartNumber").on("change", function () {
      filterTicketTable();
    });
    $("#txtFilter_MachineNumber").on("change", function () {
      filterTicketTable();
    });

    $("#txtFilter_GageDiameter").on("change", function () {
      filterTicketTable();
    });


    $("#cboFilter_Department").on("change", function () {
      filterTicketTable();
    });
    $("#cboFilter_MachineGroup").on("change", function () {
      filterTicketTable();
    });
    $("#cboFilter_Operator").on("change", function () {
      filterTicketTable();
    });
    $("#cboFilter_CellLeader").on("change", function () {
      filterTicketTable();
    });
    $("#cboFilter_Status").on("change", function () {
      filterTicketTable();
    });


    $("#txtFilter_TicketNumber").on("dblclick", function () {
      $("#txtFilter_TicketNumber").val(null).trigger("change");
    });
    $("#txtFilter_PartNumber").on("dblclick", function () {
      $("#txtFilter_PartNumber").val(null).trigger("change");
    });

    $("#txtFilter_MachineNumber").on("dblclick", function () {
      $("#txtFilter_MachineNumber").val(null).trigger("change");
    });

    $("#txtFilter_GageDiameter").on("dblclick", function () {
      $("#txtFilter_GageDiameter").val(null).trigger("change");
    });

    $("#cboFilter_Department").on("dblclick", function () {
      $("#cboFilter_Department").val(null).trigger("change");
    });
    $("#cboFilter_MachineGroup").on("dblclick", function () {
      $("#cboFilter_MachineGroup").val(null).trigger("change");
    });
    $("#cboFilter_Operator").on("dblclick", function () {
      $("#cboFilter_Operator").val(null).trigger("change");
    });
    $("#cboFilter_CellLeader").on("dblclick", function () {
      $("#cboFilter_CellLeader").val(null).trigger("change");
    });
    $("#cboFilter_Status").on("dblclick", function () {
      $("#cboFilter_Status").val(null).trigger("change");
    });
    wireUpSortFields();
  }

  if (($(".department-lookup-cbo select option").length > 0) && ($('#cboFilter_Department option').length < 2)) {
    $("#cboFilter_Department").html($(".department-lookup-cbo select").html());
  }

  if (($(".status-lookup-cbo select option").length > 0) && ($('#cboFilter_Status option').length < 2)) {
    $("#cboFilter_Status").html($(".status-lookup-cbo select").html());
  }

  if (($(".machine-group-lookup-cbo select option").length > 0) && ($('#cboFilter_MachineGroup option').length < 2)) {
    $("#cboFilter_MachineGroup").html($(".machine-group-lookup-cbo select").html());
  }

  if (($(".operator-lookup-cbo select option").length > 0) && ($('#cboFilter_Operator option').length < 2)) {
    $("#cboFilter_Operator").html($(".operator-lookup-cbo select").html());
    $("#cboFilter_Operator").find('option:eq(0)').prop('selected', true);
  }

  if (($(".cell-leader-lookup-cbo select option").length > 0) && ($('#cboFilter_CellLeader option').length < 2)) {
    $("#cboFilter_CellLeader").html($(".cell-leader-lookup-cbo select").html());
    $("#cboFilter_CellLeader").find('option:eq(0)').prop('selected', true);
  }
}


function generateFormButtons() {
  if (checkPermissions()) {
    generateTableButtons(".ticket-table-return-button", "return-button", "ui-icon-arrowreturn-1-w", "Check In Ticket", "callReturn", true);
    generateTableButtons(".ticket-table-missing-button", "missing-button", "ui-icon-help", "Set Ticket As Missing", "callSetMissing", true);
    generateCalibrateButtons();
  }
  generatePrintButtons();
  generateTicketNumberColumn();
  generateActivateButtons();
}


function generateMachineList() {
  const activateTicketID = $('.activate-ticket-id input').val();
  let machineList = '';

  if (activateTicketID !== '') {
    $('[id^="Field269"]').each(function (index, element) {
      const machineName = $(element).val();
      if (machineName !== '') {
        if (machineList.length > 0) {
          machineList += ', ' + machineName;
        } else {
          machineList = machineName;
        }
      }
    });
    $('.activate-machine-list input').val(machineList);
  }
}


function generatePrintButtons() {
  const print_buttons = $(".ticket-table-print-button input[type=text]");
  print_buttons.each(function () {
    const row = $(this).closest('tr');
    const ticket_id = row.find('.ticket-id-col input[type=text]').val();
    const ticket_status_id = Number(row.find('.ticket-status-id-col input[type=text]').val());
    const parent = $(this).parent();
    if (ticket_status_id < 3) {
      const btn_html = `<div class='table-button ui-button print-button' onclick='callPrint(${ticket_id})'><span title='Print Ticket Receipt' class='ui-button-icon ui-icon ui-icon-print'/></div>`
      syncButton(parent, 'print-button', btn_html);
    } else {
      removeButtonIfExists(parent, 'print-button');
    }
  });
}


function generateTableButtons(buttonSelector, buttonClass, buttonImageClass, buttonTitle, buttonFunction, requiresPermissions = false) {
  const selectionString = buttonSelector + " input[type=text]";
  const buttons = $(selectionString);
  let btn_html = '';

  buttons.each(function () {
    const btn_value = $(this).val();
    if (requiresPermissions && !checkPermissions()) {
      btn_html = `<div class='table-button ui-button ${buttonClass} is-disabled' aria-disabled='true' onclick='void(0);'><span title='${buttonTitle}' class='ui-button-icon ui-icon ${buttonImageClass}'/></div>`
    } else {
      btn_html = `<div class='table-button ui-button ${buttonClass}' onclick='${buttonFunction}(${btn_value})'><span title='${buttonTitle}' class='ui-button-icon ui-icon ${buttonImageClass}'/></div>`
    }

    syncButton($(this).parent(), buttonClass, btn_html);
  });
}


function generateTicketNumberColumn() {
  const ticket_numbers = $('.ticket-number-col input[type="text"]');
  ticket_numbers.each(function () {
    const row = $(this).closest('tr');
    const ticket_id = row.find('.ticket-id-col input[type="text"]').val();
    const ticket_number = $(this).val();
    const ticket_number_text = $('<div>').text(ticket_number).html();
    const link_html = `<a class='ticket-link' href='javascript:void(0);' onclick='showDetails(${ticket_id})'>${ticket_number_text}</a>`;
    syncButton($(this).parent(), 'ticket-link', link_html);
  });

}


function generateVersionLink() {
  const current_version = $('.current-version input').val();

  if (current_version.length === 0) {
    return;
  }

  if ($('#version-div').length === 0) {
    const versionInfo = `<div id="version-div"><a href="http://rmslf/Forms/RMS-GAGE-ApplicationVersion" target="_blank">App Version</a>: ${current_version} </div>`;
    $('#form-title-wrap').append(versionInfo);
  }
}


function getTicketGuidByTicketID(ticket_id) {
  let ticket_guid;
  const ticket_ids = $(".ticket-id-col input[type=text]");

  ticket_ids.each(function () {
    const row_ticket_id = Number($(this).val());
    if (row_ticket_id === Number(ticket_id)) {
      ticket_guid = $(this).closest('tr').find('.ticket-table-print-button input[type=text]').val();
      return false;
    }
  });
  return ticket_guid;
}


function getTicketRowCount() {
  return $('.ticket-table table tbody tr').length;
}


function getTicketTypeIDByTicketID(ticket_id) {
  let ticket_type_id;
  const ticket_ids = $(".ticket-id-col input[type=text]");

  ticket_ids.each(function () {
    const row_ticket_id = Number($(this).val());
    if (row_ticket_id === Number(ticket_id)) {
      ticket_type_id = $(this).closest('tr').find('.ticket-type-id-col input[type=text]').val();
      return false;
    }
  });
  return ticket_type_id;
}


function generateTitleInfo() {

  if ($('.user-name-display input').val() === '') {
    const lfUserName = $('.user-name input').val();
    if (lfUserName === 'Anonymous User') {
      $('.user-name-display input').val('User :Anonymous');
      const login_link = $("<a>", {
        text: 'Log In',
        class: 'login-link',
        href: 'http://rmslf/Forms/account/login?returnUrl=%2fForms%2fGageTicketAdministration'
      });
      $('.user-name-display').append(login_link);
    } else {
      const userName = $('.user-name-hidden input').val()
      if (userName !== '') {
        const userText = `User: ${userName}`
        $('.user-name-display input').val(userText);
      }
    }
  }
}


function loadiFrame(src) {
  $("#popUpDiv").html("<iframe id='print-iframe' name='print-iframe' src='" + src + "' />");
}


function loadCellLeaderMap() {
  if (cellLeaderMap.size === 0) {
    const cellLeader_rows = $('.cellleader-lookup-table table tbody tr');
    if (cellLeader_rows.length === 0) {
      return;
    }
    cellLeader_rows.each(function () {
      let cellLeaderID = Number($(this).find('.cellleader-lookup-table-id input').val());
      let cellLeaderName = $(this).find('.cellleader-lookup-table-name input').val();
      cellLeaderMap.set(cellLeaderID, cellLeaderName);
      cellLeaderNameMap.set(cellLeaderName, cellLeaderID);
    });
  }
}


function loadDepartmentMap() {
  if (departmentMap.size === 0) {
    const department_rows = $('.department-lookup-table table tbody tr');
    if (department_rows.length === 0) {
      return;
    }
    department_rows.each(function () {
      let departmentID = Number($(this).find('.department-lookup-table-id input').val());
      let departmentName = $(this).find('.department-lookup-table-name input').val();
      departmentMap.set(departmentID, departmentName);
      departmentNameMap.set(departmentName, departmentID);
    });
  }
}


function loadMachineGroupMap() {
  if (machineGroupMap.size === 0) {
    const machine_group_rows = $('.machine-group-lookup-table table tbody tr');
    if (machine_group_rows.length === 0) {
      return;
    }
    machine_group_rows.each(function () {
      let machineGroupID = Number($(this).find('.machine-group-lookup-table-id input').val());
      let machineGroupName = $(this).find('.machine-group-lookup-table-name input').val();
      machineGroupMap.set(machineGroupID, machineGroupName);
      machineGroupNameMap.set(machineGroupName, machineGroupID);
    });
  }

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
    position: {my: "left top", at: "left top", of: window},
    close: function (event, ui) {
    }
  });


  $("#popupIFrame").dialog("open");
  $('#popupIFrame').attr('style', `width: 100%; height: ${height}px;`);
}


function print_receipt() {

  if (Number($('.return-ticket-id input').val()) !== 0) {
    return;
  }
  const ticketGuid = String($('.print-ticket-id input').val() || '').trim();
  if (ticketGuid.length === 0) {
    return;
  }

  const domain = document.location.hostname;
  const receipt_url_root = document.location.protocol + "//" + domain + "/Forms/";
  let receipt_url = '';

  const ticketTypeID = Number($('.print-ticket-type-id input').val());

  if (ticketTypeID === 1) {
    receipt_url = receipt_url_root + "PinGageReceipt?guid=" + ticketGuid;
  }

  if (ticketTypeID === 2) {
    receipt_url = receipt_url_root + "ThreadReceipt?guid=" + ticketGuid;
  }

  if (should_print_receipt === true) {
    if (receipt_url !== "") {
      loadiFrame(receipt_url);
      should_print_receipt = false;
      $('.print-ticket-id input').val(null).trigger("change");
    }
  }
}


function reApplyFilterValues() {
  if ($('#filterRow').length === 0) {
    return;
  }

  const sortFieldOrdinal = Number($('.sfo input').val());
  const sortDirection = Number($('.sd input').val());
  const ticketNumberFilterValue = $('.ftname input').val();
  const partNumberFilterValue = $('.fpnum input').val();
  const machineNumberFilterValue = $('.fmname input').val();
  const ticketTypeFilterVal = Number($('.fttid input').val());
  const departmentFilterVal = Number($('.fdid input').val());
  const machineGroupFilterVal = Number($('.fmgid input').val());
  const operatorFilterVal = $('.fopname input').val();
  const cellLeaderFilterVal = Number($('.fclid input').val());
  const statusFilterVal = $('.fsid input').val();
  const gageDiameterFilterVal = Number($('.fpdia input').val());

  $('#cboFilter_Status').val(statusFilterVal);

  if ((ticketNumberFilterValue !== null) && (ticketNumberFilterValue.length > 0)) {
    $('#txtFilter_TicketNumber').val(ticketNumberFilterValue);
  }

  if ((partNumberFilterValue !== null) && (partNumberFilterValue.length > 0)) {
    $('#txtFilter_PartNumber').val(partNumberFilterValue);
  }

  if ((machineNumberFilterValue !== null) && (machineNumberFilterValue.length > 0)) {
    $('#txtFilter_MachineNumber').val(machineNumberFilterValue);
  }

  if (!isNaN(gageDiameterFilterVal) && (gageDiameterFilterVal > 0)) {
    $('#txtFilter_GageDiameter').val(gageDiameterFilterVal);
  }

  if (ticketTypeFilterVal !== 0) {
    $("#cboFilter_TicketType").val(ticketTypeFilterVal);
  }

  if (departmentFilterVal !== 0) {
    const departmentName = departmentMap.get(departmentFilterVal);
    $('#cboFilter_Department').val(departmentName);
  }

  if (machineGroupFilterVal !== 0) {
    const machineGroupName = machineGroupMap.get(machineGroupFilterVal);
    $('#cboFilter_MachineGroup').val(machineGroupName);
  }

  if ((operatorFilterVal !== null) && (operatorFilterVal.length > 0)) {
    $("#cboFilter_Operator").val(operatorFilterVal);
  }

  if (cellLeaderFilterVal !== 0) {
    const cellLeaderName = cellLeaderMap.get(cellLeaderFilterVal);
    $("#cboFilter_CellLeader").val(cellLeaderName);
  }

  if (sortDirection > 0) {
    $('.sd input').val(sortDirection);
  }

  if (!isNaN(sortFieldOrdinal) && !isNaN(sortDirection)) {
    setSortIcon(sortFieldOrdinal, sortDirection);
  }
}


function refreshPage() {

  //const ticketNumberFilterValue = $('.ftname input').val();
  const partNumberFilterValue = $('.fpnum input').val();
  const machineNumberFilterValue = $('.fmname input').val();
  const ticketTypeFilterVal = Number($('.fttid input').val());
  const departmentFilterVal = Number($('.fdid input').val());
  const machineGroupFilterVal = Number($('.fmgid input').val());
  const operatorFilterVal = $('.fopname input').val();
  const cellLeaderFilterVal = Number($('.fclid input').val());
  const gageDiameterFilterVal = Number($('.fpdia input').val());
  const statusFilterVal = Number($('.fsid input').val());
  const sortFieldOrdinal = Number($('.sfo input').val());
  const sortDirection = Number($('.sd input').val());


  const page_number = Number($('.pg input').val());


  let current_url = window.location.href;
  if (current_url.includes('?')) {
    const indexOfQuestionMark = current_url.indexOf('?');
    current_url = current_url.substring(0, indexOfQuestionMark);
  }

  const queryParams = new URLSearchParams();

  if (Number.isInteger(page_number) && (page_number > 0)) {
    queryParams.set('pg', page_number.toString());
  }

  // if ((ticketNumberFilterValue !== null) && (ticketNumberFilterValue.length > 0)) {
  //   queryParams.set('ftname', ticketNumberFilterValue);
  // }

  if ((partNumberFilterValue !== null) && (partNumberFilterValue.length > 0)) {
    queryParams.set('fpnum', partNumberFilterValue);
  }

  if ((machineNumberFilterValue !== null) && (machineNumberFilterValue.length > 0)) {
    queryParams.set('fmname', machineNumberFilterValue);
  }

  if (!isNaN(departmentFilterVal) && (departmentFilterVal > 0)) {
    queryParams.set('fdid', departmentFilterVal.toString());
  }

  if (!isNaN(gageDiameterFilterVal) && (gageDiameterFilterVal > 0)) {
    queryParams.set('fpdia', gageDiameterFilterVal.toString());
  }

  if (!isNaN(ticketTypeFilterVal) && (ticketTypeFilterVal > 0)) {
    queryParams.set('fttid', ticketTypeFilterVal.toString());
  }

  if (!isNaN(machineGroupFilterVal) && (machineGroupFilterVal > 0)) {
    queryParams.set('fmgid', machineGroupFilterVal.toString());
  }

  if ((operatorFilterVal !== null) && (operatorFilterVal !== '')) {
    queryParams.set('fopname', operatorFilterVal);
  }

  if (!isNaN(cellLeaderFilterVal) && (cellLeaderFilterVal > 0)) {
    queryParams.set('fclid', cellLeaderFilterVal.toString());
  }

  if (!isNaN(statusFilterVal) && (statusFilterVal > 0)) {
    queryParams.set('fsid', statusFilterVal.toString());
  }

  if (Number.isInteger(sortFieldOrdinal) && (sortFieldOrdinal >= 0)) {
    queryParams.set('sfo', sortFieldOrdinal.toString());
  }

  if (Number.isInteger(sortDirection) && (sortDirection >= 0)) {
    queryParams.set('sd', sortDirection.toString());
  }

  // Keep spaces encoded as %20 (instead of '+') for downstream parsing compatibility.
  const queryString = queryParams.toString().replace(/\+/g, '%20');
  window.location = (queryString.length > 0) ? `${current_url}?${queryString}` : current_url;
}


function removeAppendedFields() {
  $('#ticket-table-pagination').remove();
  $('.table-button').remove();
  $('.ticket-link').remove();
}


function removeRow(ticket_id) {
  const ticket_ids = $(".ticket-id-col input[type=text]");
  ticket_ids.each(function () {
    const row_ticket_id = Number($(this).val());
    if (row_ticket_id === Number(ticket_id)) {
      $(this).closest('tr').remove();
    }
  });
}


function resetPageNumber() {
  $('.ticket-table').hide();
  removeAppendedFields();
  $('.pg input').val(1).trigger("change");
}


function showDetails(ticket_id) {
  let widowHeight = $(window).height();
  widowHeight = widowHeight - 50;
  popUpIframe(`${window.location.origin}/Forms//RMS-GAGE-TicketDetails?tid=${ticket_id}`, 'Ticket Details', widowHeight, 1200);
}


function sortTable(newSortOrdinal, selector) {
  $('.ticket-table').hide();
  removeAppendedFields();

  const currentSortOrdinal = Number($('.sfo input').val());
  let sortDirection = Number($('.sd input').val());

  if (newSortOrdinal === currentSortOrdinal) {
    if (sortDirection === 0) {
      sortDirection = 1
      $('.sd input').val(1).trigger("change");
    } else {
      sortDirection = 0;
      $('.sd input').val(0).trigger("change");
    }
  } else {
    $('.sfo input').val(newSortOrdinal);
    $('.sd input').val(0).trigger("change");
    sortDirection = 0;
  }

  setSortIcon(newSortOrdinal, sortDirection, selector);
}


function setSortIcon(sortOrdinal, sortDirection, selector) {
  const sortSelectors = {
    0: '#q124',
    1: '#q115',
    2: '#q252',
    3: '#q119',
    4: '#q117',
    5: '#q120',
    6: '#q121',
    7: '#q122',
    8: '#q162',
    9: '#q166',
    10: '#q123',
    11: '#q125'
  };

  $('.sort-icon').remove();

  const selectorToUse = selector || sortSelectors[sortOrdinal] || '#q124';
  const iconClass = (sortDirection === 1) ? 'ui-icon-triangle-1-s' : 'ui-icon-triangle-1-n';
  $(`${selectorToUse} .cf-col-label`).append(`<span class="ui-icon ${iconClass} sort-icon"></span>`);
}


function submitForm() {

  const siteID = Number($('.site-id input').val());
  const activateSubmitEmployeeNumber = $('.activate-employee-number input');
  const activateSubmitEmployeeName = $('.activate-employee-name input');

  const crActivateEmployeeNumber = $('.cr-act-employee-number input');
  const crActivateEmployeeName = $('.cr-act-employee-name input');

  const anokaActivateEmployeeNumber = $('.ank-act-employee-number input');
  const anokaActivateEmployeeName = $('.ank-act-employee-name input');

  if (siteID === 1) {
    activateSubmitEmployeeNumber.val(crActivateEmployeeNumber.val());
    activateSubmitEmployeeName.val(crActivateEmployeeName.val());
  }
  if (siteID === 2) {
    activateSubmitEmployeeNumber.val(anokaActivateEmployeeNumber.val());
    activateSubmitEmployeeName.val(anokaActivateEmployeeName.val());
  }
  $('.print-ticket-id input').val($('.activate-guid input').val());
}


function wireUpSortFields() {

  $('#q124').off('click').on('click', function () {
    sortTable(0, '#q124');
  });
  $('#q115').off('click').on('click', function () {
    sortTable(1, '#q115');
  });
  $('#q252').off('click').on('click', function () {
    sortTable(2, '#q252');
  });
  $('#q119').off('click').on('click', function () {
    sortTable(3, '#q119');
  });
  $('#q117').off('click').on('click', function () {
    sortTable(4, '#q117');
  });
  $('#q120').off('click').on('click', function () {
    sortTable(5, '#q120');
  });
  $('#q121').off('click').on('click', function () {
    sortTable(6, '#q121');
  });
  $('#q122').off('click').on('click', function () {
    sortTable(7, '#q122');
  });
  $('#q162').off('click').on('click', function () {
    sortTable(8, '#q162');
  });
  $('#q166').off('click').on('click', function () {
    sortTable(9, '#q166');
  });
  $('#q123').off('click').on('click', function () {
    sortTable(10, '#q123');
  });
  $('#q125').off('click').on('click', function () {
    sortTable(11, '#q125');
  });

  setSortIcon(Number($('.sfo input').val()), Number($('.sd input').val()));
}
