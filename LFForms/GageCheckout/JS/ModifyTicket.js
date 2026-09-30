const departmentMap = new Map();
const departmentNameMap = new Map();
const machineGroupMap = new Map();
const machineGroupNameMap = new Map();
const cellLeaderMap = new Map();
const cellLeaderNameMap = new Map();


let should_print_receipt = true;


$(function () {
  $('.Submit').hide();

  $.when(
    $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js'),
    $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js')
  ).done(function () {
    $(document).prop('title', 'Modify Ticket');
    $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
    $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simplePagination.js/1.6/simplePagination.min.css">');
    $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
    $.fn.bootstrapBtn = $.fn.button.noConflict();
    $('#q0').append("<div class='hidden' id='popUpDiv'></div>");

  }).fail(function () {console.error('Failed to load required scripts');})
    .then(function () {});

  const eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
  const printEvent = window[eventMethod];
  const messageEvent = eventMethod === "attachEvent" ? "onmessage" : "message";
  printEvent(messageEvent, function (e) {

    if (e.data === "printme" || e.message === "printme") {
      $("#print-iframe").get(0).contentWindow.print();
      $('.print-ticket-id input').val(null);
    }
  });

  $('.Submit').on("click", function (e) { validateForm(e); });

  $(document).on("onloadlookupfinished", function () {
    const sitename = $.cookie('site_name');
    if (sitename !== null) {
      $('.site-name select').val(sitename).trigger("change");
    }
    generateGoBackButtons();
  });

  $(document).on('lookupcomplete', function (e) {
    if (e.triggerId === 'Field2') {
      if ($('#Field2').val()) {
        if ($('#Field2').val() !== null) {
          print_receipt();
        }
      }
    }

    if ($('.pg input').val() === '999') {
      $('.pg input').val(1).trigger("change");
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
    generateCloneButtons();
    generateFilterRow();
    reApplyFilterValues();
    appendPagination();
    fillMachineNameCombos();
    $('.ticket-table').show();

  });

  $(document).on('change', '.site-name select', function () {
    const sitename = $('.site-name select').val();
    $.cookie('site_name', sitename, { expires: 365, path: '/' });
  });

  $(document).on('change', '[id^="Field81"]', function (e) {
    if ($(e.currentTarget).val() === 'BIN') {
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

  $(document).on('change', '[id^="Field152"]', function () {
    generateMachineList();
  });

  $(document).on('change', '[id^="Field170"]', function () {
    generateMachineList();
  });

  $(document).on('change', '[id^="Field131"]', function () {
    generateMachineList();
  });

  $(document).on('click', '.cf-collection-delete', function () {
    generateMachineList();
  });

  $(document).on('click', '.ticket-detail-link', function (event) {
    event.preventDefault();
    const ticketID = Number($(this).data('ticket-id'));
    if (!Number.isNaN(ticketID)) {
      showDetails(ticketID);
    }
  });

  $(document).on('change', '.cr-activate-employee-name input', function () {
    const crActivateEmployeeNumberValue = $('.cr-activate-employee-number input').val();
    const crActivateEmployeeNameValue = $('.cr-activate-employee-name input').val();

    $('.activate-employee-number input').val(crActivateEmployeeNumberValue);
    $('.activate-employee-name input').val(crActivateEmployeeNameValue);
  });

  $(document).on('change', '.anoka-activate-employee-name input', function () {
    const anokaActivateEmployeeNumberValue = $('.anoka-activate-employee-number input').val();
    const anokaActivateEmployeeNameValue = $('.anoka-activate-employee-name input').val();

    $('.activate-employee-number input').val(anokaActivateEmployeeNumberValue);
    $('.activate-employee-name input').val(anokaActivateEmployeeNameValue);
  });

});


function appendPagination() {

  const current_page = Number($('.pg input').val());
  if (current_page === 999) { return; }

  const row_count = getTicketRowCount();

  if (row_count > 0) {
    $('#ticket-table-pagination').remove();
    if ((current_page === 1) && (row_count < 25)) {
      $('.ticket-table table').parent().append("<div id='ticket-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled'>&laquo;</a></li><li><a class='page-link prev isDisabled'>&lsaquo;</a></li><li><a class='page-link next isDisabled'>&rsaquo;</a></li></ul></div>");
      return;
    }
    if ((current_page === 1) && (row_count === 25)) {
      $('.ticket-table table').parent().append("<div id='ticket-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled'>&laquo;</a></li><li><a class='page-link prev isDisabled'>&lsaquo;</a></li><li><a class='page-link next' onclick='callNextPage();' href='javascript:void(0);'>&rsaquo;</a></li></ul></div>")
      return;
    }
    if ((current_page > 1) && (row_count === 25)) {
      $('.ticket-table table').parent().append("<div id='ticket-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev' onclick='resetPageNumber();' href='javascript:void(0);'>&laquo;</a></li><li><a class='page-link prev' onclick='callPrevPage();' href='javascript:void(0);'>&lsaquo;</a></li><li><a class='page-link next' onclick='callNextPage();' href='javascript:void(0);'>&rsaquo;</a></li></ul></div>")
      return;
    }
    if ((current_page > 1) && (row_count < 25)) {
      $('.ticket-table table').parent().append("<div id='ticket-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev' onclick='resetPageNumber();' href='javascript:void(0);'>&laquo;</a></li><li><a class='page-link prev' onclick='callPrevPage();' href='javascript:void(0);'>&lsaquo;</a></li><li><a class='page-link next isDisabled'>&rsaquo;</a></li></ul></div>")
    }
  }
}


function callActivate(ticket_id) {
  $('.modify-action input').val(3);
  $('.activate-ticket-id input').val(ticket_id).trigger("change");
  $('.Submit').show();
}


function callClone(ticket_id) {
  
  $('.modify-action input').val(4);
  $('.clone-ticket-id input').val(ticket_id).trigger("change");
  $('.print-ticket-id input').val($('.clone-guid input').val());
  $('.Submit').show();
}


function callGoBack() {

  $(".details-ticket-id input").val(null).trigger("change");
  $(".details-ticket-type-id input").val(null).trigger("change");
  $('.details-modifier-employee-number input').val(null).trigger("change");
  $('.clone-ticket-id input').val(null).trigger("change");
  $('.add-pins-bins-table-new-bin-number input').val('');
  $('[id^="Field81"]').val(null).trigger("change");
  $('[id^="Field83"]').val('');
  $('[id^="Field92"]').val('');
  $('.activate-ticket-id input').val(null).trigger("change");
  $('.modify-action input').val(0);
  $('.Submit').hide();
}


function callNextPage() {
  $('.ticket-table').hide();
  $('.ticket-detail-link').remove();
  $('.table-button').remove();
  const current_page = Number($('.pg input').val());
  $('.pg input').val(current_page + 1).trigger("change");
}


function callPrevPage() {
  $('.ticket-table').hide();
  $('.ticket-detail-link').remove();
  $('.table-button').remove();
  const current_page = Number($('.pg input').val());
  if (current_page === 1) {
    return;
  }
  $('.pg input').val(current_page - 1).trigger("change");
}


function callPrint(ticket_id) {
  should_print_receipt = true;
  const ticketGuid = getTicketGuidByTicketID(ticket_id);
  $('.print-ticket-id input').val(ticketGuid);
  print_receipt();
}


function buildMachineList(selector) {
  const machineNames = [];

  $(selector).each(function (index, element) {
    const machineName = String($(element).val() || '').trim();
    if (machineName.length > 0) {
      machineNames.push(machineName);
    }
  });

  return machineNames.join(', ');
}


function fillMachineNameCombos() {
  const machineNameInputs = $('[id^="Field122"]');

  $('[id^="Field152"]').each(function (index, element) {
    if ($(element).val() === '') {
      const machineNameInput = machineNameInputs[index];
      const machineNameInputVal = $(machineNameInput).val();
      $(element).val(machineNameInputVal).trigger("change");
    }

  });
}


function filterTicketTable() {

  if ($('#filterRow').length === 0) {
    return;
  }

  $('.projectlist-table').hide();
  removeAppendedFields();


  const ticketNumberFilterValue = $('#txtFilter_TicketNumber').val();
  const departmentFilterVal = String($('#cboFilter_Department').val() || '');
  const machineGroupFilterVal = String($('#cboFilter_MachineGroup').val() || '');
  const operatorFilterVal = String($('#cboFilter_Operator').val() || '');
  const cellLeaderFilterVal = String($('#cboFilter_CellLeader').val() || '');
  const statusFilterVal = $('#cboFilter_Status').val();
  const partNumberFilterValue = $('#txtFilter_PartNumber').val();

  const machineNameFilterValue = $('#txtFilter_MachineName').val();

  $('.ftname input').val(ticketNumberFilterValue);
  $('.fpnum input').val(partNumberFilterValue);
  $('.fmachname input').val(machineNameFilterValue);
  $('.fsid input').val(statusFilterVal);



  if (departmentFilterVal.length > 0) {
    const taskDepartmentID = departmentNameMap.get(departmentFilterVal);
    $('.fdid input').val(taskDepartmentID);
  }
  else {
    $('.fdid input').val(0);
  }

  if (machineGroupFilterVal.length > 0) {
    const machineGroupID = machineGroupNameMap.get(machineGroupFilterVal);
    $('.fmgid input').val(machineGroupID);
  }
  else {
    $('.fmgid input').val(null);
  }

  if (operatorFilterVal.length > 0) {
    $('.fopname input').val(operatorFilterVal);
  }
  else {
    $('.fopname input').val(null);
  }

  if (cellLeaderFilterVal.length > 0) {
    const cellLeaderID = cellLeaderNameMap.get(cellLeaderFilterVal);

    $('.fclid input').val(cellLeaderID);
  }
  else {
    $('.fclid input').val(0);
  }

  $('.ticket-table').hide();
  $('.ticket-detail-link').remove();
  $('.pg input').val(1).trigger("change");

}


function generateFilterRow() {

  if ($('#filterRow').length === 0) {

    const filter_row = "<TR id='filterRow'><TH/><TH/><TH/><TH/><TH><input type='text' id='txtFilter_TicketNumber'></TH><TH><select id='cboFilter_Status'/></TH><TH><select id='cboFilter_Department'/></TH><TH><input type='text' id='txtFilter_MachineName'></TH><TH><select id='cboFilter_MachineGroup'/></TH><TH><select id='cboFilter_Operator'/></TH><TH><select id='cboFilter_CellLeader'/></TH><TH><input type='text' id='txtFilter_PartNumber'></TH><TH/><TH/><TH/><TH/>"
    $('.ticket-table table thead').append(filter_row);


    $("#txtFilter_TicketNumber").on("change", function () {
      stripAsterisks(this);
      filterTicketTable();
    });
    $("#txtFilter_MachineName").on("change", function () {
      filterTicketTable();
    });
    $('#txtFilter_TicketNumber').on('keypress', function () {
      const input = $(this);
      setTimeout(function () {
        const val = String(input.val()).replace(/^\*+|\*+$/g, '');
        input.val(val);
      }, 0);
    });


    $("#cboFilter_Department").on("change", function () { filterTicketTable(); });
    $("#cboFilter_MachineGroup").on("change", function () { filterTicketTable(); });
    $("#cboFilter_Operator").on("change", function () { filterTicketTable(); });
    $("#cboFilter_CellLeader").on("change", function () { filterTicketTable(); });
    $("#cboFilter_Status").on("change", function () { filterTicketTable(); });

    $("#txtFilter_PartNumber").on("change", function () { filterTicketTable(); });



    $("#txtFilter_TicketNumber").on("dblclick", function () { $("#txtFilter_TicketNumber").val(null).trigger("change"); });
    $("#txtFilter_MachineName").on("dblclick", function () { $("#txtFilter_MachineName").val(null).trigger("change"); });
    $("#cboFilter_Department").on("dblclick", function () { $("#cboFilter_Department").val(null).trigger("change"); });
    $("#cboFilter_MachineGroup").on("dblclick", function () { $("#cboFilter_MachineGroup").val(null).trigger("change"); });
    $("#cboFilter_Operator").on("dblclick", function () { $("#cboFilter_Operator").val(null).trigger("change"); });
    $("#cboFilter_CellLeader").on("dblclick", function () { $("#cboFilter_CellLeader").val(null).trigger("change"); });

    $("#txtFilter_PartNumber").on("dblclick", function () { $("#txtFilter_PartNumber").val(null).trigger("change"); });


    $("#cboFilter_Status").on("dblclick", function () { $("#cboFilter_Status").val(null).trigger("change"); });


    wireUpSortFields();
  }



  if (($(".status-lookup-cbo select option").length > 0) && ($('#cboFilter_Status option').length === 0)) {
    $("#cboFilter_Status").html($(".status-lookup-cbo select").html());
  }

  if (($(".department-lookup-cbo select option").length > 0) && ($('#cboFilter_Department option').length === 0)) {
    $("#cboFilter_Department").html($(".department-lookup-cbo select").html());
  }

  if (($(".machine-group-lookup-cbo select option").length > 0) && ($('#cboFilter_MachineGroup option').length === 0)) {
    $("#cboFilter_MachineGroup").html($(".machine-group-lookup-cbo select").html());
  }

  if (($(".operator-lookup-cbo select option").length > 0) && ($('#cboFilter_Operator option').length === 0)) {
    $("#cboFilter_Operator").html($(".operator-lookup-cbo select").html());
    $("#cboFilter_Operator").find('option:eq(0)').prop('selected', true);
  }

  if (($(".cell-leader-lookup-cbo select option").length > 0) && ($('#cboFilter_CellLeader option').length === 0)) {
    $("#cboFilter_CellLeader").html($(".cell-leader-lookup-cbo select").html());
    $("#cboFilter_CellLeader").find('option:eq(0)').prop('selected', true);
  }


}


function generateGoBackButtons() {
  const $goback_buttons = $(".gobackbutton");
  $goback_buttons.each(function () {
    $(this).parent().append("<div class='go-back-button ui-button ui-corner-all ui-widget' onclick='callGoBack()'><span class='ui-icon ui-icon-arrowreturnthick-1-w'></span>Go Back</div>");
  });
  $(".gobackbutton").remove();

  const $gobackactivate_buttons = $(".goback_activate");
  $gobackactivate_buttons.each(function () {
    $(this).parent().append("<div class='go-back-button ui-button ui-corner-all ui-widget' onclick='callGoBack()'><span class='ui-icon ui-icon-arrowreturnthick-1-w'></span>Go Back</div>");
  });
  $(".goback_activate").remove();
}


function generateMachineList() {
  const detailTicketID = $('.details-ticket-id input').val();
  const activateTicketID = $('.activate-ticket-id input').val();
  const cloneTicketID = $('.clone-ticket-id input').val();

  if (detailTicketID !== '') {
    const detailMachineList = buildMachineList('[id^="Field152"]');
    $('.machine-name-list input').val(detailMachineList);
  }

  if (activateTicketID !== '') {
    const activateMachineList = buildMachineList('[id^="Field131"]');
    $('.activate-machine-list input').val(activateMachineList);
  }

  if (cloneTicketID !== '') {
    const cloneMachineList = buildMachineList('[id^="Field170"]');
    $('.clone-machine-list input').val(cloneMachineList);
  }
}


function generateActivateButtons() {
  const activate_textboxes = $(".activate-ticket-button input[type=text]");
  const ticket_ids = $(".ticket-table-id input[type=text]");
  const ticket_status_ids = $(".ticket-status-id-col input[type=text]");
  activate_textboxes.each(function (index) {
    const ticket_id = ticket_ids[index].value;
    const ticket_status_id = ticket_status_ids[index].value;
    if (ticket_status_id === '1') {
      const has_button = $(this).parent().find('.activate-button').length;
      if (has_button === 0) {
        const btn_html = `<div class='table-button ui-button activate-button' onclick='callActivate(${ticket_id})'><span title='Activate' class='ui-button-icon ui-icon ui-icon-power'/></div>`
        $(this).parent().append(btn_html);
      }
    }
  });
}


function generateCloneButtons() {
  const clone_textboxes = $(".clone-button input[type=text]");
  const ticket_ids = $(".ticket-table-id input[type=text]");
  const ticket_status_ids = $(".ticket-status-id-col input[type=text]");
  clone_textboxes.each(function (index) {
    const ticket_id = ticket_ids[index].value;
    const ticket_status_id = ticket_status_ids[index].value;
    if (ticket_status_id === '2') {
      const has_button = $(this).parent().find('.clone-button').length;
      if (has_button === 0) {
        const btn_html = `<div class='table-button ui-button clone-button' onclick='callClone(${ticket_id})'><span title='Clone' class='ui-button-icon ui-icon ui-icon-copy'/></div>`
        $(this).parent().append(btn_html);
      }
    }
  });
}


function generatePrintButtons() {
  const print_buttons = $(".ticket-table-print-button input[type=text]");
  const ticket_ids = $(".ticket-table-id input[type=text]");
  print_buttons.each(function (index) {
    const ticket_id = ticket_ids[index].value;
    const has_button = $(this).parent().find('.print-button').length;
    if (has_button === 0) {
      const btn_html = `<div class='table-button ui-button print-button' onclick='callPrint(${ticket_id})'><span title='Print' class='ui-button-icon ui-icon ui-icon-print'/></div>`
      $(this).parent().append(btn_html);
    }
  });
}


function generateTicketNumberColumn() {
  $('.ticket-detail-link').remove();
  const ticket_numbers = $('.ticket-table-ticket-number input[type="text"]');
  const ticket_ids = $('.ticket-table-id input[type="text"]');
  ticket_numbers.each(function (index) {
    const ticket_id = $(ticket_ids[index]).val();
    const ticket_number = $(this).val();
    const ticket_number_link = $("<a>", { text: ticket_number,
                                          class: 'ticket-detail-link',
                                          href: 'javascript:void(0);',
                                          'data-ticket-id': ticket_id });
    $(this).parent().append(ticket_number_link);
  });

}


function getTicketGuidByTicketID(ticket_id) {
  let ticket_guid;
  const normalizedTicketID = String(ticket_id);
  const ticket_ids = $(".ticket-table-id input[type=text]");
  const ticket_guids = $(".ticket-table-print-button input[type=text]");

  ticket_ids.each(function (index) {
    const row_ticket_id = String($(this).val());
    const row_ticket_guid = ticket_guids[index].value;
    if (row_ticket_id === normalizedTicketID) {
      ticket_guid = row_ticket_guid;
    }
  });
  return ticket_guid;
}


function getTicketRowCount() {
  return $('.ticket-table table tbody tr').length;
}


function loadCellLeaderMap() {
  if (cellLeaderMap.size === 0) {
    const cellLeader_rows = $('.cellleader-lookup-table table tbody tr');
    if (cellLeader_rows.length === 0) {
      return;
    }
    cellLeader_rows.each(function () {
      const cellLeaderID = Number($(this).find('.cellleader-lookup-table-id input').val());
      const cellLeaderName = $(this).find('.cellleader-lookup-table-name input').val();
      cellLeaderMap.set(cellLeaderID, cellLeaderName);
      cellLeaderNameMap.set(cellLeaderName, cellLeaderID);
    });
  }
}


function loadDepartmentMap() {
  if (departmentMap.size === 0) {
    const department_rows = $('.department-lookup-table table tbody tr');
    if (department_rows.length === 0) {
      return;
    }
    department_rows.each(function () {
      const departmentID = Number($(this).find('.department-lookup-table-id input').val());
      const departmentName = $(this).find('.department-lookup-table-name input').val();
      departmentMap.set(departmentID, departmentName);
      departmentNameMap.set(departmentName, departmentID);
    });
  }
}


function loadiFrame(src) {
  $("#popUpDiv").html("<iframe id='print-iframe' name='myname' src='" + src + "' />");
}


function loadMachineGroupMap() {
  if (machineGroupMap.size === 0) {
    const machine_group_rows = $('.machine-group-lookup-table table tbody tr');
    if (machine_group_rows.length === 0) {
      return;
    }
    machine_group_rows.each(function () {
      const machineGroupID = Number($(this).find('.machine-group-lookup-table-id input').val());
      const machineGroupName = $(this).find('.machine-group-lookup-table-name input').val();
      machineGroupMap.set(machineGroupID, machineGroupName);
      machineGroupNameMap.set(machineGroupName, machineGroupID);
    });
  }

}


function print_receipt() {
  const ticketGuid = String($('.print-ticket-id input').val() || '').trim();
  if (ticketGuid.length === 0) {
    return;
  }

  const domain = document.location.hostname;
  const receipt_url_root = document.location.protocol + "//" + domain + "/Forms/";
  const receipt_url = receipt_url_root + "PinGageReceipt?guid=" + ticketGuid;

  if (should_print_receipt === true) {
    if (receipt_url !== "") {

      setTimeout(function() {
        loadiFrame(receipt_url);
        should_print_receipt = false;
        $('.print-ticket-id input').val(null).trigger("change");
      }, 2000);
    }
  }
}


function reApplyFilterValues() {
  if ($('#filterRow').length === 0) {
    return;
  }

  const ticketNumberFilterValue = $('.ftname input').val();
  const departmentFilterVal = Number($('.fdid input').val());
  const machineGroupFilterVal = Number($('.fmgid input').val());
  const operatorFilterVal = $('.fopname input').val();
  const cellLeaderFilterVal = Number($('.fclid input').val());
  const statusFilterVal = $('.fsid input').val();
  const partNumberFilterValue = $('.fpnum input').val();

  const machineNameFilterValue = $('.fmachname input').val();

  $('#txtFilter_PartNumber').val(partNumberFilterValue);

  $('#txtFilter_MachineName').val(machineNameFilterValue);

  $('#cboFilter_Status').val(statusFilterVal);

  if ((ticketNumberFilterValue !== null) && (ticketNumberFilterValue.length > 0)) {
    $('#txtFilter_TicketNumber').val(ticketNumberFilterValue);
  }


  if (departmentFilterVal !== 0) {
    const departmentName = departmentMap.get(departmentFilterVal);
    $('#cboFilter_Department').val(departmentName);
  }

  if (machineGroupFilterVal !== 0) {
    const machineGroupName = machineGroupMap.get(machineGroupFilterVal);
    $('#cboFilter_MachineGroup').val(machineGroupName);
  }

  if ((operatorFilterVal !== null) && (operatorFilterVal.length > 0)) {
    $("#cboFilter_Operator").val(operatorFilterVal);
  }

  if (cellLeaderFilterVal !== 0) {
    const cellLeaderName = cellLeaderMap.get(cellLeaderFilterVal);
    $("#cboFilter_CellLeader").val(cellLeaderName);
  }
}


function removeAppendedFields() {
  $('.ticket-detail-link').remove();
  $('.table-button').remove();
  $('#ticket-table-pagination').remove();
}


function resetPageNumber() {
  $('.ticket-table').hide();
  $('.ticket-detail-link').remove();
  $('.table-button').remove();
  $('.pg input').val(1).trigger("change");
}


function resetValidationErrors() {
  $('.clone-part-number input').removeClass('parsley-error');
  $('.add-pins-bins-table-new-bin-number input').removeClass('parsley-error');

  $('.bad-pin-name-error').remove();
  $('.preexisting-bin-error').remove();
  $('.bad-clone-part-number').remove();
}


function showDetails(ticket_id) {
  $('.modify-action input').val(2)
  $(".details-ticket-id input").val(ticket_id).trigger("change");
  $('.Submit').show();
}


function sortTable(newSortOrdinal, columnSelector) {
  $('.projectlist-table').hide();
  removeAppendedFields();
  $('.sort-icon').remove();

  const currentSortOrdinal = Number($('.sort-field-ordinal input').val());
  let sortDirection = Number($('.sort-direction input').val());

  if (newSortOrdinal === currentSortOrdinal) {
    sortDirection = sortDirection === 0 ? 1 : 0;
    $('.sort-direction input').val(sortDirection).trigger("change");
  }
  else {
    $('.sort-field-ordinal input').val(newSortOrdinal);
    $('.sort-direction input').val(0).trigger("change");
    sortDirection = 0;
  }

  const sortIconClass = sortDirection === 0 ? 'ui-icon-triangle-1-n' : 'ui-icon-triangle-1-s';
  $(columnSelector + ' .cf-col-label').append('<span class="ui-icon ' + sortIconClass + ' sort-icon"></span>');
}


function stripAsterisks(selector) {
  const $input = $(selector);
  let val = $input.val();
  val = String(val).replace(/^\*+|\*+$/g, '');
  $input.val(val);
}


function validateForm(e) {
  let isValid = true;
  const siteID = Number($('.site-id input').val());
  const actionType = Number($('.modify-action input').val());

  if (actionType === 1) {
    return;
  }

  if (actionType === 3) {
    should_print_receipt = true;
    $('.print-ticket-id input').val($('.activate-guid input').val());
    return;
  }

  if (actionType === 4) {
    resetValidationErrors();
    const originalPartNumber = String($('.clone-original-part-number input').val() || '').trim().toUpperCase();
    const newPartNumber = String($('.clone-part-number input').val() || '').trim().toUpperCase();

    if (newPartNumber === originalPartNumber) {
      $('.clone-part-number input').addClass('parsley-error');
      $('.clone-part-number input').parent().append('<ul class="parsley-errors-list filled bad-clone-part-number"><li class="parsley-required">Cannot clone a ticket with the same part number.</li></ul>');
      e.preventDefault();
      return;
    }

    should_print_receipt = true;
    $('.print-ticket-id input').val($('.clone-guid input').val());
    return;
  }


  if (actionType === 2) {
    resetValidationErrors();
    const submitEmployeeNumber = $('.submit-employee-number input');
    const crEmployeeNumber = $('.cr-employee-number input');
    const anokaEmployeeNumber = $('.anoka-employee-number input');

    if (siteID === 1) {
      submitEmployeeNumber.val(crEmployeeNumber.val());
    }
    if (siteID === 2) {
      submitEmployeeNumber.val(anokaEmployeeNumber.val());
    }


    const pinRows = $('.add-pins-bins-table table tbody tr');

    pinRows.each(function () {

      const pinTypeValue = Number($(this).find('.add-pins-bins-table-pin-type-id input').val());
      const binName = $(this).find('.add-pins-bins-table-new-bin-number input');
      const existingBinTicketNumber = $(this).find('.add-pins-bins-table-existing-bin-id input');
      const binID = $(this).find('.add-pins-bins-table-new-bin-id input');
      const binNameValue = String(binName.val() || '');
      const existingBinTicketNumberValue = String(existingBinTicketNumber.val() || '');
      const binIDValue = String(binID.val() || '');
      if ((pinTypeValue === 5) && ((binNameValue.length > 0) && binIDValue.length === 0)) {
        binName.parent().find('.bad-pin-name-error').remove();
        binName.parent().append('<ul class="parsley-errors-list filled bad-pin-name-error"><li class="parsley-required">Invalid Pin Name.</li></ul>');
        binName.addClass('parsley-error');
        isValid = false;
      }
      if (existingBinTicketNumberValue.length > 0) {
        binName.parent().find('.preexisting-bin-error').remove();
        binName.parent().append('<ul class="parsley-errors-list filled preexisting-bin-error"><li class="parsley-required">Bin already marked as &quot;Checked Out&quot;. See Metrology Calibration.</li></ul>');
        binName.addClass('parsley-error');
        isValid = false;
      }
    });



    if (isValid === true) {
      should_print_receipt = true;
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
  $('#q30').on('click', function () { sortTable(0, '#q30'); });
  $('#q119').on('click', function () { sortTable(1, '#q119'); });
  $('#q34').on('click', function () { sortTable(2, '#q34'); });
  $('#q36').on('click', function () { sortTable(3, '#q36'); });
  $('#q35').on('click', function () { sortTable(4, '#q35'); });
  $('#q37').on('click', function () { sortTable(5, '#q37'); });
  $('#q38').on('click', function () { sortTable(6, '#q38'); });
  $('#q39').on('click', function () { sortTable(7, '#q39'); });
  $('#q41').on('click', function () { sortTable(8, '#q41'); });
  $('#q42').on('click', function () { sortTable(9, '#q42'); });
  $('#q44').on('click', function () { sortTable(10, '#q44'); });
}
