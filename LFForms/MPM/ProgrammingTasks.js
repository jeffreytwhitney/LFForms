const status_NotStarted = 1;
const status_Started = 2;
const status_Waiting = 3;
const status_Completed = 4;
const status_Cancelled = 5;
const status_NotSched = 7;

const fieldToUpdate_Assignee = 1;
const fieldToUpdate_Status = 2;
const fieldToUpdate_DueDate = 3;
const fieldToUpdate_SchedDueDate = 4;

var assigneeMap = new Map();
var assigneeNameMap = new Map();
var departmentMap = new Map();
var departmentNameMap = new Map();
var taskTypeMap = new Map();
var taskTypeByNameMap = new Map();
var taskStatusMap = new Map();
var taskStatusNameMap = new Map();
var initiatorMap = new Map();
var initiatorNameMap = new Map();


//-------------------DOCUMENT FUNCTIONS-------------------------

$(document).ready(function () {
  $('.Submit').hide();
  $(document).prop('title', 'Task Maintenance');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simplePagination.js/1.6/simplePagination.min.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
  var bootstrapButton = $.fn.button.noConflict(); // return $.fn.button to previously assigned value
  $.fn.bootstrapBtn = bootstrapButton;
  var lfUserName = $('.lf-username input').val();
  if (lfUserName != 'Anonymous User') {
    $('.network-user-name input').val(lfUserName.toUpperCase().substr(lfUserName.lastIndexOf('\\') + 1)).change();
  }
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

  $(document).on('change', '.site-name select', function () {
    var sitename = $('.site-name select').val();
    $.cookie('site_name', sitename, { expires: 365, path: '/' });
  });

  $(document).on('lookupcomplete', function (e) {


    loadAssigneeMap();
    loadStatusMap();
    loadDepartmentMap();
    loadTaskTypeMap();
    loadInitiatorMap();
    

    $('.tasklist-datestarted-col input').each((i, dateField) => $(dateField).val($(dateField).val().split(" ")[0]));
    $('.tasklist-duedate-col input').each((i, dateField) => $(dateField).val($(dateField).val().split(" ")[0]));
    $('.tasklist-schedduedate-col input').each((i, dateField) => $(dateField).val($(dateField).val().split(" ")[0]));
    generateTaskListColumnFields();
    reApplyFilterValues();
    appendPagination();
    generateFilterRow();
    lockRows();
    $('.tasklist-table').show();
  });

  $(document).on("onloadlookupfinished", function (e) {

    $('#q0').append("<div class='hidden-text' id='popUpDiv'></div>");
    $(".tasklist-filter-checks input").on("change", function () { filterTaskListTable(); });
    if ($('.tasklist-page input').val() == '999') {
      $('.tasklist-page input').val(1).change();
    }
    var sitename = $.cookie('site_name');
    if (sitename != null) {
      $('.site-name select').val(sitename).change();
    }
    $('.network-user-name input').trigger("change");
    $('.tasklist-table').show();
  });

});


function appendPagination() {

  var current_page = Number($('.tasklist-page input').val());
  if (current_page == 999) { return; }

  var row_count = getTaskListRowCount();

  if (row_count > 0) {
    $('#tasklist-pagination').remove();
    if ((current_page == 1) && (row_count < 25)) {
      $('.tasklist-table table').parent().append("<div id='tasklist-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled'>‹‹</a></li><li><a class='page-link prev isDisabled'>‹</a></li><li><a class='page-link next isDisabled'>›</a></li></ul></div>");
      return;
    }
    if ((current_page == 1) && (row_count == 25)) {
      $('.tasklist-table table').parent().append("<div id='tasklist-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled'>‹‹</a></li><li><a class='page-link prev isDisabled'>‹</a></li><li><a class='page-link next' onclick='callNextPage();' href='javascript:void(0);'>›</a></li></ul></div>")
      return;
    }
    if ((current_page > 1) && (row_count == 25)) {
      $('.tasklist-table table').parent().append("<div id='tasklist-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev' onclick='resetPageNumber();' href='javascript:void(0);''>‹‹</a></li><li><a class='page-link prev' onclick='callPrevPage();' href='javascript:void(0);''>‹</a></li><li><a class='page-link next' onclick='callNextPage();' href='javascript:void(0);'>›</a></li></ul></div>")
      return;
    }
    if ((current_page > 1) && (row_count < 25)) {
      $('.tasklist-table table').parent().append("<div id='tasklist-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev' onclick='resetPageNumber();' href='javascript:void(0);''>‹‹</a></li><li><a class='page-link prev' onclick='callPrevPage();' href='javascript:void(0);''>‹</a></li><li><a class='page-link next isDisabled'>›</a></li></ul></div>")
      return;
    }
  }
}


