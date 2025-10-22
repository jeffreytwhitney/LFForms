var requesterMap = new Map();
var requesterNameMap = new Map();
var statusMap = new Map();
var statusNameMap = new Map();


$(document).ready(function () {
  $('.Submit').hide();
  $(document).prop('title', 'Purchase Orders');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simplePagination.js/1.6/simplePagination.min.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
  var bootstrapButton = $.fn.button.noConflict(); // return $.fn.button to previously assigned value
  $.fn.bootstrapBtn = bootstrapButton;

  // Submit gate: defer to validateAdd/validateEdit based on action.
  $('.Submit').click(function (e) { submitForm(e); });

  // Normalize and capture the current user into a hidden field.
  var lfUserName = $('.lf-user-name input').val();
  if (lfUserName != 'Anonymous User') {
    $('.network-user-name input').val(lfUserName.toUpperCase().substr(lfUserName.lastIndexOf('\\') + 1)).change();
  }


  // Listen for messages from child iframes to close dialogs and optionally refresh
  window.onmessage = function (event) {
    console.log('Parent received message: ' + event.data);
    if (event.data == "CloseDialog") {
      $("#popupIFrame").dialog("destroy");
      $("#popupIFrame").remove();
    }
    if (event.data == "CloseDialogWithRefresh") {
      console.log('Closing dialog with refresh request.');
      $("#popupIFrame").dialog("destroy");
      $("#popupIFrame").remove();
      refreshPage();
    }
  };


  var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
  var printEvent = window[eventMethod];
  var messageEvent = eventMethod === "attachEvent" ? "onmessage" : "message";
  printEvent(messageEvent, function (e) {

    if (e.data === "printme" || e.message === "printme") {
      $("#print-iframe").get(0).contentWindow.print();
      $('.print-ticket-id input').val(null);
    }
  });

  // Persist selected site to a cookie.
  $(document).on('change', '.site-name select', function () {
    var sitename = $('.site-name select').val();
    $.cookie('site_name', sitename, { expires: 365, path: '/' });
  });

  // Include Inactive checkbox toggles filter and reloads page 1.
  $(document).on('change', '#chkIncludeInActive', function () { filterTable(); });

  // Quick view of description in a dialog on double-click.
  $(document).on('dblclick', '.description-col div', function (e) {
    var description = $(this).find('input').val();

    $.dialog({
      escapeKey: true,
      backgroundDismiss: true,
      title: `Purchase Order Description:`,
      content: description,
      resizable: true,
      width: 800,
      height: 600,
    });
  });

  // Quick view of long error in a dialog on double-click.
  $(document).on('dblclick', '.po-name-col div', function (e) {
    var poName = $(this).find('input').val();

    $.dialog({
      escapeKey: true,
      backgroundDismiss: true,
      title: `Gage ID/SN:`,
      content: poName,
      resizable: true,
      width: 800,
      height: 600,
    });
  });

  // When lookup tables are available, finish wiring the grid.
  $(document).on('lookupcomplete', function (e) {
    loadRequesterMap();
    loadStatusMap();

    // Trim date display to the date portion.
    $('.create-date-col input').each((i, dateField) => $(dateField).val($(dateField).val().split(" ")[0]));
    $('.last-updated-col input').each((i, dateField) => $(dateField).val($(dateField).val().split(" ")[0]));

    generateTableButtons(".edit-button-col", "ui-icon-pencil", "Edit Purchase Order", "callEditPurchaseOrder");
    appendPagination(); // See "Pagination" above.
    generateFilterRow(); // See "Filtering and Sorting" above.
    reApplyFilterValues();        // See "Page Refresh Quirks" above
    colorCodeRows();
    $('.purchase-order-table').show();

    if (($('.edit-po-id input').val() != '0') && ($('.edit-status-id input').val() != '')) {
      editStatusID = Number($('.edit-status-id input').val());
      editStatus = statusMap.get(editStatusID);
      $('.edit-status-cbo select').val(editStatus).change();
    }

  });

  // Final page activation after load.
  $(document).on("onloadlookupfinished", function (e) {
    // Host element for modal iframe dialogs.    
    $('#q0').append("<div class='hidden-text' id='popUpDiv'></div>");


    //See "Page Refresh Quirks" above.
    if ($('.pg input').val() == '999') {
      $('.pg input').val(1).change();
    }

    // Restore last-selected site from cookie.
    var sitename = $.cookie('site_name');
    if (sitename != null) {
      $('.site-name select').val(sitename).change();
    }

    // Trigger any dependent logic that listens to network-user-name changes.
    $('.network-user-name input').trigger("change");
    $('.purchase-order-table').show();
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
    $('#po-pagination').remove();
    if ((current_page == 1) && (row_count < 25)) {
      $('.purchase-order-table table').parent().append("<div id='po-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled'>‹‹</a></li><li><a class='page-link prev isDisabled'>‹</a></li><li><a class='page-link next isDisabled'>›</a></li></ul></div>");
      return;
    }
    if ((current_page == 1) && (row_count == 25)) {
      $('.purchase-order-table table').parent().append("<div id='po-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled'>‹‹</a></li><li><a class='page-link prev isDisabled'>‹</a></li><li><a class='page-link next' onclick='callNextPage();' href='javascript:void(0);'>›</a></li></ul></div>")
      return;
    }
    if ((current_page > 1) && (row_count == 25)) {
      $('.purchase-order-table table').parent().append("<div id='po-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev' onclick='resetPageNumber();' href='javascript:void(0);''>‹‹</a></li><li><a class='page-link prev' onclick='callPrevPage();' href='javascript:void(0);''>‹</a></li><li><a class='page-link next' onclick='callNextPage();' href='javascript:void(0);'>›</a></li></ul></div>")
      return;
    }
    if ((current_page > 1) && (row_count < 25)) {
      $('.purchase-order-table table').parent().append("<div id='po-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev' onclick='resetPageNumber();' href='javascript:void(0);''>‹‹</a></li><li><a class='page-link prev' onclick='callPrevPage();' href='javascript:void(0);''>‹</a></li><li><a class='page-link next isDisabled'>›</a></li></ul></div>")
      return;
    }
  }
}


/**
 * Opens the "Add Note" popup for the current task.
 * Side effects:
 * - Opens jQuery UI dialog with an iframe via popupIFrame.
 */
function callAddNote() {
  var po_id = $('.edit-po-id input').val();
  var po_number = $('.edit-po-number input').val();
  var po_name = $('.edit-po-name input').val();
  var popupTitle = '';

  if (po_number.length > 0) {
    popupTitle = `Add Note for Purchase Order ${po_number}`;
  }
  else {
    popupTitle = `Add Note for Purchase Order '${po_name}'`;
  }


  popupIFrame(`http://rmslf/Forms/MPM-AddPurchaseOrderNote?poid=${po_id}&nt=1`, popupTitle, 400, 650, false);
}


/**
 * Opens the "Add Programming Ticket" form in a modal iframe dialog sized to the current window.
 */
function callAddPurchaseOrder() {
  var widowHeight = $(window).height();
  var siteid = $('.site-id input').val();
  widowHeight = widowHeight - 50;
  popupIFrame(`http://rmslf/Forms/MPM-AddPurchaseOrder?siteid=${siteid}`, 'Add Purchase Order', widowHeight, 1500);
}


/**
 * Switches the UI into Edit PO mode for the specified PO.
 * - Opens the "Edit Programming Ticket" form in a modal iframe dialog sized to the current window.
 * @param {number} poID - The PO ID to edit.
 */
function callEditPurchaseOrder(poID) {
  var widowHeight = $(window).height();
  widowHeight = widowHeight - 50;
  popupIFrame(`http://rmslf/Forms/MPM-EditPurchaseOrder?poid=${poID}`, 'Edit Purchase Order', widowHeight, 1500);
}


/** Advance to next page and reload list. */
function callNextPage() {
  $('.purchase-order-table').hide();
  $('.table-button').remove();
  current_page = Number($('.pg input').val());
  $('.pg input').val(current_page + 1).change();
}


/** Go to previous page if possible and reload list. */
function callPrevPage() {
  $('.purchase-order-table').hide();
  $('.table-button').remove();
  current_page = Number($('.pg input').val());
  if (current_page == 1) {
    return;
  }
  $('.pg input').val(current_page - 1).change();
}


/**
 * Apply CSS classes to rows based on status and dates for quick visual scanning.
 * - Overdue: due date <= today
 * - Started: started recently or long-running (> 30 days)
 * - Waiting: status waiting
 * - Completed/Cancelled rows are ignored here (handled elsewhere)
 */
function colorCodeRows() {
  var purchase_order_rows = $(".purchase-order-table table tbody tr");

  var currentDate = new Date();
  var aMonthAgoNumber = new Date().setDate(currentDate.getDate() - 30);
  var aMonthAgo = new Date(aMonthAgoNumber).toISOString();

  $(purchase_order_rows).removeClass('colorOverDue');
  $(purchase_order_rows).removeClass('colorClosedCancelled');

  purchase_order_rows.each(function (index) {
    let purchase_order_row = purchase_order_rows[index];
    let createDateString = $(purchase_order_row).find('.create-date-col input[type="text"]').val();
    let poStatus = $(purchase_order_row).find('.po-status-col input[type="text"]').val();

    if ((poStatus == 'Completed') || (poStatus == 'Cancelled')) {
      $(purchase_order_row).addClass('colorClosedCancelled');
      return;
    }


    let createDate = moment(createDateString, "M/D/YYYY").toDate().toISOString();
    if (createDate <= aMonthAgo) {
      $(purchase_order_row).addClass('colorOverDue');
      return;
    }
  });
}


/**
 * Applies table filters based on header controls:
 * - Include Inactive checkbox -> .finccom
 * - Department/User Type dropdowns:
 *   - Converts names to IDs using departmentNameMap/userTypeNameMap
 *   - Writes values to .fdid/.futid hidden inputs
 * - Resets page to 1 and triggers refresh.
 */
function filterTable() {
  if ($('#filterRow').length == 0) {
    return;
  }

  if ($("#chkIncludeInActive").is(":checked")) {
    $('.finccom input').val(1);
  }
  else {
    $('.finccom input').val(0);
  }

  var requesterFilterVal = $('#cboFilter_Requester').val();
  var vendorFilterVal = $('#cboFilter_Vendor').val();

  if ((requesterFilterVal != null) && (requesterFilterVal.length > 0)) {
    let requesterID = requesterNameMap.get(requesterFilterVal);
    $('.freqid input').val(requesterID);
  }
  else {
    $('.freqid input').val(0);
  }

  if ((vendorFilterVal != null) && (vendorFilterVal.length > 0)) {
    $('.fvname input').val(vendorFilterVal);
  }
  else {
    $('.fvname input').val('');
  }

  $('.fponame input').val($('#txtFilter_POName').val());
  $('.fponum input').val($('#txtFilter_PONumber').val());
  $('.fdmin input').val($('#txtFilter_CreateDateMin').val());
  $('.fdmax input').val($('#txtFilter_CreateDateMax').val());


  $('.purchase-order-table').hide();
  $('.table-button').remove();
  $('.pg input').val(1).change();

}


/**
 * Create the filter header row and wire change/dblclick reset handlers.
 * Populates filter dropdowns from corresponding hidden lookup combos.
 */
function generateFilterRow() {

  if ($('#filterRow').length == 0) {

    var filter_row = "<TR id='filterRow'><TH/><TH><input id='txtFilter_PONumber'/></TH><TH/><TH><select id='cboFilter_Requester'/></TH><TH/><TH><select id='cboFilter_Vendor'/></TH><TH/><TH><input type='text' id='txtFilter_CreateDateMin' placeholder='Min Date'><input type='text' id='txtFilter_CreateDateMax' placeholder='Max Date'><TH/><TH/><TH/></TR>"


    $('.purchase-order-table table thead').append(filter_row);
    $("#txtFilter_PONumber").on("change", function () { filterTable(); });
    $("#txtFilter_CreateDateMin").on("change", function () { filterTable(); });
    $("#txtFilter_CreateDateMax").on("change", function () { filterTable(); });

    $("#cboFilter_Requester").on("change", function () { filterTable(); });
    $("#cboFilter_Vendor").on("change", function () { filterTable(); });

    // Quick clear on double-click.
    $("#txtFilter_PONumber").dblclick(function () { $("#txtFilter_PONumber").val(null).change(); });
    $("#txtFilter_CreateDateMin").dblclick(function () { $("#txtFilter_CreateDateMin").val(null).change(); });
    $("#txtFilter_CreateDateMax").dblclick(function () { $("#txtFilter_CreateDateMax").val(null).change(); });
    $("#cboFilter_Requester").dblclick(function () { $("#cboFilter_Requester").val(0).change(); });
    $("#cboFilter_Vendor").dblclick(function () { $("#cboFilter_Vendor").val(0).change(); });

    wireUpSortFields();
  }

  if ($('#chkIncludeInActive').length == 0) {
    chkIncludeCompleted = '<div class="choice include-choice" id="divIncludeInactive"><input name="chkIncludeInActive" id="chkIncludeInActive" type="checkbox"><label class="form-option-label" for="chkIncludeInActive">Include Completed</label></div>'
    $(chkIncludeCompleted).insertBefore('.purchase-order-table table');
    printButton = '<div class="ui-button print-button" id="print-report" onclick="printReport()"><span title="Print Report" class="ui-button-icon ui-icon ui-icon-print"></span>Print</div>'
    $(printButton).insertAfter('#divIncludeInactive');
  }

  if (isAdminUser()) {
    if ($('.add-button').length == 0) {
      var add_button = '<div class="ui-button add-button" id="add-purchase-order" onclick="callAddPurchaseOrder()"><span title="Add Purchase Order" class="ui-button-icon ui-icon ui-icon-plusthick"></span>Add Purchase Order</div>'
      $(add_button).insertBefore('.purchase-order-table table');
    }
    if ($('.add-note-button').length == 0) {
      var add_note_button = '<div class="ui-button add-note-button" id="add-note-button" onclick="callAddNote()"><span title="Add Note" class="ui-button-icon ui-icon ui-icon-plusthick"></span>Add Note</div>'
      $('#spacer').append(add_note_button);
    }
  }


  // Repopulate the filter controls from backing fields if present.
  if ((($('.fponame input').val() != null) && ($('.fponame input').val().length > 0)) && (($('#txtFilter_POName').val() == null) || ($('#txtFilter_POName').val() == ''))) {
    $('#txtFilter_POName').val($('.fponame input').val());
  }

  if ((($('.fponum input').val() != null) && ($('.fponum input').val().length > 0)) && (($('#txtFilter_PONumber').val() == null) || ($('#txtFilter_PONumber').val() == ''))) {
    $('#txtFilter_PONumber').val($('.fponum input').val());
  }

  if ((($('.fdmax input').val() != null) && ($('.fdmax input').val().length > 0)) && (($('#txtFilter_CreateDateMax').val() == null) || ($('#txtFilter_CreateDateMax').val() == ''))) {
    $('#txtFilter_CreateDateMax').val($('.fdmax input').val());
  }

  if ((($('.fdmin input').val() != null) && ($('.fdmin input').val().length > 0)) && (($('#txtFilter_CreateDateMin').val() == null) || ($('#txtFilter_CreateDateMin').val() == ''))) {
    $('#txtFilter_CreateDateMin').val($('.fdmin input').val());
  }

  // Populate dropdowns from lookup combos (do this once).
  if (($(".requester-lookup-cbo select option").length > 1) && ($("#cboFilter_Requester option").length == 0)) {
    $("#cboFilter_Requester").html($(".requester-lookup-cbo select").html());
  }

  if (($(".vendor-lookup-cbo select option").length > 1) && ($("#cboFilter_Vendor option").length == 0)) {
    $("#cboFilter_Vendor").html($(".vendor-lookup-cbo select").html());
  }

}


/**
 * Render a button-like div with an icon for each row in a given column.
 * @param {string} buttonSelector - Column selector (e.g., ".tasklist-note-col")
 * @param {string} buttonClass - jQuery UI icon CSS class to apply (e.g., "ui-icon-clock")
 * @param {string} buttonTitle - Tooltip for the icon/button
 * @param {string} buttonFunction - Global function name to call on click
 * @param {boolean} isArgNumeric - Whether the argument value is numeric (no quotes)
 */
function generateTableButtons(buttonSelector, buttonClass, buttonTitle, buttonFunction, isArgNumeric) {
  var btn_html
  var selectionString = buttonSelector + " input[type=text]";
  var buttons = $(selectionString);
  buttons.each(function () {
    var btn_value = $(this).val();
    if (isArgNumeric) {
      btn_html = `<div class='table-button ui-button' onclick='${buttonFunction}(${btn_value})'><span title='${buttonTitle}' class='ui-button-icon ui-icon ${buttonClass}'/></div>`
    }
    else {
      btn_html = `<div class='table-button ui-button' onclick='${buttonFunction}("${btn_value}")'><span title='${buttonTitle}' class='ui-button-icon ui-icon ${buttonClass}'/></div>`
    }



    var has_button = $(this).parent().find(`.${buttonClass}`).length;
    if (has_button == 0) {
      $(this).parent().append(btn_html);
    }
  });
}


/**
* @returns {number} The number of data rows rendered in the user table tbody.
*/
function getTableRowCount() {
  var row_count = $('.purchase-order-table tbody tr').length;
  return row_count;
}


/**
 * @returns {boolean} True when the current user is an admin user.
 */
function isAdminUser() {
  if ($('.user-isadmin input').val() == '1') {
    return true;
  }
  return false;
}


/**
 * Populate requester lookup maps (id->name and name->id) from hidden lookup table.
 */
function loadRequesterMap() {

  if (requesterMap.keys.length == 0) {
    var requester_rows = $('.requester-lookup-table table tbody tr');
    if (requester_rows.length == 0) {
      return;
    }
    requester_rows.each(function (index) {
      requesterID = Number($(this).find('.id input').val());
      requesterName = $(this).find('.name input').val();
      requesterMap.set(requesterID, requesterName);
      requesterNameMap.set(requesterName, requesterID);
    });

  }
}


/** Populate task status lookup maps (id<->name). */
function loadStatusMap() {
  if (statusMap.keys.length == 0) {
    var status_rows = $('.status-lookup-table table tbody tr');
    if (status_rows.length == 0) {
      return;
    }
    status_rows.each(function (index) {
      statusID = Number($(this).find('.id input').val());
      statusName = $(this).find('.name input').val();
      statusMap.set(statusID, statusName);
      statusNameMap.set(statusName, statusID);
    });
  }
}


/**
 * Opens an iframe inside a jQuery UI dialog.
 * @param {string} src - Iframe URL.
 * @param {string} title - Dialog title.
 * @param {number} height - Dialog/iframe height in px.
 * @param {number} width - Dialog/iframe width in px.
 * @param {boolean} cancelSubmit - If true, prevents dialog close from submitting.
 * Side effects:
 * - Creates and opens '#popupIFrame' dialog containing an iframe.
 */
function popupIFrame(src, title, height, width) {

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
      // no-op
    }
  });
  $("#popupIFrame").dialog("open");
  $("#popupIFrame").attr('style', `width: ${width};`);

  // Tweak jQuery UI resizable inline style (ensures width is applied)
  var resizeableStyle = $('.ui-resizable').attr('style');
  let newStyle = resizeableStyle.replaceAll('width: 0px;', `width: ${width}px;`);
  $('.ui-resizable').attr('style', newStyle);
}


