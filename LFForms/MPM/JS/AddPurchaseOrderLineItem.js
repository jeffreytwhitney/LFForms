/**
 AddPurchaseOrderLineItem.js
 
Author:   Jeffrey Whitney
          jtwhitney@machine.com
          651-391-7982

 Initializes and validates the "Add Line Item" form for Purchase Orders.

Responsibilities:
  - Loads required styles/scripts and sets the page title.
  - Normalizes Bootstrap button plugin to avoid conflicts with jQuery UI dialogs.
  - Maps the current network user to the form field.
  - Adds required indicators to key fields.
  - Conditionally enables the Submit button based on user/admin state and PO state.
  - Ensures default PO number label for new POs.
  - Validates inputs and submits the form.

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
        - onloadlookupfinished: The event fires only once, when all the initial lookups have completed. The kinds of lookups that are completed
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
        This causes a lookup for all the user related fields, including SiteID. Once the SiteID is set, this in turn
        causes another lookup to pull in all the departments related to that site. The Department Lookup cannot be loaded until 
        we know which site we're talking about. Sometimes this daisy-chaining can get 3 and sometimes even 4 levels deep because of all the relationships between
        various fields on a form. This causes the form to be slower than it otherwise would have been, but there's not a lot we can do about it.
        It sort of is what it is. This is what happens when you have to make an application with a non-application framework.



 External dependencies (loaded dynamically unless already present in the host):
   - jQuery (assumed present)
   - jQuery UI (CSS theme only)
   - simplePagination.js (CSS only)
   - jquery-confirm (JS and CSS)

 DOM contract (CSS selectors used by this script):
   - .Submit: Submit button for the form
   - .closeme input: Hidden flag indicating the dialog should auto-close
   - .lf-user-name input: Host-provided domain\username value
   - .network-user-name input: Target field for the network username (uppercase, without domain)
   - .poid input: Purchase Order ID; empty when creating a new PO
   - .po-number input: Purchase Order number; displayed as "Not Yet Assigned" for new POs
   - .user-isadmin input: "1" when the current user is an admin
   - .line-item-type-id input: Selected Line Item Type (numeric)
   - .quantity input: Quantity field
   - .cost-amount input: Cost amount field

 Validation behavior:
   - For LineItemType.Purchase: Quantity must be > 0.
   - For all types: Cost amount must be > 0 (i.e., $0.00 is invalid).
   - For non-Purchase items: Quantity is force-set to 0 on submit.

 UI/Styling notes:
   - Validation errors use Parsley-compatible CSS classes and markup
     (adds "parsley-error" class and a ".parsley-errors-list" below the field).
 */



/**
 * Line item fulfillment status values.
 * @enum {number}
 * @readonly
 */
const Status = Object.freeze({
  None: 0,
  Scheduled: 1,
  Received: 2,
  Completed: 3,
  Cancelled: 4
});

/**
 * Line item types supported by the form.
 * @enum {number}
 * @readonly
 */
const LineItemType = Object.freeze({
  None: 0,
  Purchase: 1,
  Service: 2,
  Calibration: 3
});

$(document).ready(function () {
  // Set dialog/page title.
  $(document).prop('title', 'Add Line Item');

  // Load external libraries' JS/CSS used by the hosting page/dialog.
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simplePagination.js/1.6/simplePagination.min.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');

  // Resolve Bootstrap's $.fn.button conflict so jQuery Confirm dialog buttons render and close correctly.
  const bootstrapButton = $.fn.button.noConflict(); // return $.fn.button to previously assigned value so that popup close button displays correctly.
  $.fn.bootstrapBtn = bootstrapButton;

  // Wire up Submit button.
  $('.Submit').on("click", function (e) { submitForm(e); });

  // If instructed by the host, close the dialog (with refresh) immediately.
  if ($('.closeme input').val() === 1) {
    window.parent.postMessage('CloseDialogWithRefresh', '*');
  }

  // Populate the "network user name" as the uppercase username (strip DOMAIN\).
  $('.network-user-name input')
    .val($('.lf-user-name input').val().toUpperCase().substr($('.lf-user-name input').val().lastIndexOf('\\') + 1)).trigger("change");

  // Add required asterisks to key labels (visual only).
  $('<span class="cf-required">*</span>').insertAfter('.quantity span span');

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



  // Toggle submit availability after lookups complete.
  // Hide for non-admins or when PO has not been created (no POID).
  $(document).on('lookupcomplete', function () {
    if ((!isMetrologyUser()) || ($('.poid input').val() === '')) {
      $('.Submit').hide();
    } else {
      $('.Submit').show();
    }
  });


  // Initialization after onload lookups:
  // - ensure dialog can be closed by host
  // - propagate user name mapping
  // - show placeholder PO number for new POs
  $(document).on("onloadlookupfinished", function () {
    $('.closeme input').val(1);
    $('.network-user-name input').trigger("change");
    if ($('.po-number input').val() === '') {
      $('.po-number input').val('Not Yet Assigned');
    }
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
 * Indicates whether the current user is an admin.
 * Reads the value from `.user-isadmin input` (string "1" for true).
 * @returns {boolean} True when the current user is an admin user; otherwise, false.
 */
function isAdminUser() {
  if ($('.user-isadmin input').val() === '1') {
    return true;
  }
  return false;
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


/**
 * Clears validation error states and messages for quantity and cost amount fields.
 * Removes Parsley error classes and error lists injected by validation.
 */
function resetErrorFields() {
  /** @type {JQuery<HTMLInputElement>} */
  const quantityField = $('.quantity input');
  /** @type {JQuery<HTMLInputElement>} */
  const costAmountField = $('.cost-amount input');

  $('#quantity-error').remove();
  $('#cost-amount-error').remove();

  quantityField.removeClass('parsley-error');
  costAmountField.removeClass('parsley-error');
}


/**
 * Handles form submission:
 * - For non-Purchase line item types, forces quantity to 0.
 * - Runs validation; aborts submit on failure.
 * - Submits the form when valid.
 * @param {JQuery.TriggeredEvent | Event} e The click or submit event.
 */
function submitForm(e) {
  e.preventDefault();

  const typeID = Number($('.line-item-type-id input').val());
  if (typeID !== LineItemType.Purchase) {
    $('.quantity input').val(0);
  }

  if (!validateForm()) {
    return;
  }

  $('#form1').trigger("submit");
}


/**
 * Validates the form fields according to business rules:
 * - When type is Purchase: Quantity must be greater than 0.
 * - Cost Amount must be greater than 0 for all types ($0.00 is invalid).
 * Adds Parsley-styled error classes and messages near offending fields.
 * @returns {boolean} True if the form is valid; otherwise, false.
 */
function validateForm() {
  let is_valid = true;

  const typeID = Number($('.line-item-type-id input').val());
  const quantityField = $('.quantity input');
  const costAmountField = $('.cost-amount input');

  const quantityValue = Number(String(quantityField.val()).trim());
  const costAmountValue = Number(String(costAmountField.val()).trim());

  resetErrorFields();

  if ((typeID === LineItemType.Purchase) && (quantityValue === 0)) {
    quantityField.addClass('parsley-error');
    quantityField
      .parent()
      .append("<ul id='quantity-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>Must Enter a valid quantity.</li></ul>");
    is_valid = false;
  }

  if (costAmountValue === 0) {
    costAmountField.addClass('parsley-error');
    costAmountField
      .parent()
      .append("<ul id='cost-amount-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>Must Enter a valid cost amount. ($0.00 is invalid).</li></ul>");
    is_valid = false;
  }

  return is_valid;
}
