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
var projectMap = new Map();
var projectNameMap = new Map();
var initiatorMap = new Map();
var initiatorNameMap = new Map();
var qualityEngineerMap = new Map();
var qualityEngineerNameMap = new Map();

//-------------------DOCUMENT FUNCTIONS-------------------------

$(document).ready(function () {
  window.name = "TaskMaintenance";
  $('.Submit').hide();
  $(document).prop('title', 'Task Maintenance');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simplePagination.js/1.6/simplePagination.min.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
  var bootstrapButton = $.fn.button.noConflict(); // return $.fn.button to previously assigned value
  $.fn.bootstrapBtn = bootstrapButton;
  $('.network-user-name input').val($('.lf-username input').val().toUpperCase().substr($('.lf-username input').val().lastIndexOf('\\') + 1)).change();
 
  window.onmessage = function (event) {
    //This is the callback from the IFrame.
    //If the event data says "Close Dialog", it destroys the dialog, (so that the close function won't fire).
    //If it says "CloseDialogWithRefresh", it destroys the dialog and refreshes the form.
    //I don't refresh if you add a note, for example. But if you do anything that will show up on the page, (adding time, cloning a task, etc)
    //then I do a refresh.
    if (event.data == "CloseDialog") {
      console.log('Task Maintenance closing dialog');
      $("#popupIFrame").dialog("destroy");
      $("#popupIFrame").remove();
    }
    if (event.data == "CloseDialogWithRefresh") {
      console.log('Task Maintenance closing dialog');
      $("#popupIFrame").dialog("destroy");
      $("#popupIFrame").remove();
      refreshPage();
    }
  };
  

  $(document).on('lookupcomplete', function (e) {
    
    
    loadAssigneeMap();
    loadStatusMap();
    loadDepartmentMap();
    loadTaskTypeMap();
    loadProjectMap();
    loadInitiatorMap();
    loadQualityEngineerMap();
    if ($('.tasklist-page input').val() == '999') {
      $('.tasklist-page input').val(1).change();
    }
    $('.tasklist-datestarted-col input').each((i, dateField) => $(dateField).val($(dateField).val().split(" ")[0]));
    generateTaskListColumnFields();
    reApplyFilterValues();
    appendPagination();
    $('.tasklist-table').show();


  });

  $(document).on("onloadlookupfinished", function (e) {
    
    $('#q0').append("<div class='hidden-text' id='popUpDiv'></div>");
    $(".tasklist-filter-checks input").on("change", function () { filterTaskListTable(); });
    

    
    generateFilterRow();
    
    $('.tasklist-table').show();
    if (checkPermissions() == false) {
      lockRows();
    }

  });

});


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


function loadProjectMap() {
  if (projectMap.keys.length == 0) {
    var project_rows = $('.project-lookup-table table tbody tr');
    if (project_rows.length == 0) {
      return;
    }
    project_rows.each(function (index) {
      projectID = Number($(this).find('.project-lookup-table-id input').val());
      projectName = $(this).find('.project-lookup-table-name input').val();
      projectMap.set(projectID, projectName);
      projectNameMap.set(projectName, projectID);
    });
  }
}