function callAddNote(task_id) {
  var user_type_id = Number($(".user-type-id input").val());
  if (user_type_id != 0) {
    var task_name = getColumnValueByTaskID(task_id, '.tasklist-task-name-col input[type="text"]');
    popUpIframe(`http://rmslf/Forms/MPMAddNote?TaskID=${task_id}&nt=1`, `Add Note for task '${task_name}'`, 400, 650, false, task_id);
  }
  else {
    $.alert({ title: 'Nope!', content: 'Sorry, you do not have permissions to do this.' });
  }

}


function callAddTime(task_id) {
  var user_type_id = Number($(".user-type-id input").val());

  if (user_type_id == 1) {
    var task_name = getColumnValueByTaskID(task_id, '.tasklist-task-name-col input[type="text"]');
    popUpIframe(`http://rmslf/Forms/MPMAddTaskTime?tid=${task_id}`, `Add Time to task '${task_name}'`, 300, 800, false, task_id);
  }
}


function callNextPage() {
  $('.tasklist-table').hide();
  removeAppendedFields();
  current_page = Number($('.tasklist-page input').val());
  $('.tasklist-page input').val(current_page + 1).change();
}


function callPrevPage() {
  $('.tasklist-table').hide();
  removeAppendedFields();
  current_page = Number($('.tasklist-page input').val());
  if (current_page == 1) {
    return;
  }
  $('.tasklist-page input').val(current_page - 1).change();
}


function colorCodeRows() {
  var status_ids = $('.tasklist-status-id-col input[type="text"]');
  var tasklist_rows = $(".tasklist-table table tbody tr");

  var currentDate = new Date();
  var aMonthAgoNumber = new Date().setDate(currentDate.getDate() - 30);
  var aMonthAgo = new Date(aMonthAgoNumber).toISOString();

  $(tasklist_rows).removeClass('colorOverDue');
  $(tasklist_rows).removeClass('colorStarted');
  $(tasklist_rows).removeClass('colorStartedButOld');
  $(tasklist_rows).removeClass('colorWaiting');
  $(tasklist_rows).removeClass('colorClosedCancelled');

  status_ids.each(function (index) {
    let status_id = $(status_ids[index]).val();
    let tasklist_row = tasklist_rows[index];
    let dueDateString = $(tasklist_row).find('.tasklist-date-col input[type="text"]').val();
    let dueDate = moment(dueDateString, "M/D/YYYY").toDate();

    let dateStartedString = $(tasklist_row).find('.tasklist-datestarted-col input[type="text"]').val();

    if ((status_id == status_Completed) || (status_id == status_Cancelled)) {
      return;
    }

    if (dueDate <= currentDate) {
      $(tasklist_row).addClass('colorOverDue');
      return;
    }
    if (status_id == status_Started) {
      if ((dateStartedString != null) && (dateStartedString.length > 0)) {
        let dateStarted = new Date(dateStartedString).toISOString();
        if (dateStarted < aMonthAgo) {
          $(tasklist_row).addClass('colorStartedButOld');
          return;
        }
        else {
          $(tasklist_row).addClass('colorStarted');
          return;
        }
      }
      else {
        $(tasklist_row).addClass('colorStarted');
      }
    }

    if ((status_id == status_Waiting)) {
      $(tasklist_row).addClass('colorWaiting');
    }

  });
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

  if ($("#Field206-3").is(":checked")) {
    $('.fexsd input').val(1);
  }
  else {
    $('.fexsd input').val(0);
  }

  var taskNameFilterValue = $('#txtFilter_TaskName').val();
  var projectNameFilterValue = $('#txtFilter_ProjectName').val();
  var ticketNumberFilterValue = $('#txtFilter_TicketNumber').val();
  var taskTypeFilterVal = $('#cboFilter_TaskType').val();
  var statusFilterVal = $('#cboFilter_Status').val();
  var assigneeFilterVal = $('#cboFilter_Assignee').val();
  var departmentFilterVal = $('#cboFilter_Department').val();
  var initiatorFilterVal = $('#cboFilter_Initiator').val();

  $('.ftname input').val(taskNameFilterValue);
  $('.fpname input').val(projectNameFilterValue);
  $('.fpid input').val(ticketNumberFilterValue);



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

  if ((initiatorFilterVal != null) && (initiatorFilterVal.length > 0)) {
    let initiatorID = initiatorNameMap.get(initiatorFilterVal);
    $('.finitid input').val(initiatorID);
  }
  else {
    $('.finitid input').val(0);
  }

  $('.tasklist-table').hide();
  removeAppendedFields();
  $('.tasklist-page input').val(1).change();

}


