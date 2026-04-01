/**
EditPurchaseOrderLineItem.js 

Author:   Jeffrey Whitney
          jtwhitney@machine.com
          651-391-7982

Overview:
  UI logic for editing a Purchase Order Line Item in LFForms MPM.
  - Manages status transitions and keeps hidden fields in sync with UI.
  - Validates quantity, cost, and service date based on line item type and status.
  - Locks the form when the line item has progressed beyond editable states.
  - Handles cancellation with a required reason using a modal dialog.

KEY CONCEPTS:
    DIALOG LOOPING MECHANISM:
     The form is called as a popup dialog from other pages, and it communicates with the parent window to close the dialog and refresh the parent 
     page after this page is submitted.
     This loop is essential to understand because it's a common pattern that you will see again and again in any form which is being used as a popup. 
     This form is one of those. The way it works is when this page loads initially, the $('.closeme input') is not provided from the query string, 
     and so is set to the default value of 0.
     Submitting the form sets that value to 1. In LFF, when that the form is submitted it executes the workflow and then, 
     the On Event Completion event redirects back to this same page, but this time with the closeme value set to 1 in the query string. 
     This tells the page that it should close the dialog and refresh the parent page, so it sends off a message to the parent window to do that.

   USER PERMISSIONS:
      There is a user permission model in place to restrict which updates a user can make.
      This is separate from LFF security, which can, (but in practice usually does not), limit who 
      can even access a particular form. For our purposes, this is not particularly useful for our needs because we we want
      all users to be able to view the forms. What we want instead is to limit their ability to do certain things
      inside the application. 
      There are several user types which are defined in the database users table, (tblUsers) each with their own
      level of permission. They are:
        - Cell Lead (user-type-id == 5). Cell Leads can only view tickets and tasks. They cannot make any changes.
          In fact, cell leads are not logged in to LFF at all because they do no have LFF accounts.
        - Manufacturing Engineer (user-type-id == 4). They do have LFF accounts, but still have read-only access. 
        - Quality Engineers, (QE's) (user-type-id == 3). QE's can add tickets, add tasks to tickets, add notes. 
          They cannot, however, change tickets outside their department.
          They also cannot change task statuses or assign them to anyone.
        - Metrology Calibration (user-type-id == 2). They have permissions to update Service Tickets, but not programming
          tickets. (A service ticket is a non-programming type of ticket used for things like a machine being
          down or needing service.)_
        - Metrology users (user-type-id == 1). They have full permissions to change the status of tasks,
          assign tasks. They can also add tickets, add tasks to tickets, add notes, etc.
      
      There is also a special case Metrology user, the Admin. This is designated in the User's table by the Admin 
      flag being set to 1. Admin's can access forms that are not available to the "regular" Metrology user, such 
      as "Department", or "Task Types". Lookup values which are not likely to change very often, if ever. There are also a 
      few little things here and there that an Admin can do that a regular Metrology user cannot, such as 
      sending off an Assignee Pester Message. (Emailing the Assignee of a task asking what's going on with it.)
      
      Lastly, there is a separate flag in the database called IsActive. If a user is inactivated, they have 
      read-only access to the system, regardless of their former user type.
      
      How authentication is performed: 
        When the user first loads the form, LFF fills in the .lf-user-name field with CRETEX\username. 
        (Predicated on the fact that the user has a LFF account and is logged in to LFF).
        Because of the expense, Cell Leads have not been given LFF accounts, so the .lf-user-name field will be set to "Anonymous User" for them.
        In any case, if the user is logged in to LFF, it sets the .lf-user-name to CRETEX\username, but we only want the username portion 
        so we copy just the username portion (trimming off the "CRETEX/" part) into the .network-user-name field, 
        which is what gets posted back to the server.
        This will be matched against the user database table to determine the user's ID, user type, and department, etc.

   LASERFICHE EVENTS:
      There are two key LaserFiche events used in this script:
        - onloadlookupfinished: The event fires only once, when all of the initial lookups have completed. The kinds of lookups that are completed
                                under this event are the ones that do not have any arguments in them, meaning that they can be looked up immediately.
                                Examples of this would be Task Types and Task Statuses. These lookups do not depend on any other fields being set.
        - lookupcomplete: This event fires each time a lookup completes after the onloadlookupfinished event has been called. 
                          Laserfiche has lookup rules applied to certain fields, so that when a field is changed, it triggers a lookup to fill in other fields.
                          The fields themselves can either be changed by the user directly, or indirectly. 
                          An example of an direct change would be when the user chooses a Site from the dropdown. 
          
    
      Now this gets a bit tricky because the lookupcomplete event can fire multiple times, and we only want to do certain things once, so we need
      to put logic in there so that it's not doing expensive things again and again.
      There is a way of asking what the TriggerID of the lookup is. (A laserfiche function). But I found this to be kind of a pain to use because
      you have to know the TriggerID of the lookup that you want to respond to and it's just an integer. Also, if you ever change anything 
      in the form, you don't know if the trigger id has changed or not. So I found it easier to just put logic in the function that I want to run
      to make sure that it doesn't, say iterate through a table or something getting values again and again when we only need it to do it once.
    
      For an example of what I'm talking about, we're setting the user name field in code and causing a lookup, (see 'User Permissions' above).
      Because we're setting the field in code and causing a lookup, the onloadlookupfinished event has already fired. Therefore, any logic that 
      relies on user fields being populated won't work if you call them from the onloadlookupfinished event. Instead, we have to call them from 
      the lookupcomplete event. The unfortunate side effect of this is that the lookupcomplete event can fire multiple times, 
      so we have to put logic in there so that it's not doing expensive things again and again. If you do this wrong, you can seriously lengthen
      the load time of the form. Sometimes this is sort of unavoidable because of the way the LFF Lookup rules work, 
      but you want to minimize it as much as possible.

      Daisy-Chaining Lookups:
        A side-effect of the way lookups work is how they sometimes daisy-chain. Let me explain with an example:
        In our example, we have four fields: LFUserName, NetworkUserName, SiteID, DepartmentLookupTable.
        At the beginning the only field which has anything in it is LFUserName, because LF has filled it in for us.
        We take that value, keeping only the username portion an dput that in NetworkUserName. 
        This causes a lookup for all of the user related fields, including SiteID. Once the SiteID is set, this in turn
        causes another lookup to pull in all the departments related to that site. The Departments Lookup cannot be loaded until 
        we know which site we're talking about. Sometimes this daisy-chaining can get 3 and sometimes even 4 levels deep because of all the relationships between
        various fields on a form. This causes the form to be slower than it otherwise would have been, but there's not a lot we can do about it.
        It sort of is what it is. This is what happens when you have to make an application with a non-application framework.


Dependencies:
  - jQuery
  - jQuery UI (Dialog)
  - jquery-confirm (alerts)
  - jquery-cookie (optional convenience)

Permissions: (See 'User Permissions' below for more detail)
  - Cell Leads (user-type-id == 5):                                        View only.
  - Manufacturing Engineers (user-type-id == 4):                           View only.
  - Quality Engineers (user-type-id == 3):                                 View only.
  - Non-AdminMetrology users (user-type-id == 1, isAdmin == 0):            View only.
  - Admin Metrology users (user-type-id == 1, isAdmin == 1):               Full permissions.

Events listened for:
  - document.ready
  - lookupcomplete (populate status combos and load history)
  - onloadlookupfinished (post-load initialization)
  - change on .purchase-status-cbo select and .service-status-cbo select
 */

