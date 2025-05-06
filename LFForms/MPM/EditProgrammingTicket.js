var mfgEngineerMap = new Map();
var mfgEngineerNameMap = new Map();
var qualEngineerMap = new Map();
var qualEngineerNameMap = new Map();
var assigneeMap = new Map();
var assigneeNameMap = new Map();
var taskTypeMap = new Map();
var taskTypeByNameMap = new Map();
var taskStatusMap = new Map();
var taskStatusNameMap = new Map();


$(document).ready(function () {
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

  $(document).on('change', '.ticket-number input', function (e) {
    var ticket_name = $(this).val();
    $(document).prop('title', `Edit Ticket ${ticket_name}`);
  });


  if ($('.closeme input').val() == 1) {
    $('#form1').hide();
    window.parent.postMessage('CloseDialogWithRefresh', '*');
  }

  $(document).on('change', '.quality-engineer-combo select', function () {
    let qeName = $('.quality-engineer-combo select').val();
    let qeID = qualEngineerNameMap.get(qeName);
    $('.qeid input').val(qeID);
  });

  $(document).on('change', '.manufacturing-engineer-combo select', function () {
    let meName = $('.manufacturing-engineer-combo select').val();
    if (meName.length == 0) {
      $('.meid input').val(0);
    }
    else {
      let meID = mfgEngineerNameMap.get(meName);
      $('.meid input').val(meID);
    }
  });



  window.onmessage = function (event) {

    if (event.data == "CloseDialogWithRefresh") {
      $("#popupIFrame").dialog("destroy");
      $("#popupIFrame").remove();
      refreshForm();
    }
  };

  $(document).on('lookupcomplete', function (e) {
    loadMfgEngineerMap();
    loadQualEngineerMap();
    loadAssigneeMap();
    loadStatusMap();
    loadTaskTypeMap();

    if (($('.mename input').val() != null) && ($('.manufacturing-engineer-combo select option').length > 0)) {
      $('.manufacturing-engineer-combo select').val($('.mename input').val());
      $('.meid input').val(mfgEngineerNameMap.get($('.mename input').val()));
    }
    if (($('.qename input').val() != null) && ($('.quality-engineer-combo select option').length > 0)) {
      $('.quality-engineer-combo select').val($('.qename input').val());
      $('.qeid input').val(qualEngineerNameMap.get($('.qename input').val()));
    }
    generateTaskListColumnFields();

    if (checkPermissions() == false) {
      $('.Submit').hide();
      $('.manufacturing-engineer-combo select').removeClass('ui-state-disabled').addClass('ui-state-disabled');
      $('.quality-engineer-combo select').removeClass('ui-state-disabled').addClass('ui-state-disabled');
      $('.cell-leader-combo select').removeClass('ui-state-disabled').addClass('ui-state-disabled');
      $('.add-button').addClass("ui-state-disabled");
    }
    else {
      $('.Submit').show();
      $('.manufacturing-engineer-combo select').removeClass('ui-state-disabled');
      $('.quality-engineer-combo select').removeClass('ui-state-disabled');
      $('.cell-leader-combo select').removeClass('ui-state-disabled');
      $('.add-button').removeClass("ui-state-disabled");
    }

    if (isMetrologyUser()) {
      if ($('.group-edit-button').length == 0) {
        $('.tasklist-table .cf-section-header').prepend('<div class="choice include-choice"><input name="chkIncludeComplete" id="chkIncludeComplete" type="checkbox" ><label class="form-option-label" for="chkIncludeComplete">Include Completed</label></div><div class="ui-button group-edit-button" onclick="callGroupEdit()"><span title="Group Edit" class="ui-button-icon ui-icon ui-icon-clipboard"></span>Group Edit</div>');
      }
    }
    else {
      if ($('.include-choice').length > 0) {
        let include_chk = '<div class="choice include-choice"><input name="chkIncludeComplete" id="chkIncludeComplete" type="checkbox" ><label class="form-option-label" for="chkIncludeComplete">Include Completed</label></div>'
        $('.tasklist-table .cf-section-header').prepend(include_chk);
      }
    }

    if ($('.add-button').length == 0) {
      let add_button = '<div class="ui-button add-button" onclick="addTask()"><span title="AddTicket" class="ui-button-icon ui-icon ui-icon-plusthick"></span>Add Task</div>';
      $(add_button).insertBefore('.tasklist-table table')
    }

    $('#chkIncludeComplete').on('change', function () {
      filterTable();
    });
    generateFilterRow();
    $('.tasklist-table').show();
  });

  $(document).on("onloadlookupfinished", function (e) {
    $('.closeme input').val(1);
    $('#q0').append("<div class='hidden-text' id='popUpDiv'></div>");
    $('.detail-input div').on("dblclick", function (e) {
      var notes = $(this).find('textarea').val();
      console.log(notes);
      $.dialog({
        escapeKey: true,
        backgroundDismiss: true,
        title: 'Ticket Details',
        content: notes,
      });
    });

    var ticketID = $('.tid input').val();
    if ((ticketID != '') && (ticketID != '0')) {
      $('#ticket-history').append(`<iframe id='ticket-history-iframe' name='ticket-history-iframe' src='http://rmslf/Forms/MPM-ProgamTicketHistory?tid=${ticketID}' height='500' width='100%'/>`);
      if ($('.quality-engineer-combo select option').length == 1) {
        console.log('No QE');
        $('.ticket-department-id input').trigger("change");
      }
    }

    if (($('.site-id input').val() != '0') && ($('.site-id input').val() != '')) {
      let assingeesCombo = $('.assignee-lookup-combo select option');
      if (typeof assingeesCombo !== 'undefined') {
        $('.site-id input').trigger("change");
      }
      else if (assingeesCombo.length < 2) {
        $('.site-id input').trigger("change");
      }
    }

    $('.network-user-name input').trigger("change");
    $('.fincomp input').val(0).change();
  });
});


