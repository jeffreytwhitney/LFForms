const assigneeMap = new Map();
const assigneeNameMap = new Map();
const machineTypeMap = new Map();
const machineTypeNameMap = new Map();
let networkUserLookupStarted = false;



$(function () {

  // Initial UI setup.
  $('.Submit').hide();
  $(document).prop('title', 'Periodic Maintenance');

  // Runtime script/styles injection (cookies, confirm dialogs, UI theme, pagination CSS).
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simplePagination.js/1.6/simplePagination.min.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');

  // Avoid Bootstrap/jQuery UI .button() conflicts.
  $.fn.bootstrapBtn = $.fn.button.noConflict(); // return $.fn.button to previously assigned value

  // Submit gate: defer to validateAdd/validateEdit based on action.
  $('.Submit').on("click", function (e) { submitForm(e); });

  // Include Completed checkbox toggles filter and reloads page 1.
  $(document).on('change', '#chkIncludeCompleted', function () { filterTable(); });


  // Register immediately so the one-time event is not missed while waiting for DOM ready.
  $(document).on("onloadlookupfinished", function () {
    console.log('onloadlookupfinished');
    //generateGoBackButtons();
    if ($('.pg input').val() === '999') {
      $('.pg input').val(1).trigger("change");
    }
    // Normalize network username on load.
    if (!networkUserLookupStarted) {
      networkUserLookupStarted = true;
      $('.network-user-name input').trigger("change");
    }
    $('.pm-table').show();
  });


  // Hook when lookup data (departments/user types) is available.
  $(document).on('lookupcomplete', function () {
    if ($('.site-id input').val() === '' && !networkUserLookupStarted) {
      networkUserLookupStarted = true;
      console.log('Setting network user name.');
      $('.network-user-name input').trigger("change");
    }
    loadAssigneeMap();
    loadMachineTypeMap();
    generateTableButtons(".edit-button-col", "ui-icon-pencil", "Edit PM", "callEditPM");
    appendPagination();
    generateFilterRow();
    $('.pm-table').show();
  });


});


function appendPagination() {

  const current_page = Number($('.pg input').val());
  if (current_page === 999) {
    return;
  }

  const row_count = $('.pm-table tbody tr').length;

  if (row_count > 0) {
    $('#pm-pagination').remove();
    if ((current_page === 1) && (row_count < 25)) {
      $('.pm-table table').parent().append("<div id='pm-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled'>&laquo;</a></li><li><a class='page-link prev isDisabled'>&lsaquo;</a></li><li><a class='page-link next isDisabled'>&rsaquo;</a></li></ul></div>");
      return;
    }
    if ((current_page === 1) && (row_count === 25)) {
      $('.pm-table table').parent().append("<div id='pm-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled'>&laquo;</a></li><li><a class='page-link prev isDisabled'>&lsaquo;</a></li><li><a class='page-link next' onclick='callNextPage();' href='javascript:void(0);'>&rsaquo;</a></li></ul></div>")
      return;
    }
    if ((current_page > 1) && (row_count === 25)) {
      $('.pm-table table').parent().append("<div id='pm-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev' onclick='resetPageNumber();' href='javascript:void(0);'>&laquo;</a></li><li><a class='page-link prev' onclick='callPrevPage();' href='javascript:void(0);'>&lsaquo;</a></li><li><a class='page-link next' onclick='callNextPage();' href='javascript:void(0);'>&rsaquo;</a></li></ul></div>")
      return;
    }
    if ((current_page > 1) && (row_count < 25)) {
      $('.pm-table table').parent().append("<div id='pm-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev' onclick='resetPageNumber();' href='javascript:void(0);'>&laquo;</a></li><li><a class='page-link prev' onclick='callPrevPage();' href='javascript:void(0);'>&lsaquo;</a></li><li><a class='page-link next isDisabled'>&rsaquo;</a></li></ul></div>")
    }
  }
}


function callNextPage() {
  $('.pm-table').hide();
  $('.table-button').remove();
  const current_page = Number($('.pg input').val());
  $('.pg input').val(current_page + 1).trigger("change");
}


function callPrevPage() {
  $('.pm-table').hide();
  $('.table-button').remove();
  const current_page = Number($('.pg input').val());
  if (current_page === 1) {
    return;
  }
  $('.pg input').val(current_page - 1).trigger("change");
}


function generateFilterRow() {

}


