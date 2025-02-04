var departmentMap = new Map();
var departmentNameMap = new Map();
var machineGroupMap = new Map();
var machineGroupNameMap = new Map();


var should_print_receipt = true;
$.getScript("https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js", function () {
  WebFont.load({
    google: {
      families: ['Montserrat', 'Libre Barcode 128']
    }
  });
});


$(document).ready(function () {
  $('.Submit').hide();
  $(document).prop('title', 'Modify Ticket');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simplePagination.js/1.6/simplePagination.min.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
  var bootstrapButton = $.fn.button.noConflict(); // return $.fn.button to previously assigned value
  $.fn.bootstrapBtn = bootstrapButton;
  


  $(document).on("onloadlookupfinished", function () {
    var sitename = $.cookie('site_name');
    if (sitename != null) {
      $('.site-name select').val(sitename).change();
    }
    $('#q0').append("<div class='hidden-text' id='print_output'></div>");
    generateFilterRow();

  });

  $(document).on('lookupcomplete', function (e) {
    if ($('.pg input').val() == '999') {
      $('.pg input').val(1).change();
    }

    loadDepartmentMap();
    loadMachineGroupMap();


    $('.ticket-table-created-on input').each((i, dateField) => $(dateField).val($(dateField).val().split(" ")[0]));
    $('.ticket-table-last-cal input').each((i, dateField) => $(dateField).val($(dateField).val().split(" ")[0]));
    $('.ticket-table-cal-due-date input').each((i, dateField) => $(dateField).val($(dateField).val().split(" ")[0]));
    generateTaskNumberColumn();
    reApplyFilterValues();
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
      $('.ticket-table table').parent().append("<div id='ticket-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled'>‹</a></li><li><a class='page-link next isDisabled'>›</a></li></ul></div>");
      return;
    }
    if ((current_page == 1) && (row_count == 25)) {
      $('.ticket-table table').parent().append("<div id='ticket-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled'>‹</a></li><li><a class='page-link next' onclick='callNextPage();' href='javascript:void(0);'>›</a></li></ul></div>")
      return;
    }
    if ((current_page > 1) && (row_count == 25)) {
      $('.ticket-table table').parent().append("<div id='ticket-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev' onclick='callPrevPage();' href='javascript:void(0);''>‹</a></li><li><a class='page-link next' onclick='callNextPage();' href='javascript:void(0);'>›</a></li></ul></div>")
      return;
    }
    if ((current_page > 1) && (row_count < 25)) {
      $('.ticket-table table').parent().append("<div id='ticket-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev' onclick='callPrevPage();' href='javascript:void(0);''>‹</a></li><li><a class='page-link next isDisabled'>›</a></li></ul></div>")
      return;
    }
  }
}


function callNextPage() {
  $('.ticket-table').hide();
    $('.ticket-detail-link').remove();
  current_page = Number($('.pg input').val());
  $('.pg input').val(current_page + 1).change();
}


function callPrevPage() {
  $('.ticket-table').hide();
  $('.ticket-detail-link').remove();
  current_page = Number($('.pg input').val());
  if (current_page == 1) {
    return;
  }
  $('.pg input').val(current_page - 1).change();
}


function filterTaskListTable() {
  $('.tasklist-assignee-cbo-col select').off();
  $('.tasklist-duedate-col input[type="text"]').off();
  $('.tasklist-schedduedate-col input[type="text"]').off();
  $('.tasklist-status-cbo-col select').off();
  if ($('#filterRow').length == 0) {
    return;
  }

  if ($("#Field206-0").is(":checked")) {
    $('.fincns input').val(1);
  }
  else {
    $('.fincns input').val(0);
  }

  if ($("#Field206-1").is(":checked")) {
    $('.finccom input').val(1);
  }
  else {
    $('.finccom input').val(0);
  }

  if ($("#Field206-2").is(":checked")) {
    $('.fexw input').val(1);
  }
  else {
    $('.fexw input').val(0);
  }

  var taskNameFilterValue = $('#txtFilter_TaskName').val();
  var projectNameFilterValue = $('#txtFilter_ProjectName').val();
  var ticketNumberFilterValue = $('#cboFilter_TicketNumber').val();
  var taskTypeFilterVal = $('#cboFilter_TaskType').val();
  var statusFilterVal = $('#cboFilter_Status').val();
  var assigneeFilterVal = $('#cboFilter_Assignee').val();
  var departmentFilterVal = $('#cboFilter_Department').val();
  var qeFilterVal = $('#cboFilter_QE').val();
  var initiatorFilterVal = $('#cboFilter_Initiator').val();

  $('.ftname input').val(taskNameFilterValue);
  $('.fpname input').val(projectNameFilterValue);

  if ((ticketNumberFilterValue != null) && (ticketNumberFilterValue.length > 0)) {
    $('.fpid input').val(ticketNumberFilterValue);
  }
  else {
    $('.fpid input').val(0);
  }

  if ((taskTypeFilterVal != null) && (taskTypeFilterVal.length > 0)) {
    let taskTypeID = taskTypeByNameMap.get(taskTypeFilterVal);
    $('.fttid input').val(taskTypeID);
  }
  else {
    $('.fttid input').val(0);
  }


  if ((statusFilterVal != null) && (statusFilterVal.length > 0)) {
    let statusID = taskStatusNameMap.get(statusFilterVal);
    $('.fsid input').val(statusID);
  }
  else {
    $('.fsid input').val(0);
  }

  if ((assigneeFilterVal != null) && (assigneeFilterVal.length > 0)) {
    let assigneeID = assigneeNameMap.get(assigneeFilterVal);
    $('.faid input').val(assigneeID);
  }
  else {
    $('.faid input').val(0);
  }

  if ((departmentFilterVal != null) && (departmentFilterVal.length > 0)) {
    let departmentID = departmentNameMap.get(departmentFilterVal);
    $('.fdid input').val(departmentID);
  }
  else {
    $('.fdid input').val(0);
  }

  if ((qeFilterVal != null) && (qeFilterVal.length > 0)) {
    let qeID = qualityEngineerNameMap.get(qeFilterVal);
    $('.fqeid input').val(qeID);
  }
  else {
    $('.fqeid input').val(0);
  }

  if ((initiatorFilterVal != null) && (initiatorFilterVal.length > 0)) {
    let initiatorID = initiatorNameMap.get(initiatorFilterVal);
    $('.finitid input').val(initiatorID);
  }
  else {
    $('.finitid input').val(0);
  }

  $('.ticket-table').hide();
    $('.ticket-detail-link').remove();
  $('.pg input').val(1).change();

}


function generateFilterRow() {

  //if ($('#filterRow').length == 0) {

  //  var filter_row = "<TR id='filterRow'><TH/><TH/><TH/><TH><select id='cboFilter_TicketNumber'/></TH><TH><input type='text' id='txtFilter_ProjectName'></TH><TH><input type='text' id='txtFilter_TaskName'></TH><TH><select id='cboFilter_Status'/></TH><TH><select id='cboFilter_TaskType'/></TH><TH><select id='cboFilter_Assignee'/></TH><TH/><TH/><TH/><TH/><TH/><TH><TH/><TH><select id='cboFilter_Department'/></TH><TH/><TH/><select id='cboFilter_QE'/></TH><TH><select id='cboFilter_Initiator'/></TH><TH/></TR>"
  //  $('.ticket-table table thead').append(filter_row);
  //  $("#cboFilter_TicketNumber").on("change", function () { filterTaskListTable(); });
  //  $("#txtFilter_ProjectName").on("change", function () { filterTaskListTable(); });
  //  $("#txtFilter_TaskName").on("change", function () { filterTaskListTable(); });
  //  $("#cboFilter_Status").on("change", function () { filterTaskListTable(); });
  //  $("#cboFilter_TaskType").on("change", function () { filterTaskListTable(); });
  //  $("#cboFilter_Assignee").on("change", function () { filterTaskListTable(); });
  //  $("#cboFilter_Department").on("change", function () { filterTaskListTable(); });
  //  $("#cboFilter_QE").on("change", function () { filterTaskListTable(); });
  //  $("#cboFilter_Initiator").on("change", function () { filterTaskListTable(); });

  //  $("#cboFilter_TicketNumber").dblclick(function () { $("#cboFilter_TicketNumber").val(null).change(); });
  //  $("#txtFilter_ProjectName").dblclick(function () { $("#txtFilter_ProjectName").val(null).change(); });
  //  $("#txtFilter_TaskName").dblclick(function () { $("#txtFilter_TaskName").val(null).change(); });
  //  $("#cboFilter_Status").dblclick(function () { $("#cboFilter_Status").val(0).change(); });
  //  $("#cboFilter_TaskType").dblclick(function () { $("#cboFilter_TaskType").val(0).change(); });
  //  $("#cboFilter_Assignee").dblclick(function () { $("#cboFilter_Assignee").val(0).change(); });
  //  $("#cboFilter_Department").dblclick(function () { $("#cboFilter_Department").val(0).change(); });
  //  $("#cboFilter_QE").dblclick(function () { $("#cboFilter_QE").val(0).change(); });
  //  $("#cboFilter_Initiator").dblclick(function () { $("#cboFilter_Initiator").val(0).change(); });
  //}

  //if ((($('.ftname input').val() != null) && ($('.ftname input').val().length > 0)) && (($('#txtFilter_TaskName').val() == null) || ($('#txtFilter_TaskName').val() == ''))) {
  //  $('#txtFilter_TaskName').val($('.ftname input').val());
  //}

  //if ((($('.fpname input').val() != null) && ($('.fpname input').val().length > 0)) && (($('#txtFilter_ProjectName').val() == null) || ($('#txtFilter_ProjectName').val() == ''))) {
  //  $('#txtFilter_TaskName').val($('.fpname input').val());
  //}

  //if (($(".qe-lookup-combo select option").length > 0) && ($("#cboFilter_QE option" == 0))) {
  //  $("#cboFilter_QE").html($(".qe-lookup-combo select").html());
  //}

  //if (($(".initiator-lookup-combo select option").length > 0) && ($("#cboFilter_Initiator option" == 0))) {
  //  $("#cboFilter_Initiator").html($(".initiator-lookup-combo select").html());


  //}

  //if (($('.ticket-number-lookup-combo select option').length > 0) && ($("#cboFilter_TicketNumber option" == 0))) {
  //  var selectList = $('.ticket-number-lookup-combo select option');

  //  selectList.sort(function (a, b) {
  //    a = a.value;
  //    b = b.value;

  //    return a - b;
  //  });
  //  $("#cboFilter_TicketNumber").html(selectList);
  //  $("#cboFilter_TicketNumber").val(null);
  //}

  //if (($(".status-lookup-combo select option").length > 0) && ($("#cboFilter_Status option" == 0))) {
  //  $("#cboFilter_Status").html($(".status-lookup-combo select").html());
  //}
  //if (($(".tasktype-lookup-combo select option").length > 0) && ($("#cboFilter_TaskType option" == 0))) {
  //  $("#cboFilter_TaskType").html($(".tasktype-lookup-combo select").html());
  //}
  //if (($(".assignee-lookup-combo select option").length > 0) && ($("#cboFilter_Assignee option" == 0))) {
  //  $("#cboFilter_Assignee").html($(".assignee-lookup-combo select").html());
  //}
  //if (($(".department-lookup-combo select option").length > 0) && ($("#cboFilter_Department option" == 0))) {
  //  $("#cboFilter_Department").html($(".department-lookup-combo select").html());
  //}
}


function generateTaskNumberColumn() {
  $('.ticket-detail-link').remove();
  var ticket_numbers = $('.ticket-table-ticket-number input[type="text"]');
  var ticket_ids = $('.ticket-table-id input[type="text"]');
  ticket_numbers.each(function (index) {
    let ticket_id = $(ticket_ids[index]).val();
    let ticket_number = $(this).val();
    let ticket_number_link = $("<a>", { text: ticket_number, class: 'ticket-detail-link', href: 'javascript:void(0);', onclick:`showDetails(${ticket_id})` });
    $(this).parent().append(ticket_number_link);
  });

}


function getColumnValueByTaskID(task_id, column_name) {

  var tasklist_rows = $(".ticket-table table tbody tr");
  var task_ids = $('.tasklist-task-id-col input[type="text"]');
  var column_value;

  task_ids.each(function (index) {
    let row_task_id = $(this).val();
    if (row_task_id == task_id) {
      let tasklist_row = tasklist_rows[index];
      column_value = $(tasklist_row).find(column_name).val();
      return;
    }
  });
  return column_value;
}


function getTicketRowCount() {
  var row_count = $('.ticket-table table tbody tr').length;
  return row_count;
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


function reApplyFilterValues() {
  if ($('#filterRow').length == 0) {
    return;
  }

  //var includeNotScheduled = Number($('.fincns input').val());
  //var includeCompleted = Number($('.finccom input').val());
  //var excludeWaiting = Number($('.fexw input').val());

  //if (includeNotScheduled == 1) {
  //  $('#Field206-0').prop('checked', true);
  //}
  //else {
  //  $('#Field206-0').prop('checked', false);
  //}

  //if (includeCompleted == 1) {
  //  $('#Field206-1').prop('checked', true);
  //}
  //else {
  //  $('#Field206-1').prop('checked', false);
  //}

  //if (excludeWaiting == 1) {
  //  $('#Field206-2').prop('checked', true);
  //}
  //else {
  //  $('#Field206-2').prop('checked', false);
  //}



  //var taskNameFilterValue = $('.ftname input').val();
  //var projectNameFilterValue = $('.fpname input').val();
  //var projectIDFilterValue = Number($('.fpid input').val());

  //var taskTypeFilterVal = Number($('.fttid input').val());
  //var statusFilterVal = Number($('.fsid input').val());
  //var assigneeFilterVal = Number($('.faid input').val());
  //var departmentFilterVal = Number($('.fdid input').val());
  //var qeFilterVal = Number($('.fqeid input').val());
  //var initiatorFilterVal = $('.finitid input').val();

  //if (qeFilterVal != 0) {
  //  let qeName = qualityEngineerMap.get(qeFilterVal);

  //  $('#cboFilter_QE').val(qeName);
  //}


  //if (initiatorFilterVal != 0) {

  //  let initiatorName = initiatorMap.get(initiatorFilterVal);

  //  $('#cboFilter_Initiator').val(initiatorName);
  //}
  //else {

  //  $("#cboFilter_Initiator").val($("#cboFilter_Initiator option:first").val());
  //}

  //if ((taskNameFilterValue != null) && (taskNameFilterValue.length > 0)) {
  //  $('#txtFilter_TaskName').val(taskNameFilterValue);
  //}

  //if ((projectNameFilterValue != null) && (projectNameFilterValue.length > 0)) {
  //  $('#txtFilter_ProjectName').val(projectNameFilterValue);
  //}

  //if (projectIDFilterValue != 0) {
  //  $('#cboFilter_TicketNumber').val(projectIDFilterValue);
  //}


  //if (taskTypeFilterVal != 0) {
  //  let taskTypeName = taskTypeMap.get(taskTypeFilterVal);
  //  $('#cboFilter_TaskType').val(taskTypeName);
  //}
  //if (statusFilterVal != 0) {
  //  let statusName = taskStatusMap.get(statusFilterVal);
  //  $('#cboFilter_Status').val(statusName);
  //}
  //if (assigneeFilterVal != 0) {

  //  let assigneeName = assigneeMap.get(assigneeFilterVal);
  //  $('#cboFilter_Assignee').val(assigneeName);
  //}
  //if (departmentFilterVal != 0) {
  //  let departmentName = departmentMap.get(departmentFilterVal);
  //  $('#cboFilter_Department').val(departmentName);
  //}

}


function resetPageNumber() {
  $('.ticket-table').hide();
  $('.ticket-detail-link').remove();
  $('.pg input').val(1).change();
}


function wireUpChangeEvents() {
  $('.site-name select').change(function () {
    var sitename = $('.site-name select').val();
    $.cookie('site_name', sitename, { expires: 365, path: '/' });
  });


}