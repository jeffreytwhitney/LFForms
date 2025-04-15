var departmentMap = new Map();
var departmentNameMap = new Map();
var initiatorMap = new Map();
var initiatorNameMap = new Map();
var qualityEngineerMap = new Map();
var qualityEngineerNameMap = new Map();



$(document).ready(function () {
  $('.Submit').hide();
  $(document).prop('title', 'Programming Tickets');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simplePagination.js/1.6/simplePagination.min.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
  var bootstrapButton = $.fn.button.noConflict(); // return $.fn.button to previously assigned value
  $.fn.bootstrapBtn = bootstrapButton;
  var lfUserName = $('.lf-user-name input').val();
  if (lfUserName != 'Anonymous User') {
    $('.network-user-name input').val(lfUserName.toUpperCase().substr(lfUserName.lastIndexOf('\\') + 1)).change();
  }
  window.onmessage = function (event) {
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

  $(document).on('change', '.site-name select', function () {
    var sitename = $('.site-name select').val();
    $.cookie('site_name', sitename, { expires: 365, path: '/' });
  });


  $(document).on('dblclick', '[id^="Field56"]', function (e) {
    var ticketDetail = $(this).val();
    var ticketNumber = $(this).closest('tr').find('.projectlist-ticket-number-col input[type="text"]').val();
    console.log(ticketDetail);
    $.dialog({
      escapeKey: true,
      backgroundDismiss: true,
      title: `${ticketNumber} Details`,
      content: ticketDetail,
    });
  });


  $(document).on('lookupcomplete', function (e) {
    $('.projectlist-table').hide();
    if ($('.pg input').val() == '999') {
      $('.pg input').val(1).change();
      
      $('.network-user-name input').trigger("change");
    }
    loadDepartmentMap();
    loadInitiatorMap();
    loadQualityEngineerMap();
    generateTicketNumberColumn();

    generateFilterRow();
    reApplyFilterValues();
    appendPagination();
    
    if ($('#popUpDiv').length == 0) {
      $('.section-iframe').append("<div class='hidden-text' id='popUpDiv'></div>");
    }
    $('.create-date-col input').each((i, dateField) => $(dateField).val($(dateField).val().split(" ")[0]));

    var userTypeID = Number($('.user-type-id input').val());
    if ((userTypeID != 1) && (userTypeID != 3)) {
      $('.add-button').addClass("ui-state-disabled");
    }
    else {
      $('.add-button').removeClass("ui-state-disabled");
    }

    $('.projectlist-table').show();
  });

  $(document).on("onloadlookupfinished", function (e) {
    var sitename = $.cookie('site_name');
    if (sitename != null) {
      $('.site-name select').val(sitename).change();
    }
  });

});


function appendPagination() {

  var current_page = Number($('.pg input').val());
  if (current_page == 999) { return; }

  var row_count = $('.projectlist-table table tbody tr').length;

  if (row_count > 0) {
    $('#projectlist-pagination').remove();
    if ((current_page == 1) && (row_count < 25)) {
      $('.projectlist-table table').parent().append("<div id='projectlist-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled'>‹‹</a></li><li><a class='page-link prev isDisabled'>‹</a></li><li><a class='page-link next isDisabled'>›</a></li></ul></div>");
      return;
    }
    if ((current_page == 1) && (row_count == 25)) {
      $('.projectlist-table table').parent().append("<div id='projectlist-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled'>‹‹</a></li><li><a class='page-link prev isDisabled'>‹</a></li><li><a class='page-link next' onclick='callNextPage();' href='javascript:void(0);'>›</a></li></ul></div>")
      return;
    }
    if ((current_page > 1) && (row_count == 25)) {
      $('.projectlist-table table').parent().append("<div id='projectlist-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev' onclick='resetPageNumber();' href='javascript:void(0);''>‹‹</a></li><li><a class='page-link prev' onclick='callPrevPage();' href='javascript:void(0);''>‹</a></li><li><a class='page-link next' onclick='callNextPage();' href='javascript:void(0);'>›</a></li></ul></div>")
      return;
    }
    if ((current_page > 1) && (row_count < 25)) {
      $('.projectlist-table table').parent().append("<div id='projectlist-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev' onclick='resetPageNumber();' href='javascript:void(0);''>‹‹</a></li><li><a class='page-link prev' onclick='callPrevPage();' href='javascript:void(0);''>‹</a></li><li><a class='page-link next isDisabled'>›</a></li></ul></div>")
      return;
    }
  }
}


function addTicket() {
  var widowHeight = $(window).height();
  widowHeight = widowHeight - 50;
  popUpIframe(`http://rmslf/Forms/RMS-MPM-AddProgrammingTicket`, 'Add Programming Ticket', widowHeight, 1500);
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
  popUpIframe(`http://rmslf/Forms/MPM-EditProgrammingTicket?tid=${ticket_id}`, 'Ticket Details', widowHeight, 1500);
}


function filterTable() {
  if ($('#filterRow').length == 0) {
    return;
  }

  if ($("#chkIncludeComplete").is(":checked")) {
    $('.inccom input').val(1);
  }
  else {
    $('.inccom input').val(0);
  }



  var taskNameFilterValue = $('#txtFilter_TaskName').val();
  var projectNameFilterValue = $('#txtFilter_ProjectName').val();
  var ticketNumberFilterValue = $('#txtFilter_TicketNumber').val();
  var departmentFilterVal = $('#cboFilter_Department').val();
  var qeFilterVal = $('#cboFilter_QE').val();
  var initiatorFilterVal = $('#cboFilter_Initiator').val();

  $('.ftname input').val(taskNameFilterValue);
  $('.fpname input').val(projectNameFilterValue);
  $('.fpid input').val(ticketNumberFilterValue);


  if ((departmentFilterVal != null) && (departmentFilterVal.length > 0)) {
    let departmentID = departmentNameMap.get(departmentFilterVal);
    $('.fdid input').val(departmentID);
  }
  else {
    $('.fdid input').val(0);
  }

  if ((qeFilterVal != null) && (qeFilterVal.length > 0)) {
    let qeID = qualityEngineerNameMap.get(qeFilterVal);
    $('.fqeid input').val(qeID);
  }
  else {
    $('.fqeid input').val(0);
  }

  if ((initiatorFilterVal != null) && (initiatorFilterVal.length > 0)) {
    let initiatorID = initiatorNameMap.get(initiatorFilterVal);
    $('.finitemp input').val(initiatorID);
  }
  else {
    $('.finitemp input').val(0);
  }

  $('.projectlist-table').hide();
  removeAppendedFields();
  $('.pg input').val(1).change();

}


function generateFilterRow() {

  if ($('#filterRow').length == 0) {

    var add_button = '<div class="table-button ui-button add-button" onclick="addTicket()"><span title="AddTicket" class="ui-button-icon ui-icon ui-icon-plusthick"></span>Add Ticket</div>'

    $(add_button).insertBefore('.projectlist-table table');

    var includeCompleteCheckbox = '<div class="choice include-choice"><input name="chkIncludeComplete" id="chkIncludeComplete" type="checkbox" ><label class="form-option-label" for="chkIncludeComplete">Include Completed</label></div>'
    $('.projectlist-table table').parent().prepend(includeCompleteCheckbox)



    var filter_row = "<TR id='filterRow'><TH><input id='txtFilter_TicketNumber'/></TH><TH><input type='text' id='txtFilter_ProjectName'></TH><TH/><TH><select id='cboFilter_Department'/></TH><TH/><TH/><TH><select id='cboFilter_QE'/></TH><TH><select id='cboFilter_Initiator'/></TH><TH/><TH><input type='text' id='txtFilter_TaskName'></TH></TR>"

    $('.projectlist-table table thead th:last-child').text('Search By Task Name');

    $('.projectlist-table table thead').append(filter_row);

    $("#txtFilter_TicketNumber").on("change", function () { filterTable(); });
    $("#txtFilter_ProjectName").on("change", function () { filterTable(); });
    $("#cboFilter_Department").on("change", function () { filterTable(); });
    $("#cboFilter_QE").on("change", function () { filterTable(); });
    $("#cboFilter_Initiator").on("change", function () { filterTable(); });
    $("#txtFilter_TaskName").on("change", function () { filterTable(); });
    $("#chkIncludeComplete").on("change", function () { filterTable(); });

    $("#txtFilter_TicketNumber").dblclick(function () { $("#txtFilter_TicketNumber").val(null).change(); });
    $("#txtFilter_ProjectName").dblclick(function () { $("#txtFilter_ProjectName").val(null).change(); });
    $("#cboFilter_Department").dblclick(function () { $("#cboFilter_Department").val(null).change(); });
    $("#cboFilter_QE").dblclick(function () { $("#cboFilter_QE").val(0).change(); });
    $("#cboFilter_Initiator").dblclick(function () { $("#cboFilter_Initiator").val(0).change(); });
    $("#txtFilter_TaskName").dblclick(function () { $("#txtFilter_TaskName").val(null).change(); });

    wireUpSortFields();

  }

  if ((($('.ftname input').val() != null) && ($('.ftname input').val().length > 0)) && (($('#txtFilter_TaskName').val() == null) || ($('#txtFilter_TaskName').val() == ''))) {
    $('#txtFilter_TaskName').val($('.ftname input').val());
  }

  if ((($('.fpname input').val() != null) && ($('.fpname input').val().length > 0)) && (($('#txtFilter_ProjectName').val() == null) || ($('#txtFilter_ProjectName').val() == ''))) {
    $('#txtFilter_ProjectName').val($('.fpname input').val());
  }

  if ((($('.fpid input').val() != null) && ($('.fpid input').val().length > 0)) && (($('#txtFilter_TicketNumber').val() == null) || ($('#txtFilter_TicketNumber').val() == ''))) {
    $('#txtFilter_TicketNumber').val($('.fpid input').val());
  }

  if (($(".department-lookup-combo select option").length > 1) && ($("#cboFilter_Department option").length == 0)) {
    let departmentOptions = $(".department-lookup-combo select").html();
    $("#cboFilter_Department").html(departmentOptions);
  }

  if (($(".qe-lookup-combo select option").length > 1) && ($("#cboFilter_QE option").length == 0)) {
    $("#cboFilter_QE").html($(".qe-lookup-combo select").html());
  }

  if (($(".initiator-lookup-combo select option").length > 1) && ($("#cboFilter_Initiator option").length == 0)) {
    $("#cboFilter_Initiator").html($(".initiator-lookup-combo select").html());
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
  $("#popupIFrame").attr('style', `width: ${width};`);
  var resizeableStyle = $('.ui-resizable').attr('style');
  let newStyle = resizeableStyle.replaceAll('width: 0px;', `width: ${width}px;`);
  $('.ui-resizable').attr('style', newStyle);
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

  var taskNameFilter = $('.ftname input').val();
  var include_Complete = Number($('.inccom input').val());
  var projectIDFilter = Number($('.fpid input').val());
  var departmentIDFilter = Number($('.fdid input').val());
  var taskListPage = Number($('.tasklist-page input').val());

  var current_url = window.location.href;
  if (current_url.includes('?')) {
    indexOfQuestionMark = current_url.indexOf('?');
    current_url = current_url.substring(0, indexOfQuestionMark);
  }

  if ((taskListPage != null) && (taskListPage != NaN) && (taskListPage > 0)) {
    current_url = current_url + `?pg=${taskListPage}`;
  }

  if ((taskNameFilter != null) && (taskNameFilter.length > 0)) {
    current_url = current_url + `&ftname=${taskNameFilter}`;
  }

  if ((include_Complete != null) && (include_Complete != NaN) && (include_Complete > 0)) {
    current_url = current_url + `&inccom=${include_Complete}`;
  }

  if ((projectIDFilter != null) && (projectIDFilter != NaN) && (projectIDFilter > 0)) {
    current_url = current_url + `&fpid=${projectIDFilter}`;
  }

  if ((departmentIDFilter != null) && (departmentIDFilter != NaN) && (departmentIDFilter > 0)) {
    current_url = current_url + `&fdid=${departmentIDFilter}`;
  }
  window.location = current_url;
}


function removeAppendedFields() {
  $('#projectlist-pagination').remove();
  $('.project-link').remove();
}


function resetPageNumber() {
  $('.projectlist-table').hide();
  removeAppendedFields();
  $('.pg input').val(1).change();
}


function sortTable(newSortOrdinal) {
  $('.projectlist-table').hide();
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

  if (newSortOrdinal == 0) {
    if (sortDirection == 0) {
      $('#q53 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-n sort-icon"></span>');
    }
    else {
      $('#q53 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-s sort-icon"></span>');
    }
  }
  if (newSortOrdinal == 1) {

    if (sortDirection == 0) {
      $('#q52 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-n sort-icon"></span>');
    }
    else {
      $('#q52 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-s sort-icon"></span>');
    }
  }
  if (newSortOrdinal == 2) {
    if (sortDirection == 0) {
      $('#q58 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-n sort-icon"></span>');
    }
    else {
      $('#q58 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-s sort-icon"></span>');
    }
  }
  if (newSortOrdinal == 3) {
    if (sortDirection == 0) {
      $('#q60 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-n sort-icon"></span>');
    }
    else {
      $('#q60 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-s sort-icon"></span>');
    }
  }
  if (newSortOrdinal == 4) {
    if (sortDirection == 0) {
      $('#q61 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-n sort-icon"></span>');
    }
    else {
      $('#q61 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-s sort-icon"></span>');
    }
  }
  if (newSortOrdinal == 5) {
    if (sortDirection == 0) {
      $('#q66 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-n sort-icon"></span>');
    }
    else {
      $('#q66 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-s sort-icon"></span>');
    }
  }

}


function wireUpSortFields() {

  $('#q53 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-n sort-icon"></span>');

  $('#q52').on('click', function () { sortTable(1); });
  $('#q53').on('click', function () { sortTable(0); });
  $('#q58').on('click', function () { sortTable(2); });
  $('#q60').on('click', function () { sortTable(3); });
  $('#q61').on('click', function () { sortTable(4); });
  $('#q66').on('click', function () { sortTable(5); });
}