function generateFilterRow() {

  if ($('#filterRow').length == 0) {

    var filter_row = "<TR id='filterRow'><TH/><TH/><TH/><TH/><TH/><TH><input id='txtFilter_TicketNumber'/></TH><TH><input type='text' id='txtFilter_ProjectName'></TH><TH><input type='text' id='txtFilter_TaskName'></TH><TH><select id='cboFilter_Status'/></TH><TH><select id='cboFilter_TaskType'/></TH><TH><select id='cboFilter_Assignee'/></TH><TH/><TH/><TH/><TH><TH/><TH/><TH><select id='cboFilter_Department'/></TH><TH><select id='cboFilter_Initiator'/></TH><TH/><TH/></TR>"
    $('.tasklist-table table thead').append(filter_row);
    $("#txtFilter_TicketNumber").on("change", function () { filterTaskListTable(); });
    $("#txtFilter_ProjectName").on("change", function () { filterTaskListTable(); });
    $("#txtFilter_TaskName").on("change", function () { filterTaskListTable(); });
    $("#cboFilter_Status").on("change", function () { filterTaskListTable(); });
    $("#cboFilter_TaskType").on("change", function () { filterTaskListTable(); });
    $("#cboFilter_Assignee").on("change", function () { filterTaskListTable(); });
    $("#cboFilter_Department").on("change", function () { filterTaskListTable(); });
    $("#cboFilter_Initiator").on("change", function () { filterTaskListTable(); });

    $("#txtFilter_TicketNumber").dblclick(function () { $("#txtFilter_TicketNumber").val(null).change(); });
    $("#txtFilter_ProjectName").dblclick(function () { $("#txtFilter_ProjectName").val(null).change(); });
    $("#txtFilter_TaskName").dblclick(function () { $("#txtFilter_TaskName").val(null).change(); });
    $("#cboFilter_Status").dblclick(function () { $("#cboFilter_Status").val(0).change(); });
    $("#cboFilter_TaskType").dblclick(function () { $("#cboFilter_TaskType").val(0).change(); });
    $("#cboFilter_Assignee").dblclick(function () { $("#cboFilter_Assignee").val(0).change(); });
    $("#cboFilter_Department").dblclick(function () { $("#cboFilter_Department").val(0).change(); });
    $("#cboFilter_Initiator").dblclick(function () { $("#cboFilter_Initiator").val(0).change(); });
    wireUpSortFields();
  }

  if ((($('.ftname input').val() != null) && ($('.ftname input').val().length > 0)) && (($('#txtFilter_TaskName').val() == null) || ($('#txtFilter_TaskName').val() == ''))) {
    $('#txtFilter_TaskName').val($('.ftname input').val());
  }

  if ((($('.fpname input').val() != null) && ($('.fpname input').val().length > 0)) && (($('#txtFilter_ProjectName').val() == null) || ($('#txtFilter_ProjectName').val() == ''))) {
    $('#txtFilter_TaskName').val($('.fpname input').val());
  }

  if ((($('.fpid input').val() != null) && ($('.fpid input').val().length > 0)) && (($('#txtFilter_TicketNumber').val() == null) || ($('#txtFilter_TicketNumber').val() == ''))) {
    $('#txtFilter_TicketNumber').val($('.fpid input').val());
  }

  if (($(".initiator-lookup-combo select option").length > 1) && ($("#cboFilter_Initiator option").length == 0)) {
    $("#cboFilter_Initiator").html($(".initiator-lookup-combo select").html());
  }

  if (($(".status-lookup-combo select option").length > 1) && ($("#cboFilter_Status option").length == 0)) {
    $("#cboFilter_Status").html($(".status-lookup-combo select").html());
  }
  if (($(".tasktype-lookup-combo select option").length > 1) && ($("#cboFilter_TaskType option").length == 0)) {
    $("#cboFilter_TaskType").html($(".tasktype-lookup-combo select").html());
  }
  if (($(".assignee-lookup-combo select option").length > 1) && ($("#cboFilter_Assignee option").length == 0)) {
    $("#cboFilter_Assignee").html($(".assignee-lookup-combo select").html());
  }
  if (($(".department-lookup-combo select option").length > 1) && ($("#cboFilter_Department option").length == 0)) {
    $("#cboFilter_Department").html($(".department-lookup-combo select").html());
  }
}


