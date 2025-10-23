var statusMap = new Map();
var statusNameMap = new Map();
$(document).ready(function () {

  $(document).prop('title', 'Edit Purchase Order');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
  var bootstrapButton = $.fn.button.noConflict(); // return $.fn.button to previously assigned value so that popup close button displays correctly.
  $.fn.bootstrapBtn = bootstrapButton;

  if ($('.closeme input').val() == 1) {
    window.parent.postMessage('CloseDialogWithRefresh', '*');
    $('.Submit').hide();
    return;
  }

  $('.Submit').click(function (e) { submitForm(e); });
  $('.network-user-name input').val($('.lf-user-name input').val().toUpperCase().substr($('.lf-user-name input').val().lastIndexOf('\\') + 1)).change();

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
      var current_url = window.location.href;
      window.location = current_url;
    }
  };


  $(document).on('lookupcomplete', function (e) {
    var poid = Number($('.poid input').val());
    var statusid = Number($('.current-status-id input').val());

    if ((!isAdminUser()) || (poid == 0)) {
      $('.Submit').hide();
      return;
    }
    else {

      if ($('.add-line-item-button').length == 0) {
        var add_button = '<div class="ui-button add-line-item-button" id="add-line-item" onclick="callAddLineItem()"><span title="Add Line Item" class="ui-button-icon ui-icon ui-icon-plusthick"></span>Add Line Item</div>'
        $(add_button).insertBefore('.lineitem-table table');
      }
      if ($('.add-note-button').length == 0) {
        var add_note_button = '<div class="ui-button add-note-button" id="add-note-button" onclick="callAddNote()"><span title="Add Note" class="ui-button-icon ui-icon ui-icon-plusthick"></span>Add Note</div>'
        $('#spacer').append(add_note_button);
      }
      $('.Submit').show();
    }

    if (statusid > 2) {
      lockForm();
    }

    $('.date-scheduled-col input').each((i, dateField) => $(dateField).val($(dateField).val().split(" ")[0]));
    $('.service-date-col input').each((i, dateField) => $(dateField).val($(dateField).val().split(" ")[0]));
    $('.date-received-col input').each((i, dateField) => $(dateField).val($(dateField).val().split(" ")[0]));

    loadStatusMap();
    generateLinkColumn('edit-id', 'gage-idsn-col', 'line-item-link', 'callEditLineItem');

    var statusid = Number($('.current-status-id input').val());
    var statusName = statusMap.get(statusid);
    if ($('.purchase-order-status select').val() == ''){
      $('.purchase-order-status select').val(statusName).change();
    }

    

  });

  $(document).on("onloadlookupfinished", function (e) {
    $('.closeme input').val(1);
    $('#q0').append("<div class='hidden-text' id='popUpDiv'></div>");
    $('.network-user-name input').trigger("change");

    var poid = Number($('.poid input').val());
    if (poid > 0) {
      $('#purchase-order-iframe').remove();
      $('#notes-history-iframe').remove();

      if ((poid != '') && (poid != '0')) {
        $('#purchase-order-history').append(`<iframe id='purchase-order-iframe' name='purchase-order-iframe' src='http://rmslf/Forms/MPM-PurchaseOrderHistory?poid=${poid}' height='400' width='100%'/>`);
        $('#notes-history').append(`<iframe id='notes-history-iframe' name='notes-history-iframe' src='http://rmslf/Forms/MPM-PurchaseOrderNotes?poid=${poid}' height='400' width='100%'/>`);
      }
    }



  });

});


/**
 * Opens the "Add Note" popup for the current purchase order.
 * Side effects:
 * - Opens jQuery UI dialog with an iframe via popupIFrame.
 */
function callAddNote() {
  var po_id = $('.poid input').val();
  var po_number = $('.po-number input').val();
  var po_description = $('.description textarea').val();
  var popupTitle = '';

  if (po_number.length > 0) {
    popupTitle = `Add Note for Purchase Order ${po_number}`;
  }
  else {
    popupTitle = `Add Note for Purchase Order '${po_description}'`;
  }


  popupIFrame(`http://rmslf/Forms/MPM-AddPurchaseOrderNote?poid=${po_id}&nt=1`, popupTitle, 400, 650, true);
}


