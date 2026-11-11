const assigneeMap = new Map();
const assigneeNameMap = new Map();
const machineTypeMap = new Map();
const machineTypeNameMap = new Map();


$(function () {

  $('.Submit').hide();
  $(document).prop('title', 'Preventative Maintenance');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simplePagination.js/1.6/simplePagination.min.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');

  $('.Submit').on("click", function (e) {
    submitForm(e);
  });

  $(document).on("change", ".edit-assignee-name-dbval input", function () {
    $('.edit-assignee-combo select').val($(this).val()).trigger("change");
  })

  $(document).on("change", ".edit-pm-is-completed-dbval input", function () {
    const value = $(this).val();
    const isCompleted = value === "1";
    const $completionRadios = $('input[name="Field51"][type="radio"]');

    $completionRadios
      .prop('checked', false)
      .filter('[value="' + value + '"]')
      .prop('checked', true);
    $completionRadios.prop('disabled', isCompleted);

    if (isCompleted) {
      $('.Submit').hide();
      $('.edit-assignee-combo select').prop('disabled', true);
      $('.edit-notes').prop('disabled', true);
    }

  })

  $(document).on('change', '#chkShowCompleted', function (e) {
    filterTable();
  })

  $(document).on("onloadlookupfinished", function () {
    console.log('onloadlookupfinished');
    if ($('.pg input').val() === '999') {
      $('.pg input').val(1).trigger("change");
    }
    const lfUserName = $('.lf-user-name input').val();
    $('.network-user-name input').val(lfUserName.toUpperCase().slice(lfUserName.lastIndexOf('\\') + 1)).trigger("change");
    generateGoBackButtons();

  });

  $(document).on('lookupcomplete', function () {
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


function callEditPM(pmid) {
  if (!isMetrologyUser()){
    return;
  }
  $('.edit-pm-id input').val(pmid).trigger("change");
  $('.Submit').show();

}


function callGoBack() {
  $(".edit-pm-id input").val(0).trigger("change");
  $('.Submit').hide();
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


function filterTable() {
  if ($('#filterRow').length === 0) {
    return;
  }

  if ($("#chkShowCompleted").is(":checked")) {
    $('.finccom input').val(1);
  } else {
    $('.finccom input').val(0);
  }

  const machineNameFilterVal = $('#cboFilter_MachineName').val();
  const machineTypeFilterVal = $('#cboFilter_MachineType').val();
  const assigneeFilterVal = $('#cboFilter_Assignee').val();

  if ((machineNameFilterVal !== null) && (machineNameFilterVal.length > 0)) {
    $('.fmname input').val(machineNameFilterVal);
  } else {
    $('.fmname input').val('');
  }

  if ((machineTypeFilterVal !== null) && (machineTypeFilterVal.length > 0)) {
    const machineTypeID = machineTypeNameMap.get(machineTypeFilterVal);
    $('.mtid input').val(machineTypeID);
  } else {
    $('.mtid input').val(0);
  }

  if ((assigneeFilterVal !== null) && (assigneeFilterVal.length > 0)) {
    const assigneeID = assigneeNameMap.get(assigneeFilterVal);
    $('.faid input').val(assigneeID);
  } else {
    $('.faid input').val(0);
  }

  $('.pm-table').hide();
  $('.table-button').remove();
  $('.pg input').val(1).trigger("change");
}


function generateFilterRow() {
  if ($('#filterRow').length === 0) {
    const filter_row = "<TR id='filterRow'><TH/><TH><select id='cboFilter_MachineName'/></TH><TH/><TH><select id='cboFilter_MachineType'/></TH><TH><select id='cboFilter_Assignee'/></TH><TH/><TH/><TH/><TH/><TH/></TR>"
    $('.pm-table table thead').append(filter_row);

    $("#cboFilter_MachineName").on("change", function () {
      filterTable();
    });
    $("#cboFilter_MachineType").on("change", function () {
      filterTable();
    });
    $("#cboFilter_Assignee").on("change", function () {
      filterTable();
    });


    $("#cboFilter_MachineName").on("dblclick", function () {
      $("#cboFilter_MachineName").val(0).trigger("change");
    });
    $("#cboFilter_MachineType").on("dblclick", function () {
      $("#cboFilter_MachineType").val(0).trigger("change");
    });
    $("#cboFilter_Assignee").on("dblclick", function () {
      $("#cboFilter_Assignee").val(0).trigger("change");
    });
    wireUpSortFields();
    const show_completed_chkbox = '<div class="choice include-choice"><input name="chkShowCompleted" id="chkShowCompleted" type="checkbox"><label class="form-option-label" for="chkShowCompleted">Show Completed</label></div>'
    if ($('#chkShowCompleted').length === 0) {
      $(show_completed_chkbox).insertBefore('.pm-table table');
    }
  }


  // Populate filter dropdowns once lookup combos are loaded.
  if (($(".machine-name-lookup-combo select option").length > 1) && ($("#cboFilter_MachineName option").length === 0)) {
    $("#cboFilter_MachineName").html($(".machine-name-lookup-combo select").html());
  }
  if (($(".machine-type-lookup-combo select option").length > 1) && ($("#cboFilter_MachineType option").length === 0)) {
    $("#cboFilter_MachineType").html($(".machine-type-lookup-combo select").html());
  }
  if (($(".assignee-lookup-combo select option").length > 1) && ($("#cboFilter_Assignee option").length === 0)) {
    $("#cboFilter_Assignee").html($(".assignee-lookup-combo select").html());
  }
}


function generateGoBackButtons() {
  const $goback_buttons = $(".gobackbutton");
  $goback_buttons.each(function () {
    $(this).parent().append("<div id='go-back' class='ui-button ui-corner-all ui-widget' onclick='callGoBack()'><span class='ui-icon ui-icon-arrowreturnthick-1-w'></span>Go Back</div>");
  });
  $(".gobackbutton").remove();
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


function isMetrologyUser() {
  const userTypeId = Number($('.user-type-id input').val());
  return userTypeId === 1 || userTypeId === 2;
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


function setSortIcon(sortOrdinal, sortDirection) {
  const sortSelectors = {
    0: '#q31',
    1: '#q25',
    2: '#q30',
    3: '#q29'
  };

  $('.sort-icon').remove();
  const selector = sortSelectors[sortOrdinal] ?? '#q31';
  const iconClass = (sortDirection === 1) ? 'ui-icon-triangle-1-s' : 'ui-icon-triangle-1-n';
  $(`${selector} .cf-col-label`).append(`<span class="ui-icon ${iconClass} sort-icon"></span>`);
}


function sortTable(newSortOrdinal) {

  $('.table-button').remove();

  const currentSortOrdinal = Number($('.sfo input').val());
  let sortDirection = Number($('.sd input').val());

  if (newSortOrdinal === currentSortOrdinal) {
    if (sortDirection === 0) {
      sortDirection = 1;
      $('.sd input').val(1).trigger("change");
    } else {
      sortDirection = 0;
      $('.sd input').val(0).trigger("change");
    }
  } else {
    $('.sfo input').val(newSortOrdinal);
    $('.sd input').val(0).trigger("change");
    sortDirection = 0;
  }

  setSortIcon(newSortOrdinal, sortDirection);
}


function submitForm(e) {

}


function wireUpSortFields() {

  $('#q31').off('click').on('click', function () {
    sortTable(0);
  });   // Due Date (default)
  $('#q25').off('click').on('click', function () {
    sortTable(1);
  });     // Machine Name
  $('#q30').off('click').on('click', function () {
    sortTable(2);
  });     // Assigned To
  $('#q29').off('click').on('click', function () {
    sortTable(3);
  });     // Machine Type


  setSortIcon(Number($('.sfo input').val()), Number($('.sd input').val()));
}
