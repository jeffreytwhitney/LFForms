var should_print_receipt = true;
$.getScript("https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js", function () {
  WebFont.load({
    google: {
      families: ['Montserrat', 'Libre Barcode 128']
    }
  });
});
$(document).ready(function () {

  $('.Submit').hide();

  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simplePagination.js/1.6/simplePagination.min.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
  var bootstrapButton = $.fn.button.noConflict(); // return $.fn.button to previously assigned value
  $.fn.bootstrapBtn = bootstrapButton;

  $(document).prop('title', 'Gage Maintenance');
  $('#q0').append("<div class='hidden-text' id='popUpDiv'></div>");


  var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
  var printEvent = window[eventMethod];
  var messageEvent = eventMethod === "attachEvent" ? "onmessage" : "message";

  printEvent(messageEvent, function (e) {

    if (e.data === "printme" || e.message === "printme") {
      console.log('Print Event Called');

      $("#popupIFrame").get(0).contentWindow.print();
    }
  });

  window.onmessage = function (event) {
    //This is the callback from the IFrame.
    //If the event data says "Close Dialog", it destroys the dialog, (so that the close function won't fire).
    //If it says "CloseDialogWithRefresh", it destroys the dialog and refreshes the form.
    //I don't refresh if you add a note, for example. But if you do anything that will show up on the page, (adding time, cloning a task, etc)
    //then I do a refresh.
    if (event.data == "CloseDialog") {
      console.log('Task Maintenance closing dialog');
      $("#popupIFrame").dialog("destroy");
      $("#popupIFrame").remove();
    }
    if (event.data == "CloseDialogWithRefresh") {
      console.log('Task Maintenance closing dialog');
      $("#popupIFrame").dialog("destroy");
      $("#popupIFrame").remove();
      refreshPage();
    }
  };


  $(document).on("onloadlookupfinished", function () {
    $('.Submit').hide();

    generateFormButtons();

    formatDateFields('Field123');
    formatDateFields('Field124');
    formatDateFields('Field166');

    $('.gage-table .cf-table_parent').append('<div id="pagination" class="paginationjs-small"></div>');
    
    wireupComboBoxEvents();

    $('.gage-table').css("visibility", "visible");

  });


  $(document).on('lookupcomplete', function (e) {

    if (e.triggerId == 'Field219') {
      if ($('.print-ticket-id input').val()) {
        if ($('.print-ticket-id input').val() != "0") {
          if ($('.print-ticket-type-id input').val()) {
            print_receipt();
          }
        }
      }
    }
  })

  $('.ticket-table-created-on input').each((i, dateField) => $(dateField).val($(dateField).val().split(" ")[0]));
  $('.ticket-table-last-cal input').each((i, dateField) => $(dateField).val($(dateField).val().split(" ")[0]));
  $('.ticket-table-cal-due-date input').each((i, dateField) => $(dateField).val($(dateField).val().split(" ")[0]));

});


function appendPagination() {

  var current_page = Number($('.pg input').val());
  if (current_page == 999) { return; }

  var row_count = getTicketRowCount();

  if (row_count > 0) {
    $('#ticket-table-pagination').remove();
    if ((current_page == 1) && (row_count < 25)) {
      $('.ticket-table table').parent().append("<div id='ticket-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled'>‹</a></li><li><a class='page-link next isDisabled'>›</a></li></ul></div>");
      return;
    }
    if ((current_page == 1) && (row_count == 25)) {
      $('.ticket-table table').parent().append("<div id='ticket-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled'>‹</a></li><li><a class='page-link next' onclick='callNextPage();' href='javascript:void(0);'>›</a></li></ul></div>")
      return;
    }
    if ((current_page > 1) && (row_count == 25)) {
      $('.ticket-table table').parent().append("<div id='ticket-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev' onclick='callPrevPage();' href='javascript:void(0);''>‹</a></li><li><a class='page-link next' onclick='callNextPage();' href='javascript:void(0);'>›</a></li></ul></div>")
      return;
    }
    if ((current_page > 1) && (row_count < 25)) {
      $('.ticket-table table').parent().append("<div id='ticket-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev' onclick='callPrevPage();' href='javascript:void(0);''>‹</a></li><li><a class='page-link next isDisabled'>›</a></li></ul></div>")
      return;
    }
  }
}


function callCalibrate(ticket_id) {
  $("#Field219").val(ticket_id)
  var has_permissions = checkPermissions();
  if (has_permissions) {
    var $ticketTypeID = getTicketTypeIDByTicketID(ticket_id);

    $("#Field41-1").prop("checked", true);

    if ($ticketTypeID == "1") {
      $("#Field27").val(ticket_id).change();
    }
    else if ($ticketTypeID == "2") {
      $("#Field45").val(ticket_id).change();
    }
    else if ($ticketTypeID == "3") {
      $("#Field61").val(ticket_id).change();
    }

    $('.Submit').show();
  }
  else {
    alert("Sorry, you do not have permissions to do this.");
  }
}