/**
 * Opens the "Add Line Item" form in a modal iframe dialog sized to the current window.
 */
function callAddLineItem() {
  var widowHeight = $(window).height();
  var poid = $('.poid input').val();
  widowHeight = widowHeight - 50;
  popupIFrame(`http://rmslf/Forms/MPM-AddPurchaseOrderLineItem?poid=${poid}`, 'Add Line Item', widowHeight, 1200, false);
}


/**
 * Opens the "Edit Line Item" form in a modal iframe dialog sized to the current window.
 * @param {number} poID - The PO ID to edit.
 */
function callEditLineItem(liID) {
  var widowHeight = $(window).height();
  widowHeight = widowHeight - 50;
  popupIFrame(`http://rmslf/Forms/MPM-EditPurchaseOrderLineItem?liid=${liID}`, 'Edit Line Item', widowHeight, 1200, false);
}


/**
 * Prompts the user for a required cancellation reason and submits the form.
 * Writes the reason into `.new-note textarea` before submission.
 * @returns {void}
 */
function cancelPurchaseOrder() {
  $('.section-add-note').append('<div id="section-add-note-content" class="section-add-note-content"><textarea id="note-textarea" rows="5" cols="50"></textarea></div>');
  var contentClone = $('#section-add-note-content');
  $(contentClone).dialog({
    title: 'Add Cancellation Reason (Required)',
    modal: true,
    width: 550,
    height: 350,
    autoOpen: false,
    resizable: false,
    buttons: {
      'OK': function () {
        let noteText = contentClone.find('#note-textarea').val().trim();
        if (noteText == '') {
          $.alert({ title: 'Must supply cancellation reason!', content: 'Sorry, you need to provide a reason for cancelling this purchase order.' });
          return;
        }

        $('.cancellation-reason textarea').val(noteText);
        $('#form1').submit();

        $('#section-add-note-content').remove();
        $(this).dialog('close');
        
      }
    }
  });

  var resizeableStyle = $('#note-textarea').attr('style');
  let newStyle = resizeableStyle + 'border-width: thin;border-color: black;border-style: solid;height: 200px;';
  $('#note-textarea').attr('style', newStyle);
  $(contentClone).dialog("open");
}


/**
 * Collects an optional completion note in a dialog and submits the form.
 * Preserves and restores the note section DOM because jQueryUI dialog removes it from the DOM, so it won't be there when the form submits.
 * @returns {void}
 */
function completePurchaseOrder() {
  $('.section-add-note').append('<div id="section-add-note-content" class="section-add-note-content"><textarea id="note-textarea" rows="5" cols="50"></textarea></div>');
  var contentClone = $('#section-add-note-content');
  $(contentClone).dialog({
    title: 'Add Completion Note (Optional)',
    modal: true,
    width: 550,
    height: 350,
    autoOpen: false,
    resizable: false,
    buttons: {
      'OK': function () {
        let noteText = contentClone.find('#note-textarea').val().trim();
        $('.completion-note textarea').val(noteText);
        $('#form1').submit();

        $('#section-add-note-content').remove();
        $(this).dialog('close');
        
      }
    }
  });

  var resizeableStyle = $('#note-textarea').attr('style');
  let newStyle = resizeableStyle + 'border-width: thin;border-color: black;border-style: solid;height: 200px;';
  $('#note-textarea').attr('style', newStyle);
  $(contentClone).dialog("open");

}


/**
 * Generates a column of links based on the provided selectors and function.
 * @param {string} idSelector - The selector for the link IDs.
 * @param {string} titleSelector - The selector for the link titles.
 * @param {string} linkSelector - The selector for the link elements.
 * @param {string} functionToCall - The name of the function to call with the link ID.
 */
