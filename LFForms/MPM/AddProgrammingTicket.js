
$(document).ready(function () {
  $('.Submit').hide();
  $(document).prop('title', 'Task Maintenance');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simplePagination.js/1.6/simplePagination.min.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
  var bootstrapButton = $.fn.button.noConflict(); // return $.fn.button to previously assigned value
  $.fn.bootstrapBtn = bootstrapButton;
  $('.Submit').click(function (e) { submitForm(e); });
  $('.network-user-name input').val($('.lf-username input').val().toUpperCase().substr($('.lf-username input').val().lastIndexOf('\\') + 1)).change();
  $('.task-name-col input').keyup(function () { this.value = this.value.toLocaleUpperCase(); });
  $('.manf-rev input').change(function () { $('.manf-rev input').val($('.manf-rev input').val().toUpperCase()); });

  $(document).on('lookupcomplete', function (e) {

  });

  $(document).on("onloadlookupfinished", function (e) {

    $('#q0').append("<div class='hidden-text' id='popUpDiv'></div>");
    $('.network-user-name input').trigger("change");
    generateGoBackButtons();
    createShowGenerateButton();
    createExecuteTaskGenerationButton();
    $('.gen-due-date input').on('change', function () {
      if ($('.gen-due-date input').val() != '') {
        $('#empty-due-date-error').remove();
        $('.gen-due-date input').removeClass('parsley-error');
      }
    });
  });

});


function createExecuteTaskGenerationButton() {
  var add_buttons = $(".execute-task-generation");
  add_buttons.each(function (index) {
    $(this).replaceWith("<input class='return' style='visibilty:visible' type='button' value='GenerateTasks' onclick='generateTasks()' />");
  });
}


function callShowGenerateTasks() {
  $('.Submit').hide();
  $('.show-generate-tasks input').val(1).change();
}


function callGoBack() {
  $(".show-generate-tasks input").val(null).change();
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
  var partNumberText = $(".part-numbers-to-generate textarea").val();
  var drawingNumberValue = $('.gen-drawing-number input').val();
  var dueDateValue = $('.gen-due-date input').val();

  var partNumbers = partNumberText.split(/\r?\n/);
  var taskTypes = $('.task-types-to-generate-table-name input');
  var opNumbers = $('.op-number-to-generate input');
  $(partNumbers).each(function (i) {
    let partNumberValue = partNumbers[i].trim();
    if (partNumberValue.length == 0) {
      return;
    }
    $(taskTypes).each(function (j) {
      let taskTypeValue = $(this).val();
      $(opNumbers).each(function (k) {
        let opNumberValue = $(this).val();
        if (isLastRowEmpty() == false) {
          $('.tasklist-table').find('.cf-table-add-row').trigger("click");
        }
        let newTaskRow = $('.tasklist-table table tbody tr:last-child');
        let taskNameField = $(newTaskRow).find('.task-name-col input');
        let drawingNumberField = $(newTaskRow).find('.drawing-number-col input');
        let taskTypeField = $(newTaskRow).find('.task-type-col select');
        let dueDateField = $(newTaskRow).find('.due-date-col input');
        let opNumberField = $(newTaskRow).find('.op-number-col input');

        taskNameField.val(partNumberValue);
        if (drawingNumberValue != '') {
          drawingNumberField.val(drawingNumberValue);
        }
        taskTypeField.val(taskTypeValue).change();
        dueDateField.val(dueDateValue);
        opNumberField.val(opNumberValue);
      });
      

    });

  });
  callGoBack();
}


function getRowCountOfTableWithValidValues(selector) {
  var taskTypes = $(`${selector} input`);
  if (taskTypes.length == 0) {
    return 0;
  }
  var count = 0;
  taskTypes.each(function () {
    if ($(this).val().length > 0) {
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
  var opNumberValue = $(lastTaskRow).find('.op-number-col input').val();

  if ((taskNameValue == '') && (drawingNumberValue == '') && (taskTypeValue == '') && (taskTypeIDValue == '') && (dueDateValue == '') && (opNumberValue == '')) {
    return true;
  }
  else {
    return false;
  }

}


function submitForm(e) {
  e.preventDefault();
  if ($('.ticket-me-id input').val().length == 0) {
    $('.ticket-me-id input').val(0);
    $('#form1').submit();
  }
}


function ValidateGenerateForm() {
  var returnVal = true;
  $('#empty-due-date-error').remove();
  $('.gen-due-date input').removeClass('parsley-error');


  if (getRowCountOfTableWithValidValues('.task-types-to-generate-table-name') == 0) {
    $('.task-types-to-generate-table-name input').blur();
    returnVal = false;
  }

  var partNumberText = $(".part-numbers-to-generate textarea").val();
  if (partNumberText.length == 0) {
    $(".part-numbers-to-generate textarea").blur();
    returnVal = false;

  }
  var dueDateValue = $('.gen-due-date input').val();
  if (dueDateValue == '') {
    $('.gen-due-date input').addClass('parsley-error');
    $('.gen-due-date input').parent().append("<ul id='empty-due-date-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>Value Is Required.</li></ul>");

    returnVal = false;
  }

  if (getRowCountOfTableWithValidValues('.op-number-to-generate') == 0) {
    $('.op-number-to-generate input').blur();
    returnVal = false;
  }


  return returnVal;
}