function callHistory(ticket_id) {

  var $ticketTypeID = getTicketTypeIDByTicketID(ticket_id);

  if ($ticketTypeID == "1") {
    $("#Field177").val(ticket_id).change();
  }
  else if ($ticketTypeID == "2") {
    $("#Field175").val(ticket_id).change();
  }
  else if ($ticketTypeID == "3") {
    $("#Field176").val(ticket_id).change();
  }

}


function callMissing(ticket_id) {

  var has_permissions = checkPermissions();
  if (has_permissions) {

    $("#Field41-3").prop("checked", true).change();
    $("#Field102").val(ticket_id).change();
    $("#Field73").val(ticket_id).change();
    $("#Field219").val(ticket_id)

    $('.Submit').show();
  }
  else {
    alert("Sorry, you do not have permissions to do this.");
  }

}


function callNextPage() {
  $('.tasklist-table').hide();
  removeAppendedFields();
  current_page = Number($('.tasklist-page input').val());
  $('.tasklist-page input').val(current_page + 1).change();
}


function callPrevPage() {
  $('.tasklist-table').hide();
  removeAppendedFields();
  current_page = Number($('.tasklist-page input').val());
  if (current_page == 1) {
    return;
  }
  $('.tasklist-page input').val(current_page - 1).change();
}


function callPrint(ticket_id) {
  should_print_receipt = true;
  var ticketTypeID = getTicketTypeIDByTicketID(ticket_id);
  $('.print-ticket-id input').val(ticket_id);
  $('.print-ticket-type-id input').val(ticketTypeID);
  print_receipt();
}


function callReturn(ticket_id) {

  $.confirm({
    title: 'Are you sure?',
    content: 'Are you sure you wish to return this ticket? It cannot be undone.',

    buttons: {
      ok: {
        text: "ok!",
        keys: ['enter'],
        action: function () {
          var has_permissions = checkPermissions();
          if (has_permissions) {
            $("#filterRow").remove();
            $("#Field41-0").prop("checked", true).change();
            $("#Field73").val(ticket_id).change();
            $("#form1").submit();
          }
          else {
            alert("Sorry, you do not have permissions to do this.");
          }
        }
      },
      cancel: function () {

      }
    }
  });

}


function checkPermissions() {

  var employee_number = $("#Field87").val();
  var is_active_user = $("#Field88").val().toString();
  var return_val = true;

  if (is_active_user == "False") {
    return_val = false;
  }

  if (employee_number == '') {
    return_val = false;
  }

  return return_val
  //return true;
}


function formatDateFields(selector) {

  $(`[id^='${selector}']`).each((i, dateField) => $(dateField).val($(dateField).val().split(" ")[0]));

}


function generateButtons(buttonSelector, buttonClass, buttonTitle, buttonFunction) {
  var selectionString = buttonSelector + " input[type=text]";
  var buttons = $(selectionString);
  buttons.each(function () {
    var btn_value = $(this).val();
    var btn_html = "<input class='" + buttonClass + "' type='button' value='" + buttonTitle + "' onclick='" + buttonFunction + "(" + btn_value + ")' />";
    $(this).parent().append(btn_html);
  });
}


function generateFilterRow() {
  var $filter_row = "<TR id='filterRow'><TD/><TD/><TD/><TD/><TD/><td><input type='text' name='txtFilter_TicketNumber' id='txtFilter_TicketNumber'></td><TD><select name='cboFilter_TicketType' id='cboFilter_TicketType' style='width:100%'/></TD><TD><select name='cboFilter_Department' id='cboFilter_Department' style='width:100%'/></td><TD/><TD><select name='cboFilter_MachineGroup' id='cboFilter_MachineGroup' style='width:100%'/></td><td><select name='cboFilter_Operator' id='cboFilter_Operator'></td><td><select name='cboFilter_CellLeader' id='cboFilter_CellLeader'></td><TD/><TD/><TD/><TD/><TD/><TD/><TD/><TD/><TD/><TD/></TR>";
  $('.gage-table table tbody tr:first').parent().prepend($filter_row);
  $("#cboFilter_Department").html($("#Field52").html());
  $("#cboFilter_TicketType").html($("#Field75").html());
  $("#cboFilter_MachineGroup").html($("#Field72").html());
  fillComboBoxWithUniqueValues('#cboFilter_Operator', "Field121");
  fillComboBoxWithUniqueValues('#cboFilter_CellLeader', "Field122");

}


