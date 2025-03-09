const status_NotStarted = 1;
const status_Started = 2;
const status_Waiting = 3;
const status_Completed = 4;
const status_Cancelled = 5;
const status_NotSched = 7;


var assigneeMap = new Map();
var assigneeNameMap = new Map();
var taskTypeMap = new Map();
var taskTypeByNameMap = new Map();
var taskStatusMap = new Map();
var taskStatusNameMap = new Map();
var mfgEngineerMap = new Map();
var mfgEngineerNameMap = new Map();
var qualEngineerMap = new Map();
var qualEngineerNameMap = new Map();

$(document).ready(function () {
  window.name = "AddEditTask";
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
  var bootstrapButton = $.fn.button.noConflict();
  $.fn.bootstrapBtn = bootstrapButton;
  $('.Submit').addClass('ui-button ui-corner-all ui-widget');
  $('.Submit').click(function (e) { submitForm(e); });
  $('.task-name input').change(function () { $('.task-name input').val($('.task-name input').val().toUpperCase()); });
  $('.op-number input').change(function () { $('.op-number input').val($('.op-number input').val().toUpperCase()); });
  $('.cust-rev input').change(function () { $('.cust-rev input').val($('.cust-rev input').val().toUpperCase()); });
  $('.manf-rev input').change(function () { $('.manf-rev input').val($('.manf-rev input').val().toUpperCase()); });
  $('.job-number input').change(function () { $('.job-number input').val($('.job-number input').val().toUpperCase()); });
  $('.drawing-number input').change(function () { $('.drawing-number input').val($('.drawing-number input').val().toUpperCase()); });
  var lfUserName = $('.lf-user-name input').val();
  if (lfUserName != "") {
    let networkUserName = lfUserName.toUpperCase();
    networkUserName = networkUserName.substr(networkUserName.lastIndexOf('\\') + 1);
    $('.network-user-name input').val(networkUserName).change();
  }
  
  if ($('.closeme input').val() == 1) {
    window.parent.postMessage('CloseDialogWithRefresh', '*');
  }

  window.onmessage = function (event) {
    if (event.data == "CloseDialog") {
      console.log('Add Edit task closing dialog');
      $("#popupIFrame").dialog("destroy");
      $("#popupIFrame").remove();
    }
    if (event.data == "CloseDialogWithRefresh") {
      console.log('Add Edit task CloseDialog closing dialog with refresh');
      $("#popupIFrame").dialog("destroy");
      $("#popupIFrame").remove();
      $("#form1").submit();
    }
  };

  $(document).on('lookupcomplete', function (e) {
    loadAssigneeMap();
    loadStatusMap();
    loadTaskTypeMap();

  });

  $(document).on("onloadlookupfinished", function (e) {
    let task_name = $('.task-name input').val();
    $('.closeme input').val(1);
    $('#q0').append("<div class='hidden-text' id='popUpDiv'></div>");
    $('.btn-wrapper').append("<div id='add-note' class='ui-button ui-corner-all ui-widget' onclick='callAddNote()'><span class='ui-button-icon ui-icon ui-icon-document'></span>Add Note</div>");
    $('.btn-wrapper').append("<div id='view-notes' class='ui-button ui-corner-all ui-widget' onclick='callViewNotes()'><span class='ui-button-icon ui-icon ui-icon-newwin'></span>View Notes</div>");
    $('.quality-engineer-name input').parent().append("<div id='pester-qe' class='table-button ui-button' onclick='callPesterQE()'><span title='Pester QE' class='ui-button-icon ui-icon ui-icon-mail-closed'/></div>");
    $('.assigned-to select').parent().append(`<div id='pester-assignee' class='table-button ui-button' onclick='callPesterAssignee()'><span title='Pester Assignee' class='ui-button-icon ui-icon ui-icon-mail-closed'/></div>`);

    if (isNewTask()) {
      setFormFieldsForNewTask();
      setFormFieldEnableStateForNewTask();
    }
    else {
      setFormFieldsForExistingTask();
      setFormFieldEnableStateForExistingTask();
    }
  });
});


function callAddNote() {
  var task_id = $('.tid input').val();
  var task_name = $('.task-name input').val();
  popupIFrame(`http://rmslf/Forms/MPMAddNote?TaskID=${task_id}&nt=1`, `Add Note for task '${task_name}'`, 400, 650, false);
}