/**
 * Constructs the report URL based on current filter values and loads it into the print iframe.
 * Side effects:
 * - Sets the 'src' of '#print-iframe' inside '#popUpDiv' to the constructed report URL.
 */
function printReport() {

  var domain = document.location.hostname;
  var url_root = "http://" + domain + "/Forms/";
  var report_url = "";
  var site_id = $('.site-id input').val();
  var finccom = Number($('.finccom input').val());
  var freqid = Number($('.freqid input').val());
  var fvname = $('.fvname input').val();
  var fponame = $('.fponame input').val();  
  var fponum = $('.fponum input').val();


  report_url = url_root + "MPM-PurchaseOrderPrint?sid=" + site_id + "&fincom=" + finccom;

  if (freqid != 0) {
    report_url = report_url + "&freqid=" + freqid;
  }

  if (fponame.length > 0) {
    report_url = report_url + "&fponame=" + encodeURIComponent(fponame);
  }

  if ((fvname != null) && (fvname.length > 0)) {
    report_url = report_url + "&fvname=" + encodeURIComponent(fvname);
  }

  if (fponum.length > 0) {
    report_url = report_url + "&fponum=" + encodeURIComponent(fponum);
  }

  if ($('.fdmin input').val().length > 0) {
    
    min_Date = moment($('.fdmin input').val()).format("YYYY-M-D");
    console.log('Min Date Filter Value: ' + min_Date);
    report_url = report_url + "&fdmin=" +min_Date;
  }

  if ($('.fdmax input').val().length > 0) {
    max_Date = moment($('.fdmax input').val()).format("YYYY-M-D");
    console.log('Max Date Filter Value: ' + max_Date);
    report_url = report_url + "&fdmax=" +max_Date;
  }


  $("#popUpDiv").html("<iframe id='print-iframe' name='myname' src='" + report_url + "' />");
}


