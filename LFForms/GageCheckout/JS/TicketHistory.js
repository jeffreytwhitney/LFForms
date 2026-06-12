const departmentMap = new Map();
const departmentNameMap = new Map();
const machineGroupMap = new Map();
const machineGroupNameMap = new Map();
const cellLeaderMap = new Map();
const cellLeaderNameMap = new Map();


$(document).ready(function () {

  $('.Submit').hide();

  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simplePagination.js/1.6/simplePagination.min.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
   // return $.fn.button to previously assigned value
  $.fn.bootstrapBtn = $.fn.button.noConflict();

  $(document).prop('title', 'Ticket History');
  $('#q0').append("<div class='hidden' id='popUpDiv'></div>");
  $('#Field33').parent().append('<div class="filter-checkboxes"><fieldset class="radio-checkbox-fieldset"><legend class="screen-reader-legend">Filter Checkboxes:</legend><span class="choice"><input name="Field52" id="Field52-0" type="checkbox" value="IncludeClosedTickets" ><label class="form-option-label" for="Field52-0">Include Closed Tickets</label></span></fieldset></div>');

   


  $(document).on("onloadlookupfinished", function () {
    $('.Submit').hide();
    const sitename = $.cookie('site_name');
    if (sitename !== null) {
      $('.site-name select').val(sitename).trigger("change");
    }
    generateTicketNumberColumn();
    $('.ticket-table').show();
    $(".filter-checkboxes input[type='checkbox']").on("change", function () { filterTicketTable(); });
  });


  $(document).on('lookupcomplete', function () {

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
    generateTicketNumberColumn();
    appendPagination();
    $('.ticket-table').show();

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
  }
}


function callNextPage() {
  $('.tasklist-table').hide();
  removeAppendedFields();
  let current_page = Number($('.pg input').val());
  $('.pg input').val(current_page + 1).trigger("change");
}


function callPrevPage() {
  $('.tasklist-table').hide();
  removeAppendedFields();
  let current_page = Number($('.pg input').val());
  if (current_page === 1) {
    return;
  }
  $('.pg input').val(current_page - 1).trigger("change");
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


function filterTicketTable() {

  if ($('#filterRow').length === 0) {
    return;
  }

  const ticketNumberFilterValue = $('#txtFilter_TicketNumber').val();
  const ticketTypeFilterVal = $('#cboFilter_TicketType').val();
  const departmentFilterVal = $('#cboFilter_Department').val();
  const machineGroupFilterVal = $('#cboFilter_MachineGroup').val();
  const operatorFilterVal = $('#cboFilter_Operator').val();
  const cellLeaderFilterVal = $('#cboFilter_CellLeader').val();

  $('.ftname input').val(ticketNumberFilterValue);

  

  if ($("#Field52-0").is(":checked")) {
    $('.fincret input').val(1);
  }
  else {
    $('.fincret input').val(0);
  }


  if (ticketTypeFilterVal !== null) {
    $('.fttid input').val(ticketTypeFilterVal);
  }
  else {
    $('.fttid input').val(0);
  }

  if (departmentFilterVal !== null)  {
    const taskDepartmentID = departmentNameMap.get(departmentFilterVal);
    $('.fdid input').val(taskDepartmentID);
  }
  else {
    $('.fdid input').val(0);
  }

  if (machineGroupFilterVal !== null) {
    const machineGroupID = machineGroupNameMap.get(machineGroupFilterVal);
    $('.fmgid input').val(machineGroupID);
  }
  else {
    $('.fmgid input').val(null);
  }

  if (operatorFilterVal !== null) {
    $('.fopname input').val(operatorFilterVal);
  }
  else {
    $('.fopname input').val(null);
  }

  if (cellLeaderFilterVal !== null) {
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


function generateFilterRow() {

  if ($('#filterRow').length === 0) {

    const filter_row = "<TR id='filterRow'><TH><input type='text' id='txtFilter_TicketNumber'></TH><TH/><TH><select id='cboFilter_TicketType'/></TH><TH><select id='cboFilter_Department'/></TH><TH/><TH><select id='cboFilter_MachineGroup'/></TH><TH><select id='cboFilter_Operator'/></TH><TH><select id='cboFilter_CellLeader'/></TH><TH/><TH/><TH/><TH/><TH/><TH/><TH/><TH/>"
    $('.ticket-table table thead').append(filter_row);
    $("#txtFilter_TicketNumber").on("change", function () { filterTicketTable(); });
    $("#cboFilter_TicketType").on("change", function () { filterTicketTable(); });
    $("#cboFilter_Department").on("change", function () { filterTicketTable(); });
    $("#cboFilter_MachineGroup").on("change", function () { filterTicketTable(); });
    $("#cboFilter_Operator").on("change", function () { filterTicketTable(); });
    $("#cboFilter_CellLeader").on("change", function () { filterTicketTable(); });


    $("#txtFilter_TicketNumber").on("dblclick", function () { $("#txtFilter_TicketNumber").val(null).trigger("change"); });
    $("#cboFilter_TicketType").on("dblclick", function () { $("#cboFilter_TicketType").val(null).trigger("change"); });
    $("#cboFilter_Department").on("dblclick", function () { $("#cboFilter_Department").val(null).trigger("change"); });
    $("#cboFilter_MachineGroup").on("dblclick", function () { $("#cboFilter_MachineGroup").val(null).trigger("change"); });
    $("#cboFilter_Operator").on("dblclick", function () { $("#cboFilter_Operator").val(null).trigger("change"); });
    $("#cboFilter_CellLeader").on("dblclick", function () { $("#cboFilter_CellLeader").val(null).trigger("change"); });
  }

  if (($(".ticket-type-lookup-cbo select option").length > 0) && ($('#cboFilter_TicketType option') === 0)) {
    $("#cboFilter_TicketType").html($(".ticket-type-lookup-cbo select").html());
  }

  if (($(".department-lookup-cbo select option").length > 0) && ($('#cboFilter_Department option') === 0)) {
    $("#cboFilter_Department").html($(".department-lookup-cbo select").html());
  }

  if (($(".machine-group-lookup-cbo select option").length > 0) && ($('#cboFilter_MachineGroup option') === 0)) {
    $("#cboFilter_MachineGroup").html($(".machine-group-lookup-cbo select").html());
  }

  if (($(".operator-lookup-cbo select option").length > 0) && ($('#cboFilter_Operator option') === 0)) {
    $("#cboFilter_Operator").html($(".operator-lookup-cbo select").html());
    $("#cboFilter_Operator").find('option:eq(0)').prop('selected', true);
  }

  if (($(".cell-leader-lookup-cbo select option").length > 0) && ($('#cboFilter_CellLeader option') === 0)) {
    $("#cboFilter_CellLeader").html($(".cell-leader-lookup-cbo select").html());
    $("#cboFilter_CellLeader").find('option:eq(0)').prop('selected', true);
  }
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


function getTicketRowCount() {
  return $('.ticket-table table tbody tr').length;
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
    cellLeader_rows.each(function () {
      let cellLeaderID = Number($(this).find('.cellleader-lookup-table-id input').val());
      let cellLeaderName = $(this).find('.cellleader-lookup-table-name input').val();
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
    department_rows.each(function () {
      let departmentID = Number($(this).find('.department-lookup-table-id input').val());
      let departmentName = $(this).find('.department-lookup-table-name input').val();
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
  const includeClosedTicketsVal = Number($('.fincret input').val());


  if (includeClosedTicketsVal === 1) {
    $('#Field52-0').prop('checked', true);
  }
  else {
    $('#Field52-0').prop('checked', false);
  }


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


function removeAppendedFields() {
  $('#tasklist-pagination').remove();
  $('.ticket-link').remove();
}


function resetPageNumber() {
  $('.ticket-table').hide();
  removeAppendedFields();
  $('.pg input').val(1).trigger("change");
}


function showDetails(ticket_id) {
  let widowHeight = $(window).height();
  widowHeight = widowHeight - 50;
  popUpIframe(`http://rmslf/Forms/RMS-GAGE-TicketDetails?tid=${ticket_id}&ro=1`, 'Ticket Details', widowHeight, 1200);
}


