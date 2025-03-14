var taskTypeMap = new Map();
var taskTypeByNameMap = new Map();


$(document).ready(function () {
  $('.Submit').hide();
  $(document).prop('title', 'Task Maintenance');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simplePagination.js/1.6/simplePagination.min.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
  var bootstrapButton = $.fn.button.noConflict(); // return $.fn.button to previously assigned value
  $.fn.bootstrapBtn = bootstrapButton;
  $('.network-user-name input').val($('.lf-username input').val().toUpperCase().substr($('.lf-username input').val().lastIndexOf('\\') + 1)).change();
  $('.task-name-col input').keyup(function () { this.value = this.value.toLocaleUpperCase(); });


  $(document).on('lookupcomplete', function (e) {
    loadTaskTypeMap();
  });

  $(document).on("onloadlookupfinished", function (e) {

    $('#q0').append("<div class='hidden-text' id='popUpDiv'></div>");
    $('.network-user-name input').trigger("change");
    generateGoBackButtons();
    createShowGenerateButton();
    createExecuteTaskGenerationButton();
  });

});


function createExecuteTaskGenerationButton() {
  var add_buttons = $(".execute-task-generation");
  add_buttons.each(function (index) {
    $(this).replaceWith("<input class='return' style='visibilty:visible' type='button' value='GenerateTasks' onclick='generateTasks()' />");
  });
}


function callShowGenerateTasks() {
  $('.show-generate-tasks input').val(1).change(); 
}


function callGoBack() {
  $(".show-generate-tasks input").val(null).change();
  $(".task-type-checkbox").each(function (i) {
    $(this).prop('checked', false);
  })
  
  $("#Field40").val(null);
  $('.Submit').show();
}


function createShowGenerateButton() {
  var add_buttons = $("#show-generate-tasks");
  add_buttons.each(function (index) {
    $(this).replaceWith("<input class='return' style='visibilty:visible' type='button' value='GenerateTasks' onclick='callShowGenerateTasks()' />");
  });

}


function generateGoBackButtons() {
  var goback_buttons = $(".gobackbutton");
  goback_buttons.each(function (index) {
    $(this).parent().append("<div id='go-back' class='ui-button ui-corner-all ui-widget' onclick='callGoBack()'><span class='ui-icon ui-icon-arrowreturnthick-1-w'></span>Go Back</div>");
  });
  $(".gobackbutton").remove();
}


function generateTasks() {
  var isGenerateFormValid = ValidateGenerateForm();
  if (isGenerateFormValid == false) {
    return;
  }
  var partNumberText = $("#Field40").val();
  var drawingNumber = $('.gen-drawing-number input').val();
  var dueDateValue = $('.gen-due-date input').val();

  var partNumbers = partNumberText.split(/\r?\n/);
  var checkboxes = $('.task-type-checkbox');
  $(partNumbers).each(function (i) {
    let partNumber = partNumbers[i].trim();
    checkboxes.each(function (j) {
      if ($(this).is(':checked')) {
        let taskTypeID = $(this).val();
        let taskTypeName = $(this).parent().find('.form-option-label').text();
        if (isLastRowEmpty() == false) {
          $('.tasklist-table').find('.cf-table-add-row').trigger("click");
        }
        let newTaskRow = $('.tasklist-table table tbody tr:last-child');
        $(newTaskRow).find('.task-name-col input').val(partNumber);
        $(newTaskRow).find('.drawing-number-col input').val(drawingNumber);
        <HERE'S WHERE I LEFT OFF!!>
      }

    });
  });
}


function generateTaskTypeCheckBoxes() {
  var tasktype_rows = $('.tasktype-lookup-table table tbody tr');
  var tasktype_Fieldset = $('.task-types-chk .radio-checkbox-fieldset')
  if (tasktype_rows.length == 0) {
    return;
  }
  tasktype_rows.each(function (index) {
    let tasktypeID = Number($(this).find('.tasktype-lookup-table-id input').val());
    let tasktypeName = $(this).find('.tasktype-lookup-table-name input').val();
    let tasktypeCheckBox = `<span class="choice"><input name="${tasktypeID}" class="task-type-checkbox" id="TaskType-${tasktypeID}" type="checkbox" value="${tasktypeID}" ><label class="form-option-label" for="TaskType-${tasktypeID}">${tasktypeName}</label></span>`;
    $(tasktype_Fieldset).append(tasktypeCheckBox);
  });
}


function getSelectedTaskTypeCount() {
  var checkboxes = $(".task-type-checkbox");
  if (checkboxes.length == 0) {
    return 0;
  }
  var count = 0;
  checkboxes.each(function () {
    if ($(this).is(':checked')) {
      count++;
    }
  });
  return count;
}


function isLastRowEmpty() {
  var lastTaskRow = $('.tasklist-table table tbody tr:last-child');
  var taskNameValue = $(lastTaskRow).find('.task-name-col input').val();
  var drawingNumberValue = $(lastTaskRow).find('.drawing-number-col input').val();
  var taskTypeValue = $(lastTaskRow).find('.task-type-col select').val();
  var taskTypeIDValue = $(lastTaskRow).find('.task-type-id-col input').val();
  var dueDateValue = $(lastTaskRow).find('.due-date-col input').val();

  if ((taskNameValue == null) && (drawingNumberValue == null) && (taskTypeValue == null) && (taskTypeIDValue == null) && (dueDateValue == null)) {
    return true;
  }
  else {
    return false;
  }

}


function loadTaskTypeMap() {

  if (taskTypeMap.keys.length == 0) {
    var tasktype_rows = $('.tasktype-lookup-table table tbody tr');
    if (tasktype_rows.length == 0) {
      return;
    }
    tasktype_rows.each(function (index) {
      let tasktypeID = Number($(this).find('.tasktype-lookup-table-id input').val());
      let tasktypeName = $(this).find('.tasktype-lookup-table-name input').val();
      taskTypeMap.set(tasktypeID, tasktypeName);
      taskTypeByNameMap.set(tasktypeName, tasktypeID);
    });
    generateTaskTypeCheckBoxes();
  }
}


function ValidateGenerateForm() {
  var returnVal = true;
  $('#Field11').removeClass('parsley-error');
  $('#Field40').removeClass('parsley-error');
  $('.gen-due-date input').addClass('parsley-error');

  $('#empty-due-date-error').remove();
  $('#empty-task-types-error').remove();
  $('#empty-part-numbers-error').remove();

  if (getSelectedTaskTypeCount() == 0) {
    $('#Field11').addClass('parsley-error');
    $('#Field11').append("<ul id='empty-task-types-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>You have to select at least one task type to generate.</li></ul>");
    returnVal = false;
  }

  var partNumberText = $("#Field40").val();
  if (partNumberText.length == 0) {
    $('#Field40').addClass('parsley-error');
    $('#Field40').parent().append("<ul id='empty-part-numbers-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>You have to add at least one part number generate.</li></ul>");
    returnVal = false;

  }
  var dueDateValue = $('.gen-due-date input').val();
  if (dueDateValue.length == 0) {
    $('.gen-due-date input').addClass('parsley-error');
    $('.gen-due-date input').parent().append("<ul id='empty-due-date-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>Required field.</li></ul>");
    returnVal = false;
  }

  return returnVal;
}