function generateTableButtons(buttonSelector, buttonClass, buttonTitle, buttonFunction, isArgNumeric) {
  let btn_html;
  const selectionString = buttonSelector + " input[type=text]";
  const buttons = $(selectionString);
  buttons.each(function () {
    const btn_value = $(this).val() ?? '';
    if (isArgNumeric) {
      btn_html = `<div class='table-button ui-button' onclick='${buttonFunction}(${btn_value})'><span title='${buttonTitle}' class='ui-button-icon ui-icon ${buttonClass}'/></div>`;
    } else {
      const encodedValue = encodeURIComponent(btn_value);
      btn_html = `<div class='table-button ui-button' onclick='${buttonFunction}("${encodedValue}")'><span title='${buttonTitle}' class='ui-button-icon ui-icon ${buttonClass}'/></div>`;
    }


    const has_button = $(this).parent().find(`.${buttonClass}`).length;
    if (has_button === 0) {
      $(this).parent().append(btn_html);
    }
  });
}


function filterTable() {

}


function isMetrologyProgrammer() {
  const userTypeId = Number($('.user-type-id input').val());
  return userTypeId === 1 ;
}


function loadAssigneeMap() {
  const assignee_rows = $('.assignee-lookup-table table tbody tr');
  if (assignee_rows.length === 0) {
    return;
  }

  assigneeMap.clear();
  assigneeNameMap.clear();
  assignee_rows.each(function () {
    const assigneeID = Number($(this).find('.assignee-lookup-table-id input').val());
    const assigneeName = $(this).find('.assignee-lookup-table-name input').val();
    assigneeMap.set(assigneeID, assigneeName);
    assigneeNameMap.set(assigneeName, assigneeID);
  });
  assigneeMap.set(-1, 'Unassigned');
  assigneeNameMap.set('Unassigned', -1);
}


function loadMachineTypeMap() {
  const machine_type_rows = $('.machine-type-lookup-table table tbody tr');
  if (machine_type_rows.length === 0) {
    return;
  }

  machineTypeMap.clear();
  machineTypeNameMap.clear();
  machine_type_rows.each(function () {
    const machineTypeID = Number($(this).find('.machine-type-lookup-table-id input').val());
    const machineTypeName = $(this).find('.machine-type-lookup-table-name input').val();
    machineTypeMap.set(machineTypeID, machineTypeName);
    machineTypeNameMap.set(machineTypeName, machineTypeID);
  });
}


function resetPageNumber() {
  $('.pm-table').hide();
  $('.table-button').remove();
  $('.pg input').val(1).trigger("change");
}


function sortTable(newSortOrdinal) {

  removeAppendedFields();

  const currentSortOrdinal = Number($('.sort-field-ordinal input').val());
  let sortDirection = Number($('.sort-direction input').val());

  if (newSortOrdinal === currentSortOrdinal) {
    if (sortDirection === 0) {
      sortDirection = 1;
      $('.sort-direction input').val(1).trigger("change");
    } else {
      sortDirection = 0;
      $('.sort-direction input').val(0).trigger("change");
    }
  } else {
    $('.sort-field-ordinal input').val(newSortOrdinal);
    $('.sort-direction input').val(0).trigger("change");
    sortDirection = 0;
  }

  setSortIcon(newSortOrdinal, sortDirection);
}


function submitForm(e) {

}

function wireUpSortFields() {

  $('#q236').off('click').on('click', function () {
    sortTable(0);
  });   // Due Date (default)
  $('#q88').off('click').on('click', function () {
    sortTable(1);
  });     // Ticket Number
  $('#q83').off('click').on('click', function () {
    sortTable(2);
  });     // Ticket Name
  $('#q84').off('click').on('click', function () {
    sortTable(3);
  });     // Task Name
  $('#q234').off('click').on('click', function () {
    sortTable(4);
  });   // Status
  $('#q87').off('click').on('click', function () {
    sortTable(5);
  });     // Task Type
  $('#q235').off('click').on('click', function () {
    sortTable(6);
  });   // Assignee
  $('#q102').off('click').on('click', function () {
    sortTable(7);
  });   // Department
  $('#q221').off('click').on('click', function () {
    sortTable(8);
  });   // Submittor
  $('#q241').off('click').on('click', function () {
    sortTable(9);
  });   // Create Date

  setSortIcon(Number($('.sort-field-ordinal input').val()), Number($('.sort-direction input').val()));
}