function callCancelTask() {
  var task_id = $('.tid input').val();
  var task_name = $('.task-name input').val();
  popupIFrame(`http://rmslf/Forms/MPMAddNote?TaskID=${task_id}&nt=5`, `Set task '${task_name}' to 'Cancelled'`, 350, 650, true);
}


function callCompleteTask() {
  var task_id = $('.tid input').val();
  var task_name = $('.task-name input').val();
  popupIFrame(`http://rmslf/Forms/MPMAddNote?TaskID=${task_id}&nt=4`, `Set task '${task_name}' to 'Complete'`, 450, 700, true);
}


function callPesterAssignee() {
  var task_id = $('.tid input').val();
  var task_name = $('.task-name input').val();
  var assignee_name = $('.assigned-to select').val();
  popupIFrame(`http://rmslf/Forms/MPMAddNote?TaskID=${task_id}&nt=3`, `Pester '${assignee_name}' regarding task '${task_name}'`, 400, 650, false);
}


function callPesterQE() {
  var task_id = $('.tid input').val();
  var task_name = $('.task-name input').val();
  var qe_name = $('.quality-engineer-name input').val();
  popupIFrame(`http://rmslf/Forms/MPMAddNote?TaskID=${task_id}&nt=2`, `Pester '${qe_name}' regarding task '${task_name}'`, 400, 650, false);
}


function callSetTaskToWaiting() {
  var task_id = $('.tid input').val();
  var task_name = $('.task-name input').val();
  popupIFrame(`http://rmslf/Forms/MPMAddNote?TaskID=${task_id}&nt=6`, `Set task '${task_name}' to 'Waiting'`, 450, 650, true);
}


function callViewNotes() {
  var noteHtml = $(".note-table").find('.cf-table_parent').clone();
  $(noteHtml).dialog({
    title: "Notes",
    height: 800,
    width: 1000,
    autoOpen: true,
    resizable: true,
    modal: true,
    close: function (event, ui) {

    }
  });
}


function changeIgnore(scheduleID) {
  if (scheduleID == 0) {
    return;
  }

  var table_rows = $('.schedule-details-table table tbody tr');

  table_rows.each(function (index) {
    let table_row = $(this);
    let scheduleIDField = $(table_row).find('.schedule-details-schedule-id input[type=text]'); 
    let ignoreField = $(table_row).find('.schedule-details-ignore input[type=text]');
    let chkField = $(table_row).find('.schedule-details-ignore-chk');
    let scheduleIDFieldValue = $(scheduleIDField).val();
    if (scheduleIDFieldValue == scheduleID) {
      try {
        if ($(chkField).is(":checked")) {
          $(ignoreField).val(1);
        }
        else {
          $(ignoreField).val(0);
        }
      }
      catch (e) {
        console.log(null);
      }
    }
    
  });
}


function changeManualDate() {
  var manual_date_check = $('#manual-date-chk');
  if ($(manual_date_check).is(":checked")) {
    $('.man-date input').val(1);
  }
  else {
    $('.man-date input').val(0);
  }
}


function checkExistingTaskIDs() {
  var existing_task_ids = $('.existing-task-id select option');
  var task_id = $('.tid input').val();
  var returnVal = false;
  existing_task_ids.each(function (index) {
    option_value = Number($(this).val());
    if (option_value == NaN) {
      return;
    }
    if ((option_value != 0) && (option_value != task_id)) {
      returnVal = true;
    }
  });
  return returnVal;
}


function checkPermissions() {

  var user_id = $(".user-id input").val();
  var is_active_user = $(".user-isactive input").val();
  var user_type_id = $(".user-type-id input").val();
  var user_department_id = $(".user-department-id input").val();
  var init_department_id = $(".initdid input").val();
  var init_usertype_id = $(".initutid input").val();
  var return_val = true;

  if (is_active_user == 0) {
    return_val = false;
  }

  if (user_id == 0) {
    return_val = false;
  }

  if (user_type_id != 1) {
    if (user_department_id != init_department_id) {
      return_val = false;
    }
    if (user_type_id != init_usertype_id)
    {
      return_val = false;
    }
  }

  return return_val

}


function isMetrologyUser() {
  if ($('.user-type-id input').val() == 1) {
    return true;
  }
  return false;
}


function isNewTask() {
  var task_id = $('.tid input').val();
  var project_id = $('.pid input').val();
  if ((task_id == 0) && (project_id !=0)) {
    return true;
  }
  return false;
}


