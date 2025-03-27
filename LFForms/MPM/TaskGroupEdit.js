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


$(document).ready(function () {

  $(document).prop('title', 'Task Maintenance');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simplePagination.js/1.6/simplePagination.min.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
  $('.Submit').click(function (e) { submitForm(e); });
  var bootstrapButton = $.fn.button.noConflict(); // return $.fn.button to previously assigned value
  $.fn.bootstrapBtn = bootstrapButton;
  $('.network-user-name input').val($('.lf-username input').val().toUpperCase().substr($('.lf-username input').val().lastIndexOf('\\') + 1)).change();

  if ($('.closeme input').val() == 1) {
    window.parent.postMessage('CloseDialogWithRefresh', '*');
  }

  $(document).on('lookupcomplete', function (e) {

    loadAssigneeMap();
    loadTaskTypeMap();

    $('.due-date-col input').each((i, dateField) => $(dateField).val($(dateField).val().split(" ")[0]));
    $('.sched-due-date-col input').each((i, dateField) => $(dateField).val($(dateField).val().split(" ")[0]));
    generateTableCheckBox(".man-date-col", "mandate-chk");

    generateFilterRow();
    $('.tasklist-table').show();

  });

  $(document).on("onloadlookupfinished", function (e) {
    $('.closeme input').val(1);
    $('#q0').append("<div class='hidden-text' id='popUpDiv'></div>");
    $('.tid input').trigger("change");
    $('.network-user-name input').trigger("change");
    if (checkPermissions() == false) {

    }

    $(document).on('change', '#Field18-0', function () {
      if (this.checked) {
        $('.update-man-date input').val(1);
      }
      else {
        $('.update-man-date input').val(0);
      }
    });


    $(document).on('change', 'input[id^="Field21"]', function () {
      fillSelectedIDs();
      if (this.checked) {
        $(this).closest('tr').find('.selected-value input').val(1);
      } else {
        $(this).closest('tr').find('.selected-value input').val(0);
      }
      $('.select-task-count input').val(getSelectedCount());
    });


    $('.tasklist-table').show();
  });

});


function checkPermissions() {

  var user_id = $(".user-id input").val();
  var is_active_user = $(".user-isactive input").val();
  var user_type_id = $(".user-type-id input").val();
  var return_val = true;

  if ((user_type_id == null) || (user_type_id == '')) {
    return_val = false;
  }

  if ((user_id == null) || (user_id == '')) {
    return_val = false;
  }
  if ((is_active_user == null) || (is_active_user == '')) {
    return_val = false;
  }

  if (is_active_user == '0') {
    return_val = false;
  }

  if (user_id == '0') {
    return_val = false;
  }

  if (user_type_id != '1') {
    return_val = false;
  }

  return return_val;

}


function hasPreexistingTask(taskName, taskID, opNumber) {


  var return_val = false;
  var preexisting_rows = $('.preexisting-task-lookup-table table tbody tr');
  preexisting_rows.each(function (index) {
    let preexistingTaskName = $(this).find('.preexisting-task-lookup-table-name input').val();
    let preexistingTaskID = Number($(this).find('.preexisting-task-lookup-table-id input').val());
    let preexistingOpNumber = $(this).find('.preexisting-task-lookup-table-op input').val();
    if ((taskName == preexistingTaskName) && (opNumber == preexistingOpNumber) && (taskID != preexistingTaskID)) {
      return_val = true;
    }
  });
  return return_val;
}


function filterTable() {
  if ($('#filterRow').length == 0) {
    return;
  }

  var taskNameFilterValue = $('#txtFilter_TaskName').val();
  var taskTypeFilterVal = $('#cboFilter_TaskType').val();
  var assigneeFilterVal = $('#cboFilter_Assignee').val();

  $('.ftname input').val(taskNameFilterValue);

  if ((taskTypeFilterVal != null) && (taskTypeFilterVal.length > 0)) {
    let taskTypeID = taskTypeByNameMap.get(taskTypeFilterVal);
    $('.fttid input').val(taskTypeID);
  }
  else {
    $('.fttid input').val(0);
  }

  if ((assigneeFilterVal != null) && (assigneeFilterVal.length > 0)) {
    let assigneeID = assigneeNameMap.get(assigneeFilterVal);
    $('.faid input').val(assigneeID);
  }
  else {
    $('.faid input').val(0);
  }

  $('.tasklist-table').hide();
  $('.mandate-chk').remove();
  $("#chkSelectAll").prop('checked', false);
  selectAllTasks(false);
  $('.tid input').trigger("change");
}