/**
 * Placeholder for restoring filter UI from hidden fields.
 */
function reApplyFilterValues() {
  if ($('#filterRow').length == 0) {
    return;
  }

  var includeCompleted = Number($('.finccom input').val());
  var requesterIDFilterValue = Number($('.freqid input').val());
  var vendorFilterValue = $('.fvname input').val();
  var poNumberFilterValue = $('.fponum input').val();
  var dateMinFilterValue = $('.fdmin input').val();
  var dateMaxFilterValue = $('.fdmax input').val();

  if (includeCompleted == 1) {
    $('#chkIncludeInActive').prop('checked', true);
  }
  else {
    $('#chkIncludeInActive').prop('checked', false);
  }

  if ((requesterIDFilterValue != NaN) && (requesterIDFilterValue > 0)) {
    let requesterName = requesterMap.get(requesterIDFilterValue);
    $('#cboFilter_Requester').val(requesterName);
  }

  if ((vendorFilterValue != null) && (vendorFilterValue.length > 0)) {
    $('#txtFilter_Vendor').val(vendorFilterValue);
  }

  if ((poNumberFilterValue != null) && (poNumberFilterValue.length > 0)) {
    $('#txtFilter_PONumber').val(poNumberFilterValue);
  }

  if ((dateMinFilterValue != null) && (dateMinFilterValue.length > 0)) {
    $('#txtFilter_DateMin').val(dateMinFilterValue);
  }

  if ((dateMaxFilterValue != null) && (dateMaxFilterValue.length > 0)) {
    $('#txtFilter_DateMax').val(dateMaxFilterValue);
  }
  
}


