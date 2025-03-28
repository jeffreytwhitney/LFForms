const status_NotStarted = 1;
const status_Started = 2;
const status_Waiting = 3;
const status_Completed = 4;
const status_Cancelled = 5;
const status_NotSched = 7;

$(document).ready(function () {
  window.name = "AddEditTask";
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
  var bootstrapButton = $.fn.button.noConflict();
  $.fn.bootstrapBtn = bootstrapButton;
  $('.Submit').addClass('ui-button ui-corner-all ui-widget');
  $('.Submit').click(function (e) { submitForm(e); });
  var lfUserName = $('.lf-user-name input').val();
  if (lfUserName != "") {
    let networkUserName = lfUserName.toUpperCase();
    networkUserName = networkUserName.substr(networkUserName.lastIndexOf('\\') + 1);
    $('.network-user-name input').val(networkUserName).change();
  }

  if ($('.closeme input').val() == 1) {
    $('.cf-formwrap').hide();
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
    if (isMetrologyUser()) {
      if (!$('#pester-qe').length) {
        $('.quality-engineer-name input').parent().append("<div id='pester-qe' class='table-button ui-button' onclick='callPesterQE()'><span title='Pester QE' class='ui-button-icon ui-icon ui-icon-mail-closed'/></div>");
      }
      if (!$('#pester-assignee').length) {
        $('.assigned-to select').parent().append(`<div id='pester-assignee' class='table-button ui-button' onclick='callPesterAssignee()'><span title='Pester Assignee' class='ui-button-icon ui-icon ui-icon-mail-closed'/></div>`);
      }
    }

    setFormFields();
    setFormFieldEnableState();

  });

  $(document).on("onloadlookupfinished", function (e) {
    let task_name = $('.task-name input').val();
    $('.closeme input').val(1);
    $('#q0').append("<div class='hidden-text' id='popUpDiv'></div>");

    $('.btn-wrapper').append("<div id='add-note' class='ui-button ui-corner-all ui-widget' onclick='callAddNote()'><span class='ui-button-icon ui-icon ui-icon-document'></span>Add Note</div>");
    $('.btn-wrapper').append("<div id='view-notes' class='ui-button ui-corner-all ui-widget' onclick='callViewNotes()'><span class='ui-button-icon ui-icon ui-icon-newwin'></span>View Notes</div>");
    $('.network-user-name input').trigger("change");

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
  var noteHtml = $(".notes-table").find('.cf-table_parent').clone();
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

  $('.ui-dialog-content .cf-col100').on("dblclick", function (e) {
    var notes = $(this).find('textarea').val();
    console.log(notes);
    $.dialog({
      escapeKey: true,
      backgroundDismiss: true,
      title: 'Note',
      content: notes,
    });
  });
}


function changeManualDate() {
  var manual_date_check = $('#manual-date-chk');
  if ($(manual_date_check).is(":checked")) {
    $('.man-date input[type="text"]').val(1);
  }
  else {
    $('.man-date input[type="text"]').val(0);
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
  var ticket_department_id = $(".ticket-department-id input").val();

  var return_val = true;

  if (is_active_user == '0') {
    return_val = false;
  }

  if (user_id == '0') {
    return_val = false;
  }

  if (user_type_id != '1') {
    if (user_department_id != ticket_department_id) {
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


function generateManualCheckBox() {
  if ($('.man-date input').val().length) {
    if (!$('#manual-date-chk').length) {
      var manual_date_field = $('.man-date input');
      var manual_date_val = $('.man-date input').val();
      if (manual_date_val == '1') {
        var manual_chk_html = `<div id="man-date-div"><input id='manual-date-chk' type='checkbox' onchange='changeManualDate()' checked/></div>`;
        manual_date_field.parent().append(manual_chk_html);
      }
      else {
        var manual_chk_html = `<div id="man-date-div"><input id='manual-date-chk' type='checkbox' onchange='changeManualDate()' /></div>`;
        manual_date_field.parent().append(manual_chk_html);
      }
    }
  }
}


function lockForm() {
  $('.Submit').addClass("ui-state-disabled");
  $('#add-note').addClass("ui-state-disabled");
  $('#view-notes').addClass("ui-state-disabled");
  $('#pester-qe').addClass("ui-state-disabled");
  $('#pester-assignee').addClass("ui-state-disabled");
  $('.task-status select').addClass("ui-state-disabled");
  $('.assigned-to select').addClass("ui-state-disabled");
  $('.task-name input').addClass("ui-state-disabled");
  $('.drawing-number input').addClass("ui-state-disabled");
  $('.manf-rev input').addClass("ui-state-disabled");
  $('.op-number input').addClass("ui-state-disabled");
  $('.due-date input').addClass("ui-state-disabled");
  $('.sched-due-date input').addClass("ui-state-disabled");
  $('#manual-date-chk').parent().addClass("ui-state-disabled");
  $('.job-number input').addClass("ui-state-disabled");
  $('.status-combo select').addClass("ui-state-disabled");
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
  var task_status = $('.status-combo select');
  var task_operation = $('.op-number input');
  var assignee = $('.assigned-to select');

  $('#operation-error').remove();
  $('#taskname-error').remove();
  $('#status-error').remove();
  $('#operation-error').remove();
  $('#assignee-error').remove();


  task_name.removeClass('parsley-error');
  task_status.removeClass('parsley-error');
  task_operation.removeClass('parsley-error');
  assignee.removeClass('parsley-error');

}


function resetEnabledState() {
  $('.Submit').removeClass("ui-state-disabled");
  $('#add-note').removeClass("ui-state-disabled");
  $('#view-notes').removeClass("ui-state-disabled");
  $('#pester-qe').removeClass("ui-state-disabled");
  $('#pester-assignee').removeClass("ui-state-disabled");
  $('.task-status select').removeClass("ui-state-disabled");
  $('.assigned-to select').removeClass("ui-state-disabled");
  $('.task-name input').removeClass("ui-state-disabled");
  $('.drawing-number input').removeClass("ui-state-disabled");
  $('.manf-rev input').removeClass("ui-state-disabled");
  $('.op-number input').removeClass("ui-state-disabled");
  $('.due-date input').removeClass("ui-state-disabled");
  $('.sched-due-date input').removeClass("ui-state-disabled");
  $('#manual-date-chk').parent().removeClass("ui-state-disabled");
  $('.job-number input').removeClass("ui-state-disabled");
  $('.status-combo select').removeClass("ui-state-disabled");
}


function setFormFieldEnableState() {
  resetEnabledState();

  if ($('.tid input').val().length == 0) {
    console.log('No Task ID provided, locking form');
    lockForm();
    return;
  }

  if ($('.pid input').val().length == 0) {
    console.log('No Project ID found, locking form');
    lockForm();
    return;
  }

  if (!checkPermissions()) {
    console.log('User does not have permissions to edit this task');
    lockForm();
    return;
  }

  var statusID = Number($('.sid input').val());
  if ((statusID == status_Completed) || (statusID == status_Cancelled)) {
    $('.Submit').addClass("ui-state-disabled");
    $('#pester-qe').addClass("ui-state-disabled");
    $('#pester-assignee').addClass("ui-state-disabled");
    $('.task-status select').addClass("ui-state-disabled");
    $('.assigned-to select').addClass("ui-state-disabled");
    $('.task-name input').addClass("ui-state-disabled");
    $('.drawing-number input').addClass("ui-state-disabled");
    $('.manf-rev input').addClass("ui-state-disabled");
    $('.op-number input').addClass("ui-state-disabled");
    $('.due-date input').addClass("ui-state-disabled");
    $('.sched-due-date input').addClass("ui-state-disabled");
    $('#manual-date-chk').parent().addClass("ui-state-disabled");
    $('.job-number input').addClass("ui-state-disabled");
    $('.status-combo select').addClass("ui-state-disabled");
    return;
  }


  if (!isMetrologyUser()) {
    $('.task-status select').addClass('ui-state-disabled');
    $('.assigned-to select').addClass('ui-state-disabled');
  }
  else {
    if ($('.aid input').val() == '') {
      $('#pester-assignee').addClass("ui-state-disabled");
    }
    if ($('.aid input').val() != $('.update-aid input').val()) {
      $('#pester-assignee').addClass("ui-state-disabled");
    }
  }
}


function setFormFields() {

  $('.note-date input').each((i, dateField) => $(dateField).val($(dateField).val().split(" ")[0]));
  $('.date-started input').each((i, dateField) => $(dateField).val($(dateField).val().split(" ")[0]));

  if ($('.status-combo select').length) {
    var statusNameValue = $('.status-name input').val();
    var statusComboValue = $('.status-combo select').val();


    if (statusNameValue.length == 0) {
      $('.status-combo select').eq(0).prop('selected', true);
    }
    else {
      if ((statusNameValue.length > 0) && ((statusComboValue == null) || (statusComboValue == ''))) {
        $('.status-combo select').val(statusNameValue).change();
      }

    }
  }

  if ($('.assigned-to select').length) {
    var assigneeNameValue = $('.assignee-name input').val();
    var assigneeComboValue = $('.assigned-to select').val();

    if (assigneeNameValue.length == 0) {
      $('.assigned-to select').eq(0).prop('selected', true);
    }
    else {

      if ((assigneeNameValue.length > 0) && ((assigneeComboValue == null) || (assigneeComboValue == ''))) {
        $('.assigned-to select').val(assigneeNameValue).change();
      }
    }
  }



  generateManualCheckBox();
}


function submitForm(e) {

  var form_is_valid = validateForm();
  if (form_is_valid == false) {
    e.preventDefault();
    return;
  }

  var statusID = Number($('.sid input').val());
  var newStatusID = Number($('.update-sid input').val());

  if (statusID != newStatusID) { 

    if (newStatusID == status_Waiting) {
      e.preventDefault();
      callSetTaskToWaiting();
      return;
    }

    if (newStatusID == status_Completed) {
      e.preventDefault();
      callCompleteTask();
      return;
    }

    if (newStatusID == status_Cancelled) {
      e.preventDefault();
      callCancelTask();
      return;
    }
  }

  $('#man-date-div').remove();

  if (!$('.aid input').val().length) {
    $('.aid input').val(0);
  }
  if (!$('.update-aid input').val().length) {
    $('.update-aid input').val(0);
  }

}


function validateForm() {
  var task_name_field = $('.task-name input');
  var status_field = $('.status-combo select');
  var opnumber_field = $('.op-number input');
  var assignee_field = $('.assigned-to select');
  var manf_rev = $('.manf-rev input');
  var due_date = $('.due-date input');
  var schedule_duedate = $('.sched-due-date input');

  var new_status_val = Number($('.update-sid input').val());
  var existing_assignee_val = $('.aid input').val();
  var new_assignee_val = Number($('.update-aid input').val());
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

  if ((new_status_val != status_NotStarted) && ((new_assignee_val == null) || (new_assignee_val == 0))) {
    assignee_field.addClass('parsley-error');
    assignee_field.parent().append("<ul id='status-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>You can't have a task status other than 'Not Started' if it's not assigned to someone.</li></ul>");
    return_val = false;
  }

  return return_val;

}
