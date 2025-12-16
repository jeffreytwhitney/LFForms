var departmentMap = new Map();
var departmentNameMap = new Map();
var cellLeaderMap = new Map();
var cellLeaderNameMap = new Map();




$(document).ready(function () {
  $('.Submit').hide();
  $(document).prop('title', 'Gage Request Maintenance');
  $('.Submit').click(function (e) { validateForm(e); });
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simplePagination.js/1.6/simplePagination.min.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
  var bootstrapButton = $.fn.button.noConflict(); // return $.fn.button to previously assigned value
  $.fn.bootstrapBtn = bootstrapButton;



  $(document).on("onloadlookupfinished", function () {
    var sitename = $.cookie('site_name');
    if (sitename != null) {
      $('.site-name select').val(sitename).change();
    }
    generateGoBackButtons();
  });

  $(document).on('lookupcomplete', function (e) {
    if ($('.pg input').val() == '999') {
      $('.pg input').val(1).change();
    }

    loadDepartmentMap();
    loadCellLeaderMap();

    if ($('.request-status-id input').val() == '3') {
      $('.Submit').hide();
      $('.gage-status-cbo select').addClass('isDisabled');
    }
    else {
      $('.gage-status-cbo select').removeClass('isDisabled');
    }

    $('.gage-request-table-created-on input').each((i, dateField) => $(dateField).val($(dateField).val().split(" ")[0]));
    $('.gage-request-table-last-cal input').each((i, dateField) => $(dateField).val($(dateField).val().split(" ")[0]));
    $('.gage-request-table-cal-due-date input').each((i, dateField) => $(dateField).val($(dateField).val().split(" ")[0]));
    generateRequestNumberColumn();
    generateFilterRow();
    reApplyFilterValues();
    appendPagination();
    $('.gage-request-table').show();

  });

  $(document).on('change', '.site-name select', function () {
    var sitename = $('.site-name select').val();
    $.cookie('site_name', sitename, { expires: 365, path: '/' });
  });

  $(document).on('change', '.request-status-id input', function () {
    $('.gage-status-cbo select').val($(this).val()).change();
  });

  $(document).on('change', '.gage-status-cbo select', function () {
    $('.new-status-id input').val($(this).val());
  });

  // Include Inactive checkbox toggles filter and reloads page 1.
  $(document).on('change', '#chkIncludeInActive', function () { filterTable(); });

});

function appendPagination() {

  var current_page = Number($('.pg input').val());
  if (current_page == 999) { return; }

  var row_count = getTicketRowCount();

  if (row_count > 0) {
    $('#gage-request-table-pagination').remove();
    if ((current_page == 1) && (row_count < 25)) {
      $('.gage-request-table table').parent().append("<div id='gage-request-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled'>‹‹</a></li><li><a class='page-link prev isDisabled'>‹</a></li><li><a class='page-link next isDisabled'>›</a></li></ul></div>");
      return;
    }
    if ((current_page == 1) && (row_count == 25)) {
      $('.gage-request-table table').parent().append("<div id='gage-request-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled'>‹‹</a></li><li><a class='page-link prev isDisabled'>‹</a></li><li><a class='page-link next' onclick='callNextPage();' href='javascript:void(0);'>›</a></li></ul></div>")
      return;
    }
    if ((current_page > 1) && (row_count == 25)) {
      $('.gage-request-table table').parent().append("<div id='gage-request-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev' onclick='resetPageNumber();' href='javascript:void(0);''>‹‹</a></li><li><a class='page-link prev' onclick='callPrevPage();' href='javascript:void(0);''>‹</a></li><li><a class='page-link next' onclick='callNextPage();' href='javascript:void(0);'>›</a></li></ul></div>")
      return;
    }
    if ((current_page > 1) && (row_count < 25)) {
      $('.gage-request-table table').parent().append("<div id='gage-request-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev' onclick='resetPageNumber();' href='javascript:void(0);''>‹‹</a></li><li><a class='page-link prev' onclick='callPrevPage();' href='javascript:void(0);''>‹</a></li><li><a class='page-link next isDisabled'>›</a></li></ul></div>")
      return;
    }
  }
}


