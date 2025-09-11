var departmentMap = new Map();
var departmentNameMap = new Map();
var machineGroupMap = new Map();
var machineGroupNameMap = new Map();
var cellLeaderMap = new Map();
var cellLeaderNameMap = new Map();


var should_print_receipt = true;


$(document).ready(function () {
  $('.Submit').hide();
  $(document).prop('title', 'Modify Ticket');
  $('.Submit').click(function (e) { validateForm(e); });
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simplePagination.js/1.6/simplePagination.min.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
  var bootstrapButton = $.fn.button.noConflict(); // return $.fn.button to previously assigned value
  $.fn.bootstrapBtn = bootstrapButton;
  
  $('#q0').append("<div class='hidden' id='popUpDiv'></div>");

  var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
  var printEvent = window[eventMethod];
  var messageEvent = eventMethod === "attachEvent" ? "onmessage" : "message";
  printEvent(messageEvent, function (e) {

    if (e.data === "printme" || e.message === "printme") {
      $("#print-iframe").get(0).contentWindow.print();
      $('.print-ticket-id input').val(null);
    }
  });

  $(document).on("onloadlookupfinished", function () {
    var sitename = $.cookie('site_name');
    if (sitename != null) {
      $('.site-name select').val(sitename).change();
    }
    generateGoBackButtons();
  });

  $(document).on('lookupcomplete', function (e) {
    if (e.triggerId == 'Field2') {
      if ($('#Field2').val()) {
        if ($('#Field2').val() != null) {
          print_receipt();
        }
      }
    }

    if ($('.pg input').val() == '999') {
      $('.pg input').val(1).change();
    }

    loadDepartmentMap();
    loadMachineGroupMap();
    loadCellLeaderMap();


    $('.ticket-table-created-on input').each((i, dateField) => $(dateField).val($(dateField).val().split(" ")[0]));
    $('.ticket-table-last-cal input').each((i, dateField) => $(dateField).val($(dateField).val().split(" ")[0]));
    $('.ticket-table-cal-due-date input').each((i, dateField) => $(dateField).val($(dateField).val().split(" ")[0]));
    generateTicketNumberColumn();
    generatePrintButtons();
    generateActivateButtons();
    generateFilterRow();
    reApplyFilterValues();
    appendPagination();
    if ($('.details-ticket-type-id input').val() == '2') {
      setDailyCalValues();
    }
    $('.ticket-table').show();

  });

  $(document).on('change', '.site-name select', function () {
    var sitename = $('.site-name select').val();
    $.cookie('site_name', sitename, { expires: 365, path: '/' });
  });

  $(document).on('change', '[id^="Field81"]', function (e) {
    if ($(e.currentTarget).val() == 'BIN') {
      $(e.currentTarget).closest('tr').find('.add-pins-bins-table-diameter input').val(0).addClass("ui-state-disabled");
      $(e.currentTarget).closest('tr').find('.add-pins-bins-table-number-of-pins input').val(1).addClass("ui-state-disabled");
    }
    else {
      $(e.currentTarget).closest('tr').find('.add-pins-bins-table-diameter input').val(null).removeClass("ui-state-disabled");
      $(e.currentTarget).closest('tr').find('.add-pins-bins-table-number-of-pins input').removeClass("ui-state-disabled");
    }
  });

  $(document).on('keyup', '[id^="Field83"]', function () {
    this.value = this.value.toLocaleUpperCase();
  });

  $(document).on('keyup', '[id^="Field92"]', function () {
    this.value = this.value.toLocaleUpperCase();
  });

  $(document).on('change', '[id^="Field122"]', function (e) {
    generateMachineList();
  });

  $(document).on('change', '[id^="Field131"]', function (e) {
    generateMachineList();
  });

  $(document).on('click', '.cf-collection-delete', function (e) {
    generateMachineList();
  });

});


