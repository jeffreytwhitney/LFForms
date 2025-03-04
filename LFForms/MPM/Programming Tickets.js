var departmentMap = new Map();
var departmentNameMap = new Map();
var initiatorMap = new Map();
var initiatorNameMap = new Map();
var qualityEngineerMap = new Map();
var qualityEngineerNameMap = new Map();



$(document).ready(function () {
  $('.Submit').hide();
  $(document).prop('title', 'Programming Tickets');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simplePagination.js/1.6/simplePagination.min.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
  var bootstrapButton = $.fn.button.noConflict(); // return $.fn.button to previously assigned value
  $.fn.bootstrapBtn = bootstrapButton;
  $('.network-user-name input').val($('.lf-user-name input').val().toUpperCase().substr($('.lf-user-name input').val().lastIndexOf('\\') + 1)).change();
  window.onmessage = function (event) {
    //This is the callback from the IFrame.
    //If the event data says "Close Dialog", it destroys the dialog, (so that the close function won't fire).
    //If it says "CloseDialogWithRefresh", it destroys the dialog and refreshes the form.
    //I don't refresh if you add a note, for example. But if you do anything that will show up on the page, (adding time, cloning a task, etc)
    //then I do a refresh.
    if (event.data == "CloseDialog") {
      $("#popupIFrame").dialog("destroy");
      $("#popupIFrame").remove();
    }
    if (event.data == "CloseDialogWithRefresh") {
      $("#popupIFrame").dialog("destroy");
      $("#popupIFrame").remove();
      refreshPage();
    }
  };


  $(document).on('lookupcomplete', function (e) {
    $('.projectlist-table').hide();
    if ($('.pg input').val() == '999') {
      $('.pg input').val(1).change();
      console.log("lookupcomplete");
      $('.network-user-name input').trigger("change");
    }
    
    generateTicketNumberColumn();

    generateFilterRow();
    reApplyFilterValues();
    appendPagination();
    $('.projectlist-table').show();

  });

  $(document).on("onloadlookupfinished", function (e) {
    console.log("onloadlookupfinished");
    $('.section-iframe').append("<div class='hidden-text' id='popUpDiv'></div>");
    $('.network-user-name input').trigger("change");
  });

});


function appendPagination() {

  var current_page = Number($('.pg input').val());
  if (current_page == 999) { return; }

  var row_count = $('.projectlist-table table tbody tr').length;

  if (row_count > 0) {
    $('#projectlist-pagination').remove();
    if ((current_page == 1) && (row_count < 25)) {
      $('.projectlist-table table').parent().append("<div id='projectlist-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled'>‹</a></li><li><a class='page-link next isDisabled'>›</a></li></ul></div>");
      return;
    }
    if ((current_page == 1) && (row_count == 25)) {
      $('.projectlist-table table').parent().append("<div id='projectlist-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled'>‹</a></li><li><a class='page-link next' onclick='callNextPage();' href='javascript:void(0);'>›</a></li></ul></div>")
      return;
    }
    if ((current_page > 1) && (row_count == 25)) {
      $('.projectlist-table table').parent().append("<div id='projectlist-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev' onclick='callPrevPage();' href='javascript:void(0);''>‹</a></li><li><a class='page-link next' onclick='callNextPage();' href='javascript:void(0);'>›</a></li></ul></div>")
      return;
    }
    if ((current_page > 1) && (row_count < 25)) {
      $('.projectlist-table table').parent().append("<div id='projectlist-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev' onclick='callPrevPage();' href='javascript:void(0);''>‹</a></li><li><a class='page-link next isDisabled'>›</a></li></ul></div>")
      return;
    }
  }
}


function callNextPage() {
  $('.projectlist-table').hide();
  removeAppendedFields();
  current_page = Number($('.pg input').val());
  $('.pg input').val(current_page + 1).change();
}


function callPrevPage() {
  $('.projectlist-table').hide();
  removeAppendedFields();
  current_page = Number($('.pg input').val());
  if (current_page == 1) {
    return;
  }
  $('.pg input').val(current_page - 1).change();
}


function callShowDetails(ticket_id) {
  var widowHeight = $(window).height();
  widowHeight = widowHeight - 50;
  popUpIframe(`http://rmslf/Forms/MPMAddEditProject?pid=${ticket_id}`, 'Project Details', widowHeight, 1100);
}