function generateManualCheckBox() {
  if ($('#manual-date-chk').length == 0) {
    var manual_date_field = $('.man-date input');
    var manual_date_val = $('.man-date input').val();
    if (manual_date_val == 1) {
      var manual_chk_html = `<input id='manual-date-chk' type='checkbox' onchange='changeManualDate()' checked/>`;
      manual_date_field.parent().append(manual_chk_html);
    }
    else {
      var manual_chk_html = `<input id='manual-date-chk' type='checkbox' onchange='changeManualDate()' />`;
      manual_date_field.parent().append(manual_chk_html);
    }
  }

}


function loadAssigneeMap() {

  if (assigneeMap.keys.length == 0) {
    var assignee_rows = $('.assignee-lookup table tbody tr');
    if (assignee_rows.length == 0) {
      return;
    }
    assignee_rows.each(function (index) {
      assigneeID = Number($(this).find('.assignee-lookup-id input').val());
      assigneeName = $(this).find('.assignee-lookup-name input').val();
      assigneeMap.set(assigneeID, assigneeName);
      assigneeNameMap.set(assigneeName, assigneeID);
    });
  }
}


function loadStatusMap() {
  if (taskStatusMap.keys.length == 0) {
    var status_rows = $('.status-lookup table tbody tr');
    if (status_rows.length == 0) {
      return;
    }
    status_rows.each(function (index) {
      statusID = Number($(this).find('.status-lookup-id input').val());
      statusName = $(this).find('.status-lookup-name input').val();
      taskStatusMap.set(statusID, statusName);
      taskStatusNameMap.set(statusName, statusID);
    });
  }
}


function loadTaskTypeMap() {

  if (taskTypeMap.keys.length == 0) {
    var tasktype_rows = $('.task-type-lookup table tbody tr');
    if (tasktype_rows.length == 0) {
      return;
    }
    tasktype_rows.each(function (index) {
      tasktypeID = Number($(this).find('.task-type-lookup-id input').val());
      tasktypeName = $(this).find('.task-type-lookup-name input').val();
      taskTypeMap.set(tasktypeID, tasktypeName);
      taskTypeByNameMap.set(tasktypeName, tasktypeID);
    });
  }
}


function popupIFrame(src, title, height, width, cancelSubmit) {
  
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
      if (cancelSubmit) {
        return false;
      }
    }
  });


  $("#popupIFrame").dialog("open");
  $('#popupIFrame').attr('style', `width: 100%; height: ${height}px;`);
}


function resetErrorFields() {
  var task_name = $('.task-name input');
  var task_type = $('.task-type select');
  var task_status = $('.task-status select');
  var task_operation = $('.op-number input');
  var assignee = $('.assigned-to select');


  $('#taskname-error').remove();
  $('#tasktype-error').remove();
  $('#status-error').remove();
  $('#operation-error').remove();
  $('#assignee-error').remove();
  

  task_name.removeClass('parsley-error');
  task_type.removeClass('parsley-error');
  task_status.removeClass('parsley-error');
  task_operation.removeClass('parsley-error');
  assignee.removeClass('parsley-error');

}