function addTask() {
  var ticketID = $('.tid input').val();
  var widowHeight = $(window).height();
  widowHeight = widowHeight - 50;
  popUpIframe(`http://rmslf/Forms/MPM-AddProgrammingTask?pid=${ticketID}`, 'Add Task', widowHeight, 1300);
}


function callAddTime(task_id) {
  if (checkPermissions() == true) {
    var task_name = getColumnValueByTaskID(task_id, '.tasklist-task-name-col input[type="text"]');
    popUpIframe(`http://rmslf/Forms/MPMAddTaskTime?tid=${task_id}`, `Add Time to task '${task_name}'`, 300, 800, false, task_id);
  }
}


function callCloneTask(task_id) {
  var user_type_id = Number($(".user-type-id input").val());
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


function callGroupEdit() {
  var ticketId = $('.tid input').val();
  var ticketNumber = $('.ticket-number input').val();
  var widowHeight = $(window).height();
  widowHeight = widowHeight - 50;
  popUpIframe(`http://rmslf/Forms/MPM-TaskGroupEdit?tid=${ticketId}`, `Group Edit Ticket '${ticketNumber}'`, widowHeight, 1300);
}


function callShowDetails(task_id) {
  var widowHeight = $(window).height();
  widowHeight = widowHeight - 50;
  popUpIframe(`http://rmslf/Forms/MPM-EditProgrammingTask?tid=${task_id}`, 'Task Details', widowHeight, 1300);
}


function checkPermissions() {
  var user_type_id = Number($(".user-type-id input").val());
  var user_department_id = Number($(".user-department-id input").val());
  var ticket_department_id = Number($(".ticket-department-id input").val());

  if (typeof $('.user-type-id input').val() === 'undefined') {
    return false;
  }

  if (user_type_id == 1) {
    return true;
  }
  else {
    if (user_department_id == ticket_department_id) {
      return true;
    }
  }

  return false;
}


function filterTable() {
  if ($('#filterRow').length == 0) {
    return;
  }

  //$('.tasklist-table').hide();
  var includeCompleted = $('#chkIncludeComplete').is(':checked');
  var taskNameFilterValue = $('#txtFilter_TaskName').val();
  var taskTypeFilterVal = $('#cboFilter_TaskType').val();
  var statusFilterVal = $('#cboFilter_Status').val();
  var assigneeFilterVal = $('#cboFilter_Assignee').val();


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
    $('.faid input').val(assigneeID);
  }
  else {
    $('.faid input').val(0);
  }

  removeAppendedFields();

  if (includeCompleted) {
    $('.fincomp input').val(1).change();
  }
  else {
    $('.fincomp input').val(0).change();
  }

}