function loadQualityEngineerMap() {
  if (qualityEngineerMap.keys.length == 0) {
    var qe_rows = $('.qe-lookup-table table tbody tr');
    if (qe_rows.length == 0) {
      return;
    }
    qe_rows.each(function (index) {
      qeID = Number($(this).find('.qe-lookup-table-id input').val());
      qeName = $(this).find('.qe-lookup-table-name input').val();
      qualityEngineerMap.set(qeID, qeName);
      qualityEngineerNameMap.set(qeName, qeID);
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

//-------------------TASK LIST FUNCTIONS----------------------

function appendPagination() {
  
  var current_page = Number($('.tasklist-page input').val());
  if (current_page == 999) { return; }

  var row_count = getTaskListRowCount();
  
  if (row_count > 0) {
    $('#tasklist-pagination').remove();
    if ((current_page == 1) && (row_count < 25)) {
      $('.tasklist-table table').parent().append("<div id='tasklist-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled'>‹</a></li><li><a class='page-link next isDisabled'>›</a></li></ul></div>");
      return;
    }
    if ((current_page == 1) && (row_count == 25)) {
      $('.tasklist-table table').parent().append("<div id='tasklist-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled'>‹</a></li><li><a class='page-link next' onclick='callNextPage();' href='javascript:void(0);'>›</a></li></ul></div>")
      return;
    }
    if ((current_page > 1) && (row_count == 25)) {
      $('.tasklist-table table').parent().append("<div id='tasklist-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev' onclick='callPrevPage();' href='javascript:void(0);''>‹</a></li><li><a class='page-link next' onclick='callNextPage();' href='javascript:void(0);'>›</a></li></ul></div>")
      return;
    }
    if ((current_page > 1) && (row_count < 25)) {
      $('.tasklist-table table').parent().append("<div id='tasklist-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev' onclick='callPrevPage();' href='javascript:void(0);''>‹</a></li><li><a class='page-link next isDisabled'>›</a></li></ul></div>")
      return;
    }
  }
}


function checkPermissions() {

  var employee_number = $(".user-id input").val();
  var is_active_user = $(".user-isactive input").val();
  var user_type_id = $(".user-type-id input").val();
  var return_val = true;

  if (is_active_user == 0) {
    return_val = false;
  }

  if (employee_number == '') {
    return_val = false;
  }

  if (user_type_id != 1) {
    return_val = false;
  }

  return return_val
  
}


function colorCodeRow(task_id) {
  var currentDate = new Date();
  var aMonthAgoNumber = new Date().setDate(currentDate.getDate() - 30);
  var aMonthAgo = new Date(aMonthAgoNumber).toISOString();

  var row = getRowByTaskID(task_id);
  var status_id = $(row).find('.tasklist-status-id-col input[type="text"]').val();
  var dueDateString = $(row).find('.tasklist-date-col input[type="text"]').val();
  var dueDate = moment(dueDateString, "M/D/YYYY").toDate();
  let dateStartedString = $(row).find('.tasklist-datestarted-col input[type="text"]').val();

  $(row).removeClass('colorOverDue');
  $(row).removeClass('colorStarted');
  $(row).removeClass('colorStartedButOld');
  $(row).removeClass('colorWaiting');
  if (dueDate <= currentDate) {
    $(row).addClass('colorOverDue');
    return;
  }
  if (status_id == status_Started) {
    if ((dateStartedString != null) && (dateStartedString.length > 0)) {
      let dateStarted = new Date(dateStartedString).toISOString();
      if (dateStarted < aMonthAgo) {
        $(row).addClass('colorStartedButOld');
        return;
      }
      else {
        $(row).addClass('colorStarted');
        return;
      }
    }
    else {
      $(row).addClass('colorStarted');
    }
  }

  if ((status_id == status_Waiting)) {
    $(row).addClass('colorWaiting');
  }


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


function executeIFrameUpdate(task_id, fieldToUpdate, fieldValue) {
  
  if (typeof task_id === 'undefined') {
    return;
  }
  if (typeof fieldToUpdate === 'undefined') {
    return;
  }
  if (typeof fieldValue === 'undefined') {
    return;
  }
  
  console.log('executeIFrameUpdate');
  console.log(`task_id: ${task_id}`);
  console.log(`fieldToUpdate: ${fieldToUpdate}`);
  console.log(`fieldValue: ${fieldValue}`);
  
  var execute_url = `http://rmslf/Forms/MPM-UpdateTask?tid=${task_id}&ftu=${fieldToUpdate}&fv=${fieldValue}`;

  $("#popupIFrame").remove();
  $("#popUpDiv").html(`<iframe id='popupIFrame' name='myname' src='${execute_url}'/>`);
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

  if ((ticketNumberFilterValue != null) && (ticketNumberFilterValue.length > 0))  {
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
    let statusID= taskStatusNameMap.get(statusFilterVal);
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

  $('.tasklist-table').hide();
  removeAppendedFields();
  $('.tasklist-page input').val(1).change();

}


function generateFilterRow() {
  
  if ($('#filterRow').length == 0) {

    var filter_row = "<TR id='filterRow'><TH/><TH/><TH/><TH><select id='cboFilter_TicketNumber'/></TH><TH><input type='text' id='txtFilter_ProjectName'></TH><TH><input type='text' id='txtFilter_TaskName'></TH><TH><select id='cboFilter_Status'/></TH><TH><select id='cboFilter_TaskType'/></TH><TH><select id='cboFilter_Assignee'/></TH><TH/><TH/><TH/><TH/><TH/><TH><TH/><TH><select id='cboFilter_Department'/></TH><TH/><TH/><select id='cboFilter_QE'/></TH><TH><select id='cboFilter_Initiator'/></TH><TH/></TR>"
    $('.tasklist-table table thead').append(filter_row);
    $("#cboFilter_TicketNumber").on("change", function () {filterTaskListTable(); });
    $("#txtFilter_ProjectName").on("change", function () {filterTaskListTable(); });
    $("#txtFilter_TaskName").on("change", function () { filterTaskListTable(); });
    $("#cboFilter_Status").on("change", function () { filterTaskListTable(); });
    $("#cboFilter_TaskType").on("change", function () { filterTaskListTable(); });
    $("#cboFilter_Assignee").on("change", function () { filterTaskListTable(); });
    $("#cboFilter_Department").on("change", function () { filterTaskListTable(); });
    $("#cboFilter_QE").on("change", function () { filterTaskListTable(); });
    $("#cboFilter_Initiator").on("change", function () { filterTaskListTable(); });

    $("#cboFilter_TicketNumber").dblclick(function () { $("#cboFilter_TicketNumber").val(null).change(); });
    $("#txtFilter_ProjectName").dblclick(function () { $("#txtFilter_ProjectName").val(null).change(); });
    $("#txtFilter_TaskName").dblclick(function () { $("#txtFilter_TaskName").val(null).change(); });
    $("#cboFilter_Status").dblclick(function () { $("#cboFilter_Status").val(0).change(); });
    $("#cboFilter_TaskType").dblclick(function () { $("#cboFilter_TaskType").val(0).change(); });
    $("#cboFilter_Assignee").dblclick(function () { $("#cboFilter_Assignee").val(0).change(); });
    $("#cboFilter_Department").dblclick(function () { $("#cboFilter_Department").val(0).change(); });
    $("#cboFilter_QE").dblclick(function () { $("#cboFilter_QE").val(0).change(); });
    $("#cboFilter_Initiator").dblclick(function () { $("#cboFilter_Initiator").val(0).change(); });
  }

  if ((($('.ftname input').val() != null) && ($('.ftname input').val().length > 0)) && (($('#txtFilter_TaskName').val() == null) || ($('#txtFilter_TaskName').val() == ''))) {
    $('#txtFilter_TaskName').val($('.ftname input').val());
  }

  if ((($('.fpname input').val() != null) && ($('.fpname input').val().length > 0)) && (($('#txtFilter_ProjectName').val() == null) || ($('#txtFilter_ProjectName').val() == ''))) {
    $('#txtFilter_TaskName').val($('.fpname input').val());
  }

  if (($(".qe-lookup-combo select option").length > 0) && ($("#cboFilter_QE option" == 0))) {
    $("#cboFilter_QE").html($(".qe-lookup-combo select").html());
  }

  if (($(".initiator-lookup-combo select option").length > 0) && ($("#cboFilter_Initiator option" == 0))) {
    $("#cboFilter_Initiator").html($(".initiator-lookup-combo select").html());

    
  }

  if (($('.ticket-number-lookup-combo select option').length > 0) && ($("#cboFilter_TicketNumber option" == 0))) {
    var selectList = $('.ticket-number-lookup-combo select option');

    selectList.sort(function (a, b) {
      a = a.value;
      b = b.value;

      return a - b;
    });
    $("#cboFilter_TicketNumber").html(selectList);
    $("#cboFilter_TicketNumber").val(null);
  }
  
  if (($(".status-lookup-combo select option").length > 0) && ($("#cboFilter_Status option" == 0))) {
    $("#cboFilter_Status").html($(".status-lookup-combo select").html());
  }
  if (($(".tasktype-lookup-combo select option").length > 0) && ($("#cboFilter_TaskType option" == 0))) {
    $("#cboFilter_TaskType").html($(".tasktype-lookup-combo select").html());
  }
  if (($(".assignee-lookup-combo select option").length > 0) && ($("#cboFilter_Assignee option" == 0))) {
    $("#cboFilter_Assignee").html($(".assignee-lookup-combo select").html());
  }
  if (($(".department-lookup-combo select option").length > 0) && ($("#cboFilter_Department option" == 0))) {
    $("#cboFilter_Department").html($(".department-lookup-combo select").html());
  }  
}


function generateTaskListColumnFields() {
  removeAppendedFields();
  if ($('.tasklist-table table tbody tr').length > 0) {
    
    generateTableButtons(".task-list-clone-col", "ui-icon-newwin", "Clone Task", "callCloneTask");

    generateTableButtons(".tasklist-note-col", "ui-icon-document", "Add Note", "callAddNote");

    generateTableButtons(".tasklist-time-col", "ui-icon-clock", "Add Time", "callAddTime");

    generateTableCheckBox(".tasklist-mandate-col", "mandate-chk");
    generateProjectColumn();
    generateTaskColumn();
    setStatusColumnValues();
    setAssigneeColumnValues();
    wireUpChangeEvents('.tasklist-duedate-col input[type="text"]', updateDueDate);
    wireUpChangeEvents('.tasklist-schedduedate-col input[type="text"]', updateSchedDueDate);
    lockCompletedRows();
    colorCodeRows();
  }
}


function generateProjectColumn() {
  var project_names = $('.tasklist-project-name-col input[type="text"]');
  var project_ids = $('.tasklist-project-id-col input[type="text"]');
  project_names.each(function (index) {
    let project_id = $(project_ids[index]).val();
    let project_name = $(this).val();
    let project_href = `http://rmslf/Forms/MPMProjectMaintenance?pid=${project_id}`;
    let project_link = $("<a>", { text: project_name.substr(0, 30), class: 'project-link', href: project_href, "target": "_blank" });
    $(this).parent().append(project_link);
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
    let task_link = $("<a>", { text: task_name.substr(0, 30), class: 'task-link', href: `javascript:void(0);`, onclick: `callShowDetails(${task_id})` });
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


function lockCompletedRows() {
  var status_ids = $('.tasklist-status-id-col input[type="text"]');
  var tasklist_rows = $(".tasklist-table table tbody tr");
  

  status_ids.each(function (index) {
    let status_id = $(status_ids[index]).val();
    let tasklist_row = tasklist_rows[index];
    
    if ((status_id == status_Completed) || (status_id == status_Cancelled)) {
      $(tasklist_row).addClass('colorClosedCancelled');
      $(tasklist_row).find(".time-button").prop("disabled", true);
      $(tasklist_row).find('.tasklist-date-col input[type="text"]').prop("disabled", true);
      $(tasklist_row).find('.tasklist-date-col input[type="text"]').prop("disabled", true);
      $(tasklist_row).find('.tasklist-status-cbo-col select').prop("disabled", true);
      $(tasklist_row).find('.tasklist-assignee-cbo-col select').prop("disabled", true);

    }
    else {
      $(tasklist_row).removeClass('colorClosedCancelled');
      $(tasklist_row).find(".time-button").prop("disabled", false);
      $(tasklist_row).find('.tasklist-date-col input[type="text"]').prop("disabled", false);
      $(tasklist_row).find('.tasklist-date-col input[type="text"]').prop("disabled", false);
      $(tasklist_row).find('.tasklist-status-cbo-col select').prop("disabled", false);
      $(tasklist_row).find('.tasklist-assignee-cbo-col select').prop("disabled", false);
    }
  });
}


function lockRows() {
  var tasklist_rows = $(".tasklist-table table tbody tr");
  var user_type_id = $(".user-type-id input").val();
  var userDepartmentID = $(".user-department-id input").val();

  tasklist_rows.each(function (index) {

    let departmentID = $(this).find('.tasklist-dept-id-col input[type="text"]').val();
    
    $(this).find(".tasklist-time-col").find(".table-button").addClass("ui-state-disabled");
    if ((user_type_id == 2) || (user_type_id == 4) || (user_type_id == 5)) {
      $(this).find(".task-list-clone-col").find(".table-button").addClass("ui-state-disabled");
    }
    if (user_type_id == 3) {
      if (departmentID != userDepartmentID) {
        $(this).find(".task-list-clone-col").find(".table-button").addClass("ui-state-disabled");
      }
    }

    $(this).find('.tasklist-date-col input[type="text"]').prop("disabled", true);
    $(this).find('.tasklist-status-cbo-col select').prop("disabled", true);
    $(this).find('.tasklist-assignee-cbo-col select').prop("disabled", true);
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
    close: function (event, ui) {
      if (dorefresh) {
        resetAssignee(task_id);
        resetTaskStatus(task_id);
      }
    }
  });

  
  $("#popupIFrame").dialog("open");
  $('#popupIFrame').attr('style', `width: 100%; height: ${height}px;`);
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
  var projectIDFilterValue = Number($('.fpid input').val());

  var taskTypeFilterVal = Number($('.fttid input').val());
  var statusFilterVal = Number($('.fsid input').val());
  var assigneeFilterVal = Number($('.faid input').val());
  var departmentFilterVal = Number($('.fdid input').val());
  var qeFilterVal = Number($('.fqeid input').val());
  var initiatorFilterVal = $('.finitid input').val();
  
  if (qeFilterVal != 0) {
    let qeName = qualityEngineerMap.get(qeFilterVal);
    
    $('#cboFilter_QE').val(qeName);
  }


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

  if (projectIDFilterValue != 0) {
    $('#cboFilter_TicketNumber').val(projectIDFilterValue);
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
  var projectIDFilter = Number($('.fpid input').val());
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

  if ((projectIDFilter != null) && (projectIDFilter != NaN) && (projectIDFilter > 0)) {
    current_url = current_url + `&fpid=${projectIDFilter}`;
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
  $('.clone-button').remove();
  $('.project-link').remove();
  $('.task-link').remove();
  $('.note-button').remove();
  $('.time-button').remove();
  $('.mandate-chk').remove();
  $('.tasklist-assignee-cbo-col select').off();
  $('.tasklist-duedate-col input[type="text"]').off();
  $('.tasklist-status-cbo-col select').off();
  $('.tasklist-schedduedate-col input[type="text"]').off();
}


function resetPageNumber() {
  $('.tasklist-table').hide();
  removeAppendedFields();
  $('.tasklist-page input').val(1).change();
}


function resetAssignee(task_id) {
  var original_assignee_name = getColumnValueByTaskID(task_id, '.tasklist-assignee-name-col input[type="text"]');
  setColumnValueByTaskID(task_id, '.tasklist-assignee-cbo-col select', original_assignee_name);
}


function resetTaskStatus(task_id) {
  var original_status_name = getColumnValueByTaskID(task_id, '.tasklist-status-name-col input[type="text"]');
  setColumnValueByTaskID(task_id, '.tasklist-status-cbo-col select', original_status_name);
}


function setAssigneeColumnValues() {

  var assignee_names = $('.tasklist-assignee-name-col input[type="text"]');

  if (assignee_names.length == 0) {
    return;
  }

  var assignee_cbos = $('.tasklist-assignee-cbo-col select');
  $(assignee_cbos).off();
  var assignee_ids = $('.tasklist-assignee-id-col input[type="text"]');
  var status_ids = $('.tasklist-status-id-col input[type="text"]');
  var task_ids = $('.tasklist-task-id-col input[type="text"]');


  assignee_names.each(function (index) {
    let assignee_name = $(this).val();
    let status_id = $(status_ids[index]).val();
    let task_id = $(task_ids[index]).val();
    let assignee_id = $(assignee_ids[index]).val();
    let assignee_cbo = assignee_cbos[index];
    
    $(assignee_cbo).val(assignee_name);
    $(assignee_cbo).on("change", function () { assigneeChanged(task_id) });

  });
}


function setStatusColumnValues() {
  
  $('.tasklist-status-cbo-col select option').filter(function () {
    return this.hasAttribute('value') == false;
  }).remove();

  var status_names = $('.tasklist-status-name-col input[type="text"]');
  if (status_names.length == 0) {
    return;
  }
  
  var status_cbos = $('.tasklist-status-cbo-col select');
  $(status_cbos).off();
  var task_ids = $('.tasklist-task-id-col input[type="text"]');

  status_names.each(function (index) {
    let task_id = $(task_ids[index]).val();
    let status_name = $(this).val();
    let status_cbo = $(status_cbos[index]);
    
    $(status_cbo).val(status_name);
    $(status_cbo).on("change", function () { statusChanged(task_id) });

  });
}


function setColumnValueByTaskID(task_id, column_name, value) {
  var tasklist_rows = $(".tasklist-table table tbody tr");
  var task_ids = $('.tasklist-task-id-col input[type="text"]');

  task_ids.each(function (index) {
    let row_task_id = $(this).val();
    if (row_task_id == task_id) {
      let tasklist_row = tasklist_rows[index];

      $(tasklist_row).find(column_name).val(value);
      return;
    }
  });
}


function wireUpChangeEvents(column_name, function_name) {

  var task_ids = $('.tasklist-task-id-col input[type="text"]');
  if (task_ids.length == 0) {
    return;
  }

  var columns = $(column_name);
  $(columns).off();
  task_ids.each(function (index) {
    let row_task_id = $(this).val();
    let column = columns[index];
    $(column).on("change", function () { function_name(row_task_id) });
  });
}


//-------------------TASK LIST CALLED FUNCTIONS-------------------

function assigneeChanged(task_id) {
  
  original_assignee_name = getColumnValueByTaskID(task_id, '.tasklist-assignee-name-col input');
  if (typeof original_assignee_name === 'undefined') {
    return;
  }

  new_assignee_name = getColumnValueByTaskID(task_id, '.tasklist-assignee-cbo-col select');
  if (typeof new_assignee_name === 'undefined') {
    confirm("no new assignee name");
    return;
  }

  if (original_assignee_name == new_assignee_name) {
    return;
  }

  if (((new_assignee_name == null) || (new_assignee_name.length == 0)) && ((original_assignee_name != null) && (original_assignee_name.length > 0))){
    resetAssignee(task_id);
    return;
  }

  new_assignee_id = assigneeNameMap.get(new_assignee_name);

  if (original_assignee_name != new_assignee_name) {
    
    $.confirm({
      title: 'Are you sure?',
      content: 'Are you sure you wish to reassign this task?',

      buttons: {
        ok: {
          text: "OK",
          keys: ['enter'],
          action: function () {
            var has_permissions = checkPermissions();
            if (has_permissions) {
              executeIFrameUpdate(task_id, fieldToUpdate_Assignee, new_assignee_id);
              setColumnValueByTaskID(task_id, '.tasklist-assignee-name-col input[type="text"]', new_assignee_name);
              setColumnValueByTaskID(task_id, '.tasklist-assignee-id-col input[type="text"]', new_assignee_id);
            }
            else {
              $.alert({ title: 'Nope!', content: 'Sorry, you do not have permissions to do this.' });
              resetAssignee(task_id);
            }
          }
        },
        cancel: function () {
          resetAssignee(task_id);
        }
      }
    });
  }
}


function callAddNote(task_id) {
  var task_name = getColumnValueByTaskID(task_id, '.tasklist-task-name-col input[type="text"]');
  popUpIframe(`http://rmslf/Forms/MPMAddNote?TaskID=${task_id}&nt=1`, `Add Note for task '${task_name}'`, 400, 650, false, task_id);
}


function callAddTime(task_id) {
  if (checkPermissions() == true) { 
    var task_name = getColumnValueByTaskID(task_id, '.tasklist-task-name-col input[type="text"]');
    popUpIframe(`http://rmslf/Forms/MPMAddTaskTime?tid=${task_id}`, `Add Time to task '${task_name}'`, 300, 800, false, task_id);
  }
}


function callCancelTask(task_id) {
  if (checkPermissions() == true) {
    var task_name = getColumnValueByTaskID(task_id, '.tasklist-task-name-col input[type="text"]');
    popUpIframe(`http://rmslf/Forms/MPMAddNote?TaskID=${task_id}&nt=5`, `Set task '${task_name}' to 'Cancelled'`, 400, 650, false, task_id);
  }
}


function callCompleteTask(task_id) {
  if (checkPermissions() == true) {
    var task_name = getColumnValueByTaskID(task_id, '.tasklist-task-name-col input[type="text"]');
    popUpIframe(`http://rmslf/Forms/MPMAddNote?TaskID=${task_id}&nt=4`, `Set task '${task_name}' to 'Complete'`, 400, 650, false, task_id);
  }
}


function callCloneTask(task_id) {
  var user_type_id = $(".user-type-id input").val();
  var userDepartmentID = $(".user-department-id input").val();
  var departmentID = getColumnValueByTaskID(task_id, '.tasklist-dept-id-col input[type="text"]');

  if (user_type_id == 2 || user_type_id == 4 || user_type_id == 5) {
    $.alert({ title: 'Nope!', content: 'Sorry, you do not have permissions to do this.' });
    return;
  }

  if (user_type_id == 3) {
    if (departmentID != userDepartmentID) {
      $.alert({ title: 'Nope!', content: 'Sorry, you do not have permissions to do this.' });
      return;
    }
  }

  var task_name = getColumnValueByTaskID(task_id, '.tasklist-task-name-col input[type="text"]');
  popUpIframe(`http://rmslf/Forms/MPMCloneTask?tid=${task_id}`, `Clone task '${task_name}'`, 300, 750, false, task_id);
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


function callShowDetails(task_id) {
  popUpIframe(`http://rmslf/Forms/MPMAddEditTask?tid=${task_id}`, 'Task Details', 900, 1100, false, task_id);
}


function callSetTaskToWaiting(task_id) {
  if (checkPermissions() == true) {
    var task_name = getColumnValueByTaskID(task_id, '.tasklist-task-name-col input[type="text"]');
    popUpIframe(`http://rmslf/Forms/MPMAddNote?TaskID=${task_id}&nt=6`, `Set task '${task_name}' to 'Waiting'`, 500, 750, false, task_id);
  }
}


function statusChanged(task_id) {


  var new_status_name = getColumnValueByTaskID(task_id, '.tasklist-status-cbo-col select');
  if (typeof new_status_name === 'undefined') {
    return;
  }

  var old_status_name = getColumnValueByTaskID(task_id, '.tasklist-status-name-col input[type="text"]');
  if (typeof old_status_name === 'undefined') {
    return;
  }

  if (new_status_name == old_status_name) {
    return;
  }

  var new_status_id = taskStatusNameMap.get(new_status_name);
  var sum_of_hours = getColumnValueByTaskID(task_id, '.tasklist-tothours-col input[type="text"]');

  if ((new_status_id == status_NotStarted) && (sum_of_hours > 0)) {
    $.alert({ title: 'Nope!', content: 'You cannot set a task to Not Started if hours have been logged.' });
    resetTaskStatus(task_id)
    return;
  }

  if (new_status_id == status_Completed) {
    callCompleteTask(task_id);
    return;
  }

  if (new_status_id == status_Cancelled) {
    callCancelTask(task_id);
    return;
  }

  if ((new_status_id == status_Waiting)) {
    callSetTaskToWaiting(task_id);
    return;
  }

  if ((new_status_id == status_NotSched) || (new_status_id == status_NotStarted) || (new_status_id == status_Started)){
    executeIFrameUpdate(task_id, fieldToUpdate_Status, new_status_id);
    setColumnValueByTaskID(task_id, '.tasklist-status-name-col input[type="text"]', new_status_name);
    setColumnValueByTaskID(task_id, '.tasklist-status-id-col input[type="text"]', new_status_id);
    colorCodeRow(task_id);
    return;
  }
}


function updateDueDate(task_id) {

  var new_due_date = getColumnValueByTaskID(task_id, '.tasklist-date-col input[type="text"]');
  executeIFrameUpdate(task_id, fieldToUpdate_DueDate, new_due_date);
}


function updateSchedDueDate(task_id) {
  var new_due_date = getColumnValueByTaskID(task_id, '.tasklist-date-col input[type="text"]');
  executeIFrameUpdate(task_id, fieldToUpdate_SchedDueDate, new_due_date);
}
