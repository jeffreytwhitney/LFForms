var departmentMap = new Map();
var departmentNameMap = new Map();
var initiatorMap = new Map();
var initiatorNameMap = new Map();
var ticketTypeMap = new Map();
var ticketTypeNameMap = new Map();


$(document).ready(function () {
  $(document).prop('title', 'ServiceTickets');
  $('.Submit').hide();
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simplePagination.js/1.6/simplePagination.min.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
  var bootstrapButton = $.fn.button.noConflict(); // return $.fn.button to previously assigned value
  $.fn.bootstrapBtn = bootstrapButton;
  $('#q0').append("<div class='hidden' id='popUpDiv'></div>");

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


  $(document).on("onloadlookupfinished", function () {
    var sitename = $.cookie('site_name');
    if (sitename != null) {
      $('.site-name select').val(sitename).change();
    }
  });


  $(document).on('lookupcomplete', function (e) {
    $('.projectlist-table').hide();
    if ($('.pg input').val() == '999') {
      $('.pg input').val(1).change();

      $('.network-user-name input').trigger("change");
    }
    loadDepartmentMap();
    loadInitiatorMap();
    loadTicketTypeMap();
    $('.due-date-col input').each((i, dateField) => $(dateField).val($(dateField).val().split(" ")[0]));
    $('.create-date-col input').each((i, dateField) => $(dateField).val($(dateField).val().split(" ")[0]));
    generateTicketNumberColumn();
    generateFilterRow();
    //reApplyFilterValues();
    appendPagination();
    $('.service-ticket-table').show();

  });


  $(document).on('change', '.site-name select', function () {
    var sitename = $('.site-name select').val();
    $.cookie('site_name', sitename, { expires: 365, path: '/' });
  });


});


function addTicket() {
  var widowHeight = $(window).height();
  widowHeight = widowHeight - 50;
  popUpIframe(`http://rmslf/Forms/RMS-MPM-AddServiceTicket`, 'Add Service Ticket', widowHeight, 1500);
}


function appendPagination() {

  var current_page = Number($('.pg input').val());
  if (current_page == 999) { return; }

  var row_count = getTableRowCount();

  if (row_count > 0) {
    $('#table-pagination').remove();
    if ((current_page == 1) && (row_count < 25)) {
      $('.service-ticket-table table').parent().append("<div id='table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled'>‹‹</a></li><li><a class='page-link prev isDisabled'>‹</a></li><li><a class='page-link next isDisabled'>›</a></li></ul></div>");
      return;
    }
    if ((current_page == 1) && (row_count == 25)) {
      $('.service-ticket-table table').parent().append("<div id='table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled'>‹‹</a></li><li><a class='page-link prev isDisabled'>‹</a></li><li><a class='page-link next' onclick='callNextPage();' href='javascript:void(0);'>›</a></li></ul></div>")
      return;
    }
    if ((current_page > 1) && (row_count == 25)) {
      $('.service-ticket-table table').parent().append("<div id='table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev' onclick='resetPageNumber();' href='javascript:void(0);''>‹‹</a></li><li><a class='page-link prev' onclick='callPrevPage();' href='javascript:void(0);''>‹</a></li><li><a class='page-link next' onclick='callNextPage();' href='javascript:void(0);'>›</a></li></ul></div>")
      return;
    }
    if ((current_page > 1) && (row_count < 25)) {
      $('.service-ticket-table table').parent().append("<div id='table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev' onclick='resetPageNumber();' href='javascript:void(0);''>‹‹</a></li><li><a class='page-link prev' onclick='callPrevPage();' href='javascript:void(0);''>‹</a></li><li><a class='page-link next isDisabled'>›</a></li></ul></div>")
      return;
    }
  }
}


function callNextPage() {
  $('.service-ticket-table').hide();
  removeAppendedFields();
  current_page = Number($('.pg input').val());
  $('.pg input').val(current_page + 1).change();
}


function callPrevPage() {
  $('.service-ticket-table').hide();
  removeAppendedFields();
  current_page = Number($('.pg input').val());
  if (current_page == 1) {
    return;
  }
  $('.pg input').val(current_page - 1).change();
}


function editTicket(ticketID) {
  var widowHeight = $(window).height();
  widowHeight = widowHeight - 50;
  popUpIframe(`http://rmslf/Forms/RMS-MPM-EditServiceTicket?tid=${ticketID}`, 'Edit Service Ticket', widowHeight, 1500);
}