function generateFormButtons() {
  $('.gage-table table tbody tr').addClass("gage-row");
  generateButtons(".gage-table-return-button", "return-button", "Return", "callReturn");
  generateButtons(".gage-table-calibrate-button", "cal-button", "Calibrate", "callCalibrate");
  generateButtons(".gage-table-history-button", "history-button", "History", "callHistory");
  generateButtons(".gage-table-print-button", "print-button", "Print", "callPrint");
  generateMissingButtons();
}


function generateMissingButtons() {
  var missing_buttons = $(".gage-table-missing-button input[type=text]");

  missing_buttons.each(function (index) {

    let ticket_id = $(this).val();
    let ticket_type = getTicketTypeIDByTicketID(ticket_id);
    if (ticket_type == "2") {
      $(this).parent().append("<input class='return' type='button' value='Missing' onclick='callMissing(" + ticket_id + ")' />");
    }
  });
}


function getTicketTypeIDByTicketID(ticket_id) {
  var $ticket_typeid;
  var $ticket_ids = $(".gage-table-hidden table .Gages_TicketID_Column");

  $ticket_ids.each(function (index) {
    var $row_ticket_id = $(this).find('input[type=text]:first').val();
    if ($row_ticket_id == ticket_id) {
      $ticket_typeid = $(this).parent().find(".Gages_TicketTypeID_Column").find('input[type=text]:first').val();
      return;
    }
  });
  return $ticket_typeid;
}


function loadiFrame(src) {
  $("#popUpDiv").html("<iframe id='popupIFrame' name='popupIFrame' src='" + src + "' />");
}


function popUpIframe(src, title, height, width, dorefresh, task_id) {
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
      if (dorefresh) {
        resetAssignee(task_id);
        resetTaskStatus(task_id);
      }
    }
  });


  $("#popupIFrame").dialog("open");
  $('#popupIFrame').attr('style', `width: 100%; height: ${height}px;`);
}


function print_receipt() {

  var domain = document.location.hostname;
  var receipt_url_root = "http://" + domain + "/Forms/";
  var receipt_url = "";



  if ($('.print-ticket-type-id input').val() == 1) {
    receipt_url = receipt_url_root + "PinGageReceipt?TicketID=" + $('.print-ticket-id input').val();
  }
  if ($('.print-ticket-type-id input').val() == 2) {
    receipt_url = receipt_url_root + "ThreadReceipt?TicketID=" + $('.print-ticket-id input').val();
  }

  if (should_print_receipt == true) {
    if (receipt_url != "") {
      loadiFrame(receipt_url);
      should_print_receipt == false;
      $('.print-ticket-id input').val(0).change();
    }
  }
}


function reApplyFilterValues() {
  if ($('#filterRow').length == 0) {
    return;
  }

  var taskNameFilterValue = $('.ftname input').val();
  var projectNameFilterValue = $('.fpname input').val();
  var projectIDFilterValue = Number($('.fpid input').val());

  var taskTypeFilterVal = Number($('.fttid input').val());
  var statusFilterVal = Number($('.fsid input').val());
  var assigneeFilterVal = Number($('.faid input').val());
  var departmentFilterVal = Number($('.fdid input').val());
  var qeFilterVal = Number($('.fqeid input').val());
  var initiatorFilterVal = $('.finitid input').val();

  if (qeFilterVal != 0) {
    let qeName = qualityEngineerMap.get(qeFilterVal);

    $('#cboFilter_QE').val(qeName);
  }


  if (initiatorFilterVal != 0) {

    let initiatorName = initiatorMap.get(initiatorFilterVal);

    $('#cboFilter_Initiator').val(initiatorName);
  }
  else {

    $("#cboFilter_Initiator").val($("#cboFilter_Initiator option:first").val());
  }

  if ((taskNameFilterValue != null) && (taskNameFilterValue.length > 0)) {
    $('#txtFilter_TaskName').val(taskNameFilterValue);
  }

  if ((projectNameFilterValue != null) && (projectNameFilterValue.length > 0)) {
    $('#txtFilter_ProjectName').val(projectNameFilterValue);
  }

  if (projectIDFilterValue != 0) {
    $('#cboFilter_TicketNumber').val(projectIDFilterValue);
  }


  if (taskTypeFilterVal != 0) {
    let taskTypeName = taskTypeMap.get(taskTypeFilterVal);
    $('#cboFilter_TaskType').val(taskTypeName);
  }
  if (statusFilterVal != 0) {
    let statusName = taskStatusMap.get(statusFilterVal);
    $('#cboFilter_Status').val(statusName);
  }
  if (assigneeFilterVal != 0) {

    let assigneeName = assigneeMap.get(assigneeFilterVal);
    $('#cboFilter_Assignee').val(assigneeName);
  }
  if (departmentFilterVal != 0) {
    let departmentName = departmentMap.get(departmentFilterVal);
    $('#cboFilter_Department').val(departmentName);
  }

}


