const statusMap = new Map();
const statusNameMap = new Map();
$(document).ready(function () {

  $(document).prop('title', 'Edit Purchase Order');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
   // return $.fn.button to previously assigned value so that popup close button displays correctly.
  $.fn.bootstrapBtn = $.fn.button.noConflict();

  if ($('.closeme input').val() === '1') {
    console.log("EditPurchaseOrder - Form submitted, closing dialog and refreshing parent.");
    window.parent.postMessage('CloseDialogWithRefresh', '*');
    $('.Submit').hide();
    return;
  }

  $('.Submit').on('click', function (e) { submitForm(e); });
  $('.network-user-name input').val($('.lf-user-name input').val().toUpperCase().slice($('.lf-user-name input').val().lastIndexOf('\\') + 1)).trigger("change");

  // Listen for messages from child iframes to close dialogs and optionally refresh
  window.onmessage = function (event) {
    if (event.data === "CloseDialog") {
      $("#popupIFrame").dialog("destroy");
      $("#popupIFrame").remove();
    }
    if (event.data === "CloseDialogWithRefresh") {
      $("#popupIFrame").dialog("destroy");
      $("#popupIFrame").remove();
      window.location = window.location.href;
    }
  };


  $(document).on('lookupcomplete', function () {
    const poid = Number($('.poid input').val());
    let statusid = Number($('.current-status-id input').val());

    if ((!isMetrologyUser()) || (poid === 0)) {
      $('.Submit').hide();
      return;
    }
    else {

      if ($('.add-line-item-button').length === 0) {
        const add_button = '<div class="ui-button add-line-item-button" id="add-line-item" onclick="callAddLineItem()"><span title="Add Line Item" class="ui-button-icon ui-icon ui-icon-plusthick"></span>Add Line Item</div>'
        $(add_button).insertBefore('.lineitem-table table');
      }
      if ($('.add-note-button').length === 0) {
        const add_note_button = '<div class="ui-button add-note-button" id="add-note-button" onclick="callAddNote()"><span title="Add Note" class="ui-button-icon ui-icon ui-icon-plusthick"></span>Add Note</div>'
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

    statusid = Number($('.current-status-id input').val());
    const statusName = statusMap.get(statusid);
    if ($('.purchase-order-status select').val() === ''){
      $('.purchase-order-status select').val(statusName).trigger("change");
    }
  });

  $(document).on("onloadlookupfinished", function () {
    $('.closeme input').val(1);
    $('#q0').append("<div class='hidden-text' id='popUpDiv'></div>");
    $('.network-user-name input').trigger("change");

    const poid = Number($('.poid input').val());
    if (poid > 0) {
      $('#purchase-order-iframe').remove();
      $('#notes-history-iframe').remove();

      if (poid !== 0) {
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
  const po_id = $('.poid input').val();
  const po_number = $('.po-number input').val();
  const po_description = $('.description textarea').val();
  let popupTitle;

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
  let widowHeight = $(window).height();
  const poid = $('.poid input').val();
  widowHeight = widowHeight - 50;
  popupIFrame(`http://rmslf/Forms/MPM-AddPurchaseOrderLineItem?poid=${poid}`, 'Add Line Item', widowHeight, 1200, false);
}


/**
 * Opens the "Edit Line Item" form in a modal iframe dialog sized to the current window.
 * @param liID - The ID of the line item to edit, passed in from the onclick handler of the generated link.
 */
function callEditLineItem(liID) {
  let widowHeight = $(window).height();
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
  const contentClone = $('#section-add-note-content');
  $(contentClone).dialog({
    title: 'Add Cancellation Reason (Required)',
    modal: true,
    width: 550,
    height: 350,
    autoOpen: false,
    resizable: false,
    buttons: {
      'OK': function () {
        const noteText = contentClone.find('#note-textarea').val().trim();
        if (noteText === '') {
          $.alert({ title: 'Must supply cancellation reason!', content: 'Sorry, you need to provide a reason for cancelling this purchase order.' });
          return;
        }

        $('.cancellation-reason textarea').val(noteText);
        $('#form1').trigger('submit');

        $('#section-add-note-content').remove();
        $(this).dialog('close');
        
      }
    }
  });

  const resizeableStyle = $('#note-textarea').attr('style');
  const newStyle = resizeableStyle + 'border-width: thin;border-color: black;border-style: solid;height: 200px;';
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
  const contentClone = $('#section-add-note-content');
  $(contentClone).dialog({
    title: 'Add Completion Note (Optional)',
    modal: true,
    width: 550,
    height: 350,
    autoOpen: false,
    resizable: false,
    buttons: {
      'OK': function () {
        const noteText = contentClone.find('#note-textarea').val().trim();
        $('.completion-note textarea').val(noteText);
        $('#form1').trigger('submit');

        $('#section-add-note-content').remove();
        $(this).dialog('close');
        
      }
    }
  });

  const resizeableStyle = $('#note-textarea').attr('style');
  const newStyle = resizeableStyle + 'border-width: thin;border-color: black;border-style: solid;height: 200px;';
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
  const link_titles = $(`.${titleSelector} input[type="text"]`);
  const link_ids = $(`.${idSelector} input[type="text"]`);
  link_titles.each(function (index) {
    const link_id = $(link_ids[index]).val();
    const link_title = $(this).val();
    const link_html = $("<a>", { text: link_title, class: linkSelector, href: 'javascript:void(0);', onclick: `${functionToCall}(${link_id})` });
    const has_link = $(this).parent().find(`.${linkSelector}`).length;
    if (has_link === 0) {
      $(this).parent().append(link_html);
    }
  });

}


/**
 * @returns {boolean} True when the current user is an admin user.
 */
function isAdminUser() {
  return $('.user-isadmin input').val() === '1';
}

/**
 * Determines whether the current user is classified as a "Metrology" user.
 * Business Rule: user-type-id == 1 => elevated privilege.
 * @returns {boolean} True if metrology user; false otherwise.
 */
function isMetrologyUser() {
  const userTypeId = Number($('.user-type-id input').val());
  return userTypeId === 1 || userTypeId === 2;
}


/** Populate task status lookup maps (id<->name). */
function loadStatusMap() {
  if (statusMap.keys.length === 0) {
    const status_rows = $('.status-lookup-table table tbody tr');
    if (status_rows.length === 0) {
      return;
    }
      status_rows.each(function () {
      let statusID = Number($(this).find('.id input').val());
      let statusName = $(this).find('.name input').val();
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
 * @param center
 */
function popupIFrame(src, title, height, width, center) {
  $("#popupIFrame").remove();
  $("#popUpDiv").html(`<div style='height:${height}px; width:${width}px;'><iframe id='popupIFrame' name='myname' src='${src}' height='${height}' width='${width}'/></div>`);

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
    const resizeableStyle = $('.ui-resizable').attr('style');
    const newStyle = resizeableStyle.replaceAll('width: 0px;', `width: ${width}px;`);
    $('.ui-resizable').attr('style', newStyle);

    const iframeStyle = $('#popupIFrame').attr('style');
    const newIframeStyle = iframeStyle.replaceAll('width: auto;', `width: 100%;`);
    $('#popupIFrame').attr('style', newIframeStyle);

  }
}


/**
 * Resets the error fields in the form.
 */
function resetErrorFields() {
  const po_number = $('.po-number input');
  const status = $('.status-combo select');

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
  
  const statusID = Number($('.new-status-id input').val());
  const form_is_valid = validateForm();
  if (form_is_valid === false) {
    e.preventDefault();
    return;
  }

  if (statusID === 3) {
    e.preventDefault();
    completePurchaseOrder();
    return;
  }
  if (statusID === 4) {
    e.preventDefault();
    cancelPurchaseOrder();
  }
}


/**
 * Validates the form fields.
 * @returns {boolean} True if the form is valid, false otherwise.
 */
function validateForm() {
  let is_valid = true;
  const po_numberField = $('.po-number input');
  const statusField = $('.purchase-order-status select');
  const po_number = $('.po-number input').val().trim();
  const statusID = Number($('.new-status-id input').val());
  resetErrorFields();

  if ((statusID === 2) && (po_number === '')) {
    po_numberField.addClass('parsley-error');
    po_numberField.parent().append("<ul id='po-number-required-error' aria-live='assertive' aria-atomic='true' class='parsley-errors-list filled'><li class='parsley-required'>Purchase Order Number is required when Status = 'Issued'.</li></ul>");
    is_valid = false;
  }

  if ((statusID === 3) && (po_number === '')) {
    po_numberField.addClass('parsley-error');
    po_numberField.parent().append("<ul id='po-number-required-error' aria-live='assertive' aria-atomic='true' class='parsley-errors-list filled'><li class='parsley-required'>Purchase Order Number is required when Status = 'Completed'.</li></ul>");
    is_valid = false;
  }
 
  if ((statusID === 1) && (po_number !== '')) {
    statusField.addClass('parsley-error');
    statusField.parent().append("<ul id='wrong-status-error' aria-live='assertive' aria-atomic='true' class='parsley-errors-list filled'><li class='parsley-required'>If you enter a Purchase Order Number, you must set Status to 'Issued'.</li></ul>");
    is_valid = false;
  }

  return is_valid;
}