function generateFilterRow() {

  if ($('#filterRow').length == 0) {

    var filter_row = "<TR id='filterRow'><TH/><TH/><TH/><TH><input type='text' id='txtFilter_TaskName'></TH><TH><select id='cboFilter_TaskType'/></TH><TH><select id='cboFilter_Assignee'/></TH><TH><select id='cboFilter_Status'/></TH><TH/><TH/><TH/><TH><TH/><TH/></TR>"
    $('.tasklist-table table thead').append(filter_row);
    $("#txtFilter_TaskName").on("change", function () { filterTable(); });
    $("#cboFilter_Status").on("change", function () { filterTable(); });
    $("#cboFilter_TaskType").on("change", function () { filterTable(); });
    $("#cboFilter_Assignee").on("change", function () { filterTable(); });

    $("#txtFilter_TaskName").dblclick(function () { $("#txtFilter_TaskName").val(null).change(); });
    $("#cboFilter_Status").dblclick(function () { $("#cboFilter_Status").val(0).change(); });
    $("#cboFilter_TaskType").dblclick(function () { $("#cboFilter_TaskType").val(0).change(); });
    $("#cboFilter_Assignee").dblclick(function () { $("#cboFilter_Assignee").val(0).change(); });
    wireUpSortFields();
  }

  if ((($('.ftname input').val() != null) && ($('.ftname input').val().length > 0)) && (($('#txtFilter_TaskName').val() == null) || ($('#txtFilter_TaskName').val() == ''))) {
    $('#txtFilter_TaskName').val($('.ftname input').val());
  }

  if (($(".status-lookup-combo select option").length > 1) && ($("#cboFilter_Status option").length == 0)) {
    $("#cboFilter_Status").html($(".status-lookup-combo select").html());
  }
  if (($(".tasktype-lookup-combo select option").length > 1) && ($("#cboFilter_TaskType option").length == 0)) {
    $("#cboFilter_TaskType").html($(".tasktype-lookup-combo select").html());
  }
  if (($(".assignee-lookup-combo select option").length > 1) && ($("#cboFilter_Assignee option").length == 0)) {
    $("#cboFilter_Assignee").html($(".assignee-lookup-combo select").html());
    $("#cboFilter_Assignee option").eq(0).after($('<option>', {
      value: 'Unassigned',
      text: 'Unassigned'
    }));

  }
  
}

function generateTableButtons(buttonSelector, buttonClass, buttonTitle, buttonFunction, disabled) {
  var btn_html = '';
  var selectionString = buttonSelector + " input[type=text]";
  var buttons = $(selectionString);
  buttons.each(function () {
    let btn_value = $(this).val();
    $(this).parent().find(`.table-button`).remove();


    if (disabled == true) {
      btn_html = `<div class='table-button ui-button ui-state-disabled' onclick='javascript:void(0);'><span title='${buttonTitle}' class='ui-button-icon ui-icon ui-state-disabled ${buttonClass}'/></div>`
    }
    else {
      btn_html = `<div class='table-button ui-button' onclick='${buttonFunction}(${btn_value})'><span title='${buttonTitle}' class='ui-button-icon ui-icon ${buttonClass}'/></div>`
    }

    $(this).parent().append(btn_html);
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
    let has_link = $(this).parent().find('.task-link').length;
    if (!has_link) {
      let task_id = $(task_ids[index]).val();
      let task_name = $(this).val();
      let task_link = $("<a>", { text: task_name.substr(0, 30), class: 'task-link', href: `javascript:void(0);`, onclick: `callShowDetails(${task_id})` });
      $(this).parent().append(task_link);
    }
  });
}


