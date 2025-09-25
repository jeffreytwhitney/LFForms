$(document).ready(function () {
  // Hide submit controls and set page name.
  $('.Submit').hide();
  $(document).prop('title', '1Factory Curl Logs');

  // Load required 3rd-party scripts and styles used by this page.
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simplePagination.js/1.6/simplePagination.min.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');


  // When lookup tables are available, finish wiring the grid.
  $(document).on('lookupcomplete', function (e) {
    appendPagination(); // See "Pagination" above.
    generateFilterRow(); // See "Filtering and Sorting" above.
  });

  // Final page activation after load.
  $(document).on("onloadlookupfinished", function (e) {
    //See "Page Refresh Quirks" above.
    if ($('.pg input').val() == '999') {
      $('.pg input').val(1).change();
    }

  });

});


/**
  * Append simple pagination controls based on current page and row count.
 * Relies on '.pg input' value and current table rows.
 */
function appendPagination() {

  var current_page = Number($('.pg input').val());
  if (current_page == 999) { return; }

  var row_count = getTableRowCount();

  if (row_count > 0) {
    $('#log-pagination').remove();
    if ((current_page == 1) && (row_count < 25)) {
      $('.log-table table').parent().append("<div id='log-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled'>‹‹</a></li><li><a class='page-link prev isDisabled'>‹</a></li><li><a class='page-link next isDisabled'>›</a></li></ul></div>");
      return;
    }
    if ((current_page == 1) && (row_count == 25)) {
      $('.log-table table').parent().append("<div id='log-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled'>‹‹</a></li><li><a class='page-link prev isDisabled'>‹</a></li><li><a class='page-link next' onclick='callNextPage();' href='javascript:void(0);'>›</a></li></ul></div>")
      return;
    }
    if ((current_page > 1) && (row_count == 25)) {
      $('.log-table table').parent().append("<div id='log-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev' onclick='resetPageNumber();' href='javascript:void(0);''>‹‹</a></li><li><a class='page-link prev' onclick='callPrevPage();' href='javascript:void(0);''>‹</a></li><li><a class='page-link next' onclick='callNextPage();' href='javascript:void(0);'>›</a></li></ul></div>")
      return;
    }
    if ((current_page > 1) && (row_count < 25)) {
      $('.log-table table').parent().append("<div id='log-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev' onclick='resetPageNumber();' href='javascript:void(0);''>‹‹</a></li><li><a class='page-link prev' onclick='callPrevPage();' href='javascript:void(0);''>‹</a></li><li><a class='page-link next isDisabled'>›</a></li></ul></div>")
      return;
    }
  }
}


/** Advance to next page and reload list. */
function callNextPage() {
  current_page = Number($('.pg input').val());
  $('.pg input').val(current_page + 1).change();
}


/** Go to previous page if possible and reload list. */
function callPrevPage() {
  current_page = Number($('.pg input').val());
  if (current_page == 1) {
    return;
  }
  $('.pg input').val(current_page - 1).change();
}


/**
 * Push filter UI values into their backing hidden fields and refresh the list.
 * Reads values from the filter row controls.
 */
function filterTable() {
  if ($('#filterRow').length == 0) {
    return;
  }

  var programFilterValue = $('#txtFilter_Program').val();
  var machineNameFilterValue = $('#cboMachineName').val();
  var resultFilterValue = $('#cboResultStatus').val();


  $('.fpname input').val(programFilterValue);
  $('.fmname input').val(machineNameFilterValue);

  if (resultFilterValue != '') {
    $('.sid input').val(resultFilterValue);
  }
  else {
    $('.sid input').val(-1);
  }
  
  $('.pg input').val(1).change();

}


/**
 * Create the filter header row and wire change/dblclick reset handlers.
 * Populates filter dropdowns from corresponding hidden lookup combos.
 */
function generateFilterRow() {

  if ($('#filterRow').length == 0) {

    var filter_row = "<TR id='filterRow'><TH/><TH><input id='txtFilter_Program'/></TH><TH/><TH/><TH><select id='cboMachineName'/></TH><TH><select id='cboResultStatus'/></TH><TH/><TH/><TH/></TR>"

    $('.log-table table thead').append(filter_row);
    $("#txtFilter_Program").on("change", function () { filterTable(); });
    $("#cboMachineName").on("change", function () { filterTable(); });
    $("#cboResultStatus").on("change", function () { filterTable(); });


    // Quick clear on double-click.
    $("#txtFilter_Program").dblclick(function () { $("#txtFilter_Program").val(null).change(); });
    $("#cboMachineName").dblclick(function () {
      $("#cboMachineName").val(0).change();
    });
    $("#cboResultStatus").dblclick(function () {
      $('#cboResultStatus option:first').prop('selected', true).change();
    });

    wireUpSortFields();
  }

  // Populate dropdowns from lookup combos (do this once).
  if (($(".machine-name-lookup select option").length > 1) && ($("#cboMachineName option").length == 0)) {
    $("#cboMachineName").html($(".machine-name-lookup select").html());
  }

  if (($(".status-lookup select option").length > 1) && ($("#cboResultStatus option").length == 0)) {
    $("#cboResultStatus").html($(".status-lookup select").html());
  }

}


/** @returns {number} Count of task rows in the table body. */
function getTableRowCount() {
  var row_count = $('.log-table table tbody tr').length;
  return row_count;
}


// Reset to page 1 and refresh the list.
function resetPageNumber() {
  $('.pg input').val(1).change();
}


// Sort the table by a given column, toggling direction if already sorted by that column.
function sortTable(newSortOrdinal, selector) {

  $('.sort-icon').remove();

  var currentSortOrdinal = Number($('.sfo input').val());
  var sortDirection = Number($('.sfd input').val());

  if (newSortOrdinal == currentSortOrdinal) {
    if (sortDirection == 0) {
      sortDirection = 1
      $('.sfd input').val(1).change();
    }
    else {
      sortDirection = 0;
      $('.sfd input').val(0).change();
    }
  }
  else {
    if (selector == '#q20') {
      $('.sfo input').val(newSortOrdinal);
      $('.sfd input').val(1).change();
      sortDirection = 1;
    }
    else {
      $('.sfo input').val(newSortOrdinal);
      $('.sfd input').val(0).change();
      sortDirection = 0;
    }
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

  $('#q20 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-s sort-icon"></span>');

  $('#q20').on('click', function () { sortTable(0, '#q20'); });
  $('#q7').on('click', function () { sortTable(1, '#q7'); });
  $('#q1').on('click', function () { sortTable(2, '#q1'); });
  $('#q84').on('click', function () { sortTable(3, '#q84'); });
  $('#q6').on('click', function () { sortTable(4, '#q6'); });
}