function appendPagination() {

  var current_page = Number($('.pg input').val());
  if (current_page == 999) { return; }

  var row_count = getTicketRowCount();

  if (row_count > 0) {
    $('#ticket-table-pagination').remove();
    if ((current_page == 1) && (row_count < 25)) {
      $('.ticket-table table').parent().append("<div id='ticket-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled'>‹‹</a></li><li><a class='page-link prev isDisabled'>‹</a></li><li><a class='page-link next isDisabled'>›</a></li></ul></div>");
      return;
    }
    if ((current_page == 1) && (row_count == 25)) {
      $('.ticket-table table').parent().append("<div id='ticket-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled'>‹‹</a></li><li><a class='page-link prev isDisabled'>‹</a></li><li><a class='page-link next' onclick='callNextPage();' href='javascript:void(0);'>›</a></li></ul></div>")
      return;
    }
    if ((current_page > 1) && (row_count == 25)) {
      $('.ticket-table table').parent().append("<div id='ticket-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev' onclick='resetPageNumber();' href='javascript:void(0);''>‹‹</a></li><li><a class='page-link prev' onclick='callPrevPage();' href='javascript:void(0);''>‹</a></li><li><a class='page-link next' onclick='callNextPage();' href='javascript:void(0);'>›</a></li></ul></div>")
      return;
    }
    if ((current_page > 1) && (row_count < 25)) {
      $('.ticket-table table').parent().append("<div id='ticket-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev' onclick='resetPageNumber();' href='javascript:void(0);''>‹‹</a></li><li><a class='page-link prev' onclick='callPrevPage();' href='javascript:void(0);''>‹</a></li><li><a class='page-link next isDisabled'>›</a></li></ul></div>")
      return;
    }
  }
}


function callActivate(ticket_id) {
  $('.modify-action input').val(3);
  $('.activate-ticket-id input').val(ticket_id).change(); 
  $('.Submit').show();
}


function callGoBack() {
  $(".details-ticket-id input").val(null).change();
  $(".details-ticket-type-id input").val(null).change();
  $('.details-modifier-employee-number input').val(null).change();
  $('.add-pins-bins-table-new-bin-number input').val('');
  $('[id^="Field81"]').val(null).change();
  $('[id^="Field83"]').val('');
  $('[id^="Field92"]').val('');
  $('.activate-ticket-id input').val(null).change(); 
  $('.modify-action input').val(0);
  $('.Submit').hide();
}


function callNextPage() {
  $('.ticket-table').hide();
  $('.ticket-detail-link').remove();
  current_page = Number($('.pg input').val());
  $('.pg input').val(current_page + 1).change();
}


function callPrevPage() {
  $('.ticket-table').hide();
  $('.ticket-detail-link').remove();
  current_page = Number($('.pg input').val());
  if (current_page == 1) {
    return;
  }
  $('.pg input').val(current_page - 1).change();
}


function callPrint(ticket_id) {
  should_print_receipt = true;
  var ticketTypeID = getTicketTypeIDByTicketID(ticket_id);
  var ticketGuid = getTicketGuidByTicketID(ticket_id);
  $('.print-ticket-id input').val(ticketGuid);
  $('.print-ticket-type-id input').val(ticketTypeID);
  print_receipt();
}


function callReturnTicket() {

  var siteID = Number($('.site-id input').val());
  if (siteID == 1) {
    if ($('.cr-employee-name input').val().length == 0) {
      $.alert({
        title: 'Enter Your Employee Number!',
        content: 'You have to enter your employee number before you can return this ticket.',
      });
      return;
    }
  }
  if (siteID == 2) {
    if ($('.anoka-employee-name input').val().length == 0) {
      $.alert({
        title: 'Enter Your Employee Number!',
        content: 'You have to enter your employee number before you can return this ticket.',
      });
      return;
    }
  }




  $.confirm({
    title: 'Are you sure?',
    content: 'Are you sure you wish to return this ticket in? It cannot be undone.',

    buttons: {
      ok: {
        text: "OK",
        keys: ['enter'],
        action: function () {
          $('.modify-action input').val(1);
          $('.print-ticket-id input').val(null).change();
          $('#form1').submit();
        }
      },
      cancel: function () {
        
      }
    }
  });
}