/**
 * Purchase/Service line item lifecycle statuses.
 * @enum {number}
 * @readonly
 */
const Status = Object.freeze({ None: 0, Scheduled: 1, Received: 2, Completed: 3, Cancelled: 4, PartialReceived: 5 });

/**
 * Types of line items supported by the form.
 * @enum {number}
 * @readonly
 */
const LineItemType = Object.freeze({ None: 0, Purchase: 1, Service: 2, Calibration: 3 });

/**
 * Map of status id -> status name loaded from the page's lookup table.
 * @type {Map<number, string>}
 */
const statusMap = new Map();

/**
 * Map of status name -> status id loaded from the page's lookup table.
 * @type {Map<string, number>}
 */
const statusNameMap = new Map();

$(document).ready(function () {
  // Page chrome and third-party script/style setup.
  $(document).prop('title', 'Edit Purchase Order Line Item');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');

  /**
   * Restore Bootstrap button plugin if a conflict exists so jQuery UI dialog
   * close buttons render and behave correctly.
   */
  const bootstrapButton = $.fn.button.noConflict(); // return $.fn.button to previously assigned value so that popup close button displays correctly.
  $.fn.bootstrapBtn = bootstrapButton;

  // If upstream logic requests the dialog to close, notify parent and stop initialization.
  if ($('.closeme input').val() === 1) {
    window.parent.postMessage('CloseDialogWithRefresh', '*');
    $('.Submit').hide();
    return;
  }

  // Wire up submit button to centralized submit handler.
  $('.Submit').on("click", function (e) { submitForm(e); });

  // Populate a normalized network user name (uppercase, sans domain).
  $('.network-user-name input')
    .val($('.lf-user-name input').val().toUpperCase().substr($('.lf-user-name input').val().lastIndexOf('\\') + 1)).trigger("change");

  // Mark required fields with asterisk for visual cue (in addition to validation).
  $('<span class="cf-required">*</span>').insertAfter('.service-date span span');
  $('<span class="cf-required">*</span>').insertAfter('.quantity span span');
  $('<span class="cf-required">*</span>').insertAfter('.per-unit-cost span span');
  $('<span class="cf-required">*</span>').insertAfter('.received-quantity span span');

  $(document).on('change', '.quantity input', function (e) {

    const quantity = Number($(this).val().replace(',', ''));
    const perUnitCost = Number($('.per-unit-cost input').val().replace(',', ''));
    const totalCost = quantity * perUnitCost;
    const formattedTotalCost = addThousandsSeparator(totalCost.toFixed(2));
    $('.cost-amount input').val(formattedTotalCost);
  });

  $(document).on('change', '.per-unit-cost input', function (e) {
    const quantity = Number($('.quantity input').val().replace(',', ''));
    const perUnitCost = Number($(this).val().replace(',', ''));
    const totalCost = quantity * perUnitCost;
    const formattedTotalCost = addThousandsSeparator(totalCost.toFixed(2));
    $('.cost-amount input').val(formattedTotalCost);
  });



  /**
   * Fired after data lookups populate hidden fields (IDs, status, etc.).
   * - Shows/hides submit permission based on admin status and line item presence.
   * - Locks the form once the item is Received or beyond.
   * - Otherwise, loads status lookup maps and syncs the status combo.
   * - Injects the line item history iframe when an item exists.
   */
  $(document).on('lookupcomplete', function (e) {
    const lineItemId = Number($('.liid input').val());
    const statusid = Number($('.current-status-id input').val());

    if ((!isAdminUser()) || (lineItemId === LineItemType.None)) {
      $('.Submit').hide();
      return;
    }
    else {
      $('.Submit').show();
    }

    if (statusid > Status.Received) {
      // Once a line item is beyond 'Received', editing is disabled.
      lockForm();
    }
    else {
      // Prepare id<->name maps and set the correct status combo selection.
      loadStatusMap();
      setStatusComboValue();
    }

    // Load the line item history when we have a valid id.
    if (lineItemId > 0) {
      $('#line-item-history-iframe').remove();
      $('#line-item-history').append(
        `<iframe id='line-item-history-iframe' name='line-item-history-iframe' src='http://rmslf/Forms/MPM-PurchaseOrderLineItemHistory?liid=${lineItemId}' height='400' width='100%'>`
      );
    }
  });

  /**
   * Fired after the page and lookups finish loading.
   * - Sets a sentinel for close behavior.
   * - Initializes a hidden div used by modal/popups.
   * - Finalizes network user name normalization.
   * - Backfills PO number when none has been assigned.
   */
  $(document).on("onloadlookupfinished", function (e) {
    $('.closeme input').val(1);
    $('#q0').append("<div class='hidden-text' id='popUpDiv'></div>");
    $('.network-user-name input').trigger("change");
    if ($('.po-number input').val() === '') {
      $('.po-number input').val('Not Yet Assigned')
    } 
  });

  /**
   * Keep hidden 'new-status-id' in sync when the Purchase status combobox changes.
   */
  $(document).on('change', '.purchase-status-cbo select', function () {
    const selectedStatusID = Number($(this).val());
    $('.new-status-id input').val(selectedStatusID).trigger("change");
  });

  /**
   * Keep hidden 'new-status-id' in sync when the Service status combobox changes.
   */
  $(document).on('change', '.service-status-cbo select', function () {
    const selectedStatusID = Number($(this).val());
    $('.new-status-id input').val(selectedStatusID).trigger("change");
  });

});