function generateTaskListColumnFields() {

  var has_permissions = checkPermissions();

  if ($('.tasklist-table table tbody tr').length > 0) {
    if (has_permissions == false) {
      generateTableButtons(".task-list-clone-col", "ui-icon-newwin", "Clone Task", "callCloneTask", true);
      generateTableButtons(".tasklist-time-col", "ui-icon-clock", "Add Time", "callAddTime", true);
    }
    else {
      if (!isMetrologyUser()) {
        generateTableButtons(".tasklist-time-col", "ui-icon-clock", "Add Time", "callAddTime", true);
      }
      else {
        generateTableButtons(".tasklist-time-col", "ui-icon-clock", "Add Time", "callAddTime", false);
      }
      generateTableButtons(".task-list-clone-col", "ui-icon-newwin", "Clone Task", "callCloneTask", false);
    }

    generateTableCheckBox(".tasklist-mandate-col", "mandate-chk");
    generateTaskColumn();

  }
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


function isMetrologyUser() {
  if (($('.user-type-id input').val() == '1') && ($('.user-isactive input').val() == '1')) {
    return true;
  }
  return false;
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
    assigneeMap.set(-1, 'Unassigned');
    assigneeNameMap.set('Unassigned', -1);
  }
}


function loadMfgEngineerMap() {
  if (mfgEngineerMap.keys.length == 0) {
    var me_rows = $('.me-lookup-table table tbody tr');
    if (me_rows.length == 0) {
      return;
    }
    me_rows.each(function (index) {
      meID = Number($(this).find('.me-lookup-table-id input').val());
      meName = $(this).find('.me-lookup-table-name input').val();
      mfgEngineerMap.set(meID, meName);
      mfgEngineerNameMap.set(meName, meID);
    });
  }
}


function loadQualEngineerMap() {
  if (qualEngineerMap.keys.length == 0) {
    var qe_rows = $('.qe-lookup-table table tbody tr');
    if (qe_rows.length == 0) {
      return;
    }
    qe_rows.each(function (index) {
      qeID = Number($(this).find('.qe-lookup-table-id input').val());
      qeName = $(this).find('.qe-lookup-table-name input').val();
      qualEngineerMap.set(qeID, qeName);
      qualEngineerNameMap.set(qeName, qeID);
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


function popUpIframe(src, title, height, width) {

  $("#popupIFrame").remove();
  $("#popUpDiv").html(`<div height='${height}' width='${width}'><iframe id='popupIFrame' name='myname' src='${src}' height='${height}' width='${width}'/></div>`);
  $("#popupIFrame").dialog({
    title: title,
    height: height,
    width: width,
    autoOpen: false,
    resizable: true,
    modal: true,
    position: { my: "left top", at: "left top", of: window },
    close: function (event, ui) {

    }
  });


  $("#popupIFrame").dialog("open");
  $('#popupIFrame').attr('style', `width: 100%; height: ${height}px;`);
}


function refreshForm() {
  var current_url = window.location.href;
  window.location = current_url;
}


function removeAppendedFields() {
  
  $('.table-button').remove();
  $('.task-link').remove();
}


function submitForm(e) {
  if ($('.meid input').val() == '') {
    $('.meid input').val(0);
  }
}


function sortTable(newSortOrdinal, selector) {
  
  removeAppendedFields();
  $('.sort-icon').remove();

  var currentSortOrdinal = Number($('.sort-field-ordinal input').val());
  var sortDirection = Number($('.sort-direction input').val());

  if (newSortOrdinal == currentSortOrdinal) {
    if (sortDirection == 0) {
      sortDirection = 1
      $('.sort-direction input').val(1).change();
    }
    else {
      sortDirection = 0;
      $('.sort-direction input').val(0).change();
    }
  }
  else {
    $('.sort-field-ordinal input').val(newSortOrdinal);
    $('.sort-direction input').val(0).change();
    sortDirection = 0;
  }

    if (sortDirection == 0) {
      $(`${selector} .cf-col-label`).append('<span class="ui-icon ui-icon-triangle-1-n sort-icon"></span>');
    }
    else {
      $(`${selector} .cf-col-label`).append('<span class="ui-icon ui-icon-triangle-1-s sort-icon"></span>');
    }
}


function wireUpSortFields() {

  $('#q47 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-n sort-icon"></span>');

  $('#q47').on('click', function () { sortTable(0, '#q47'); });
  $('#q48').on('click', function () { sortTable(1, '#q48'); });
  $('#q49').on('click', function () { sortTable(2, '#q49'); });
  $('#q50').on('click', function () { sortTable(3, '#q50'); });
  $('#q52').on('click', function () { sortTable(4, '#q52'); });
  $('#q53').on('click', function () { sortTable(5, '#q53'); });
  $('#q54').on('click', function () { sortTable(6, '#q54'); });
  $('#q55').on('click', function () { sortTable(7, '#q55'); });

}