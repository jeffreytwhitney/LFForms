var assigneeMap = new Map();
var assigneeNameMap = new Map();
var taskTypeMap = new Map();
var taskTypeByNameMap = new Map();
var taskStatusMap = new Map();
var taskStatusNameMap = new Map();

$(document).ready(function () {
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  var bootstrapButton = $.fn.button.noConflict();
  $.fn.bootstrapBtn = bootstrapButton;

  $('.user-id input').on('change', function () {
    $('.aid input').val($('.user-id input').val()).change();
  });

  $('.ted input').val(moment().format("l"));

  window.onmessage = function (event) {
    $("#popupIFrame").dialog("destroy");
    $("#popupIFrame").remove();
  };


  $(document).on("onloadlookupfinished", function (e) {
    $('#q0').append("<div class='hidden-text' id='popUpDiv'></div>");
    $(".tasklist-filter-checks input").on("change", function () { filterTaskListTable(); });
    $('.network-user-name input').val($('.lf-user-name input').val().toUpperCase().substr($('.lf-user-name input').val().lastIndexOf('\\') + 1)).change();
    generateFilterRow();

    $('.assignee-lookup select').on('change', function () {
      var assigneeName = $('.assignee-lookup select').val();
      if ((assigneeName == null) || (assigneeName.length == 0)) {
        return;
      }
      var assigneeID = assigneeNameMap.get(assigneeName);
      if (assigneeID != null) {
        $('.aid input').val(assigneeID).change();
      }
    });

  });

  $(document).on('lookupcomplete', function (e) {
    $('.due-date-col input').each((i, dateField) => $(dateField).val($(dateField).val().split(" ")[0]));
    loadAssigneeMap();
    loadStatusMap();
    loadTaskTypeMap();
    generateTableButtons(".task-id-col", "ui-icon-document", "Add Note", "callAddNote");

    if ($('.assignee-lookup select').val().length == 0) {
      $('.assignee-lookup select').val($('.user-name input').val());
    }

    $('.assignee-lookup select option').filter(function () {
      return this.hasAttribute('value') == false;
    }).remove();
    if (checkPermissions() == false) {
      $('.Submit').hide();
    }
    else {
      $('.Submit').show();
    }
    $('.tasklist-table').show();
  });


});


function callAddNote(task_id) {
  var task_name = getColumnValueByTaskID(task_id, '.task-name-col input[type="text"]');
  popUpIframe(`http://rmslf/Forms/MPMAddNote?TaskID=${task_id}&nt=1`, `Add Note for task '${task_name}'`, 400, 650, task_id);
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


function filterTaskListTable() {

  if ($('#filterRow').length == 0) {
    return;
  }

  if ($("#Field25-0").is(":checked")) {
    $('.fincns input').val(1);
  }
  else {
    $('.fincns input').val(0);
  }

  if ($("#Field25-1").is(":checked")) {
    $('.fexwop input').val(1);
  }
  else {
    $('.fexwop input').val(0);
  }

  var taskNameFilterValue = $('#txtFilter_TaskName').val();
  var taskTypeFilterVal = $('#cboFilter_TaskType').val();
  var statusFilterVal = $('#cboFilter_Status').val();
  var assigneeFilterVal = $('.assignee-lookup select').val();


  $('.ftname input').val(taskNameFilterValue);



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
    $('.aid input').val(assigneeID);
  }
  else {
    $('.aid input').val($('.user-id input').val());
  }


  $('.tasklist-table').hide();
  removeAppendedFields();
  $('.aid input').trigger("change");

}


function generateFilterRow() {

  if ($('#filterRow').length == 0) {

    var filter_row = "<TR id='filterRow'><TH/><TH><input type='text' id='txtFilter_TaskName'></TH><TH><select id='cboFilter_Status'/></TH><TH><select id='cboFilter_TaskType'/></TH><TH/><TH/><TH/></TR>"
    $('.tasklist-table table thead').append(filter_row);
    $("#txtFilter_TaskName").on("change", function () { filterTaskListTable(); });
    $("#cboFilter_Status").on("change", function () { filterTaskListTable(); });
    $("#cboFilter_TaskType").on("change", function () { filterTaskListTable(); });

    $("#txtFilter_TaskName").dblclick(function () { $("#txtFilter_TaskName").val(null).change(); });
    $("#cboFilter_Status").dblclick(function () { $("#cboFilter_Status").val(0).change(); });
    $("#cboFilter_TaskType").dblclick(function () { $("#cboFilter_TaskType").val(0).change(); });
  }

  if ((($('.ftname input').val() != null) && ($('.ftname input').val().length > 0)) && (($('#txtFilter_TaskName').val() == null) || ($('#txtFilter_TaskName').val() == ''))) {
    $('#txtFilter_TaskName').val($('.ftname input').val());
  }

  if (($(".status-lookup select option").length > 0) && ($("#cboFilter_Status option" == 0))) {
    $("#cboFilter_Status").html($(".status-lookup select").html());
  }
  if (($(".task-type-lookup select option").length > 0) && ($("#cboFilter_TaskType option" == 0))) {
    $("#cboFilter_TaskType").html($(".task-type-lookup select").html());
  }

}


function getColumnValueByTaskID(task_id, column_name) {

  var tasklist_rows = $(".tasklist-table table tbody tr");
  var task_ids = $('.task-id-col input[type="text"]');
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


function popUpIframe(src, title, height, width, task_id) {
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
    }
  });


  $("#popupIFrame").dialog("open");
  $('#popupIFrame').attr('style', `width: 100%; height: ${height}px;`);
}


function removeAppendedFields() {
  $('.note-button').remove();
}