function filterTable() {
  if ($('#filterRow').length == 0) {
    return;
  }

  if ($("#chkIncludeComplete").is(":checked")) {
    $('.finccomp input').val(1);
  }
  else {
    $('.finccomp input').val(0);
  }

  var ticketNumberFilterValue = $('#txtFilter_TicketNumber').val();
  var ticketNameFilterValue = $('#txtFilter_TicketName').val();
  var initiatorFilterVal = $('#cboFilter_Initiator').val();
  var ticketTypeFilterVal = $('#cboFilter_TicketType').val();
  var departmentFilterVal = $('#cboFilter_Department').val();

  $('.ftnum input').val(ticketNumberFilterValue);
  $('.ftname input').val(ticketNameFilterValue);
  
  if ((departmentFilterVal != null) && (departmentFilterVal.length > 0)) {
    let departmentID = departmentNameMap.get(departmentFilterVal);
    $('.fdid input').val(departmentID);
  }
  else {
    $('.fdid input').val(0);
  }

  if ((initiatorFilterVal != null) && (initiatorFilterVal.length > 0)) {
    let initiatorID = initiatorNameMap.get(initiatorFilterVal);
    $('.fiid input').val(initiatorID);
  }
  else {
    $('.fiid input').val(0);
  }

  if ((ticketTypeFilterVal != null) && (ticketTypeFilterVal.length > 0)) {
    let ticketTypeID = ticketTypeNameMap.get(ticketTypeFilterVal);
    $('.fttid input').val(ticketTypeID);
  }
  else {
    $('.fttid input').val(0);
  }

  $('.service-ticket-table').hide();
  removeAppendedFields();
  $('.pg input').val(1).change();

}


function generateFilterRow() {

  if ($('#filterRow').length == 0) {
    var add_button = '<div class="table-button ui-button add-button" onclick="addTicket()"><span title="AddTicket" class="ui-button-icon ui-icon ui-icon-plusthick"></span>Add Ticket</div>'

    $(add_button).insertBefore('.service-ticket-table table');

    var includeCompleteCheckbox = '<div class="choice include-choice"><input name="chkIncludeComplete" id="chkIncludeComplete" type="checkbox" ><label class="form-option-label" for="chkIncludeComplete">Include Completed</label></div>'
    $('.service-ticket-table table').parent().prepend(includeCompleteCheckbox)

    var filter_row = "<TR id='filterRow'><TH><input id='txtFilter_TicketNumber'/></TH><TH><input id='txtFilter_TicketName'/></TH><TH><select id='cboFilter_Initiator'/></TH><TH><select id='cboFilter_TicketType'/></TH><TH><select id='cboFilter_Department'/></TH><TH></TH><TH></TH><TH></TH><TH></TH><TH></TH><TH></TH><TH></TH></TR>"


    $('.service-ticket-table table thead').append(filter_row);

    $("#chkIncludeComplete").on("change", function () { filterTable(); });

    $("#txtFilter_TicketNumber").on("change", function () { filterTable(); });
    $("#txtFilter_TicketName").on("change", function () { filterTable(); });
    $("#cboFilter_Initiator").on("change", function () { filterTable(); });
    $("#cboFilter_TicketType").on("change", function () { filterTable(); });
    $("#cboFilter_Department").on("change", function () { filterTable(); });

    $("#txtFilter_TicketNumber").dblclick(function () { $("#txtFilter_TicketNumber").val(null).change(); });
    $("#txtFilter_TicketName").dblclick(function () { $("#txtFilter_TicketName").val(null).change(); });
    $("#cboFilter_Initiator").dblclick(function () { $("#cboFilter_Initiator").val(0).change(); });
    $("#cboFilter_TicketType").dblclick(function () { $("#cboFilter_TicketType").val(0).change(); });
    $("#cboFilter_Department").dblclick(function () { $("#cboFilter_Department").val(null).change(); });
    wireUpSortFields();
  }

  if ((($('.ftnum input').val() != null) && ($('.ftnum input').val().length > 0)) && (($('#txtFilter_TicketNumber').val() == null) || ($('#txtFilter_TicketNumber').val() == ''))) {
    $('#txtFilter_TicketNumber').val($('.ftnum input').val());
  }

  if ((($('.ftname input').val() != null) && ($('.ftname input').val().length > 0)) && (($('#txtFilter_TicketName').val() == null) || ($('#txtFilter_TicketName').val() == ''))) {
    $('#txtFilter_TicketName').val($('.ftname input').val());
  }

  if (($(".initiator-lookup-combo select option").length > 1) && ($("#cboFilter_Initiator option").length == 0)) {
    $("#cboFilter_Initiator").html($(".initiator-lookup-combo select").html());
  }

  if (($(".ticket-type-lookup select option").length > 1) && ($("#cboFilter_TicketType option").length == 0)) {
    $("#cboFilter_TicketType").html($(".ticket-type-lookup select").html());
  }

  if (($(".department-lookup-combo select option").length > 1) && ($("#cboFilter_Department option").length == 0)) {
    let departmentOptions = $(".department-lookup-combo select").html();
    $("#cboFilter_Department").html(departmentOptions);
  }


}


