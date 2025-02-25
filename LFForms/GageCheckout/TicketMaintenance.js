var departmentMap = new Map();
var departmentNameMap = new Map();
var machineGroupMap = new Map();
var machineGroupNameMap = new Map();
var cellLeaderMap = new Map();
var cellLeaderNameMap = new Map();

var should_print_receipt = true;

$(document).ready(function () {

  $('.Submit').hide();

  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simplePagination.js/1.6/simplePagination.min.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
  var bootstrapButton = $.fn.button.noConflict(); // return $.fn.button to previously assigned value
  $.fn.bootstrapBtn = bootstrapButton;

  $(document).prop('title', 'Gage Maintenance');
  $('#q0').append("<div class='hidden' id='popUpDiv'></div>");


  var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
  var printEvent = window[eventMethod];
  var messageEvent = eventMethod === "attachEvent" ? "onmessage" : "message";
  printEvent(messageEvent, function (e) {

    if (e.data === "printme" || e.message === "printme") {
      $("#print-iframe").get(0).contentWindow.print();
      $('.print-ticket-id input').val(null);
    }
  });

  window.onmessage = function (event) {
    //This is the callback from the IFrame.
    //If the event data says "Close Dialog", it destroys the dialog, (so that the close function won't fire).
    //If it says "CloseDialogWithRefresh", it destroys the dialog and refreshes the form.
    //I don't refresh if you add a note, for example. But if you do anything that will show up on the page, (adding time, cloning a task, etc)
    //then I do a refresh.
    if (event.data == "CloseDialog") {
      $("#popupIFrame").dialog("destroy");
      $("#popupIFrame").remove();
    }
    if (event.data == "CloseDialogWithRefresh") {
      $("#popupIFrame").dialog("destroy");
      $("#popupIFrame").remove();
      refreshPage();
    }
  };


  $(document).on("onloadlookupfinished", function () {
    $('.Submit').hide();
    var sitename = $.cookie('site_name');
    if (sitename != null) {
      $('.site-name select').val(sitename).change();
    }
    generateFormButtons();
    $('.ticket-table').show();

  });


  $(document).on('lookupcomplete', function (e) {

    if (e.triggerId == 'Field219') {
      if ($('.print-ticket-id input').val()) {
        if ($('.print-ticket-id input').val() != null) {
          if ($('.print-ticket-type-id input').val()) {
            print_receipt();
          }
        }
      }
    }


    if ($('.pg input').val() == '999') {
      $('.pg input').val(1).change();
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
    $('.ticket-table').show();

  });

});


function appendPagination() {

  var current_page = Number($('.pg input').val());
  if (current_page == 999) { return; }

  var row_count = getTicketRowCount();

  if (row_count > 0) {
    $('#ticket-table-pagination').remove();
    if ((current_page == 1) && (row_count < 25)) {
      $('.ticket-table table').parent().append("<div id='ticket-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled'>‹‹</a></li><li><a class='page-link prev isDisabled'>‹</a></li><li><a class='page-link next isDisabled'>›</a></li></ul></div>");
      return;
    }
    if ((current_page == 1) && (row_count == 25)) {
      $('.ticket-table table').parent().append("<div id='ticket-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled'>‹‹</a></li><li><a class='page-link prev isDisabled'>‹</a></li><li><a class='page-link next' onclick='callNextPage();' href='javascript:void(0);'>›</a></li></ul></div>")
      return;
    }
    if ((current_page > 1) && (row_count == 25)) {
      $('.ticket-table table').parent().append("<div id='ticket-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev' onclick='resetPageNumber();' href='javascript:void(0);''>‹‹</a></li><li><a class='page-link prev' onclick='callPrevPage();' href='javascript:void(0);''>‹</a></li><li><a class='page-link next' onclick='callNextPage();' href='javascript:void(0);'>›</a></li></ul></div>")
      return;
    }
    if ((current_page > 1) && (row_count < 25)) {
      $('.ticket-table table').parent().append("<div id='ticket-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev' onclick='resetPageNumber();' href='javascript:void(0);''>‹‹</a></li><li><a class='page-link prev' onclick='callPrevPage();' href='javascript:void(0);''>‹</a></li><li><a class='page-link next isDisabled'>›</a></li></ul></div>")
      return;
    }
  }
}


function callCalibrate(ticket_id) {
  var has_permissions = checkPermissions();
  if (has_permissions) {
    var widowHeight = $(window).height();
    widowHeight = widowHeight - 50;
    popUpIframe(`http://rmslf/Forms/GageCalibration?tid=${ticket_id}`, 'Calibrate Ticket', widowHeight, 1200);
  }
  else {
    alert("Sorry, you do not have permissions to do this.");
  }
}


function callNextPage() {
  $('.pg').hide();
  removeAppendedFields();
  current_page = Number($('.pg input').val());
  $('.pg input').val(current_page + 1).change();
}


function callPrevPage() {
  $('.pg').hide();
  removeAppendedFields();
  current_page = Number($('.pg input').val());
  if (current_page == 1) {
    return;
  }
  $('.pg input').val(current_page - 1).change();
}


function callPrint(ticket_id) {
  should_print_receipt = true;
  var ticketTypeID = getTicketTypeIDByTicketID(ticket_id);
  var ticketGuid = getTicketGuidByTicketID(ticket_id);
  $('.print-ticket-id input').val(ticketGuid);
  $('.print-ticket-type-id input').val(ticketTypeID);
  print_receipt();
}


function callReturn(ticket_id) {

  $.confirm({
    title: 'Are you sure?',
    content: 'Are you sure you wish to return this ticket? It cannot be undone.',

    buttons: {
      ok: {
        text: "ok!",
        keys: ['enter'],
        action: function () {
          var has_permissions = checkPermissions();
          if (has_permissions) {
            executeIFrameUpdate(ticket_id);
            removeRow(ticket_id);
          }
          else {
            alert("Sorry, you do not have permissions to do this.");
          }
        }
      },
      cancel: function () {

      }
    }
  });

}


function checkPermissions() {

  var employee_number = $("#Field87").val();
  var is_active_user = $("#Field88").val().toString();
  var return_val = true;

  if (is_active_user == "False") {
    return_val = false;
  }

  if (employee_number == '') {
    return_val = false;
  }

  return return_val

}


function executeIFrameUpdate(ticket_id) {

  if (typeof ticket_id === 'undefined') {
    return;
  }

  console.log('executeIFrameUpdate');
  console.log(execute_url);

  var execute_url = `http://rmslf/Forms/RMS-GAGE-ReturnTicket?tid=${ticket_id}`;

  $("#popupIFrame").remove();
  $("#popUpDiv").html(`<iframe id='popupIFrame' name='myname' src='${execute_url}'/>`);
}


function filterTicketTable() {

  if ($('#filterRow').length == 0) {
    return;
  }

  var ticketNumberFilterValue = $('#txtFilter_TicketNumber').val();
  var ticketTypeFilterVal = $('#cboFilter_TicketType').val();
  var departmentFilterVal = $('#cboFilter_Department').val();
  var machineGroupFilterVal = $('#cboFilter_MachineGroup').val();
  var operatorFilterVal = $('#cboFilter_Operator').val();
  var cellLeaderFilterVal = $('#cboFilter_CellLeader').val();

  $('.ftname input').val(ticketNumberFilterValue);

  if (ticketTypeFilterVal != null) {
    $('.fttid input').val(ticketTypeFilterVal);
  }
  else {
    $('.fttid input').val(0);
  }

  if ((departmentFilterVal != 0) && (departmentFilterVal.length > 0)) {
    let taskDepartmentID = departmentNameMap.get(departmentFilterVal);
    $('.fdid input').val(taskDepartmentID);
  }
  else {
    $('.fdid input').val(0);
  }

  if ((machineGroupFilterVal != 0) && (machineGroupFilterVal.length > 0)) {
    let machineGroupID = machineGroupNameMap.get(machineGroupFilterVal);
    $('.fmgid input').val(machineGroupID);
  }
  else {
    $('.fmgid input').val(null);
  }

  if ((operatorFilterVal != null) && (operatorFilterVal.length > 0)) {
    $('.fopname input').val(operatorFilterVal);
  }
  else {
    $('.fopname input').val(null);
  }

  if ((cellLeaderFilterVal != 0) && (cellLeaderFilterVal.length > 0)) {
    let cellLeaderID = cellLeaderNameMap.get(cellLeaderFilterVal);
    $('.fclid input').val(cellLeaderID);
  }
  else {
    $('.fclid input').val(0);
  }

  $('.ticket-table').hide();
  $('.ticket-detail-link').remove();
  $('.pg input').val(1).change();

}


function formatDateFields(selector) {

  $(`[id^='${selector}']`).each((i, dateField) => $(dateField).val($(dateField).val().split(" ")[0]));

}


function generateTableButtons(buttonSelector, buttonClass, buttonImageClass, buttonTitle, buttonFunction) {
  var selectionString = buttonSelector + " input[type=text]";
  var buttons = $(selectionString);
  buttons.each(function () {
    var btn_value = $(this).val();
    var btn_html = `<div class='table-button ui-button ${buttonClass}'><span title='${buttonTitle}' class='ui-button-icon ui-icon ${buttonImageClass}' onclick='${buttonFunction}(${btn_value})'/></div>`

    var has_button = $(this).parent().find(`.${buttonClass}`).length;
    if (has_button == 0) {
      $(this).parent().append(btn_html);
    }
  });
}


function generateFilterRow() {

  if ($('#filterRow').length == 0) {

    var filter_row = "<TR id='filterRow'><TH/><TH/><TH/><TH><input type='text' id='txtFilter_TicketNumber'></TH><TH><select id='cboFilter_TicketType'/></TH><TH><select id='cboFilter_Department'/></TH><TH/><TH><select id='cboFilter_MachineGroup'/></TH><TH><select id='cboFilter_Operator'/></TH><TH><select id='cboFilter_CellLeader'/></TH><TH/><TH/><TH/><TH/><TH/><TH/><TH/>"
    $('.ticket-table table thead').append(filter_row);
    $("#txtFilter_TicketNumber").on("change", function () { filterTicketTable(); });
    $("#cboFilter_TicketType").on("change", function () { filterTicketTable(); });
    $("#cboFilter_Department").on("change", function () { filterTicketTable(); });
    $("#cboFilter_MachineGroup").on("change", function () { filterTicketTable(); });
    $("#cboFilter_Operator").on("change", function () { filterTicketTable(); });
    $("#cboFilter_CellLeader").on("change", function () { filterTicketTable(); });


    $("#txtFilter_TicketNumber").dblclick(function () { $("#txtFilter_TicketNumber").val(null).change(); });
    $("#cboFilter_TicketType").dblclick(function () { $("#cboFilter_TicketType").val(null).change(); });
    $("#cboFilter_Department").dblclick(function () { $("#cboFilter_Department").val(null).change(); });
    $("#cboFilter_MachineGroup").dblclick(function () { $("#cboFilter_MachineGroup").val(null).change(); });
    $("#cboFilter_Operator").dblclick(function () { $("#cboFilter_Operator").val(null).change(); });
    $("#cboFilter_CellLeader").dblclick(function () { $("#cboFilter_CellLeader").val(null).change(); });
  }

  if (($(".ticket-type-lookup-cbo select option").length > 0) && ($('#cboFilter_TicketType option' == 0))) {
    $("#cboFilter_TicketType").html($(".ticket-type-lookup-cbo select").html());
  }

  if (($(".department-lookup-cbo select option").length > 0) && ($('#cboFilter_Department option' == 0))) {
    $("#cboFilter_Department").html($(".department-lookup-cbo select").html());
  }

  if (($(".machine-group-lookup-cbo select option").length > 0) && ($('#cboFilter_MachineGroup option' == 0))) {
    $("#cboFilter_MachineGroup").html($(".machine-group-lookup-cbo select").html());
  }

  if (($(".operator-lookup-cbo select option").length > 0) && ($('#cboFilter_Operator option' == 0))) {
    $("#cboFilter_Operator").html($(".operator-lookup-cbo select").html());
    $("#cboFilter_Operator").find('option:eq(0)').prop('selected', true);
  }

  if (($(".cell-leader-lookup-cbo select option").length > 0) && ($('#cboFilter_CellLeader option' == 0))) {
    $("#cboFilter_CellLeader").html($(".cell-leader-lookup-cbo select").html());
    $("#cboFilter_CellLeader").find('option:eq(0)').prop('selected', true);
  }
}


function generateFormButtons() {

  generateTableButtons(".ticket-table-return-button", "return-button", "ui-icon-arrowreturn-1-w", "Return", "callReturn");
  generateTableButtons(".ticket-table-calibrate-button", "cal-button", "ui-icon-wrench", "Calibrate", "callCalibrate");
  generatePrintButtons();
  generateTicketNumberColumn();
}


function generatePrintButtons() {
  var print_buttons = $(".ticket-table-print-button input[type=text]");
  var ticket_ids = $(".ticket-id-col input[type=text]");
  print_buttons.each(function (index) {
    let ticket_id = ticket_ids[index].value;
    let has_button = $(this).parent().find('.print-button').length;
    if (has_button == 0) {
      let btn_html = `<div class='table-button ui-button print-button'><span title='Print' class='ui-button-icon ui-icon ui-icon-print' onclick='callPrint(${ticket_id})'/></div>`
      $(this).parent().append(btn_html);
    }
  });
}


function generateTicketNumberColumn() {
  $('.ticket-link').remove();
  var ticket_numbers = $('.ticket-number-col input[type="text"]');
  var ticket_ids = $('.ticket-id-col input[type="text"]');
  ticket_numbers.each(function (index) {
    let ticket_id = $(ticket_ids[index]).val();
    let ticket_number = $(this).val();
    let ticket_number_link = $("<a>", { text: ticket_number, class: 'ticket-link', href: 'javascript:void(0);', onclick: `showDetails(${ticket_id})` });
    let has_link = $(this).parent().find('.ticket-link').length;
    if (has_link == 0) {
      $(this).parent().append(ticket_number_link);
    }
  });

}


function getTicketGuidByTicketID(ticket_id) {
  var ticket_guid;
  var ticket_ids = $(".ticket-id-col input[type=text]");
  var ticket_guids = $(".ticket-table-print-button input[type=text]");

  ticket_ids.each(function (index) {
    var row_ticket_id = $(this).val();
    var row_ticket_guid = ticket_guids[index].value;
    if (row_ticket_id == ticket_id) {
      ticket_guid = row_ticket_guid;
      return;
    }
  });
  return ticket_guid;
}


function getTicketRowCount() {
  var row_count = $('.ticket-table table tbody tr').length;
  return row_count;
}


function getTicketTypeIDByTicketID(ticket_id) {
  var ticket_type_id;
  var ticket_ids = $(".ticket-id-col input[type=text]");
  var ticket_type_ids = $(".ticket-type-id-col input[type=text]");

  ticket_ids.each(function (index) {
    var row_ticket_id = $(this).val();
    var row_ticket_type_id = ticket_type_ids[index].value;
    if (row_ticket_id == ticket_id) {
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
  if (cellLeaderMap.keys.length == 0) {
    var cellLeader_rows = $('.cellleader-lookup-table table tbody tr');
    if (cellLeader_rows.length == 0) {
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
  if (departmentMap.keys.length == 0) {
    var department_rows = $('.department-lookup-table table tbody tr');
    if (department_rows.length == 0) {
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
  if (machineGroupMap.keys.length == 0) {
    var machine_group_rows = $('.machine-group-lookup-table table tbody tr');
    if (machine_group_rows.length == 0) {
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


function reApplyFilterValues() {
  if ($('#filterRow').length == 0) {
    return;
  }

  var ticketNumberFilterValue = $('.ftname input').val();
  var ticketTypeFilterVal = $('.fttid input').val();
  var departmentFilterVal = Number($('.fdid input').val());
  var machineGroupFilterVal = Number($('.fmgid input').val());
  var operatorFilterVal = $('.fopname input').val();
  var cellLeaderFilterVal = Number($('.fclid input').val());

  if ((ticketNumberFilterValue != null) && (ticketNumberFilterValue.length > 0)) {
    $('#txtFilter_TicketNumber').val(ticketNumberFilterValue);
  }

  if (ticketTypeFilterVal != 0) {
    $("#cboFilter_TicketType").val(ticketTypeFilterVal);
  }

  if (departmentFilterVal != 0) {
    let departmentName = departmentMap.get(departmentFilterVal);
    $('#cboFilter_Department').val(departmentName);
  }

  if (machineGroupFilterVal != 0) {
    let machineGroupName = machineGroupMap.get(machineGroupFilterVal);
    $('#cboFilter_MachineGroup').val(machineGroupName);
  }

  if ((operatorFilterVal != null) && (operatorFilterVal.length > 0)) {
    $("#cboFilter_Operator").val(operatorFilterVal);
  }

  if (cellLeaderFilterVal != 0) {
    let cellLeaderName = cellLeaderMap.get(cellLeaderFilterVal);
    $("#cboFilter_CellLeader").val(cellLeaderName);
  }
}


function refreshPage() {

  var ticketNumberFilterValue = $('.ftname input').val();
  var ticketTypeFilterVal = $('.fttid input').val();
  var departmentFilterVal = Number($('.fdid input').val());
  var machineGroupFilterVal = Number($('.fmgid input').val());
  var operatorFilterVal = $('.fopname input').val();
  var cellLeaderFilterVal = Number($('.fclid input').val());
  var page_number = Number($('.pg input').val());
  

  var current_url = window.location.href;
  if (current_url.includes('?')) {
    indexOfQuestionMark = current_url.indexOf('?');
    current_url = current_url.substring(0, indexOfQuestionMark);
  }

  if (page_number > 0) {
    current_url = current_url + `?pg=${page_number}`;
  }

  if ((ticketNumberFilterValue != null) && (ticketNumberFilterValue.length > 0)) {
    current_url = current_url + `&ftname=${ticketNumberFilterValue}`;
  }

  if ((departmentFilterVal != null) && (departmentFilterVal > 0)) {
    current_url = current_url + `&fdid=${departmentFilterVal}`;
  }
  if ((ticketTypeFilterVal != null) && (ticketTypeFilterVal > 0)) {
    current_url = current_url + `&fttid=${ticketTypeFilterVal}`;
  }
  if ((machineGroupFilterVal != null) && (machineGroupFilterVal > 0)) {
    current_url = current_url + `&fmgid=${machineGroupFilterVal}`;
  }
  if ((operatorFilterVal != null) && (operatorFilterVal != '')) {
    current_url = current_url + `&fopname=${operatorFilterVal}`;
  }
  if ((cellLeaderFilterVal != null) && (cellLeaderFilterVal > 0)) {
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
  var ticket_ids = $(".ticket-id-col input[type=text]");
  ticket_ids.each(function (index) {
    var row_ticket_id = $(this).val();
    if (row_ticket_id == ticket_id) {
      $(this).closest('tr').remove();
      return;
    }
  });
}


function resetPageNumber() {
  $('.ticket-table').hide();
  removeAppendedFields();
  $('.pg input').val(1).change();
}


function showDetails(ticket_id) {
  var widowHeight = $(window).height();
  widowHeight = widowHeight - 50;
  popUpIframe(`http://rmslf/Forms/RMS-GAGE-TicketDetails?tid=${ticket_id}`, 'Ticket Details', widowHeight, 1200);
}