function refreshPage() {

  var taskNameFilter = $('.ftname input').val();
  var projectFilter = $('.fpname input').val();
  var include_NotSched = Number($('.fincns input').val());
  var exclude_Waiting = Number($('.fexw input').val());
  var include_Complete = Number($('.finccom input').val());
  var projectIDFilter = Number($('.fpid input').val());
  var taskTypeIDFilter = Number($('fttid input').val());
  var statusIDFilter = Number($('fsid input').val());
  var assigneeIDFilter = Number($('faid input').val());
  var departmentIDFilter = Number($('fdid input').val());
  var taskListPage = Number($('.tasklist-page input').val());
  var initiatorID = Number($('.finitid input').val());

  var current_url = window.location.href;
  if (current_url.includes('?')) {
    indexOfQuestionMark = current_url.indexOf('?');
    current_url = current_url.substring(0, indexOfQuestionMark);
  }

  if ((taskListPage != null) && (taskListPage != NaN) && (taskListPage > 0)) {
    current_url = current_url + `?TaskListPage=${taskListPage}`;
  }

  if ((projectFilter != null) && (projectFilter.length > 0)) {
    current_url = current_url + `&fpname=${projectFilter}`;
  }

  if ((taskNameFilter != null) && (taskNameFilter.length > 0)) {
    current_url = current_url + `&ftname=${taskNameFilter}`;
  }

  if ((include_NotSched != null) && (include_NotSched != NaN) && (include_NotSched > 0)) {
    current_url = current_url + `&fincns=${include_NotSched}`;
  }

  if ((exclude_Waiting != null) && (exclude_Waiting != NaN) && (exclude_Waiting > 0)) {
    current_url = current_url + `&fexw=${exclude_Waiting}`;
  }

  if ((include_Complete != null) && (include_Complete != NaN) && (include_Complete > 0)) {
    current_url = current_url + `&finccom=${include_Complete}`;
  }

  if ((projectIDFilter != null) && (projectIDFilter != NaN) && (projectIDFilter > 0)) {
    current_url = current_url + `&fpid=${projectIDFilter}`;
  }

  if ((assigneeIDFilter != null) && (assigneeIDFilter != NaN) && (assigneeIDFilter > 0)) {
    current_url = current_url + `&faid=${assigneeIDFilter}`;
  }

  if ((statusIDFilter != null) && (statusIDFilter != NaN) && (statusIDFilter > 0)) {
    current_url = current_url + `&fsid=${statusIDFilter}`;
  }

  if ((taskTypeIDFilter != null) && (taskTypeIDFilter != NaN) && (taskTypeIDFilter > 0)) {
    current_url = current_url + `&fttid=${taskTypeIDFilter}`;
  }

  if ((departmentIDFilter != null) && (departmentIDFilter != NaN) && (departmentIDFilter > 0)) {
    current_url = current_url + `&fdid=${departmentIDFilter}`;
  }

  if ((initiatorID != null) && (initiatorID != NaN) && (initiatorID > 0)) {
    current_url = current_url + `&finitid=${initiatorID}`;
  }

  window.location = current_url;
}


function removeAppendedFields() {
  $('#tasklist-pagination').remove();
  $('.clone-button').remove();
  $('.project-link').remove();
  $('.task-link').remove();
  $('.note-button').remove();
  $('.time-button').remove();
  $('.mandate-chk').remove();
  $('.tasklist-assignee-cbo-col select').off();
  $('.tasklist-duedate-col input[type="text"]').off();
  $('.tasklist-status-cbo-col select').off();
  $('.tasklist-schedduedate-col input[type="text"]').off();
}


function resetPageNumber() {
  $('.tasklist-table').hide();
  removeAppendedFields();
  $('.tasklist-page input').val(1).change();
}


function wireupComboBoxEvents() {

  $("#cboFilter_TicketType").on("change", function () { paginateTable(); });
  $("#cboFilter_Department").on("change", function () { paginateTable(); });
  $("#cboFilter_MachineGroup").on("change", function () { paginateTable(); });
  $("#txtFilter_TicketNumber").on("change", function () { paginateTable(); });
  $("#cboFilter_Operator").on("change", function () { paginateTable(); });
  $("#cboFilter_CellLeader").on("change", function () { paginateTable(); });
}