function generateTicketNumberColumn() {
  var ticket_numbers = $('.ticket-number-col input[type="text"]');
  var ticket_ids = $('.edit-ticket-col input[type="text"]');
  ticket_numbers.each(function (index) {
    let ticket_id = $(ticket_ids[index]).val();
    let ticket_number = $(this).val();
    let ticket_link = $("<a>", { text: ticket_number.substr(0, 30), class: 'ticket-link', href: `javascript:void(0);`, onclick: `editTicket(${ticket_id})` });
    if ($(this).parent().find('.ticket-link').length == 0) {
      $(this).parent().append(ticket_link);
    }
  });
}


function getTableRowCount() {
  var row_count = $('.service-ticket-table tbody tr').length;
  return row_count;
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


function loadInitiatorMap() {
  if (initiatorMap.keys.length == 0) {
    var initiator_rows = $('.initiator-lookup-table table tbody tr');
    if (initiator_rows.length == 0) {
      return;
    }
    initiator_rows.each(function (index) {
      initiatorID = Number($(this).find('.initiator-lookup-table-id input').val());
      initiatorName = $(this).find('.initiator-lookup-table-name input').val();
      initiatorMap.set(initiatorID, initiatorName);
      initiatorNameMap.set(initiatorName, initiatorID);
    });
  }
}


function loadTicketTypeMap() {
  if (ticketTypeMap.keys.length == 0) {
    var ticketType_rows = $('.ticket-type-lookup-table table tbody tr');
    if (ticketType_rows.length == 0) {
      return;
    }
    ticketType_rows.each(function (index) {
      ticketTypeID = Number($(this).find('.ticket-type-lookup-table-id input').val());
      ticketTypeName = $(this).find('.ticket-type-lookup-table-name input').val();
      ticketTypeMap.set(ticketTypeID, ticketTypeName);
      ticketTypeNameMap.set(ticketTypeName, ticketTypeID);
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
  if ($('#filterRow').length == 0) {
    return;
  }

  var includeCompleted = Number($('.finccomp input').val());
  var ticketNumberFilterValue = $('.ftnum input').val();
  var ticketNameFilterValue = $('.ftname input').val();
  var initiatorFilterVal = $('.fiid input').val();
  var ticketTypeFilterVal = $('.fttid input').val();
  var departmentFilterVal = $('.fdid input').val();


  if (includeCompleted == 1) {
    $('#chkIncludeComplete').prop('checked', true);
  }
  else {
    $('#chkIncludeComplete').prop('checked', false);
  }
  
  if ((ticketNumberFilterValue != null) && (ticketNumberFilterValue.length > 0)) {
    $('#txtFilter_TicketNumber').val(ticketNumberFilterValue);
  }

  if ((ticketNameFilterValue != null) && (ticketNameFilterValue.length > 0)) {
    $('#txtFilter_TicketName').val(ticketNameFilterValue);
  }

  if (initiatorFilterVal != 0) {
    let initiatorName = initiatorMap.get(initiatorFilterVal);
    $('#cboFilter_Initiator').val(initiatorName);
  }
  else {
    $("#cboFilter_Initiator").val($("#cboFilter_Initiator option:first").val());
  }

  if (departmentFilterVal != 0) {
    let departmentName = departmentMap.get(departmentFilterVal);
    $('#cboFilter_Department').val(departmentName);
  }
  else {
    $("#cboFilter_Department").val($("#cboFilter_Department option:first").val());
  }

  if (ticketTypeFilterVal != 0) {
    let ticketTypeName = ticketTypeMap.get(ticketTypeFilterVal);
    $('#cboFilter_TicketType').val(ticketTypeName);
  }
  else {
    $("#cboFilter_TicketType").val($("#cboFilter_TicketType option:first").val());
  }
}


function refreshPage() {

  var ticketNameFilter = $('.ftname input').val();
  var ticketNumberFilter = $('.ftnum input').val();
  var include_Complete = Number($('.finccomp input').val());
  var departmentIDFilter = Number($('.fdid input').val());
  var ticketTypeIDFilter = Number($('.fttid input').val());
  var initiatorIDFilter = Number($('.fiid input').val());


  var pageNumber = Number($('.pg input').val());

  var current_url = window.location.href;
  if (current_url.includes('?')) {
    indexOfQuestionMark = current_url.indexOf('?');
    current_url = current_url.substring(0, indexOfQuestionMark);
  }

  if ((pageNumber != null) && (pageNumber != NaN) && (pageNumber > 0)) {
    current_url = current_url + `?pg=${pageNumber}`;
  }

  if ((ticketNameFilter != null) && (ticketNameFilter.length > 0)) {
    current_url = current_url + `&ftname=${ticketNameFilter}`;
  }

  if ((ticketNumberFilter != null) && (ticketNumberFilter.length > 0)) {
    current_url = current_url + `&ftnum=${ticketNumberFilter}`;
  }

  if ((ticketTypeIDFilter != null) && (ticketTypeIDFilter != NaN) && (ticketTypeIDFilter > 0)) {
    current_url = current_url + `&fttid=${ticketTypeIDFilter}`;
  }

  if ((initiatorIDFilter != null) && (initiatorIDFilter.length > 0)) {
    current_url = current_url + `&fiid=${initiatorIDFilter}`;
  }

  if ((include_Complete != null) && (include_Complete != NaN) && (include_Complete > 0)) {
    current_url = current_url + `&finccomp=${include_Complete}`;
  }

  if ((departmentIDFilter != null) && (departmentIDFilter != NaN) && (departmentIDFilter > 0)) {
    current_url = current_url + `&fdid=${departmentIDFilter}`;
  }
  window.location = current_url;
}


function removeAppendedFields() {
  $('#table-pagination').remove();
  $('.edit-button').remove();
  $('.ticket-link').remove();
}


function resetPageNumber() {
  $('.service-ticket-table').hide();
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
      $('#q15 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-n sort-icon"></span>');
    }
    else {
      $('#q15 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-s sort-icon"></span>');
    }
  }
  if (newSortOrdinal == 1) {

    if (sortDirection == 0) {
      $('#q18 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-n sort-icon"></span>');
    }
    else {
      $('#q18 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-s sort-icon"></span>');
    }
  }
  if (newSortOrdinal == 2) {
    if (sortDirection == 0) {
      $('#q40 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-n sort-icon"></span>');
    }
    else {
      $('#q40 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-s sort-icon"></span>');
    }
  }
  if (newSortOrdinal == 3) {
    if (sortDirection == 0) {
      $('#q42 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-n sort-icon"></span>');
    }
    else {
      $('#q42 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-s sort-icon"></span>');
    }
  }
  if (newSortOrdinal == 4) {
    if (sortDirection == 0) {
      $('#q43 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-n sort-icon"></span>');
    }
    else {
      $('#q43 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-s sort-icon"></span>');
    }
  }
  if (newSortOrdinal == 5) {
    if (sortDirection == 0) {
      $('#q44 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-n sort-icon"></span>');
    }
    else {
      $('#q44 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-s sort-icon"></span>');
    }
  }
  if (newSortOrdinal == 6) {
    if (sortDirection == 0) {
      $('#q45 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-n sort-icon"></span>');
    }
    else {
      $('#q45 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-s sort-icon"></span>');
    }
  }
  if (newSortOrdinal == 7) {
    if (sortDirection == 0) {
      $('#q46 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-n sort-icon"></span>');
    }
    else {
      $('#q46 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-s sort-icon"></span>');
    }
  }
  if (newSortOrdinal == 8) {
    if (sortDirection == 0) {
      $('#q47 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-n sort-icon"></span>');
    }
    else {
      $('#q47 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-s sort-icon"></span>');
    }
  }
  if (newSortOrdinal == 9) {
    if (sortDirection == 0) {
      $('#q51 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-n sort-icon"></span>');
    }
    else {
      $('#q51 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-s sort-icon"></span>');
    }
  }



}


function wireUpSortFields() {

  $('#q15 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-n sort-icon"></span>');

  $('#q15').on('click', function () { sortTable(0); });
  $('#q18').on('click', function () { sortTable(1); });
  $('#q40').on('click', function () { sortTable(2); });
  $('#q42').on('click', function () { sortTable(3); });
  $('#q43').on('click', function () { sortTable(4); });
  $('#q44').on('click', function () { sortTable(5); });
  $('#q45').on('click', function () { sortTable(6); });
  $('#q46').on('click', function () { sortTable(7); });
  $('#q47').on('click', function () { sortTable(8); });
  $('#q51').on('click', function () { sortTable(9); });

}