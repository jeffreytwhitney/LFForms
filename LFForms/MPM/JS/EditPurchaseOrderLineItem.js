const Status = Object.freeze({ Active: 0, Scheduled: 1, Received: 2, Completed: 3, Cancelled: 4 });
var statusMap = new Map();
var statusNameMap = new Map();
$(document).ready(function () {

  $(document).prop('title', 'Edit Purchase Order Line Item');
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


  $(document).on('lookupcomplete', function (e) {
    var lineItemId = Number($('.liid input').val());
    var statusid = Number($('.current-status-id input').val());

    if ((!isAdminUser()) || (lineItemId == 0)) {
      $('.Submit').hide();
      return;
    }
    else {
      $('.Submit').show();
    }

    if (statusid > Status.Received) {
      lockForm();
    }
    else {
      loadStatusMap();
      setStatusComboValue();
    }

  });

  $(document).on("onloadlookupfinished", function (e) {
    $('.closeme input').val(1);
    $('#q0').append("<div class='hidden-text' id='popUpDiv'></div>");
    $('.network-user-name input').trigger("change");

    var lineItemId = Number($('.liid input').val());
    if (lineItemId > 0) {
      $('#line-item-iframe').remove();

      if ((lineItemId != '') && (lineItemId != '0')) {
        $('#line-item-history').append(`<iframe id='line-item-iframe' name='line-item-iframe' src='http://rmslf/Forms/MPM-PurchaseOrderLineItemHistory?liid=${lineItemId}' height='400' width='100%'/>`);
      }
    }

  });

});



/**
 * Prompts the user for a required cancellation reason and submits the form.
 * Writes the reason into `.new-note textarea` before submission.
 * @returns {void}
 */
function cancelLineItem() {
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
  if (statusMap.size > 0) return;

  const $rows = $('.status-lookup-table table tbody tr');
  if ($rows.length === 0) return;

  $rows.each(function () {
    const id = Number($(this).find('.id input').val());
    const name = $(this).find('.name input').val();
    if (!Number.isNaN(id) && name) {
      statusMap.set(id, name);
      statusNameMap.set(name, id);
    }
  });
}


/** Lock the form fields to prevent editing. */
function lockForm() {
  $('.purchase-status-cbo select').prop('disabled', true);
  $('.service-status-cbo select').prop('disabled', true);
  $('.gage-idsn input').prop('disabled', true);
  $('.quantity input').prop('disabled', true);
  $('.cost-amount input').prop('disabled', true);
  $('.Submit').hide();
}



/**
 * Resets the error fields in the form.
 */
function resetErrorFields() {
  var gage_idsn = $('.gage-idsn input');
  var status = $('.status-combo select');

  $('#wrong-status-error').remove();

  status.removeClass('parsley-error');
}


/**
 * Sets the status combo box value based on the current and new status IDs.
 */
function setStatusComboValue() {
  var currentStatusID = Number($('.current-status-id input').val());
  var newStatusID = Number($('.new-status-id input').val());
  var lineItemTypeID = Number($('.line-item-type-id input').val());

  if ((statusMap.size == 0) || (lineItemTypeID == 0) || (currentStatusID == 0)) {
    return;
  }

  // If no new status is set, default to current status
  if (newStatusID == 0) {
    newStatusID = currentStatusID;
  }

  if (lineItemTypeID == 1) { // Purchase
    $('.purchase-status-cbo select').val(newStatusID).change();
  }
  else if (lineItemTypeID == 2) { // Service
    $('.service-status-cbo select').val(newStatusID).change();
  }

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

  if (statusID == 4) {
    e.preventDefault();
    cancelLineItem();
    return;
  }
}


/**
 * Validates the form fields.
 * @returns {boolean} True if the form is valid, false otherwise.
 */
function validateForm() {
  var is_valid = true;
  var currentStatusID = Number($('.current-status-id input').val());
  var newStatusID = Number($('.new-status-id input').val());
  var typeID = Number($('.line-item-type-id input').val());
  var purchaseStatusField = $('.purchase-status-cbo select');
  var serviceStatusField = $('.service-status-cbo select');

  var po_numberField = $('.po-number input');
  var statusField = $('.purchase-order-status select');
  var po_number = $('.po-number input').val().trim();
  var statusID = Number($('.new-status-id input').val());
  resetErrorFields();

  if ((statusID == Status.Issued) && (po_number === '')) {
    po_numberField.addClass('parsley-error');
    po_numberField.parent().append("<ul id='po-number-required-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>Purchase Order Number is required when Status = 'Issued'.</li></ul>");
    is_valid = false;
  }

  if ((statusID == Status.Completed) && (po_number === '')) {
    po_numberField.addClass('parsley-error');
    po_numberField.parent().append("<ul id='po-number-required-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>Purchase Order Number is required when Status = 'Completed'.</li></ul>");
    is_valid = false;
  }

  if ((statusID == Status.Active) && (po_number != '')) {
    console.log('Status ID: ' + statusID);
    console.log('PO Number: ' + po_number);
    statusField.addClass('parsley-error');
    statusField.parent().append("<ul id='wrong-status-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>If you enter a Purchase Order Number, you must set Status to 'Issued'.</li></ul>");
    is_valid = false;
  }

  return is_valid;
}