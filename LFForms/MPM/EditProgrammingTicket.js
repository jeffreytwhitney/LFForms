var mfgEngineerMap = new Map();
var mfgEngineerNameMap = new Map();
var qualEngineerMap = new Map();
var qualEngineerNameMap = new Map();


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


    $('.tasklist-duedate-col input').each((i, dateField) => $(dateField).val($(dateField).val().split(" ")[0]));
    $('.tasklist-schedduedate-col input').each((i, dateField) => $(dateField).val($(dateField).val().split(" ")[0]));
    $('.tasklist-date-completed-col input').each((i, dateField) => $(dateField).val($(dateField).val().split(" ")[0]));


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
    }
    else {
      $('.Submit').show();
      $('.manufacturing-engineer-combo select').removeClass('ui-state-disabled');
      $('.quality-engineer-combo select').removeClass('ui-state-disabled');
      $('.cell-leader-combo select').removeClass('ui-state-disabled');
    }

    if (isMetrologyUser()) {
      if ($('.group-edit-button').length == 0) {
        $('.tasklist-table .cf-section-header').prepend('<div class="ui-button group-edit-button" onclick="callGroupEdit()"><span title="Group Edit" class="ui-button-icon ui-icon ui-icon-clipboard"></span>Group Edit</div>');
      }
    }


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
    $('.network-user-name input').trigger("change");
  });
});


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

  var user_id = $(".user-id input").val();
  var is_active_user = $(".user-isactive input").val();
  var user_type_id = $(".user-type-id input").val();
  var user_department_id = $(".user-department-id input").val();
  var ticket_department_id = $(".ticket-department-id input").val();
  var return_val = true;


  if (user_type_id == '1') {
    return return_val;
  }

  if ((user_type_id == null) || (user_type_id == '')) {
    return_val = false;
  }
  if ((user_department_id == null) || (user_department_id == '')) {
    return_val = false;
  }
  if ((ticket_department_id == null) || (ticket_department_id == '')) {
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
    if (user_department_id !== ticket_department_id) {
      return_val = false;
    }
  }

  return return_val;

}


function generateTableButtons(buttonSelector, buttonClass, buttonTitle, buttonFunction, disabled) {
  var btn_html = '';
  var selectionString = buttonSelector + " input[type=text]";
  var buttons = $(selectionString);
  buttons.each(function () {
    let btn_value = $(this).val();
    $(this).parent().find(`.table-button`).remove();


    if (disabled == true) {
      btn_html = `<div class='table-button ui-button ui-state-disabled'><span title='${buttonTitle}' class='ui-button-icon ui-icon ui-state-disabled ${buttonClass}' onclick='javascript:void(0);'/></div>`
    }
    else {
      btn_html = `<div class='table-button ui-button'><span title='${buttonTitle}' class='ui-button-icon ui-icon ${buttonClass}' onclick='${buttonFunction}(${btn_value})'/></div>`
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


function submitForm(e) {
  if ($('.meid input').val() == '') {
    $('.meid input').val(0);
  } 
}