// Adds thousands separators (commas) to a numeric string.
function addThousandsSeparator(numStr) {
  // Remove any non-digit except decimal point
  numStr = numStr.replace(/[^0-9.]/g, '');

  // Split integer and decimal parts
  const parts = numStr.split('.');
  let integerPart = parts[0];
  const decimalPart = parts.length > 1 ? '.' + parts[1] : '';

  // Add commas to integer part
  integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return integerPart + decimalPart;
}


/**
 * Prompts the user for a required cancellation reason and submits the form.
 * Writes the reason into `.new-note textarea` before submission.
 * - Opens a jQuery UI dialog with a multiline text area.
 * - Requires non-empty input; shows a confirm alert if missing.
 * - Writes the note into `.cancellation-reason textarea` and submits the form.
 * @returns {void}
 */
function cancelLineItem() {
  // Build dialog content fresh each time to ensure a clean state.
  $('#section-cancellation-note-content').remove(); 
  $('.section-cancellation-note').append('<div id="section-cancellation-note-content" class="section-cancellation-note-content"><textarea id="note-textarea" rows="5" cols="50"></textarea></div>');
  const contentClone = $('#section-cancellation-note-content');
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
          $.alert({ title: 'Must supply cancellation reason!', content: 'Sorry, you need to provide a reason for cancelling this line item.' });
          return;
        }

        $('.cancellation-reason textarea').val(noteText);
        $('#form1').trigger("submit");
      }
    }
  });

  // Improve textarea visuals and open dialog.
  const resizeableStyle = $('#note-textarea').attr('style');
  const newStyle = resizeableStyle + 'border-width: thin;border-color: black;border-style: solid;height: 200px;';
  $('#note-textarea').attr('style', newStyle);
  $(contentClone).dialog("open");
}