/**
 * Rebuilds current page URL with query-string parameters mirroring current filter state,
 * then navigates to that URL to cause a full server-side refresh.
 */
function refreshPage() {
  var includeCompleted = Number($('.finccom input').val());
  var requesterIDFilterValue = $('.freqid input').val();
  var vendorFilterValue = $('.fvname input').val();
  var poNumberFilterValue = $('.fponum input').val();
  var dateMinFilterValue = $('.fdmin input').val();
  var dateMaxFilterValue = $('.fdmax input').val();
  var taskListPage = Number($('.pg input').val());
  var sfo = Number($('.sfo input').val());
  var sd = Number($('.sd input').val());

  var current_url = window.location.href;
  if (current_url.includes('?')) {
    indexOfQuestionMark = current_url.indexOf('?');
    current_url = current_url.substring(0, indexOfQuestionMark);
  }

  if ((taskListPage != null) && (taskListPage != NaN) && (taskListPage > 0)) {
    current_url = current_url + `?pg=${taskListPage}`;
  }

  if ((requesterIDFilterValue != null) && (requesterIDFilterValue.length > 0)) {
    current_url = current_url + `&freqid=${requesterIDFilterValue}`;
  }

  if ((includeCompleted != null) && (includeCompleted != NaN) && (includeCompleted > 0)) {
    current_url = current_url + `&finccom=${includeCompleted}`;
  }

  if ((vendorFilterValue != null) && (vendorFilterValue.length > 0)) {
    current_url = current_url + `&fvname=${encodeURIComponent(vendorFilterValue)}`;
  }

  if ((poNumberFilterValue != null) && (poNumberFilterValue.length > 0)) {
    current_url = current_url + `&fponum=${encodeURIComponent(poNumberFilterValue)}`;
  }

  if ((dateMinFilterValue != null) && (dateMinFilterValue.length > 0)) {
    current_url = current_url + `&fdmin=${encodeURIComponent(dateMinFilterValue)}`;
  }

  if ((dateMaxFilterValue != null) && (dateMaxFilterValue.length > 0)) {
    current_url = current_url + `&fdmax=${encodeURIComponent(dateMaxFilterValue)}`;
  }

  if ((sfo != null) && (sfo != NaN)) {
    current_url = current_url + `&sfo=${sfo}`;
  }

  if ((sd != null) && (sd != NaN)) {
    current_url = current_url + `&sd=${sd}`;
  }

  window.location = current_url;
}


