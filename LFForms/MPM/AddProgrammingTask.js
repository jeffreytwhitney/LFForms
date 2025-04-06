$(document).ready(function () {
  window.name = "AddEditTask";
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
  var bootstrapButton = $.fn.button.noConflict();
  $.fn.bootstrapBtn = bootstrapButton;
  $('.Submit').click(function (e) { submitForm(e); });

  var lfUserName = $('.lf-user-name input').val();
  if (lfUserName != "") {
    let networkUserName = lfUserName.toUpperCase();
    networkUserName = networkUserName.substr(networkUserName.lastIndexOf('\\') + 1);
    $('.network-user-name input').val(networkUserName).change();
  }

  if ($('.closeme input').val() == 1) {
    window.parent.postMessage('CloseDialogWithRefresh', '*');
  }

  $('.existing-task-id input').on('change', function (e) {
    validateForm();
  });

  $(document).on('lookupcomplete', function (e) {
    setFormFieldEnableState();
  });

  $(document).on("onloadlookupfinished", function (e) {
    $('.closeme input').val(1);
    $('.network-user-name input').trigger("change");
  });
});


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
  var user_department_id = $(".user-department-id input").val();
  var ticket_department_id = $(".did input").val();

  var return_val = true;

  if (is_active_user == '0') {
    return_val = false;
  }

  if (user_id == '0') {
    return_val = false;
  }

  if (!isMetrologyUser()) {
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


function resetErrorFields() {
  var task_name = $('.task-name input');
  var task_type = $('.task-type select');
  var task_operation = $('.op-number input');

  $('#operation-error').remove();
  $('#taskname-error').remove();
  $('#tasktype-error').remove();

  task_name.removeClass('parsley-error');
  task_type.removeClass('parsley-error');
  task_operation.removeClass('parsley-error');
}


function setFormFieldEnableState() {

  if (($('.user-type-id input').val() != 0) && ($('.user-type-id input').val() != '')) {
    var has_permission = checkPermissions();
    if (!has_permission) {
      $('.Submit').addClass("ui-state-disabled");
    }

    if (isMetrologyUser()) {
      $('.assigned-to select').removeClass("ui-state-disabled");
    }
    else {
      $('.assigned-to select').addClass("ui-state-disabled");
    }
  }

}


function submitForm(e) {

  if (!validateForm()) {
    e.preventDefault();
    return;
  }


  if ($('.aid input').val() == 0) {
    $('.aid input').val(0)
  }
}


function validateForm() {

  var has_permission = checkPermissions();
  if (!has_permission) {
    $('.Submit').addClass("ui-state-disabled");
    return false;
  }

  resetErrorFields();
  var return_val = true;
  var task_name_field = $('.task-name input');
  var task_type_field = $('.task-type select');
  var opnumber_field = $('.op-number input');
  var existingTaskID = $('.existing-task-id input').val();

  if (existingTaskID != '') {
    task_name_field.addClass('parsley-error');
    task_name_field.parent().append("<ul id='taskname-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>A task with this Name, Type, and Op already exist in this project.</li></ul>");
    task_type_field.addClass('parsley-error');
    task_type_field.parent().append("<ul id='tasktype-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>A task with this Name, Type, and Op already exist in this project.</li></ul>");
    opnumber_field.addClass('parsley-error');
    opnumber_field.parent().append("<ul id='operation-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>A task with this Name, Type, and Op already exist in this project.</li></ul>");
    $('.Submit').addClass("ui-state-disabled");
    return_val = false;
  }
  else {
    $('.Submit').removeClass("ui-state-disabled");
  }
  console.log('return_val: ' + return_val);
  return return_val;

}