/**
 * Indicates whether the current user is an admin (allowed to submit changes).
 * @returns {boolean} True when the current user is an admin user.
 */
function isAdminUser() {
  if ($('.user-isadmin input').val() === '1') {
    return true;
  }
  return false;
}

/**
 * Populate task status lookup maps (id<->name) from the hidden table on the page.
 * Safe to call multiple times; it is a no-op after the first successful load.
 * @returns {void}
 */
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

/**
 * Lock the form fields to prevent editing when the item is in a terminal state.
 * Hides the submit button and disables editable inputs/selects.
 * @returns {void}
 */
function lockForm() {
  $('.purchase-status-cbo select').prop('disabled', true);
  $('.service-status-cbo select').prop('disabled', true);
  $('.gage-idsn input').prop('disabled', true);
  $('.quantity input').prop('disabled', true);
  $('.cost-amount input').prop('disabled', true);
  $('.Submit').hide();
}

/**
 * Clears validation error messages and styles for all validated fields.
 * @returns {void}
 */
function resetErrorFields() {
  const quantityField = $('.quantity input');
  const costAmountField = $('.cost-amount input');
  const serviceDateField = $('.service-date input');
  const serviceStatusField = $('.service-status-cbo select');
  const purchaseStatusField = $('.purchase-status-cbo select');

  // Remove any prior error message lists.
  $('#quantity-error').remove();
  $('#cost-amount-error').remove();
  $('#status-unset-error').remove();
  '#service-date-required-error' // Selector kept consistent with others below.
  $('#service-date-required-error').remove(); 

  // Remove error highlighting classes.
  quantityField.removeClass('parsley-error');
  costAmountField.removeClass('parsley-error');
  serviceStatusField.removeClass('parsley-error');
  purchaseStatusField.removeClass('parsley-error');
  serviceDateField.removeClass('parsley-error');
}

/**
 * Selects the correct status value in the appropriate combo box (purchase or service)
 * based on current and new status IDs, and the line item type.
 * - If a new status isn't set, defaults to the current status.
 * - Applies selection to `.purchase-status-cbo` or `.service-status-cbo` depending on type.
 * @returns {void}
 */
function setStatusComboValue() {
  const currentStatusID = Number($('.current-status-id input').val());
  let newStatusID = Number($('.new-status-id input').val());
  const lineItemTypeID = Number($('.line-item-type-id input').val());

  if ((lineItemTypeID === LineItemType.None) || (currentStatusID === Status.None)) {
    return;
  }

  // If no new status is set, default to current status
  if (newStatusID === Status.None) {
    newStatusID = currentStatusID;
  }

  if (lineItemTypeID === LineItemType.Purchase) { // Purchase
    $('.purchase-status-cbo select').val(newStatusID).trigger("change");
  }
  else { // Service
    $('.service-status-cbo select').val(newStatusID).trigger("change");
  }

}

/**
 * Handles the submit button click:
 * - Validates inputs.
 * - Normalizes quantity for Service items when left empty/zero.
 * - For Cancelled status, requires a cancellation reason before submitting.
 * @param {Event} e The click or submit event.
 * @returns {void}
 */