function generateLinkColumn(idSelector, titleSelector, linkSelector, functionToCall) {
  $(`.${linkSelector}`).remove();
  var link_titles = $(`.${titleSelector} input[type="text"]`);
  var link_ids = $(`.${idSelector} input[type="text"]`);
  link_titles.each(function (index) {
    let link_id = $(link_ids[index]).val();
    let link_title = $(this).val();
    let link_html = $("<a>", { text: link_title, class: linkSelector, href: 'javascript:void(0);', onclick: `${functionToCall}(${link_id})` });
    let has_link = $(this).parent().find(`.${linkSelector}`).length;
    if (has_link == 0) {
      $(this).parent().append(link_html);
    }
  });

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


/** Lock the form fields to prevent editing. */
function lockForm() {
  $('.purchase-order-status select').prop('disabled', true);
  $('.description textarea').prop('disabled', true);
  $('#add-lineitem').prop('disabled', true);
  $('.Submit').hide();
}


/**
 * Creates and opens a jQuery UI Dialog containing an iframe for forms/pages.
 * Also adjusts resizable container styles for consistent width.
 * @param {string} src - Iframe URL
 * @param {string} title - Dialog title
 * @param {number} height - Dialog height in pixels
 * @param {number} width - Dialog width in pixels
 */
function popupIFrame(src, title, height, width, center) {
  $("#popupIFrame").remove();
  $("#popUpDiv").html(`<div height='${height}' width='${width}'><iframe id='popupIFrame' name='myname' src='${src}' height='${height}' width='${width}'/></div>`);

  if (center === undefined || center === true) {

    $("#popupIFrame").dialog({
      title: title,
      height: height,
      width: width,
      autoOpen: false,
      resizable: true,
      modal: true,
      close: function (event, ui) {
        // no-op
      }
    });
    $("#popupIFrame").dialog("open");
    $('#popupIFrame').attr('style', `width: 100%; height: ${height}px;`);

  } else {

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
    $("#popupIFrame").attr('style', `width: ${width};`);
    $("#popupIFrame").dialog("open");
    // Tweak jQuery UI resizable inline style (ensures width is applied)
    var resizeableStyle = $('.ui-resizable').attr('style');
    let newStyle = resizeableStyle.replaceAll('width: 0px;', `width: ${width}px;`);
    $('.ui-resizable').attr('style', newStyle);

    var iframeStyle = $('#popupIFrame').attr('style');
    let newIframeStyle = iframeStyle.replaceAll('width: auto;', `width: 100%;`);
    $('#popupIFrame').attr('style', newIframeStyle);

  }
}


/**
 * Resets the error fields in the form.
 */
function resetErrorFields() {
  var po_number = $('.po-number input');
  var status = $('.status-combo select');

  $('#po-number-required-error').remove();
  $('#wrong-status-error').remove();
  po_number.removeClass('parsley-error');
  status.removeClass('parsley-error');
}


/**
 * Submits the form data.
 * @param {Event} e - The event object.
 */
function submitForm(e) {
  
  var statusID = Number($('.new-status-id input').val());
  var form_is_valid = validateForm();
  if (form_is_valid == false) {
    e.preventDefault();
    return;
  }

  if (statusID == 3) {
    e.preventDefault();
    completePurchaseOrder();
    return;
  }
  if (statusID == 4) {
    e.preventDefault();
    cancelPurchaseOrder();
    return;
  }
}


/**
 * Validates the form fields.
 * @returns {boolean} True if the form is valid, false otherwise.
 */
function validateForm() {
  var is_valid = true;
  var po_numberField = $('.po-number input');
  var statusField = $('.purchase-order-status select');
  var po_number = $('.po-number input').val().trim();
  var statusID = Number($('.new-status-id input').val());
  resetErrorFields();

  if ((statusID == 2) && (po_number === '')) {
    po_numberField.addClass('parsley-error');
    po_numberField.parent().append("<ul id='po-number-required-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>Purchase Order Number is required when Status = 'Issued'.</li></ul>");
    is_valid = false;
  }

  if ((statusID == 3) && (po_number === '')) {
    po_numberField.addClass('parsley-error');
    po_numberField.parent().append("<ul id='po-number-required-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>Purchase Order Number is required when Status = 'Completed'.</li></ul>");
    is_valid = false;
  }
 
  if ((statusID == 1) && (po_number != '')) {
    console.log('Status ID: ' + statusID);
    console.log('PO Number: ' + po_number);
    statusField.addClass('parsley-error');
    statusField.parent().append("<ul id='wrong-status-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>If you enter a Purchase Order Number, you must set Status to 'Issued'.</li></ul>");
    is_valid = false;
  }

  return is_valid;
}