function callGoBack() {
  $(".details-request-id input").val(0).change();
  $('.Submit').hide();
}


function callNextPage() {
  $('.gage-request-table').hide();
  $('.request-detail-link').remove();
  current_page = Number($('.pg input').val());
  $('.pg input').val(current_page + 1).change();
}


function callPrevPage() {
  $('.gage-request-table').hide();
  $('.request-detail-link').remove();
  current_page = Number($('.pg input').val());
  if (current_page == 1) {
    return;
  }
  $('.pg input').val(current_page - 1).change();
}


function filterTable() {

  if ($('#filterRow').length == 0) {
    return;
  }

  $('.gage-request-table').hide();
  $('.request-detail-link').remove();


  var departmentFilterVal = $('#cboFilter_Department').val();
  var operatorFilterVal = $('#txtFilter_Operator').val();
  var cellLeaderFilterVal = $('#cboFilter_CellLeader').val();
  var partNumberFilterValue = $('#txtFilter_PartNumber').val();
  var jobNumberFilterValue = $('#txtFilter_JobNumber').val();

  $('.fpname input').val(partNumberFilterValue);
  $('.fjnbr input').val(jobNumberFilterValue);
  $('.fopname input').val(operatorFilterVal);


  if ($("#chkIncludeInActive").is(":checked")) {
    $('.finccom input').val(1);
  }
  else {
    $('.finccom input').val(0);
  }

  if ((departmentFilterVal != 0) && (departmentFilterVal.length > 0)) {
    let taskDepartmentID = departmentNameMap.get(departmentFilterVal);
    $('.fdid input').val(taskDepartmentID);
  }
  else {
    $('.fdid input').val(0);
  }

  if ((cellLeaderFilterVal != 0) && (cellLeaderFilterVal.length > 0)) {
    let cellLeaderID = cellLeaderNameMap.get(cellLeaderFilterVal);
    $('.fclid input').val(cellLeaderID);
  }
  else {
    $('.fclid input').val(0);
  }

  $('.gage-request-table').hide();
  $('.request-detail-link').remove();
  $('.pg input').val(1).change();

}


function generateFilterRow() {

  if ($('#filterRow').length == 0) {

    var filter_row = "<TR id='filterRow'><TH/><TH/><TH/><TH><select id='cboFilter_Department'/></TH><TH/><TH><input type='text' id='txtFilter_Operator'/></TH><TH><select id='cboFilter_CellLeader'/></TH><TH><input type='text' id='txtFilter_PartNumber'></TH><TH><input type='text' id='txtFilter_JobNumber'></TH><TH/><TH/><TH/>"
    $('.gage-request-table table thead').append(filter_row);

    $("#cboFilter_Department").on("change", function () { filterTable(); });
    $("#txtFilter_Operator").on("change", function () { filterTable(); });
    $("#cboFilter_CellLeader").on("change", function () { filterTable(); });
    $("#txtFilter_PartNumber").on("change", function () { filterTable(); });
    $("#txtFilter_JobNumber").on("change", function () { filterTable(); });

    $("#cboFilter_Department").dblclick(function () { $("#cboFilter_Department").val(null).change(); });
    $("#txtFilter_Operator").dblclick(function () { $("#txtFilter_Operator").val(null).change(); });
    $("#cboFilter_CellLeader").dblclick(function () { $("#cboFilter_CellLeader").val(null).change(); });
    $("#txtFilter_PartNumber").dblclick(function () { $("#txtFilter_PartNumber").val(null).change(); });
    $("#txtFilter_JobNumber").dblclick(function () { $("#txtFilter_JobNumber").val(null).change(); });

    if ($('#chkIncludeInActive').length == 0) {
      chkIncludeCompleted = '<div class="choice include-choice" id="divIncludeInactive"><input name="chkIncludeInActive" id="chkIncludeInActive" type="checkbox"><label class="form-option-label" for="chkIncludeInActive">Show Completed</label></div>'
      $(chkIncludeCompleted).insertBefore('.gage-request-table table');
    }

    wireUpSortFields();
  }



  if (($(".status-lookup-cbo select option").length > 0) && ($('#cboFilter_Status option' == 0))) {
    $("#cboFilter_Status").html($(".status-lookup-cbo select").html());
  }

  if (($(".department-lookup-cbo select option").length > 0) && ($('#cboFilter_Department option' == 0))) {
    $("#cboFilter_Department").html($(".department-lookup-cbo select").html());
  }

  if (($(".machine-group-lookup-cbo select option").length > 0) && ($('#cboFilter_MachineGroup option' == 0))) {
    $("#cboFilter_MachineGroup").html($(".machine-group-lookup-cbo select").html());
  }

  if (($(".operator-lookup-cbo select option").length > 0) && ($('#cboFilter_Operator option' == 0))) {
    $("#cboFilter_Operator").html($(".operator-lookup-cbo select").html());
    $("#cboFilter_Operator").find('option:eq(0)').prop('selected', true);
  }

  if (($(".cell-leader-lookup-cbo select option").length > 0) && ($('#cboFilter_CellLeader option' == 0))) {
    $("#cboFilter_CellLeader").html($(".cell-leader-lookup-cbo select").html());
    $("#cboFilter_CellLeader").find('option:eq(0)').prop('selected', true);
  }


}


