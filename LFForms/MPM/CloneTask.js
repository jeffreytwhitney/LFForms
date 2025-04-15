$(document).ready(function () {
  
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
  var bootstrapButton = $.fn.button.noConflict();
  $.fn.bootstrapBtn = bootstrapButton;
  $('.Submit').addClass('ui-button ui-corner-all ui-widget');
  $('.Submit').click(function (e) { submitForm(e); });
  $('.network-user-name input').val($('.lf-user-name input').val().toUpperCase().substr($('.lf-user-name input').val().lastIndexOf('\\') + 1)).change();

  if ($('.closeme input').val() == 1) {
    window.parent.postMessage('CloseDialogWithRefresh', '*');
  }

  $(document).on('blur', "input[type=text]", function () {
    $(this).val(function (_, val) {
      return val.toUpperCase();
    });
  });

  $(document).on("onloadlookupfinished", function (e) {
    if ($('.tid input').val() == 0) {
      $('.Submit').addClass("ui-state-disabled");
      return;
    } 

    $('.new-task-type select').val($('.current-task-type-name input').val()).change();
    $('.new-op input').val($('.current-op input').val()).change();
    $('.new-task-name input').val($('.current-task-name input').val()).change();
    

  });

  $(document).on('lookupcomplete', function (e) {
    if (Number($('.user-id input').val()) == 0) {
      $('.network-user-name input').trigger("change");
    }
    if (Number($('.pid input').val()) == 0) {
      $('.tid input').trigger("change");
    }
    if ((Number($('.department-id input').val()) != 0) && ($('.department-email-address input').val() == '')){
      $('.department-id input').trigger("change");
    }
  });

});


function checkExistingTaskIDs() {
  var existing_task_ids = $('.existing-task-ids select option');
  var returnVal = false;
  existing_task_ids.each(function (index) {
    option_value = Number($(this).val());
    if (option_value == NaN) {
      return;
    }
    if (option_value != 0) {
      returnVal = true;
    }
  });
  return returnVal;
}


function isMetrologyUser() {
  if ($('.user-type-id input').val() == 1) {
    return true;
  }
  return false;
}

function setFormEnabledState() {

  if ($('.user-type-id input').val() == 3) {
    if ($('.user-department-id input').val() != $('.department-id input').val()) {
      $('.Submit').addClass("ui-state-disabled");
      $('.new-task-type select').addClass("ui-state-disabled");
      $('.new-op input').addClass("ui-state-disabled");
      $('.new-task-name input').addClass("ui-state-disabled");
      $('#error-message').html('<b><font size="5">You do not have permission to clone this task.</font></b>').show();
    }
  }
  if (($('.user-type-id input').val() != 1) && ($('.user-type-id input').val() != 3)) {
    $('.Submit').addClass("ui-state-disabled");
    $('.new-task-type select').addClass("ui-state-disabled");
    $('.new-op input').addClass("ui-state-disabled");
    $('.new-task-name input').addClass("ui-state-disabled");
    $('#error-message').html('<b><font size="5">You do not have permission to clone this task.</font></b>').show();
  }

}


function submitForm(e) {
  if (validateForm() == false) {
    console.log('form is invalid');
    e.preventDefault();
    return;
  }
  var newAssigneeID = $('.new-assignee-id input').val();
  if (newAssigneeID == '') {
    $('.new-assignee-id input').val(0);
  }


  $('.closeme input').val(1);
}


function validateForm() {
  var task_name_field = $('.new-task-name input');
  var task_type_field = $('.new-task-type select');
  var opnumber_field = $('.new-op input');

  var return_val = true;

  $('#taskname-error').remove();
  $('#tasktype-error').remove();
  $('#operation-error').remove();
  
  task_name_field.removeClass('parsley-error');
  task_type_field.removeClass('parsley-error');
  opnumber_field.removeClass('parsley-error');

  if (checkExistingTaskIDs()) {
    task_name_field.addClass('parsley-error');
    task_name_field.parent().append("<ul id='taskname-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>A task with this Name, Type, and Op already exist in this project.</li></ul>");
    task_type_field.addClass('parsley-error');
    task_type_field.parent().append("<ul id='tasktype-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>A task with this Name, Type, and Op already exist in this project.</li></ul>");
    opnumber_field.addClass('parsley-error');
    opnumber_field.parent().append("<ul id='operation-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>A task with this Name, Type, and Op already exist in this project.</li></ul>");
    return_val = false;
  }

  return return_val;

}