function submitForm(e) {
  const lineItemTypeID = Number($('.line-item-type-id input').val());
  const statusID = Number($('.new-status-id input').val());
  const form_is_valid = validateForm();
  const quantityValue = $('.quantity input').val();
  const receivedQuantityValue = $('.received-quantity input').val();
  const receivedQuantityField = $('.received-quantity input');

  if (receivedQuantityValue === '') {
    receivedQuantityField.val(0);
  }

  if (form_is_valid === false) {
    e.preventDefault();
    return;
  }

  // Service line items allow 0 quantity; normalize empty to 0.
  if ((lineItemTypeID === LineItemType.Service) && (quantityValue === '0' || quantityValue === '')) {
    $('.quantity input').val(0);
  }

  // If cancelling, collect a reason via modal dialog before allowing submit.
  if (statusID === Status.Cancelled) {
    e.preventDefault();
    cancelLineItem();
    return;
  }
}

/**
 * Validates the form fields and displays inline errors where needed.
 * Rules:
 * - Status cannot be unset once set.
 * - For Service/Calibration, Service Date is required when Status is Scheduled.
 * - For Purchase, Quantity must be > 0.
 * - Cost amount must be > 0 for all types.
 * @returns {boolean} True if the form is valid, false otherwise.
 */
function validateForm() {
  let is_valid = true;
  const currentStatusID = Number($('.current-status-id input').val());
  const newStatusID = Number($('.new-status-id input').val());
  const typeID = Number($('.line-item-type-id input').val());
  const purchaseStatusField = $('.purchase-status-cbo select');
  const serviceStatusField = $('.service-status-cbo select');
  const serviceDateField = $('.service-date input');
  const serviceDateValue = serviceDateField.val().trim();
  const quantityField = $('.quantity input');
  const costAmountField = $('.cost-amount input');
  const quantityValue = Number(quantityField.val().trim());
  const costAmountValue = Number(costAmountField.val().trim());
  const receivedQuantityValue = Number($('.received-quantity input').val().trim());
  const receivedQuantityField = $('.received-quantity input');

  resetErrorFields();

  // Once any status is set, it cannot be reverted to None.
  if ((currentStatusID > Status.None) && (newStatusID === Status.None)) {
    if (typeID === LineItemType.Purchase) {
      purchaseStatusField.addClass('parsley-error');
      purchaseStatusField.parent().append("<ul id='status-unset-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>Once a status is set, it cannot be undone.</li></ul>");
      is_valid = false;
    }
    else {
      serviceStatusField.addClass('parsley-error');
      serviceStatusField.parent().append("<ul id='status-unset-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>Once a status is set, it cannot be undone.</li></ul>");
      is_valid = false;
    }
  }

  // Service/Calibration items require a Service Date when moving to Scheduled.
  if ((typeID > LineItemType.Purchase) && (newStatusID === Status.Scheduled)) {
    if (serviceDateValue === '') {
      serviceDateField.addClass('parsley-error');
      serviceDateField.parent().append("<ul id='service-date-required-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>Service Date is required when Status is Scheduled.</li></ul>");
      is_valid = false;
    }
  }

  // Purchase items must have quantity > 0.
  if ((typeID === LineItemType.Purchase) && (quantityValue === 0)) {
    quantityField.addClass('parsley-error');
    quantityField.parent().append("<ul id='quantity-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>Must Enter a valid quantity.</li></ul>");
    is_valid = false;
  }

  // Cost amount must be > 0 for all item types.
  if (costAmountValue === 0 ) {
    costAmountField.addClass('parsley-error');
    costAmountField.parent().append("<ul id='cost-amount-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>Must Enter a valid cost amount. ($0.00 is invalid).</li></ul>");
    is_valid = false;
  }

  if (newStatusID === Status.Received) {
    if (receivedQuantityValue < quantityValue) {
      receivedQuantityField.addClass('parsley-error');
      receivedQuantityField.parent().append("<ul id='quantity-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>If Status = Received, Quantity must equal Order Quantity.</li></ul>");
      is_valid = false;
    }
  }

  if (newStatusID === Status.PartialReceived) {
    if (receivedQuantityValue >= quantityValue || receivedQuantityValue === 0) {
      receivedQuantityField.addClass('parsley-error');
      receivedQuantityField.parent().append("<ul id='quantity-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>If Status = Partial Received, Received Quantity must be greater than 0 and less than Order Quantity.</li></ul>");
      is_valid = false;
    }
  }

  if ((newStatusID === Status.None) && (receivedQuantityValue > 0)) {
    receivedQuantityField.addClass('parsley-error');
    serviceStatusField.addClass('parsley-error');
    receivedQuantityField.parent().append("<ul id='quantity-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>If Status is not set to Received or Partially Received, Received Quantity must be 0.</li></ul>");
    is_valid = false;
  }


  return is_valid;
}