function generateGoBackButtons() {
  var $goback_buttons = $(".gobackbutton");
  $goback_buttons.each(function (index) {
    $(this).parent().append("<div id='go-back' class='ui-button ui-corner-all ui-widget' onclick='callGoBack()'><span class='ui-icon ui-icon-arrowreturnthick-1-w'></span>Go Back</div><div id='return-ticket' class='ui-button ui-corner-all ui-widget' onclick='callReturnTicket()'><span class='ui-icon ui-icon-check'></span>Return Ticket</div>");
  });
  $(".gobackbutton").remove();

  var $gobackactivate_buttons = $(".goback_activate");
  $gobackactivate_buttons.each(function (index) {
    $(this).parent().append("<div id='go-back' class='ui-button ui-corner-all ui-widget' onclick='callGoBack()'><span class='ui-icon ui-icon-arrowreturnthick-1-w'></span>Go Back</div>");
  });
  $(".goback_activate").remove();
}


function generateMachineList() {
  var detailTicketID = $('.details-request-id input').val();
  var activateTicketID = $('.activate-ticket-id input').val();
  var machineList = '';

  if (detailTicketID != '') {

    $('[id^="Field152"]').each(function (index, element) {
      machineName = $(element).val();
      if (machineName != '') {
        if (machineList.length > 0) {
          machineList += ', ' + machineName;
        }
        else {
          machineList = machineName;
        }
      }
    });

    $('.machine-name-list input').val(machineList);
  }

  if (activateTicketID != '') {

    $('[id^="Field131"]').each(function (index, element) {
      machineName = $(element).val();
      if (machineName != '') {
        if (machineList.length > 0) {
          machineList += ', ' + machineName;
        }
        else {
          machineList = machineName;
        }
      }
    });

    $('.activate-machine-list input').val(machineList);
  }
}


function generateRequestNumberColumn() {
  $('.request-detail-link').remove();
  var request_numbers = $('.request-number-col input[type="text"]');
  var request_ids = $('.edit-id-col input[type="text"]');
  request_numbers.each(function (index) {
    let request_id = $(request_ids[index]).val();
    let request_number = $(this).val();
    let request_number_link = $("<a>", { text: request_number, class: 'request-detail-link', href: 'javascript:void(0);', onclick: `showDetails(${request_id})` });
    $(this).parent().append(request_number_link);
  });

}


function getTicketRowCount() {
  var row_count = $('.gage-request-table table tbody tr').length;
  return row_count;
}