function setFormFieldEnableStateForExistingTask() {
  console.log('setFormFieldEnableStateForExistingTask');
  var has_permission = checkPermissions();
  var task_status = $('.sid input').val();
  $('.task-type select').addClass('ui-state-disabled');

  if ($('#add-note').length == 0) {
    return;
  }

  //reset everything
  $('.Submit').removeClass("ui-state-disabled");
  $('#add-note').removeClass("ui-state-disabled");
  $('#view-notes').removeClass("ui-state-disabled");
  $('#pester-qe').removeClass("ui-state-disabled");
  $('#pester-assignee').removeClass("ui-state-disabled");
  $('#manual-date-chk').removeClass("ui-state-disabled");
  $('.task-status select').removeClass("ui-state-disabled");
  $('.assigned-to select').removeClass("ui-state-disabled");
  

  //if both project and task are 0, disable everything
  if (($('.pid input').val() == 0) && ($('.tid input').val() == 0)) {
    $('.Submit').addClass("ui-state-disabled");
    $('#add-note').addClass("ui-state-disabled");
    $('#view-notes').addClass("ui-state-disabled");
    $('#pester-qe').addClass("ui-state-disabled");
    $('#pester-assignee').addClass("ui-state-disabled");
    $('.assigned-to select').addClass("ui-state-disabled");
    $('.task-status select').addClass("ui-state-disabled");
    
  }

  //if user doesn't have permission, disable submit button
  if (has_permission == false) {
    $('.Submit').addClass("ui-state-disabled");
    $('#add-note').addClass("ui-state-disabled");
  }

  //if user is not metrology, disable pester buttons, ignore checkboxes, manual date checkbox, and status/assignee dropdowns
  if (isMetrologyUser() == false) {
    $('#pester-qe').addClass("ui-state-disabled");
    $('#pester-assignee').addClass("ui-state-disabled");
    $('.schedule-details-ignore-chk').addClass("ui-state-disabled");
    $('#manual-date-chk').addClass("ui-state-disabled");
    $('.task-status select').addClass("ui-state-disabled");
    $('.assigned-to select').addClass("ui-state-disabled");
  }

  //if task is completed or cancelled, disable everything
  if ((task_status == status_Completed) || (task_status == status_Cancelled)) {
    $('.Submit').addClass("ui-state-disabled");
    $('#add-note').addClass("ui-state-disabled");
    $('#pester-qe').addClass("ui-state-disabled");
    $('#pester-assignee').addClass("ui-state-disabled");
    $('.schedule-details-ignore-chk').addClass("ui-state-disabled");
    $('#manual-date-chk').addClass("ui-state-disabled");
    $('.assigned-to select').addClass("ui-state-disabled");
    $('.task-status select').addClass("ui-state-disabled");
  }

}


function setFormFieldEnableStateForNewTask() {
  console.log('setFormFieldEnableStateForNewTask');
  $('.Submit').removeClass("ui-state-disabled");

  $('#add-note').addClass("ui-state-disabled");
  $('#view-notes').addClass("ui-state-disabled");
  $('#pester-qe').addClass("ui-state-disabled");
  $('#pester-assignee').addClass("ui-state-disabled");

  if (isMetrologyUser()) {
    $('#manual-date-chk').removeClass("ui-state-disabled");
    $('.assigned-to select').removeClass("ui-state-disabled");
  }
  else {
    $('#manual-date-chk').addClass("ui-state-disabled");
    $('.assigned-to select').addClass("ui-state-disabled");
  }
}


function setFormFieldsForExistingTask() {
  

  if (($('.ttid input').val() != null) && ($('.ttid input').val().length > 0)) {
    let tasktype_id = Number($('.ttid input').val());
    let tasktype_name = taskTypeMap.get(tasktype_id);
    $('.task-type select').val(tasktype_name).change();
    
  }

  if (($('.sid input').val() != null) && ($('.sid input').val().length > 0)) {
    let status_id = Number($('.sid input').val());
    let status_name = taskStatusMap.get(status_id);
    $('.task-status select').val(status_name).change();
  }

  if (($('.aid input').val() != null) && ($('.aid input').val().length > 0)) {
    let assignee_id = Number($('.aid input').val());
    let assignee_name = assigneeMap.get(assignee_id);
    $('.assigned-to select').val(assignee_name).change();
  }
  $('.note-date input').each((i, dateField) => $(dateField).val($(dateField).val().split(" ")[0]));

  setScheduleCheckboxes();
  generateManualCheckBox();
}


function setFormFieldsForNewTask() {
  console.log('setFormFieldsForNewTask');
  $('.task-status select').val('Not Started');
  $('.task-status select').prop('disabled', true);
  $('.ticket-number input').val($('.new-task-project-id input').val());
  $('.project-name input').val($('.new-task-project-name input').val());
  $('.did input').val($('.new-task-department-id input').val()).change();
  $('.department input').val($('.new-task-department input').val());
  $('.initiator input').val($('.new-task-initiator input').val());
  $('.project-description textarea').val($('.new-task-project-desc textarea').val());
  $('.new-status-id input').val(1);
  $('.sid input').val(1);
  generateManualCheckBox();
}


