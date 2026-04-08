const departmentMap = new Map();
const departmentNameMap = new Map();
const machineGroupMap = new Map();
const machineGroupNameMap = new Map();
const cellLeaderMap = new Map();
const cellLeaderNameMap = new Map();

let should_print_receipt = true;

$(document).ready(function () {

  $('.Submit').hide();
  $('.Submit').on("click", function (e) { submitForm(e); });
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simplePagination.js/1.6/simplePagination.min.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
  const bootstrapButton = $.fn.button.noConflict(); // return $.fn.button to previously assigned value
  $.fn.bootstrapBtn = bootstrapButton;

  $(document).prop('title', 'Gage Maintenance');
  $('#q0').append("<div class='hidden' id='popUpDiv'></div>");


  const eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
  const printEvent = window[eventMethod];
  const messageEvent = eventMethod === "attachEvent" ? "onmessage" : "message";
  printEvent(messageEvent, function (e) {
    returnTicketID = Number($('.return-ticket-id input').val());
    if (returnTicketID === 0) {
      if (e.data === "printme" || e.message === "printme") {
        $("#print-iframe").get(0).contentWindow.print();
        $('.print-ticket-id input').val(null);
      }
    }
  });

  window.onmessage = function (event) {
    //This is the callback from the IFrame.
    //If the event data says "Close Dialog", it destroys the dialog, (so that the close function won't fire).
    //If it says "CloseDialogWithRefresh", it destroys the dialog and refreshes the form.
    //I don't refresh if you add a note, for example. But if you do anything that will show up on the page, (adding time, cloning a task, etc)
    //then I do a refresh.
    if (event.data === "CloseDialog") {
      $("#popupIFrame").dialog("destroy");
      $("#popupIFrame").remove();
    }
    if (event.data === "CloseDialogWithRefresh") {
      $("#popupIFrame").dialog("destroy");
      $("#popupIFrame").remove();

      returnTicketID = Number($('.return-ticket-id input').val());
      if (returnTicketID > 0) {
        executeIFrameUpdate(returnTicketID);
        removeRow(returnTicketID);
        $('.return-ticket-id input').val(0);
      }
      else {
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
    $('.ticket-table').show();

  });

  $(document).on('change', '.site-name select', function () {
    const sitename = $('.site-name select').val();
    $.cookie('site_name', sitename, { expires: 365, path: '/' });
  });

  $(document).on('change', '[id^="Field269"]', function (e) {
    generateMachineList();
  });

  $(document).on('click', '.cf-collection-delete', function (e) {
    generateMachineList();
  });
});


function appendPagination() {

  const current_page = Number($('.pg input').val());
  if (current_page === 999) { return; }

  const row_count = getTicketRowCount();

  if (row_count > 0) {
    $('#ticket-table-pagination').remove();
    if ((current_page === 1) && (row_count < 25)) {
      $('.ticket-table table').parent().append("<div id='ticket-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled'>&laquo;</a></li><li><a class='page-link prev isDisabled'>&lsaquo;</a></li><li><a class='page-link next isDisabled'>&rsaquo;</a></li></ul></div>");
      return;
    }
    if ((current_page === 1) && (row_count === 25)) {
      $('.ticket-table table').parent().append("<div id='ticket-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled'>&laquo;</a></li><li><a class='page-link prev isDisabled'>&lsaquo;</a></li><li><a class='page-link next'>&rsaquo;</a></li></ul></div>")
      return;
    }
    if ((current_page > 1) && (row_count === 25)) {
      $('.ticket-table table').parent().append("<div id='ticket-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev' onclick='resetPageNumber();' href='javascript:void(0);'>&laquo;</a></li><li><a class='page-link prev' onclick='callPrevPage();' href='javascript:void(0);'>&lsaquo;</a></li><li><a class='page-link next'>&rsaquo;</a></li></ul></div>")
      return;
    }
    if ((current_page > 1) && (row_count < 25)) {
      $('.ticket-table table').parent().append("<div id='ticket-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev' onclick='resetPageNumber();' href='javascript:void(0);'>&laquo;</a></li><li><a class='page-link prev' onclick='callPrevPage();' href='javascript:void(0);'>&lsaquo;</a></li><li><a class='page-link next isDisabled'>&rsaquo;</a></li></ul></div>")
      return;
    }
  }
  else {
    $('#ticket-table-pagination').remove();
    $('.ticket-table table').parent().append("<div id='ticket-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled' href='javascript:void(0);'>&laquo;</a></li><li><a class='page-link prev isDisabled' href='javascript:void(0);'>&lsaquo;</a></li><li><a class='page-link next isDisabled'>&rsaquo;</a></li></ul></div>")
    return;
  }
}


function callActivate(ticket_id) {
  $('.activate-ticket-id input').val(ticket_id).trigger("change");
  $('.Submit').show();
}


function callCalibrate(ticket_id, calForReturn=0) {
  const has_permissions = checkPermissions();
  if (has_permissions) {
    let widowHeight = $(window).height();
    widowHeight = widowHeight - 50;
    if (calForReturn === 0) {
      popUpIframe(`http://rmslf/Forms/GageCalibration?tid=${ticket_id}`, 'Calibrate Ticket', widowHeight, 1200);
    }
    else {
      popUpIframe(`http://rmslf/Forms/GageCalibration?tid=${ticket_id}&CalForReturn=1`, 'Calibrate Ticket', widowHeight, 1200);
    }
  }
  else {
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
  current_page = Number($('.pg input').val());
  $('.pg input').val(current_page + 1).trigger("change");
}


function callPrevPage() {
  $('.pg').hide();
  removeAppendedFields();
  current_page = Number($('.pg input').val());
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


function executeIFrameUpdate(ticket_id) {

  if (typeof ticket_id === 'undefined') {
    return;
  }
  const execute_url = `http://rmslf/Forms/RMS-GAGE-ReturnTicket?tid=${ticket_id}`;

  $("#popupIFrame").remove();
  $("#popUpDiv").html(`<iframe id='popupIFrame' name='myname' src='${execute_url}'/>`);
}


function filterTicketTable() {

  if ($('#filterRow').length === 0) {
    return;
  }

  $('.projectlist-table').hide();
  removeAppendedFields();


  const ticketNumberFilterValue = $('#txtFilter_TicketNumber').val();
  //var ticketTypeFilterVal = $('#cboFilter_TicketType').val();
  const departmentFilterVal = $('#cboFilter_Department').val();
  const machineGroupFilterVal = $('#cboFilter_MachineGroup').val();
  const operatorFilterVal = $('#cboFilter_Operator').val();
  const cellLeaderFilterVal = $('#cboFilter_CellLeader').val();
  const statusFilterVal = $('#cboFilter_Status').val();

  $('.ftname input').val(ticketNumberFilterValue);

  $('.fsid input').val(statusFilterVal); 

  //if (ticketTypeFilterVal != null) {
  //  $('.fttid input').val(ticketTypeFilterVal);
  //}
  //else {
  //  $('.fttid input').val(0);
  //}

  if ((departmentFilterVal !== 0) && (departmentFilterVal.length > 0)) {
    const taskDepartmentID = departmentNameMap.get(departmentFilterVal);
    $('.fdid input').val(taskDepartmentID);
  }
  else {
    $('.fdid input').val(0);
  }

  if ((machineGroupFilterVal !== 0) && (machineGroupFilterVal.length > 0)) {
    const machineGroupID = machineGroupNameMap.get(machineGroupFilterVal);
    $('.fmgid input').val(machineGroupID);
  }
  else {
    $('.fmgid input').val(null);
  }

  if ((operatorFilterVal !== null) && (operatorFilterVal.length > 0)) {
    $('.fopname input').val(operatorFilterVal);
  }
  else {
    $('.fopname input').val(null);
  }

  if ((cellLeaderFilterVal !== 0) && (cellLeaderFilterVal.length > 0)) {
    const cellLeaderID = cellLeaderNameMap.get(cellLeaderFilterVal);
    $('.fclid input').val(cellLeaderID);
  }
  else {
    $('.fclid input').val(0);
  }

  $('.ticket-table').hide();
  $('.ticket-detail-link').remove();
  $('.pg input').val(1).trigger("change");

}


function formatDateFields(selector) {

  $(`[id^='${selector}']`).each((i, dateField) => $(dateField).val($(dateField).val().split(" ")[0]));

}


function generateActivateButtons() {
  const activate_textboxes = $(".activate-ticket-button input[type=text]");
  const ticket_ids = $(".ticket-id-col input[type=text]");
  const ticket_status_ids = $(".ticket-status-id-col input[type=text]");
  activate_textboxes.each(function (index) {
    const ticket_id = ticket_ids[index].value;
    const ticket_status_id = ticket_status_ids[index].value;
    if (ticket_status_id === '1') {
      const has_button = $(this).parent().find('.activate-button').length;
      if (has_button === 0) {
        const btn_html = `<div class='table-button ui-button activate-button' onclick='callActivate(${ticket_id})'><span title='Activate Staged Ticket' class='ui-button-icon ui-icon ui-icon-power'/></div>`
        $(this).parent().append(btn_html);
      }
    }
  });
}


function generateGoBackButtons() {
  const gobackactivate_buttons = $(".goback_activate");
  gobackactivate_buttons.each(function (index) {
    $(this).parent().append("<div id='go-back' class='ui-button ui-corner-all ui-widget' onclick='callGoBack()'><span class='ui-icon ui-icon-arrowreturnthick-1-w'></span>Go Back</div>");
  });
  $(".goback_activate").remove();
}


function generateFilterRow() {

  if ($('#filterRow').length === 0) {

    const filter_row = "<TR id='filterRow'><TH/><TH/><TH/><TH/><TH><input type='text' id='txtFilter_TicketNumber'></TH><TH><select id='cboFilter_Status'/></TH><TH><select id='cboFilter_Department'/></TH><TH/><TH><select id='cboFilter_MachineGroup'/></TH><TH><select id='cboFilter_Operator'/></TH><TH><select id='cboFilter_CellLeader'/></TH><TH/><TH/><TH/><TH/><TH/><TH/><TH/>"
    $('.ticket-table table thead').append(filter_row);
    $("#txtFilter_TicketNumber").on("change", function () { filterTicketTable(); });
    //$("#cboFilter_TicketType").on("change", function () { filterTicketTable(); });
    $("#cboFilter_Department").on("change", function () { filterTicketTable(); });
    $("#cboFilter_MachineGroup").on("change", function () { filterTicketTable(); });
    $("#cboFilter_Operator").on("change", function () { filterTicketTable(); });
    $("#cboFilter_CellLeader").on("change", function () { filterTicketTable(); });
    $("#cboFilter_Status").on("change", function () { filterTicketTable(); });


    $("#txtFilter_TicketNumber").on("dblclick", function () { $("#txtFilter_TicketNumber").val(null).trigger("change"); });
    //$("#cboFilter_TicketType").on("dblclick", function () { $("#cboFilter_TicketType").val(null).trigger("change"); });
    $("#cboFilter_Department").on("dblclick", function () { $("#cboFilter_Department").val(null).trigger("change"); });
    $("#cboFilter_MachineGroup").on("dblclick", function () { $("#cboFilter_MachineGroup").val(null).trigger("change"); });
    $("#cboFilter_Operator").on("dblclick", function () { $("#cboFilter_Operator").val(null).trigger("change"); });
    $("#cboFilter_CellLeader").on("dblclick", function () { $("#cboFilter_CellLeader").val(null).trigger("change"); });
    $("#cboFilter_Status").on("dblclick", function () { $("#cboFilter_Status").val(null).trigger("change"); });
    wireUpSortFields();
  }

  //if (($(".ticket-type-lookup-cbo select option").length > 0) && ($('#cboFilter_TicketType option' == 0))) {
  //  $("#cboFilter_TicketType").html($(".ticket-type-lookup-cbo select").html());
  //}

  if (($(".department-lookup-cbo select option").length > 0) && ($('#cboFilter_Department option' === 0))) {
    $("#cboFilter_Department").html($(".department-lookup-cbo select").html());
  }

  if (($(".status-lookup-cbo select option").length > 0) && ($('#cboFilter_Status option' === 0))) {
    $("#cboFilter_Status").html($(".status-lookup-cbo select").html());
  }

  if (($(".machine-group-lookup-cbo select option").length > 0) && ($('#cboFilter_MachineGroup option' === 0))) {
    $("#cboFilter_MachineGroup").html($(".machine-group-lookup-cbo select").html());
  }

  if (($(".operator-lookup-cbo select option").length > 0) && ($('#cboFilter_Operator option' === 0))) {
    $("#cboFilter_Operator").html($(".operator-lookup-cbo select").html());
    $("#cboFilter_Operator").find('option:eq(0)').prop('selected', true);
  }

  if (($(".cell-leader-lookup-cbo select option").length > 0) && ($('#cboFilter_CellLeader option' === 0))) {
    $("#cboFilter_CellLeader").html($(".cell-leader-lookup-cbo select").html());
    $("#cboFilter_CellLeader").find('option:eq(0)').prop('selected', true);
  }
}


function generateFormButtons() {

  generateTableButtons(".ticket-table-return-button", "return-button", "ui-icon-arrowreturn-1-w", "Check In Ticket", "callReturn");
  generateTableButtons(".ticket-table-calibrate-button", "cal-button", "ui-icon-wrench", "Calibrate Ticket Gages", "callCalibrate");
  generatePrintButtons();
  generateTicketNumberColumn();
  generateActivateButtons();
}


function generateMachineList() {
  const activateTicketID = $('.activate-ticket-id input').val();
  let machineList = '';


  if (activateTicketID !== '') {

    $('[id^="Field269"]').each(function (index, element) {
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

    $('.activate-machine-list input').val(machineList);
  }
}


function generatePrintButtons() {
  const print_buttons = $(".ticket-table-print-button input[type=text]");
  const ticket_ids = $(".ticket-id-col input[type=text]");
  print_buttons.each(function (index) {
    const ticket_id = ticket_ids[index].value;
    const has_button = $(this).parent().find('.print-button').length;
    if (has_button === 0) {
      const btn_html = `<div class='table-button ui-button print-button' onclick='callPrint(${ticket_id})'><span title='Print Ticket Receipt' class='ui-button-icon ui-icon ui-icon-print'/></div>`
      $(this).parent().append(btn_html);
    }
  });
}


function generateTableButtons(buttonSelector, buttonClass, buttonImageClass, buttonTitle, buttonFunction) {
  const selectionString = buttonSelector + " input[type=text]";
  const buttons = $(selectionString);
  buttons.each(function () {
    const btn_value = $(this).val();
    const btn_html = `<div class='table-button ui-button ${buttonClass}' onclick='${buttonFunction}(${btn_value})'><span title='${buttonTitle}' class='ui-button-icon ui-icon ${buttonImageClass}'/></div>`

    const has_button = $(this).parent().find(`.${buttonClass}`).length;
    if (has_button === 0) {
      $(this).parent().append(btn_html);
    }
  });
}


function generateTicketNumberColumn() {
  $('.ticket-link').remove();
  const ticket_numbers = $('.ticket-number-col input[type="text"]');
  const ticket_ids = $('.ticket-id-col input[type="text"]');
  ticket_numbers.each(function (index) {
    const ticket_id = $(ticket_ids[index]).val();
    const ticket_number = $(this).val();
    const ticket_number_link = $("<a>", { text: ticket_number, class: 'ticket-link', href: 'javascript:void(0);', onclick: `showDetails(${ticket_id})` });
    const has_link = $(this).parent().find('.ticket-link').length;
    if (has_link === 0) {
      $(this).parent().append(ticket_number_link);
    }
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
  const ticket_guids = $(".ticket-table-print-button input[type=text]");

  ticket_ids.each(function (index) {
    const row_ticket_id = $(this).val();
    const row_ticket_guid = ticket_guids[index].value;
    if (row_ticket_id === ticket_id) {
      ticket_guid = row_ticket_guid;
      return;
    }
  });
  return ticket_guid;
}


function getTicketRowCount() {
  const row_count = $('.ticket-table table tbody tr').length;
  return row_count;
}


function getTicketTypeIDByTicketID(ticket_id) {
  let ticket_type_id;
  const ticket_ids = $(".ticket-id-col input[type=text]");
  const ticket_type_ids = $(".ticket-type-id-col input[type=text]");

  ticket_ids.each(function (index) {
    const row_ticket_id = $(this).val();
    const row_ticket_type_id = ticket_type_ids[index].value;
    if (row_ticket_id === ticket_id) {
      ticket_type_id = row_ticket_type_id;
      return;
    }
  });
  return ticket_type_id;
}


function loadiFrame(src) {
  $("#popUpDiv").html("<iframe id='print-iframe' name='print-iframe' src='" + src + "' />");
}


function loadCellLeaderMap() {
  if (cellLeaderMap.keys.length === 0) {
    const cellLeader_rows = $('.cellleader-lookup-table table tbody tr');
    if (cellLeader_rows.length === 0) {
      return;
    }
    cellLeader_rows.each(function (index) {
      cellLeaderID = Number($(this).find('.cellleader-lookup-table-id input').val());
      cellLeaderName = $(this).find('.cellleader-lookup-table-name input').val();
      cellLeaderMap.set(cellLeaderID, cellLeaderName);
      cellLeaderNameMap.set(cellLeaderName, cellLeaderID);
    });
  }
}


function loadDepartmentMap() {
  if (departmentMap.keys.length === 0) {
    const department_rows = $('.department-lookup-table table tbody tr');
    if (department_rows.length === 0) {
      return;
    }
    department_rows.each(function (index) {
      departmentID = Number($(this).find('.department-lookup-table-id input').val());
      departmentName = $(this).find('.department-lookup-table-name input').val();
      departmentMap.set(departmentID, departmentName);
      departmentNameMap.set(departmentName, departmentID);
    });
  }
}


function loadMachineGroupMap() {
  if (machineGroupMap.keys.length === 0) {
    const machine_group_rows = $('.machine-group-lookup-table table tbody tr');
    if (machine_group_rows.length === 0) {
      return;
    }
    machine_group_rows.each(function (index) {
      machineGroupID = Number($(this).find('.machine-group-lookup-table-id input').val());
      machineGroupName = $(this).find('.machine-group-lookup-table-name input').val();
      machineGroupMap.set(machineGroupID, machineGroupName);
      machineGroupNameMap.set(machineGroupName, machineGroupID);
    });
  }

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
    position: { my: "left top", at: "left top", of: window },
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


function reApplyFilterValues() {
  if ($('#filterRow').length === 0) {
    return;
  }

  const ticketNumberFilterValue = $('.ftname input').val();
  const ticketTypeFilterVal = $('.fttid input').val();
  const departmentFilterVal = Number($('.fdid input').val());
  const machineGroupFilterVal = Number($('.fmgid input').val());
  const operatorFilterVal = $('.fopname input').val();
  const cellLeaderFilterVal = Number($('.fclid input').val());
  const statusFilterVal = $('.fsid input').val();

  $('#cboFilter_Status').val(statusFilterVal);

  if ((ticketNumberFilterValue !== null) && (ticketNumberFilterValue.length > 0)) {
    $('#txtFilter_TicketNumber').val(ticketNumberFilterValue);
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
}


function refreshPage() {

  const ticketNumberFilterValue = $('.ftname input').val();
  const ticketTypeFilterVal = $('.fttid input').val();
  const departmentFilterVal = Number($('.fdid input').val());
  const machineGroupFilterVal = Number($('.fmgid input').val());
  const operatorFilterVal = $('.fopname input').val();
  const cellLeaderFilterVal = Number($('.fclid input').val());
  const page_number = Number($('.pg input').val());
  

  let current_url = window.location.href;
  if (current_url.includes('?')) {
    indexOfQuestionMark = current_url.indexOf('?');
    current_url = current_url.substring(0, indexOfQuestionMark);
  }

  if (page_number > 0) {
    current_url = current_url + `?pg=${page_number}`;
  }

  if ((ticketNumberFilterValue !== null) && (ticketNumberFilterValue.length > 0)) {
    current_url = current_url + `&ftname=${ticketNumberFilterValue}`;
  }

  if ((departmentFilterVal !== null) && (departmentFilterVal > 0)) {
    current_url = current_url + `&fdid=${departmentFilterVal}`;
  }
  if ((ticketTypeFilterVal !== null) && (ticketTypeFilterVal > 0)) {
    current_url = current_url + `&fttid=${ticketTypeFilterVal}`;
  }
  if ((machineGroupFilterVal !== null) && (machineGroupFilterVal > 0)) {
    current_url = current_url + `&fmgid=${machineGroupFilterVal}`;
  }
  if ((operatorFilterVal !== null) && (operatorFilterVal !== '')) {
    current_url = current_url + `&fopname=${operatorFilterVal}`;
  }
  if ((cellLeaderFilterVal !== null) && (cellLeaderFilterVal > 0)) {
    current_url = current_url + `&fclid=${cellLeaderFilterVal}`;
  }

  window.location = current_url;
}


function removeAppendedFields() {
  $('#tasklist-pagination').remove();
  $('.table-button').remove();
  $('.ticket-link').remove();
  }


function removeRow(ticket_id) {
  const ticket_ids = $(".ticket-id-col input[type=text]");
  ticket_ids.each(function (index) {
    const row_ticket_id = $(this).val();
    if (row_ticket_id === ticket_id) {
      $(this).closest('tr').remove();
      return;
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
  popUpIframe(`http://rmslf/Forms/RMS-GAGE-TicketDetails?tid=${ticket_id}`, 'Ticket Details', widowHeight, 1200);
}


function sortTable(newSortOrdinal, selector) {
  $('.projectlist-table').hide();
  removeAppendedFields();
  $('.sort-icon').remove();

  const currentSortOrdinal = Number($('.sort-field-ordinal input').val());
  let sortDirection = Number($('.sort-direction input').val());

  if (newSortOrdinal === currentSortOrdinal) {
    if (sortDirection === 0) {
      sortDirection = 1
      $('.sort-direction input').val(1).trigger("change");
    }
    else {
      sortDirection = 0;
      $('.sort-direction input').val(0).trigger("change");
    }
  }
  else {
    $('.sort-field-ordinal input').val(newSortOrdinal);
    $('.sort-direction input').val(0).trigger("change");
    sortDirection = 0;
  }

  if (sortDirection === 0) {
    $(`${selector} .cf-col-label`).append('<span class="ui-icon ui-icon-triangle-1-n sort-icon"></span>');
  }
  else {
    $(`${selector} .cf-col-label`).append('<span class="ui-icon ui-icon-triangle-1-s sort-icon"></span>');
  }


}


function submitForm(e) {

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

  $('#q124 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-n sort-icon"></span>');
  $('#q124').on('click', function () { sortTable(0, '#q124'); });
  $('#q115').on('click', function () { sortTable(1, '#q115'); });
  $('#q116').on('click', function () { sortTable(2, '#q116'); });
  $('#q119').on('click', function () { sortTable(3, '#q119'); });
  $('#q117').on('click', function () { sortTable(4, '#q117'); });
  $('#q120').on('click', function () { sortTable(5, '#q120'); });
  $('#q121').on('click', function () { sortTable(6, '#q121'); });
  $('#q122').on('click', function () { sortTable(7, '#q122'); });
  $('#q162').on('click', function () { sortTable(8, '#q162'); });
  $('#q163').on('click', function () { sortTable(9, '#q163'); });
  $('#q166').on('click', function () { sortTable(10, '#q166'); });
  $('#q123').on('click', function () { sortTable(11, '#q123'); });
  $('#q125').on('click', function () { sortTable(12, '#q125'); });
}