function filterTicketTable() {

  if ($('#filterRow').length == 0) {
    return;
  }

  var ticketNumberFilterValue = $('#txtFilter_TicketNumber').val();
  //var ticketTypeFilterVal = $('#cboFilter_TicketType').val();
  var departmentFilterVal = $('#cboFilter_Department').val();
  var machineGroupFilterVal = $('#cboFilter_MachineGroup').val();
  var operatorFilterVal = $('#cboFilter_Operator').val();
  var cellLeaderFilterVal = $('#cboFilter_CellLeader').val();
  var statusFilterVal = $('#cboFilter_Status').val();

  $('.ftname input').val(ticketNumberFilterValue);


  $('.fsid input').val(statusFilterVal); 

  //if ((ticketTypeFilterVal != null) && (ticketTypeFilterVal.length > 0)) {
  //  $('.fttid input').val(ticketTypeFilterVal);
  //}
  //else {
  //  $('.fttid input').val(0);
  //}

  if ((departmentFilterVal != 0) && (departmentFilterVal.length > 0)) {
    let taskDepartmentID = departmentNameMap.get(departmentFilterVal);
    $('.fdid input').val(taskDepartmentID);
  }
  else {
    $('.fdid input').val(0);
  }

  if ((machineGroupFilterVal != 0) && (machineGroupFilterVal.length > 0)) {
    let machineGroupID = machineGroupNameMap.get(machineGroupFilterVal);
    $('.fmgid input').val(machineGroupID);
  }
  else {
    $('.fmgid input').val(null);
  }

  if ((operatorFilterVal != null) && (operatorFilterVal.length > 0)) {
    $('.fopname input').val(operatorFilterVal);
  }
  else {
    $('.fopname input').val(null);
  }

  if ((cellLeaderFilterVal != 0) && (cellLeaderFilterVal.length > 0)) {
    let cellLeaderID = cellLeaderNameMap.get(cellLeaderFilterVal);

    $('.fclid input').val(cellLeaderID);
  }
  else {
    $('.fclid input').val(0);
  }

  $('.ticket-table').hide();
  $('.ticket-detail-link').remove();
  $('.pg input').val(1).change();

}