// Reset to page 1 and refresh the list.
function resetPageNumber() {
  $('.purchase-order-table').hide();
  $('.table-button').remove();
  $('.pg input').val(1).change();
}


/**
 * Toggles sort state and updates the sort icons in the specified column header.
 * - Reads current sort field (.sfo) and direction (.sd).
 * - When the same field is clicked, toggles direction; when new field, sets ascending (0).
 * - Appends a jQuery UI triangle icon to the header label.
 * @param {number} newSortOrdinal - The ordinal/index for the clicked field.
 * @param {string} selector - The column header selector (e.g., "#q21").
 */
function sortTable(newSortOrdinal, selector) {

  $('.table-button').remove();
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


/**
* Wires the sortable column headers and sets the initial sort indicator.
*/
function wireUpSortFields() {

  $('#q37 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-n sort-icon"></span>');
  $('#q37').on('click', function () { sortTable(0, '#q37'); });   //Create Date (default)
  $('#q20').on('click', function () { sortTable(1, '#q20'); });   //PO Number
  $('#q29').on('click', function () { sortTable(2, '#q29'); });   //Status
  $('#q24').on('click', function () { sortTable(3, '#q24'); });   //Vendor
  $('#q23').on('click', function () { sortTable(4, '#q23'); });   //Purchase Order Name
  $('#q28').on('click', function () { sortTable(5, '#q28'); });   //Requester

}