function generateTaskListColumnFields() {
  removeAppendedFields();
  if ($('.tasklist-table table tbody tr').length > 0) {

    generateTableButtons(".tasklist-note-col", "ui-icon-document", "Add Note", "callAddNote");
    generateTableButtons(".tasklist-time-col", "ui-icon-clock", "Add Time", "callAddTime");

    generateTableCheckBox(".tasklist-mandate-col", "mandate-chk");
    generateProjectColumn();
    generateTaskColumn();
    lockCompletedRows();
    colorCodeRows();
  }
}


function generateProjectColumn() {
  var project_names = $('.tasklist-project-name-col input[type="text"]');
  var project_ids = $('.tasklist-project-id-col input[type="text"]');
  var ticket_numbers = $('.tasklist-ticket-number-col input[type="text"]');
  project_names.each(function (index) {
    let project_id = $(project_ids[index]).val();
    let ticket_number = $(ticket_numbers[index]);
    let ticket_number_value = $(ticket_numbers[index]).val();
    let project_name = $(this).val();
    let project_link = $("<a>", { text: project_name.substr(0, 30), class: 'project-link', href: `javascript:void(0);`, onclick: `showProjectDetails(${project_id})` });
    $(this).parent().append(project_link);
    project_link = $("<a>", { text: ticket_number_value, class: 'project-link', href: `javascript:void(0);`, onclick: `showProjectDetails(${project_id})` });
    $(ticket_number).parent().append(project_link);
  });

}


function generateTableButtons(buttonSelector, buttonClass, buttonTitle, buttonFunction) {
  var selectionString = buttonSelector + " input[type=text]";
  var buttons = $(selectionString);
  buttons.each(function () {
    var btn_value = $(this).val();
    var btn_html = `<div class='table-button ui-button'><span title='${buttonTitle}' class='ui-button-icon ui-icon ${buttonClass}' onclick='${buttonFunction}(${btn_value})'/></div>`

    var has_button = $(this).parent().find(`.${buttonClass}`).length;
    if (has_button == 0) {
      $(this).parent().append(btn_html);
    }
  });
}


function generateTableCheckBox(selector, checkboxClass) {
  var selectionString = selector + " input[type=text]";
  var checkboxes = $(selectionString);
  checkboxes.each(function () {
    var btn_value = $(this).val();
    if (btn_value == '1') {
      var btn_html = "<input class='" + checkboxClass + "' type='checkbox' disabled checked/>";
      var has_button = $(this).parent().find(`.${checkboxClass}`).length;
      if (has_button == 0) {
        $(this).parent().append(btn_html);
      }
    }
    else {
      var btn_html = "<input class='" + checkboxClass + "' type='checkbox' disabled/>";
      var has_button = $(this).parent().find(`.${checkboxClass}`).length;
      if (has_button == 0) {
        $(this).parent().append(btn_html);
      }
    }
  });
}


function generateTaskColumn() {
  var task_names = $('.tasklist-task-name-col input[type="text"]');
  var task_ids = $('.tasklist-task-id-col input[type="text"]');
  task_names.each(function (index) {
    let task_id = $(task_ids[index]).val();
    let task_name = $(this).val();
    let task_link = $("<a>", { text: task_name.substr(0, 30), class: 'task-link', href: `javascript:void(0);`, onclick: `showTaskDetails(${task_id})` });
    $(this).parent().append(task_link);
  });
}


function getTaskListRowCount() {
  var row_count = $('.tasklist-table table tbody tr').length;
  return row_count;
}