function loadCellLeaderMap() {
  if (cellLeaderMap.keys.length == 0) {
    var cellLeader_rows = $('.cellleader-lookup-table table tbody tr');
    if (cellLeader_rows.length == 0) {
      return;
    }
    cellLeader_rows.each(function (index) {
      cellLeaderID = Number($(this).find('.cellleader-lookup-table-id input').val());
      cellLeaderName = $(this).find('.cellleader-lookup-table-name input').val();
      cellLeaderMap.set(cellLeaderID, cellLeaderName);
      cellLeaderNameMap.set(cellLeaderName, cellLeaderID);
    });
  }
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


function loadiFrame(src) {
  $("#popUpDiv").html("<iframe id='print-iframe' name='myname' src='" + src + "' />");
}


function reApplyFilterValues() {
  if ($('#filterRow').length == 0) {
    return;
  }

  var departmentFilterVal = Number($('.fdid input').val());
  var cellLeaderFilterVal = Number($('.fclid input').val());
  var partNumberFilterValue = $('.fpname input').val();
  var jobNumberFilterValue = $('.fjnbr input').val();
  var operatorFilterValue = $('.fopname input').val();

  $('#txtFilter_PartNumber').val(partNumberFilterValue);
  $('#txtFilter_JobNumber').val(jobNumberFilterValue);
  $('#txtFilter_Operator').val(operatorFilterValue);


  if (departmentFilterVal != 0) {
    let departmentName = departmentMap.get(departmentFilterVal);
    $('#cboFilter_Department').val(departmentName);
  }

  if (cellLeaderFilterVal != 0) {
    let cellLeaderName = cellLeaderMap.get(cellLeaderFilterVal);
    $("#cboFilter_CellLeader").val(cellLeaderName);
  }
}


function resetPageNumber() {
  $('.gage-request-table').hide();
  $('.request-detail-link').remove();
  $('.pg input').val(1).change();
}


function showDetails(request_id) {
  var is_active_user = Number($(".user-isactive input").val());

  $(".details-request-id input").val(request_id).change();

  if (is_active_user == 1) {
    $('.Submit').show();
  }
}


// Sort the table by a given column, toggling direction if already sorted by that column.
function sortTable(newSortOrdinal, selector) {

  $('.request-detail-link').remove();
  $('.sort-icon').remove();

  var currentSortOrdinal = Number($('.sfo input').val());
  var sortDirection = Number($('.sd input').val());

  if (newSortOrdinal == currentSortOrdinal) {
    if (sortDirection == 0) {
      sortDirection = 1
      $('.sd input').val(1).change();
    }
    else {
      sortDirection = 0;
      $('.sd input').val(0).change();
    }
  }
  else {
    $('.sfo input').val(newSortOrdinal);
    $('.sd input').val(0).change();
    sortDirection = 0;
  }

  if (sortDirection == 0) {
    $(`${selector} .cf-col-label`).append('<span class="ui-icon ui-icon-triangle-1-n sort-icon"></span>');
  }
  else {
    $(`${selector} .cf-col-label`).append('<span class="ui-icon ui-icon-triangle-1-s sort-icon"></span>');
  }
}


// Wire up click handlers on column headers to enable sorting.
function wireUpSortFields() {

  $('#q37 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-n sort-icon"></span>');

  $('#q37').on('click', function () { sortTable(0, '#q37'); });   // Request Number (default)
  $('#q29').on('click', function () { sortTable(1, '#q29'); });     // Department
  $('#q30').on('click', function () { sortTable(2, '#q30'); });     // MachineName
  $('#q31').on('click', function () { sortTable(3, '#q31'); });     // OperatorName
  $('#q32').on('click', function () { sortTable(4, '#q32'); });   // Cell Leader
  $('#q33').on('click', function () { sortTable(5, '#q33'); });     // Part Number
  $('#q34').on('click', function () { sortTable(6, '#q34'); });   // Job Number
  $('#q36').on('click', function () { sortTable(7, '#q36'); });   // Create date

}