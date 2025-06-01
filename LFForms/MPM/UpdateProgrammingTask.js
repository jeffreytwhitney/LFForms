const status_NotStarted = 1;
const status_Started = 2;
const status_Waiting = 3;
const status_Completed = 4;
const status_Cancelled = 5;
const status_NotSched = 7;

$(document).ready(function () {
  $(document).prop('title', 'Edit Programming Task');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');

  var bootstrapButton = $.fn.button.noConflict();
  $.fn.bootstrapBtn = bootstrapButton;
  $('.Submit').addClass('ui-button ui-corner-all ui-widget');
  $('.Submit').click(function (e) { submitForm(e); });
  var lfUserName = $('.lf-user-name input').val();
  if (lfUserName != '') {
    let networkUserName = $('.lf-user-name input').val().toUpperCase();
    networkUserName = networkUserName.substr(networkUserName.lastIndexOf('\\') + 1);
    $('.network-user-name input').val(networkUserName).change();
  }

  $(document).on('change', '.task-name input', function (e) {
    var task_name = $(this).val();
    $(document).prop('title', `Edit Task ${task_name}`);
  });

  $('.date-to-add input').val(moment().format('MM/DD/YYYY'));

  $(document).on('dblclick', '.project-description textarea', function (e) {
    var ticketDetail = $(this).val();

    $.dialog({
      escapeKey: true,
      backgroundDismiss: true,
      title: `Details:`,
      content: ticketDetail,
      resizable: true,
      width: 600,
      height: 400,
    });
  });

  if ($('.closeme input').val() == 1) {
    $('.cf-formwrap').hide();
    window.parent.postMessage('CloseDialogWithRefresh', '*');
  }

  $('.add-time fieldset').change(function () {
    var time_to_add = $('.add-time fieldset input[type="radio"]:checked').val();
    if (time_to_add != 'X') {
      $('.time-to-add input').val(time_to_add);
    }
    else {
      $('.time-to-add input').val(1);
    }
  });

  $('.amount-of-time input').change(function () {
    $('.time-to-add input').val($('.amount-of-time input').val());
  });

  window.onmessage = function (event) {
    if (event.data == "CloseDialog") {
      $("#popupIFrame").dialog("destroy");
      $("#popupIFrame").remove();
    }
    if (event.data == "CloseDialogWithRefresh") {
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
    var taskID = $('.tid input').val();
    if ((taskID != '') && (taskID != '0')) {
      $('#task-history').append(`<iframe id='task-history-iframe' name='task-history-iframe' src='http://rmslf/Forms/MPM-ProgamTaskHistory?tid=${taskID}' height='500' width='100%'/>`);
    }
    generateFilePathLinks();
  });
});


function callAddNote() {
  var task_id = $('.tid input').val();
  var task_name = $('.task-name input').val();
  popupIFrame(`http://rmslf/Forms/MPMAddNote?TaskID=${task_id}&nt=1`, `Add Note for task '${task_name}'`, 400, 650, false);
}


function callCancelTask() {
  var noteField = $('.section-cancellation-note');
  $(noteField).dialog({
    title: 'Add Cancellation Reason (Required)',
    modal: true,
    width: 650,
    height: 425,
    autoOpen: false,
    resizable: false,
    buttons: {
      'OK': function () {

        if ($('.cancellation-note textarea').val().trim() == '') {
          $.alert({ title: 'Must supply cancellation reason!', content: 'Sorry, you need to provide a reason for cancelling this ticket.' });
          return;
        }
        $('.submit-note input').val($('.cancellation-note textarea').val());
        $(this).dialog('close');
        $('#form1').submit();
      }
    }
  });

  $(noteField).dialog("open");
}


function callCompleteTask() {
  var noteField = $('.section-completion-time-note');
  $(noteField).dialog({
    title: 'Add Completion Note (Optional)',
    modal: true,
    width: 800,
    height: 450,
    autoOpen: false,
    resizable: false,
    buttons: {
      'OK': function () {
        let selectedTimeAmount = $('.add-time .radio-checkbox-fieldset input[type="radio"]:checked').val(); 
        let timeAmount = Number($('.amount-of-time input').val());
        if (selectedTimeAmount == 'X') {
          if (timeAmount <= 1) {
            $.alert({ title: 'Must supply amount of time to add!', content: 'Sorry, you need to provide a valid number of hours. (1 hour or greater).' });
            return;
          }
        }
        $('.submit-note input').val($('.completion-note textarea').val());
        $(this).dialog('close');
        $('#form1').submit();
      }
    }
  });

  $(noteField).dialog("open");



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
  var noteField = $('.section-waiting-note');
  $(noteField).dialog({
    title: 'Add What you are waiting on (Required)',
    modal: true,
    width: 650,
    height: 425,
    autoOpen: false,
    resizable: false,
    buttons: {
      'OK': function () {
        var selectedLength = $('.waiting-reason .radio-checkbox-fieldset input[type="radio"]:checked').length;
        
        if (selectedLength == 0) {
          $.alert({ title: 'Must select waiting reason!', content: 'Sorry, you need to select what you are waiting on.' });
          return;
        }

        let selectedWaitingValue = Number($('.waiting-reason .radio-checkbox-fieldset input[type="radio"]:checked').val());
        if (selectedWaitingValue == 3) {
          if ($('.waiting-note textarea').val().trim() == '') {
            $.alert({ title: 'Must supply waiting reason!', content: 'Sorry, you need to provide what you are waiting on.' });
            return;
          }
          $('.submit-note input').val($('.waiting-note textarea').val());
        }
        $('.update-waiting-id input').val(selectedWaitingValue).change();
        $(this).dialog('close');
        
        $('#form1').submit();
      }
    }
  });
  $(noteField).dialog("open");
}