function generateFilterRow() {

  if ($('#filterRow').length == 0) {

    var filter_row = "<TR id='filterRow'><TH><input id='txtFilter_TicketNumber'/></TH><TH><input type='text' id='txtFilter_ProjectName'></TH><TH/><TH><select id='cboFilter_Department'/></TH><TH/><TH/><TH><select id='cboFilter_QE'/></TH><TH><select id='cboFilter_Initiator'/></TH><TH/></TR>"
    $('.projectlist-table table thead').append(filter_row);
    $("#txtFilter_ProjectName").on("change", function () { filterTable(); });
    $("#txtFilter_TicketNumber").on("change", function () { filterTable(); });
    $("#txtFilter_ProjectName").on("change", function () { filterTable(); });
    $("#cboFilter_Department").on("change", function () { filterTable(); });
    $("#cboFilter_QE").on("change", function () { filterTable(); });
    $("#cboFilter_Initiator").on("change", function () { filterTable(); });


    $("#txtFilter_TicketNumber").dblclick(function () { $("#txtFilter_TicketNumber").val(null).change(); });
    $("#txtFilter_ProjectName").dblclick(function () { $("#txtFilter_ProjectName").val(null).change(); });
    $("#cboFilter_Department").dblclick(function () { $("#cboFilter_Department").val(null).change(); });
    $("#cboFilter_QE").dblclick(function () { $("#cboFilter_QE").val(0).change(); });
    $("#cboFilter_Initiator").dblclick(function () { $("#cboFilter_Initiator").val(0).change(); });
  }

  if ((($('.ftname input').val() != null) && ($('.ftname input').val().length > 0)) && (($('#txtFilter_TaskName').val() == null) || ($('#txtFilter_TaskName').val() == ''))) {
    $('#txtFilter_TaskName').val($('.ftname input').val());
  }

  if ((($('.fpname input').val() != null) && ($('.fpname input').val().length > 0)) && (($('#txtFilter_ProjectName').val() == null) || ($('#txtFilter_ProjectName').val() == ''))) {
    $('#txtFilter_TaskName').val($('.fpname input').val());
  }

  if ((($('.fpid input').val() != null) && ($('.fpid input').val().length > 0)) && (($('#txtFilter_TicketNumber').val() == null) || ($('#txtFilter_TicketNumber').val() == ''))) {
    $('#txtFilter_TicketNumber').val($('.fpid input').val());
  }

  if (($(".status-lookup-combo select option").length > 0) && ($("#cboFilter_Status option").length == 0)) {
    $("#cboFilter_Status").html($(".status-lookup-combo select").html());
  }
  if (($(".tasktype-lookup-combo select option").length > 0) && ($("#cboFilter_TaskType option").length == 0)) {
    $("#cboFilter_TaskType").html($(".tasktype-lookup-combo select").html());
  }
  if (($(".assignee-lookup-combo select option").length > 0) && ($("#cboFilter_Assignee option").length == 0)) {
    $("#cboFilter_Assignee").html($(".assignee-lookup-combo select").html());
  }
  if (($(".department-lookup-combo select option").length > 0) && ($("#cboFilter_Department option").length == 0)) {
    $("#cboFilter_Department").html($(".department-lookup-combo select").html());
  }
}


function generateTicketNumberColumn() {
  var ticket_ids = $('.projectlist-ticket-id-col input[type="text"]');
  var ticket_numbers = $('.projectlist-ticket-number-col input[type="text"]');
  
  ticket_numbers.each(function (index) {
    let ticket_id = $(ticket_ids[index]).val();
    let ticket_number = $(this).val();
    let project_link = $("<a>", { text: ticket_number, class: 'project-link', href: `javascript:void(0);`, onclick: `callShowDetails(${ticket_id})` });
    if ($(this).parent().find('.project-link').length == 0) {
      $(this).parent().append(project_link);
    }
  });
}


function loadDepartmentMap() {
  if (departmentMap.keys.length == 0) {
    var department_rows = $('.department-lookup-table table tbody tr');
    if (department_rows.length == 0) {
      return;
    }
    department_rows.each(function (index) {
      departmentID = Number($(this).find('.department-lookup-table-id input').val());
      departmentName = $(this).find('.department-lookup-table-name input').val();
      departmentMap.set(departmentID, departmentName);
      departmentNameMap.set(departmentName, departmentID);
    });
  }
}


function loadQualityEngineerMap() {
  if (qualityEngineerMap.keys.length == 0) {
    var qe_rows = $('.qe-lookup-table table tbody tr');
    if (qe_rows.length == 0) {
      return;
    }
    qe_rows.each(function (index) {
      qeID = Number($(this).find('.qe-lookup-table-id input').val());
      qeName = $(this).find('.qe-lookup-table-name input').val();
      qualityEngineerMap.set(qeID, qeName);
      qualityEngineerNameMap.set(qeName, qeID);
    });
  }
}