function setScheduleCheckboxes() {
  var ignoreFields = $('.schedule-details-ignore input');
  var scheduleIDFields = $('.schedule-details-schedule-id input');

  ignoreFields.each(function (index) {
    let ignoreField = $(this).val();
    let scheduleIDField = $(scheduleIDFields[index]).val();
    if (ignoreField == '1') {
      var chk_html = `<input class='schedule-details-ignore-chk' type='checkbox' onchange='changeIgnore(${scheduleIDField})' checked/>`;
      var chk_len = $(this).parent().find('.schedule-details-ignore-chk').length;
      if (chk_len == 0) {
        $(this).parent().append(chk_html);
      }
    }
    else {
      var chk_html = `<input class='schedule-details-ignore-chk' type='checkbox' onchange='changeIgnore(${scheduleIDField})' />`;
      var chk_len = $(this).parent().find('.schedule-details-ignore-chk').length;
      if (chk_len == 0) {
        $(this).parent().append(chk_html);
      }
    }
  });
}


function submitForm(e) {
  
  var form_is_valid = false;

  if (isNewTask() == false) {
    form_is_valid = validateFormForExistingTask();
    e.preventDefault();
    return;
  }

  $('.qeid input').val(qualEngineerNameMap.get($('.quality-eng select').val()));
  $('.mfeid input').val(mfgEngineerNameMap.get($('.manf-eng select').val()));

  if (!isNewTask()) {

    if ($('.sid input').val() != $('.new-status-id input').val()) { //status has changed
      $('.sid input').val($('.new-status-id input').val());
      if ($('.sid input').val() == status_Waiting) {
        e.preventDefault();
        callSetTaskToWaiting();
        return;
      }

      if ($('.sid input').val() == status_Completed) {
        e.preventDefault();
        callCompleteTask();
        return;
      }

      if ($('.sid input').val() == status_Cancelled) {
        e.preventDefault();
        callCancelTask();
        return;
      }
    }
  }
}


function validateFormForExistingTask() {
  var task_name_field = $('.task-name input');
  var status_field = $('.task-status select');
  var opnumber_field = $('.op-number input');
  var assignee_field = $('.assigned-to select');
  var manf_rev = $('.manf-rev input');
  var due_date = $('.due-date input');
  var schedule_duedate = $('.sched-due-date input');

  var new_status_val = $('.new-status-id input').val();
  var existing_assignee_val = $('.aid input').val();
  var new_assignee_val = $('.new-assignee-id input').val();
  var tracked_hours_val = $('.tracked-hours input').val();

  var return_val = true;

  resetErrorFields();

  if (task_name_field.val() == "") {
    $('.task-name input').trigger("blur");
    return_val = false;
  }
  if (opnumber_field.val() == "") {
    $('.op-number input').trigger("blur");
    return_val = false;
  }
  if (manf_rev.val() == "") { 
    $('.manf-rev input').trigger("blur");
    return_val = false;
  }
  if (due_date.val() == "") {
    $('.due-date input').trigger("blur");
    return_val = false;
  }
  if (schedule_duedate.val() == "") {
    $('.sched-due-date input').trigger("blur");
    return_val = false;
  }

  if (checkExistingTaskIDs()) {
    task_name_field.addClass('parsley-error');
    task_name_field.parent().append("<ul id='taskname-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>A task with this Name, Type, and Op already exist in this project.</li></ul>");
    task_type_field.addClass('parsley-error');
    task_type_field.parent().append("<ul id='tasktype-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>A task with this Name, Type, and Op already exist in this project.</li></ul>");
    opnumber_field.addClass('parsley-error');
    opnumber_field.parent().append("<ul id='operation-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>A task with this Name, Type, and Op already exist in this project.</li></ul>");
    return_val = false;
  }

  if ((new_status_val == status_NotStarted) && (tracked_hours_val > 0)) {
    status_field.addClass('parsley-error');
    status_field.parent().append("<ul id='status-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>You can't set a task to 'Not Started' if there are hours assigned to it.</li></ul>");
    return_val = false;
  }

  if (((existing_assignee_val != null) && (existing_assignee_val.length > 0)) && ((new_assignee_val == null) || (new_assignee_val.length == 0))) {
    assignee_field.addClass('parsley-error');
    assignee_field.parent().append("<ul id='status-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>You can't unassign a task once it's been assigned to someone.</li></ul>");
    return_val = false;
  }
  
  if ((new_status_val != status_NotStarted) && ((new_assignee_val == null) && (new_assignee_val.length == 0))){
    assignee_field.addClass('parsley-error');
    assignee_field.parent().append("<ul id='status-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>You can't have a task status other than 'Not Started' if it's not assigned to someone.</li></ul>");
    return_val = false;
  }

  return return_val;

}