function getColumnValueByTaskID(task_id, column_name) {

  var tasklist_rows = $(".tasklist-table table tbody tr");
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


function getRowByTaskID(task_id) {
  var tasklist_rows = $(".tasklist-table table tbody tr");
  var task_ids = $('.tasklist-task-id-col input[type="text"]');
  var row;

  task_ids.each(function (index) {
    let row_task_id = $(this).val();
    if (row_task_id == task_id) {
      row = tasklist_rows[index];
      return;
    }
  });
  return row;
}


function loadAssigneeMap() {

  if (assigneeMap.keys.length == 0) {
    var assignee_rows = $('.assignee-lookup-table table tbody tr');
    if (assignee_rows.length == 0) {
      return;
    }
    assignee_rows.each(function (index) {
      assigneeID = Number($(this).find('.assignee-lookup-table-id input').val());
      assigneeName = $(this).find('.assignee-lookup-table-name input').val();
      assigneeMap.set(assigneeID, assigneeName);
      assigneeNameMap.set(assigneeName, assigneeID);
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


function loadInitiatorMap() {
  if (initiatorMap.keys.length == 0) {
    var initiator_rows = $('.initiator-lookup-table table tbody tr');
    if (initiator_rows.length == 0) {
      return;
    }
    initiator_rows.each(function (index) {
      initiatorID = $(this).find('.initiator-lookup-table-id input').val();
      initiatorName = $(this).find('.initiator-lookup-table-name input').val();
      initiatorMap.set(initiatorID, initiatorName);
      initiatorNameMap.set(initiatorName, initiatorID);
    });
  }
}


function loadStatusMap() {
  if (taskStatusMap.keys.length == 0) {
    var status_rows = $('.status-lookup-table table tbody tr');
    if (status_rows.length == 0) {
      return;
    }
    status_rows.each(function (index) {
      statusID = Number($(this).find('.status-lookup-table-id input').val());
      statusName = $(this).find('.status-lookup-table-name input').val();
      taskStatusMap.set(statusID, statusName);
      taskStatusNameMap.set(statusName, statusID);
    });
  }
}


function loadTaskTypeMap() {

  if (taskTypeMap.keys.length == 0) {
    var tasktype_rows = $('.tasktype-lookup-table table tbody tr');
    if (tasktype_rows.length == 0) {
      return;
    }
    tasktype_rows.each(function (index) {
      tasktypeID = Number($(this).find('.tasktype-lookup-table-id input').val());
      tasktypeName = $(this).find('.tasktype-lookup-table-name input').val();
      taskTypeMap.set(tasktypeID, tasktypeName);
      taskTypeByNameMap.set(tasktypeName, tasktypeID);
    });
  }
}


function lockCompletedRows() {
  var status_ids = $('.tasklist-status-id-col input[type="text"]');
  var tasklist_rows = $(".tasklist-table table tbody tr");
  var includeCompleted = Number($('.finccom input').val());

  if (includeCompleted == 1) {

    status_ids.each(function (index) {
      let status_id = $(status_ids[index]).val();
      let tasklist_row = tasklist_rows[index];

      if ((status_id == status_Completed) || (status_id == status_Cancelled)) {
        $(tasklist_row).addClass('colorClosedCancelled');
        $(tasklist_row).find(".time-button").prop("disabled", true);

      }
      else {
        $(tasklist_row).removeClass('colorClosedCancelled');
        $(tasklist_row).find(".time-button").prop("disabled", false);
      }
    });
  }
}


function lockRows() {
  var tasklist_rows = $(".tasklist-table table tbody tr");
  var user_type_id = Number($(".user-type-id input").val());
  var userDepartmentID = Number($(".user-department-id input").val());
  tasklist_rows.each(function (index) {
    if (user_type_id == 1) {
      
      $(this).find(".tasklist-note-col").find(".table-button").removeClass("ui-state-disabled");
      $(this).find(".tasklist-time-col").find(".table-button").removeClass("ui-state-disabled");
      return;
    }
    if (user_type_id == 3) {
      $(this).find(".tasklist-time-col").find(".table-button").addClass("ui-state-disabled");
      let departmentID = Number($(this).find('.tasklist-dept-id-col input[type="text"]').val());
      if (departmentID != userDepartmentID) {
        $(this).find(".tasklist-note-col").find(".table-button").addClass("ui-state-disabled");
      }
      return;
    }
    
    $(this).find(".tasklist-note-col").find(".table-button").addClass("ui-state-disabled");
    $(this).find(".tasklist-time-col").find(".table-button").addClass("ui-state-disabled");
  });
}


function popUpIframe(src, title, height, width, dorefresh, task_id) {
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
      if (dorefresh) {
        resetAssignee(task_id);
        resetTaskStatus(task_id);
      }
    }
  });


  $("#popupIFrame").dialog("open");
  $("#popupIFrame").attr('style', `width: ${width};`);
  var resizeableStyle = $('.ui-resizable').attr('style');
  let newStyle = resizeableStyle.replaceAll('width: 0px;', `width: ${width}px;`);
  $('.ui-resizable').attr('style', newStyle);
}


function reApplyFilterValues() {
  if ($('#filterRow').length == 0) {
    return;
  }

  var includeNotScheduled = Number($('.fincns input').val());
  var includeCompleted = Number($('.finccom input').val());
  var excludeWaiting = Number($('.fexw input').val());

  if (includeNotScheduled == 1) {
    $('#Field206-0').prop('checked', true);
  }
  else {
    $('#Field206-0').prop('checked', false);
  }

  if (includeCompleted == 1) {
    $('#Field206-1').prop('checked', true);
  }
  else {
    $('#Field206-1').prop('checked', false);
  }

  if (excludeWaiting == 1) {
    $('#Field206-2').prop('checked', true);
  }
  else {
    $('#Field206-2').prop('checked', false);
  }



  var taskNameFilterValue = $('.ftname input').val();
  var projectNameFilterValue = $('.fpname input').val();
  var projectIDFilterValue = $('.fpid input').val();

  var taskTypeFilterVal = Number($('.fttid input').val());
  var statusFilterVal = Number($('.fsid input').val());
  var assigneeFilterVal = Number($('.faid input').val());
  var departmentFilterVal = Number($('.fdid input').val());
  var initiatorFilterVal = $('.finitid input').val();

  if (initiatorFilterVal != 0) {

    let initiatorName = initiatorMap.get(initiatorFilterVal);

    $('#cboFilter_Initiator').val(initiatorName);
  }
  else {

    $("#cboFilter_Initiator").val($("#cboFilter_Initiator option:first").val());
  }

  if ((taskNameFilterValue != null) && (taskNameFilterValue.length > 0)) {
    $('#txtFilter_TaskName').val(taskNameFilterValue);
  }

  if ((projectNameFilterValue != null) && (projectNameFilterValue.length > 0)) {
    $('#txtFilter_ProjectName').val(projectNameFilterValue);
  }

  if ((projectIDFilterValue != null) && (projectIDFilterValue.length > 0)) {
    $('#txtFilter_TicketNumber').val(projectIDFilterValue);
  }


  if (taskTypeFilterVal != 0) {
    let taskTypeName = taskTypeMap.get(taskTypeFilterVal);
    $('#cboFilter_TaskType').val(taskTypeName);
  }
  if (statusFilterVal != 0) {
    let statusName = taskStatusMap.get(statusFilterVal);
    $('#cboFilter_Status').val(statusName);
  }
  if (assigneeFilterVal != 0) {
    let assigneeName = assigneeMap.get(assigneeFilterVal);
    console.log(`assigneeName: ${assigneeName}`);
    $('#cboFilter_Assignee').val(assigneeName);

  }
  if (departmentFilterVal != 0) {
    let departmentName = departmentMap.get(departmentFilterVal);
    $('#cboFilter_Department').val(departmentName);
  }

}


function refreshPage() {

  var taskNameFilter = $('.ftname input').val();
  var projectFilter = $('.fpname input').val();
  var include_NotSched = Number($('.fincns input').val());
  var exclude_Waiting = Number($('.fexw input').val());
  var include_Complete = Number($('.finccom input').val());
  var taskTypeIDFilter = Number($('fttid input').val());
  var statusIDFilter = Number($('fsid input').val());
  var assigneeIDFilter = Number($('faid input').val());
  var departmentIDFilter = Number($('fdid input').val());
  var taskListPage = Number($('.tasklist-page input').val());
  var initiatorID = Number($('.finitid input').val());

  var current_url = window.location.href;
  if (current_url.includes('?')) {
    indexOfQuestionMark = current_url.indexOf('?');
    current_url = current_url.substring(0, indexOfQuestionMark);
  }

  if ((taskListPage != null) && (taskListPage != NaN) && (taskListPage > 0)) {
    current_url = current_url + `?TaskListPage=${taskListPage}`;
  }

  if ((projectFilter != null) && (projectFilter.length > 0)) {
    current_url = current_url + `&fpname=${projectFilter}`;
  }

  if ((taskNameFilter != null) && (taskNameFilter.length > 0)) {
    current_url = current_url + `&ftname=${taskNameFilter}`;
  }

  if ((include_NotSched != null) && (include_NotSched != NaN) && (include_NotSched > 0)) {
    current_url = current_url + `&fincns=${include_NotSched}`;
  }

  if ((exclude_Waiting != null) && (exclude_Waiting != NaN) && (exclude_Waiting > 0)) {
    current_url = current_url + `&fexw=${exclude_Waiting}`;
  }

  if ((include_Complete != null) && (include_Complete != NaN) && (include_Complete > 0)) {
    current_url = current_url + `&finccom=${include_Complete}`;
  }

  if ((assigneeIDFilter != null) && (assigneeIDFilter != NaN) && (assigneeIDFilter > 0)) {
    current_url = current_url + `&faid=${assigneeIDFilter}`;
  }

  if ((statusIDFilter != null) && (statusIDFilter != NaN) && (statusIDFilter > 0)) {
    current_url = current_url + `&fsid=${statusIDFilter}`;
  }

  if ((taskTypeIDFilter != null) && (taskTypeIDFilter != NaN) && (taskTypeIDFilter > 0)) {
    current_url = current_url + `&fttid=${taskTypeIDFilter}`;
  }

  if ((departmentIDFilter != null) && (departmentIDFilter != NaN) && (departmentIDFilter > 0)) {
    current_url = current_url + `&fdid=${departmentIDFilter}`;
  }

  if ((initiatorID != null) && (initiatorID != NaN) && (initiatorID > 0)) {
    current_url = current_url + `&finitid=${initiatorID}`;
  }

  window.location = current_url;
}


function removeAppendedFields() {
  $('#tasklist-pagination').remove();
  $('.table-button').remove();
  $('.project-link').remove();
  $('.task-link').remove();
  $('.mandate-chk').remove();

}


function resetPageNumber() {
  $('.tasklist-table').hide();
  removeAppendedFields();
  $('.tasklist-page input').val(1).change();
}


function showProjectDetails(ticket_id) {
  var widowHeight = $(window).height();
  widowHeight = widowHeight - 50;
  popUpIframe(`http://rmslf/Forms/MPM-EditProgrammingTicket?tid=${ticket_id}`, 'Ticket Details', widowHeight, 1500, false, ticket_id);
}


function showTaskDetails(task_id) {
  var widowHeight = $(window).height();
  widowHeight = widowHeight - 50;
  popUpIframe(`http://rmslf/Forms/MPM-EditProgrammingTask?tid=${task_id}`, 'Task Details', widowHeight, 1100, false, task_id);
}


function sortTable(newSortOrdinal, selector) {

  removeAppendedFields();
  $('.sort-icon').remove();

  var currentSortOrdinal = Number($('.sort-field-ordinal input').val());
  var sortDirection = Number($('.sort-direction input').val());

  if (newSortOrdinal == currentSortOrdinal) {
    if (sortDirection == 0) {
      sortDirection = 1
      $('.sort-direction input').val(1).change();
    }
    else {
      sortDirection = 0;
      $('.sort-direction input').val(0).change();
    }
  }
  else {
    $('.sort-field-ordinal input').val(newSortOrdinal);
    $('.sort-direction input').val(0).change();
    sortDirection = 0;
  }

  if (sortDirection == 0) {
    $(`${selector} .cf-col-label`).append('<span class="ui-icon ui-icon-triangle-1-n sort-icon"></span>');
  }
  else {
    $(`${selector} .cf-col-label`).append('<span class="ui-icon ui-icon-triangle-1-s sort-icon"></span>');
  }
}


function wireUpSortFields() {

  $('#q236 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-n sort-icon"></span>');

  $('#q236').on('click', function () { sortTable(0, '#q236'); });
  $('#q88').on('click', function () { sortTable(1, '#q88'); });
  $('#q83').on('click', function () { sortTable(2, '#q83'); });
  $('#q84').on('click', function () { sortTable(3, '#q84'); });
  $('#q234').on('click', function () { sortTable(4, '#q234'); });
  $('#q87').on('click', function () { sortTable(5, '#q87'); });
  $('#q235').on('click', function () { sortTable(6, '#q235'); });
  $('#q102').on('click', function () { sortTable(7, '#q102'); });
  $('#q221').on('click', function () { sortTable(8, '#q221'); });
  $('#q241').on('click', function () { sortTable(9, '#q241'); });
}