function generateFilterRow() {

  if ($('#filterRow').length == 0) {

    var filter_row = "<TR id='filterRow'><TH/><TH/><TH><input type='text' id='txtFilter_TicketNumber'></TH><TH/><TH><select id='cboFilter_Status'/></TH><TH><select id='cboFilter_Department'/></TH><TH/><TH><select id='cboFilter_MachineGroup'/></TH><TH><select id='cboFilter_Operator'/></TH><TH><select id='cboFilter_CellLeader'/></TH><TH/><TH/><TH/><TH/><TH/><TH/>"
    $('.ticket-table table thead').append(filter_row);
    $("#txtFilter_TicketNumber").on("change", function () { filterTicketTable(); });
    //$("#cboFilter_TicketType").on("change", function () { filterTicketTable(); });
    $("#cboFilter_Department").on("change", function () { filterTicketTable(); });
    $("#cboFilter_MachineGroup").on("change", function () { filterTicketTable(); });
    $("#cboFilter_Operator").on("change", function () { filterTicketTable(); });
    $("#cboFilter_CellLeader").on("change", function () { filterTicketTable(); });
    $("#cboFilter_Status").on("change", function () { filterTicketTable(); });


    $("#txtFilter_TicketNumber").dblclick(function () { $("#txtFilter_TicketNumber").val(null).change(); });
    //$("#cboFilter_TicketType").dblclick(function () { $("#cboFilter_TicketType").val(null).change(); });
    $("#cboFilter_Department").dblclick(function () { $("#cboFilter_Department").val(null).change(); });
    $("#cboFilter_MachineGroup").dblclick(function () { $("#cboFilter_MachineGroup").val(null).change(); });
    $("#cboFilter_Operator").dblclick(function () { $("#cboFilter_Operator").val(null).change(); });
    $("#cboFilter_CellLeader").dblclick(function () { $("#cboFilter_CellLeader").val(null).change(); });
    $("#cboFilter_Status").dblclick(function () { $("#cboFilter_Status").val(null).change(); });
    wireUpSortFields();
  }

  //if (($(".ticket-type-lookup-cbo select option").length > 0) && ($('#cboFilter_TicketType option' == 0))) {
  //  $("#cboFilter_TicketType").html($(".ticket-type-lookup-cbo select").html());
  //}

  if (($(".status-lookup-cbo select option").length > 0) && ($('#cboFilter_Status option' == 0))) {
    $("#cboFilter_Status").html($(".status-lookup-cbo select").html());
  }

  if (($(".department-lookup-cbo select option").length > 0) && ($('#cboFilter_Department option' == 0) )) {
    $("#cboFilter_Department").html($(".department-lookup-cbo select").html());
  }

  if (($(".machine-group-lookup-cbo select option").length > 0) && ($('#cboFilter_MachineGroup option' == 0) )) {
    $("#cboFilter_MachineGroup").html($(".machine-group-lookup-cbo select").html());
  }

  if (($(".operator-lookup-cbo select option").length > 0) && ($('#cboFilter_Operator option' == 0) )) {
    $("#cboFilter_Operator").html($(".operator-lookup-cbo select").html());
    $("#cboFilter_Operator").find('option:eq(0)').prop('selected', true);
  }

  if (($(".cell-leader-lookup-cbo select option").length > 0) && ($('#cboFilter_CellLeader option' == 0) )) {
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
  var detailTicketID = $('.details-ticket-id input').val();
  var activateTicketID = $('.activate-ticket-id input').val();
  var machineList = '';

  if (detailTicketID != '') {

    $('[id^="Field122"]').each(function (index, element) {
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


function generateActivateButtons() {
  var activate_textboxes = $(".activate-ticket-button input[type=text]");
  var ticket_ids = $(".ticket-table-id input[type=text]");
  var ticket_status_ids = $(".ticket-status-id-col input[type=text]");
  activate_textboxes.each(function (index) {
    let ticket_id = ticket_ids[index].value;
    let ticket_status_id = ticket_status_ids[index].value;
    if (ticket_status_id == '1') {
      let has_button = $(this).parent().find('.activate-button').length;
      if (has_button == 0) {
        let btn_html = `<div class='table-button ui-button activate-button' onclick='callActivate(${ticket_id})'><span title='Activate' class='ui-button-icon ui-icon ui-icon-power'/></div>`
        $(this).parent().append(btn_html);
      }
    }
  });
}


function generatePrintButtons() {
  var print_buttons = $(".ticket-table-print-button input[type=text]");
  var ticket_ids = $(".ticket-table-id input[type=text]");
  print_buttons.each(function (index) {
    let ticket_id = ticket_ids[index].value;
    let has_button = $(this).parent().find('.print-button').length;
    if (has_button == 0) {
      let btn_html = `<div class='table-button ui-button print-button' onclick='callPrint(${ticket_id})'><span title='Print' class='ui-button-icon ui-icon ui-icon-print'/></div>`
      $(this).parent().append(btn_html);
    }
  });
}


function generateTicketNumberColumn() {
  $('.ticket-detail-link').remove();
  var ticket_numbers = $('.ticket-table-ticket-number input[type="text"]');
  var ticket_ids = $('.ticket-table-id input[type="text"]');
  ticket_numbers.each(function (index) {
    let ticket_id = $(ticket_ids[index]).val();
    let ticket_number = $(this).val();
    let ticket_number_link = $("<a>", { text: ticket_number, class: 'ticket-detail-link', href: 'javascript:void(0);', onclick: `showDetails(${ticket_id})` });
    $(this).parent().append(ticket_number_link);
  });

}


function getTicketGuidByTicketID(ticket_id) {
  var ticket_guid;
  var ticket_ids = $(".ticket-table-id input[type=text]");
  var ticket_guids = $(".ticket-table-print-button input[type=text]");

  ticket_ids.each(function (index) {
    var row_ticket_id = $(this).val();
    var row_ticket_guid = ticket_guids[index].value;
    if (row_ticket_id == ticket_id) {
      ticket_guid = row_ticket_guid;
      return;
    }
  });
  return ticket_guid;
}


function getTicketRowCount() {
  var row_count = $('.ticket-table table tbody tr').length;
  return row_count;
}


function getTicketTypeIDByTicketID(ticket_id) {
  var ticket_type_id;
  var ticket_ids = $(".ticket-table-id input[type=text]");
  var ticket_type_ids = $(".ticket-table-ticket-type-id input[type=text]");

  ticket_ids.each(function (index) {
    var row_ticket_id = $(this).val();
    var row_ticket_type_id = ticket_type_ids[index].value;
    if (row_ticket_id == ticket_id) {
      ticket_type_id = row_ticket_type_id;
      return;
    }
  });


  return ticket_type_id;
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


function loadMachineGroupMap() {
  if (machineGroupMap.keys.length == 0) {
    var machine_group_rows = $('.machine-group-lookup-table table tbody tr');
    if (machine_group_rows.length == 0) {
      return;
    }
    machine_group_rows.each(function (index) {
      machineGroupID = Number($(this).find('.machine-group-lookup-table-id input').val());
      machineGroupName = $(this).find('.machine-group-lookup-table-name input').val();
      machineGroupMap.set(machineGroupID, machineGroupName);
      machineGroupNameMap.set(machineGroupName, machineGroupID);
    });
  }

}


function print_receipt() {

  var domain = document.location.hostname;
  var receipt_url_root = "http://" + domain + "/Forms/";
  var receipt_url = "";



  if ($('.print-ticket-type-id input').val() == 1) {
    receipt_url = receipt_url_root + "PinGageReceipt?guid=" + $('.print-ticket-id input').val();
  }
  if ($('.print-ticket-type-id input').val() == 2) {
    receipt_url = receipt_url_root + "ThreadReceipt?guid=" + $('.print-ticket-id input').val();
  }

  if (should_print_receipt == true) {
    if (receipt_url != "") {
      loadiFrame(receipt_url);
      should_print_receipt == false;
      $('.print-ticket-id input').val(null).change();
    }
  }
}


function reApplyFilterValues() {
  if ($('#filterRow').length == 0) {
    return;
  }

  var ticketNumberFilterValue = $('.ftname input').val();
  var ticketTypeFilterVal = $('.fttid input').val();
  var departmentFilterVal = Number($('.fdid input').val());
  var machineGroupFilterVal = Number($('.fmgid input').val());
  var operatorFilterVal = $('.fopname input').val();
  var cellLeaderFilterVal = Number($('.fclid input').val());
  var statusFilterVal = $('.fsid input').val();

  $('#cboFilter_Status').val(statusFilterVal);

  if ((ticketNumberFilterValue != null) && (ticketNumberFilterValue.length > 0)) {
    $('#txtFilter_TicketNumber').val(ticketNumberFilterValue);
  }

  //if (ticketTypeFilterVal != 0) {
  //  $("#cboFilter_TicketType").val(ticketTypeFilterVal);
  //}

  if (departmentFilterVal != 0) {
    let departmentName = departmentMap.get(departmentFilterVal);
    $('#cboFilter_Department').val(departmentName);
  }

  if (machineGroupFilterVal != 0) {
    let machineGroupName = machineGroupMap.get(machineGroupFilterVal);
    $('#cboFilter_MachineGroup').val(machineGroupName);
  }

  if ((operatorFilterVal != null) && (operatorFilterVal.length > 0)) {
    $("#cboFilter_Operator").val(operatorFilterVal);
  }

  if (cellLeaderFilterVal != 0) {
    let cellLeaderName = cellLeaderMap.get(cellLeaderFilterVal);
    $("#cboFilter_CellLeader").val(cellLeaderName);
  }
}


function removeAppendedFields() {
  $('.ticket-detail-link').remove();
  $('#ticket-table-pagination').remove();
}


function resetPageNumber() {
  $('.ticket-table').hide();
  $('.ticket-detail-link').remove();
  $('.pg input').val(1).change();
}


function resetValidationErrors() {
  $('.add-pins-bins-table-new-bin-number input').removeClass('parsley-error');
  $('.add-thread-gages-new-thread-gage-name input').removeClass('parsley-error');

  $('#bad-pin-name-error').remove();
  $('#preexisting-bin-error').remove();

  $('#bad-thread-gage-error').remove();
  $('#preexisting-thread-gage-error').remove();
  $('#missing-thread-gage-error').remove();

}


function setDailyCalValues() {
  var dailyCalValues = $('.existing-thread-gages-daily-cal-value input');
  var dailyCalDisplay = $('.existing-thread-gages-daily-cal fieldset');

  dailyCalValues.each(function (i) {
    let dailyCalValue = $(this).val();
    let dailyCalDisplayField = dailyCalDisplay[i];
    let dailyDisplayInputs = $(dailyCalDisplayField).find('input');
    dailyDisplayInputs.each(function (ii) {
      let inputValue = $(this).val();
      if (dailyCalValue == inputValue) {
        $(this).attr('checked', 'checked');
      }
    });
  });
}


function showDetails(ticket_id) {
  $('.modify-action input').val(2)
  $('.details-modifier-employee-number input').focus();
  $(".details-ticket-id input").val(ticket_id).change();
  $('.Submit').show();
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
      $('#q30 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-n sort-icon"></span>');
    }
    else {
      $('#q30 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-s sort-icon"></span>');
    }
  }
  if (newSortOrdinal == 1) {

    if (sortDirection == 0) {
      $('#q33 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-n sort-icon"></span>');
    }
    else {
      $('#q33 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-s sort-icon"></span>');
    }
  }
  if (newSortOrdinal == 2) {
    if (sortDirection == 0) {
      $('#q34 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-n sort-icon"></span>');
    }
    else {
      $('#q34 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-s sort-icon"></span>');
    }
  }
  if (newSortOrdinal == 3) {
    if (sortDirection == 0) {
      $('#q36 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-n sort-icon"></span>');
    }
    else {
      $('#q36 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-s sort-icon"></span>');
    }
  }
  if (newSortOrdinal == 4) {
    if (sortDirection == 0) {
      $('#q35 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-n sort-icon"></span>');
    }
    else {
      $('#q35 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-s sort-icon"></span>');
    }
  }
  if (newSortOrdinal == 5) {
    if (sortDirection == 0) {
      $('#q37 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-n sort-icon"></span>');
    }
    else {
      $('#q37 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-s sort-icon"></span>');
    }
  }
  if (newSortOrdinal == 6) {
    if (sortDirection == 0) {
      $('#q38 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-n sort-icon"></span>');
    }
    else {
      $('#q38 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-s sort-icon"></span>');
    }
  }
  if (newSortOrdinal == 7) {
    if (sortDirection == 0) {
      $('#q39 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-n sort-icon"></span>');
    }
    else {
      $('#q39 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-s sort-icon"></span>');
    }
  }
  if (newSortOrdinal == 8) {
    if (sortDirection == 0) {
      $('#q40 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-n sort-icon"></span>');
    }
    else {
      $('#q40 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-s sort-icon"></span>');
    }
  }
  if (newSortOrdinal == 9) {
    if (sortDirection == 0) {
      $('#q41 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-n sort-icon"></span>');
    }
    else {
      $('#q41 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-s sort-icon"></span>');
    }
  }
  if (newSortOrdinal == 10) {
    if (sortDirection == 0) {
      $('#q42 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-n sort-icon"></span>');
    }
    else {
      $('#q42 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-s sort-icon"></span>');
    }
  }
  if (newSortOrdinal == 11) {
    if (sortDirection == 0) {
      $('#q44 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-n sort-icon"></span>');
    }
    else {
      $('#q44 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-s sort-icon"></span>');
    }
  }
}


function validateForm(e) {
  var isValid = true;
  var siteID = Number($('.site-id input').val());
  var actionType = Number($('.modify-action input').val());

  if (actionType == 1) {
    return;
  }

  if (actionType == 3) {
    $('.print-ticket-id input').val($('.activate-guid input').val());

    let activateSubmitEmployeeNumber = $('.activate-employee-number input');
    let activateSubmitEmployeeName = $('.activate-employee-name input');
    let crActivateEmployeeNumber = $('.cr-activate-employee-number input');
    let anokaActivateEmployeeNumber = $('.anoka-activate-employee-number input');
    let crActivateEmployeeName = $('.cr-activate-employee-name input');
    let anokaActivateEmployeeName = $('.anoka-activate-employee-name input');
    
    if (siteID == 1) {
      activateSubmitEmployeeNumber.val(crActivateEmployeeNumber.val());
      activateSubmitEmployeeName.val(crActivateEmployeeName.val());
    }
    if (siteID == 2) {
      activateSubmitEmployeeNumber.val(anokaActivateEmployeeNumber.val());
      activateSubmitEmployeeName.val(anokaActivateEmployeeName.val());
    }

    return;
  }

  if (actionType == 2) {
    resetValidationErrors();
    var submitEmployeeNumber = $('.submit-employee-number input');
    var crEmployeeNumber = $('.cr-employee-number input');
    var anokaEmployeeNumber = $('.anoka-employee-number input');

    if (siteID == 1) {
      submitEmployeeNumber.val(crEmployeeNumber.val());
    }
    if (siteID == 2) {
      submitEmployeeNumber.val(anokaEmployeeNumber.val());
    }

    var ticketType = $('.details-ticket-type-id input').val();
    var pinRows = $('.add-pins-bins-table table tbody tr');
    var threadRows = $('.add-thread-gages-table table tbody tr');

    if (ticketType == 1) {
      pinRows.each(function (index) {

        let pinTypeValue = Number($(this).find('.add-pins-bins-table-pin-type-id input').val());
        let binName = $(this).find('.add-pins-bins-table-new-bin-number input');
        let existingBinTicketNumber = $(this).find('.add-pins-bins-table-existing-bin-id input');
        let binID = $(this).find('.add-pins-bins-table-new-bin-id input');
        if ((pinTypeValue == 5) && ((binName.val().length > 0) && binID.val().length == 0)) {
          binName.parent().find('#bad-pin-name-error').remove();
          binName.parent().append("<ul id='bad-pin-name-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>Invalid Pin Name.</li></ul>");
          binName.addClass('parsley-error');
          isValid = false;
        }
        if (existingBinTicketNumber.val().length > 0) {
          binName.parent().find('#preexisting-bin-error').remove();
          binName.parent().append("<ul id='preexisting-bin-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>Bin already marked as 'Checked Out'. See Metrology Calibration.</li></ul>");
          binName.addClass('parsley-error');
          isValid = false;
        }
      });
    }
    else if (ticketType == 2) {
      console.log('validating');
      threadRows.each(function (index) {
        let threadGageName = $(this).find('.add-thread-gages-table-thread-gage-name input');
        let threadGageID = $(this).find('.add-thread-gages-table-new-thread-gage-id input');
        let existingThreadGageTicketNumber = $(this).find('.add-thread-gages-table-existing-thread-gage-id input');
        let missingThreadGageTicketNumber = $(this).find('.existing-missing-thread-ticket-number input');

        if ((threadGageID.val().length == 0) && (threadGageName.val().length > 0)) {
          threadGageName.parent().find('#bad-thread-gage-error').remove();
          threadGageName.parent().append("<ul id='bad-thread-gage-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>Invalid Thread Gage Name.</li></ul>");
          threadGageName.addClass('parsley-error');
          isValid = false;
        }
        if (existingThreadGageTicketNumber.val().length > 0) {
          threadGageName.parent().find('#preexisting-thread-gage-error').remove();
          threadGageName.parent().append("<ul id='preexisting-thread-gage-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>Thread Gage already marked as 'Checked Out'. See Metrology Calibration.</li></ul>");
          threadGageName.addClass('parsley-error');
          isValid = false;
        }
        if (missingThreadGageTicketNumber.val().length > 0) {
          threadGageName.parent().find('#missing-thread-gage-error').remove();
          threadGageName.parent().append("<ul id='missing-thread-gage-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>Thread Gage marked as 'Missing' on another ticket. Bring gage to Metrology Calibration.</li></ul>");
          threadGageName.addClass('parsley-error');
          isValid = false;
        }
      });
    }

    if (isValid == true) {
      $('.print-ticket-id input').val($('.details-guid input').val());
    }
    else {
      e.preventDefault();
    }

    return;
  }
  
  e.preventDefault();
}


function wireUpSortFields() {

  $('#q30 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-n sort-icon"></span>');
  $('#q30').on('click', function () { sortTable(0); });
  $('#q33').on('click', function () { sortTable(1); });
  $('#q34').on('click', function () { sortTable(2); });
  $('#q36').on('click', function () { sortTable(3); });
  $('#q35').on('click', function () { sortTable(4); });
  $('#q37').on('click', function () { sortTable(5); });
  $('#q38').on('click', function () { sortTable(6); });
  $('#q39').on('click', function () { sortTable(7); });
  $('#q40').on('click', function () { sortTable(8); });
  $('#q41').on('click', function () { sortTable(9); });
  $('#q42').on('click', function () { sortTable(10); });
  $('#q44').on('click', function () { sortTable(11); });
}