function callShowScheduleFilePath(index) {
  var schedule_name = $('.schedule-col input').eq(index).val();
  var file_path = $('.file-path-col input').eq(index).val();
  

  $.confirm({
    title: `File path for ${schedule_name} schedule`,
    content: '' +
      '<form action="" class="formName">' +
      '<div class="form-group">' +
      '<label>Copy this and paste into Windows Explorer</label>' +
      `<input type="text" value="${file_path}" class="name form-control"/>` +
      '</div>' +
      '</form>',
    buttons: {
      close: function () {
        close
      },
    },
  });

}


function callViewNotes() {
  var task_id = $('.tid input').val();
  var qe_name = $('.quality-engineer-name input').val();
  popupIFrame(`http://rmslf/Forms/MPM-ViewTaskNotes?tid=${task_id}`, `Notes`, 800, 1000, false);
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
      return returnVal;
    }
    if ((option_value != 0) && (option_value != task_id)) {
      returnVal = true;
    }
  });
  return returnVal;
}


function checkPermissions() {

  var user_type_id = Number($(".user-type-id input").val());
  var user_department_id = Number($(".user-department-id input").val());
  var ticket_department_id = Number($(".ticket-department-id input").val());

  if (user_type_id == 1) {
    return true;
  }

  if (user_type_id == 3) {
    if (user_department_id == ticket_department_id) {
      return true;
    }
  }

  return false;
}


function isMetrologyUser() {
  if ($('.user-type-id input').val() == 1) {
    return true;
  }
  return false;
}


function generateFilePathLinks() {
  var scheduleNames = $('.schedule-col input[type="text"]'); 
  var filePaths = $('.file-path-col input[type="text"]');
  
  scheduleNames.each(function (index) {

    let file_path = $(filePaths[index]);
    let file_path_val = $(filePaths[index]).val();
    let schedule_name = $(scheduleNames[index]).val();
    let schedule_link = $("<a>", { text: schedule_name, class: 'schedule-link', href: `javascript:void(0);`, onclick: `callShowScheduleFilePath(${index})` });

    $(this).parent().append(schedule_link);
    $(file_path).parent().append(`<div id="filepath${index}" class="filepath${index}" value="${file_path_val}"/></div>`)
  });

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


function lockFormNoPermissions() {
  $('.Submit').addClass("ui-state-disabled");
  $('#add-note').addClass("ui-state-disabled");
  
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


function lockFormCompleteCancelled() {

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
    lockFormNoPermissions();
    return;
  }

  if (!checkPermissions()) {
    lockFormNoPermissions();
    return;
  }

  var statusID = Number($('.sid input').val());
  if ((statusID == status_Completed) || (statusID == status_Cancelled)) {
    lockFormCompleteCancelled();
  }


  if (!isMetrologyUser()) {
    $('.status-combo select').addClass('ui-state-disabled');
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
  if ((Number($('.site-id input').val()) != 0) && ($('.metrology-email input').val() == '')) {
    $('.site-id input').trigger("change");
  }


  $('.note-date input').each((i, dateField) => $(dateField).val($(dateField).val().split(" ")[0]));
  $('.date-started input').each((i, dateField) => $(dateField).val($(dateField).val().split(" ")[0]));

  if (($('.assignee-name input').val() != '') && ($('.assigned-to select').val() == '')) {
    $('.assigned-to select').val($('.assignee-name input').val()).change();
  }
  if (($('.status-name input').val() != '') && ($('.status-combo select').val() == '')) {
    $('.status-combo select').val($('.status-name input').val()).change();
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

  if (!$('.aid input').val().length) {
    $('.aid input').val(0);
  }
  if (!$('.update-aid input').val().length) {
    $('.update-aid input').val(0);
  }
  $('#man-date-div').remove();

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
 
  if (((new_status_val != status_NotStarted) && (new_status_val != status_Cancelled) && (new_status_val != status_NotSched)) && ((new_assignee_val == null) || (new_assignee_val == 0))) {
    assignee_field.addClass('parsley-error');
    assignee_field.parent().append("<ul id='status-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>You can't have a task status other than 'Not Started' if it's not assigned to someone.</li></ul>");
    return_val = false;
  }

  return return_val;

}