function fillSelectedIDs() {
  var checkboxes = $("input[id^='Field21']");
  var selectedIDField = $('.selected-id-list input');
  $(selectedIDField).val('');
  if (checkboxes.length == 0) {
    return;
  }
  checkboxes.each(function () {
    if ($(this).is(':checked')) {
      var taskID = $(this).closest('tr').find('.task-id-col input').val();
      if (selectedIDField.val() == '') {
        selectedIDField.val(taskID);
      }
      else {
        selectedIDField.val(selectedIDField.val() + ',' + taskID);
      }
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


function generateFilterRow() {

  if ($('#filterRow').length == 0) {
    var filter_row = "<TR id='filterRow'><TH><input name='chkSelectAll' id='chkSelectAll' type='checkbox' class='check-all-manual'></TH><TH/><TH><input id='txtFilter_TaskName' type='text'/></TH><TH><select id='cboFilter_TaskType'/></TH><TH/><TH><select id='cboFilter_Assignee'/></TH><TH/><TH/><TH/><TH/><TH/><TH/><TH/></TR>"

    $('.tasklist-table table thead').append(filter_row);

    $("#chkSelectAll").on("click", function () {
      if ($("#chkSelectAll").is(":checked")) {
        selectAllTasks(true);
      }
      else {
        selectAllTasks(false);
      }
    });

    $("#txtFilter_TaskName").on("change", function () { filterTable(); });
    $("#cboFilter_TaskType").on("change", function () { filterTable(); });
    $("#cboFilter_Assignee").on("change", function () { filterTable(); });

    $("#txtFilter_TaskName").dblclick(function () { $("#txtFilter_TaskName").val(null).change(); });
    $("#cboFilter_TaskType").dblclick(function () { $("#cboFilter_TaskType").val(0).change(); });
    $("#cboFilter_Assignee").dblclick(function () { $("#cboFilter_Assignee").val(0).change(); });

  }

  if ((($('.ftname input').val() != null) && ($('.ftname input').val().length > 0)) && (($('#txtFilter_TaskName').val() == null) || ($('#txtFilter_TaskName').val() == ''))) {
    $('#txtFilter_TaskName').val($('.ftname input').val());
  }
  if (($(".tasktype-lookup-combo select option").length > 1) && ($("#cboFilter_TaskType option").length == 0)) {
    $("#cboFilter_TaskType").html($(".tasktype-lookup-combo select").html());
  }
  if (($(".assignee-lookup-combo select option").length > 1) && ($("#cboFilter_Assignee option").length == 0)) {
    $("#cboFilter_Assignee").html($(".assignee-lookup-combo select").html());
  }

}


function getSelectedCount() {
  var checkboxes = $("input[id^='Field21']");
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


function popupCancelNote(e) {
  $("#q80").dialog({
    title: "Please explain your reason for cancelling these tasks.",
    height: 350,
    width: 750,
    autoOpen: true,
    resizable: false,
    modal: true,
    close: function (event, ui) {
    },
    buttons: [
      {
        text: "OK",
        click: function () {
          $('#Field80').val($('#Field80').val().trim());
          let note_text = $('#Field80').val();
          if (note_text.length == 0) {
            $.alert({
              title: 'Error',
              content: 'You have to enter a reason for cancelling. You cannot save otherwise.',
              type: 'red',
              typeAnimated: true,
              buttons: {
                ok: function () { }
              }
            });
            return;
          }
          else {
            $('#Field90').val(note_text);
            $("#q80").dialog("close");
            $('#form1').submit();
          }
        }
      }
    ]
  });
}


function popupCompletionNote(e) {
  $("#q80").dialog({
    title: "Enter completion notes. (Not required.)",
    height: 350,
    width: 750,
    autoOpen: true,
    resizable: false,
    modal: true,
    close: function (event, ui) {
    },
    buttons: [
      {
        text: "OK",
        click: function () {
          var note_text = $('#Field80').val();
          $('#Field90').val(note_text);
          $("#q80").dialog("close");
          $('#form1').submit();
        }
      }
    ]
  });
}


function popupWaitingNote(e) {
  $("#q80").dialog({
    title: "Please explain what you are waiting on.",
    height: 350,
    width: 750,
    autoOpen: true,
    resizable: false,
    modal: true,
    buttons: [
      {
        text: "OK",
        click: function () {
          $('#Field80').val($('#Field80').val().trim());
          var note_text = $('#Field80').val();
          if (note_text.length == 0) {
            $.alert({
              title: 'Error',
              content: 'You have to enter what you are waiting on. You cannot save otherwise.',
              type: 'red',
              typeAnimated: true,
              buttons: {
                ok: function () { }
              }
            });
            return;
          }
          else {
            $('#Field90').val(note_text);
            $("#q80").dialog("close");
            $('#form1').submit();
          }
        }
      }
    ]
  });
}


function selectAllTasks(check_on) {
  var checkboxes = $("input[id^='Field21']");
  if (checkboxes.length == 0) {
    return;
  }
  checkboxes.each(function () {
    if (check_on == true)
      $(this).prop('checked', true);
    else
      $(this).prop('checked', false);
  });
  fillSelectedIDs();
  $('.select-task-count input').val(getSelectedCount());
}


function submitForm(e) {
  if (validateForm() == false) {
    e.preventDefault();
    return;
  }

  if ($('.update-status-id input').val() == '') {
    $('.update-status-id input').val(0);
  }
  if ($('.update-assignee-id input').val() == '') {
    $('.update-assignee-id input').val(0);
  }
  if ($('.update-task-type-id input').val() == '') {
    $('.update-task-type-id input').val(0);
  }

  var statusID = Number($('.update-status-id input').val());

  if (statusID != 0) {
    if (statusID == status_Cancelled) {
      e.preventDefault();
      popupCancelNote(e);
    }
    else if (statusID == status_Completed) {
      e.preventDefault();
      popupCompletionNote();
    }
    else if (statusID == status_Waiting) {
      e.preventDefault();
      popupWaitingNote();
    }
    else {
      $('#form1').submit();
    }
  }
 
}


function validateForm() {
  $(".tasklist-table table tbody tr").removeClass('parsley-error');
  $('.error-message input').val('');
  $('.color-error').removeClass('color-error');

  var formIsValid = true;
  var selectedCount = getSelectedCount();
  if (selectedCount == 0) {
    $.alert({
      title: 'Error',
      content: 'Please select at least one task to update.',
      type: 'red',
      typeAnimated: true,
      buttons: {
        ok: function () { }
      }
    });
    formIsValid = false;
  }

  var updateTaskTypeID = Number($('.update-task-type-id input').val());
  var updateStatusID = Number($('.update-status-id input').val());
  var updateOpNumber = $('.update-op-number input').val();
  var checked_rows = $("input[id^='Field21']").filter(':checked').closest('tr');


  checked_rows.each(function (index) {
    let taskID = Number($(this).find('.task-id-col input').val());
    let totalHours = Number($(this).find('.total-hours-col input').val());
    let taskName = $(this).find('.task-name-col input').val();
    let opNumber = $(this).find('.op-number-col input').val();

    if (updateStatusID == status_NotStarted) {
      if (totalHours > 0) {
        formIsValid = false;
        $(this).addClass('color-error');
        $(this).find('.error-message input').val(`This task has hours logged to it. You cannot set its status to 'Not Started'.`);
      }
    }

    if (updateTaskTypeID > 0) {
      let preexistingTask = false;

      if (updateOpNumber.length > 0) {
        preexistingTask = hasPreexistingTask(taskName, taskID, updateOpNumber);
      }
      else {
        preexistingTask = hasPreexistingTask(taskName, taskID, opNumber);
      }
      if (preexistingTask) {
        formIsValid = false;
        $(this).addClass('color-error');
        $(this).find('.error-message input').val(`A task with this name, type, and op number already exists in this ticket.`);
      }

    }

  });

  return formIsValid;
}