function loadInitiatorMap() {
  if (initiatorMap.keys.length == 0) {
    var initiator_rows = $('.initiator-lookup-table table tbody tr');
    if (initiator_rows.length == 0) {
      return;
    }
    initiator_rows.each(function (index) {
      initiatorID = $(this).find('.initiator-lookup-table-id input').val();
      initiatorName = $(this).find('.initiator-lookup-table-name input').val();
      initiatorMap.set(initiatorID, initiatorName);
      initiatorNameMap.set(initiatorName, initiatorID);
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


function reApplyFilterValues() {
  //if ($('#filterRow').length == 0) {
  //  return;
  //}

  //var includeNotScheduled = Number($('.fincns input').val());
  //var includeCompleted = Number($('.finccom input').val());
  //var excludeWaiting = Number($('.fexw input').val());

  //if (includeNotScheduled == 1) {
  //  $('#Field206-0').prop('checked', true);
  //}
  //else {
  //  $('#Field206-0').prop('checked', false);
  //}

  //if (includeCompleted == 1) {
  //  $('#Field206-1').prop('checked', true);
  //}
  //else {
  //  $('#Field206-1').prop('checked', false);
  //}

  //if (excludeWaiting == 1) {
  //  $('#Field206-2').prop('checked', true);
  //}
  //else {
  //  $('#Field206-2').prop('checked', false);
  //}



  //var taskNameFilterValue = $('.ftname input').val();
  //var projectNameFilterValue = $('.fpname input').val();
  //var projectFilterValue = Number($('.fpid input').val());

  //var taskTypeFilterVal = Number($('.fttid input').val());
  //var statusFilterVal = Number($('.fsid input').val());
  //var assigneeFilterVal = Number($('faid input').val());
  //var departmentFilterVal = Number($('fdid input').val());


  //if ((taskNameFilterValue != null) && (taskNameFilterValue.length > 0)) {
  //  $('#txtFilter_TaskName').val(taskNameFilterValue);
  //}
  //if ((projectNameFilterValue != null) && (projectNameFilterValue.length > 0)) {
  //  $('#txtFilter_ProjectName').val(projectNameFilterValue);
  //}

  //if (projectFilterValue != NaN) {
  //  let projectName = projectMap.get(projectFilterValue);
  //  $('#cboFilter_TicketNumber').val(projectFilterValue);
  //}
  //if (taskTypeFilterVal != NaN) {
  //  let taskTypeName = taskTypeMap.get(taskTypeFilterVal);
  //  $('#cboFilter_TaskType').val(taskTypeName);
  //}
  //if (statusFilterVal != NaN) {
  //  let statusName = taskStatusMap.get(statusFilterVal);
  //  $('#cboFilter_Status').val(statusName);
  //}
  //if (assigneeFilterVal != NaN) {
  //  let assigneeName = assigneeMap.get(assigneeFilterVal);
  //  $('#cboFilter_Assignee').val(assigneeName);
  //}
  //if (departmentFilterVal != NaN) {
  //  let departmentName = departmentMap.get(departmentFilterVal);
  //  $('#cboFilter_Department').val(departmentName);
  //}

}


function refreshPage() {

  //var taskNameFilter = $('.ftname input').val();
  //var include_NotSched = Number($('.fincns input').val());
  //var exclude_Waiting = Number($('.fexw input').val());
  //var include_Complete = Number($('.finccom input').val());
  //var projectIDFilter = Number($('.fpid input').val());
  //var taskTypeIDFilter = Number($('fttid input').val());
  //var statusIDFilter = Number($('fsid input').val());
  //var assigneeIDFilter = Number($('faid input').val());
  //var departmentIDFilter = Number($('fdid input').val());
  //var taskListPage = Number($('.tasklist-page input').val());

  //var current_url = window.location.href;
  //if (current_url.includes('?')) {
  //  indexOfQuestionMark = current_url.indexOf('?');
  //  current_url = current_url.substring(0, indexOfQuestionMark);
  //}

  //if ((taskListPage != null) && (taskListPage != NaN) && (taskListPage > 0)) {
  //  current_url = current_url + `?TaskListPage=${taskListPage}`;
  //}

  //if ((taskNameFilter != null) && (taskNameFilter.length > 0)) {
  //  current_url = current_url + `&ftname=${taskNameFilter}`;
  //}

  //if ((include_NotSched != null) && (include_NotSched != NaN) && (include_NotSched > 0)) {
  //  current_url = current_url + `&fincns=${include_NotSched}`;
  //}

  //if ((exclude_Waiting != null) && (exclude_Waiting != NaN) && (exclude_Waiting > 0)) {
  //  current_url = current_url + `&fexw=${exclude_Waiting}`;
  //}

  //if ((include_Complete != null) && (include_Complete != NaN) && (include_Complete > 0)) {
  //  current_url = current_url + `&finccom=${include_Complete}`;
  //}

  //if ((projectIDFilter != null) && (projectIDFilter != NaN) && (projectIDFilter > 0)) {
  //  current_url = current_url + `&fpid=${projectIDFilter}`;
  //}

  //if ((assigneeIDFilter != null) && (assigneeIDFilter != NaN) && (assigneeIDFilter > 0)) {
  //  current_url = current_url + `&faid=${assigneeIDFilter}`;
  //}

  //if ((statusIDFilter != null) && (statusIDFilter != NaN) && (statusIDFilter > 0)) {
  //  current_url = current_url + `&fsid=${statusIDFilter}`;
  //}

  //if ((taskTypeIDFilter != null) && (taskTypeIDFilter != NaN) && (taskTypeIDFilter > 0)) {
  //  current_url = current_url + `&fttid=${taskTypeIDFilter}`;
  //}

  //if ((departmentIDFilter != null) && (departmentIDFilter != NaN) && (departmentIDFilter > 0)) {
  //  current_url = current_url + `&fdid=${departmentIDFilter}`;
  //}
  //window.location = current_url;
}


function removeAppendedFields() {
  $('#projectlist-pagination').remove();
  $('.project-link').remove();
}

