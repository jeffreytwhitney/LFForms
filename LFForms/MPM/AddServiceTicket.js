/**
 * AddServiceTicket.js
 *
 * Purpose:
 * Initializes and drives the Add Service Ticket form UI behavior.
 *
 * Responsibilities:
 * - Set document title and wire submit handler.
 * - Load client-side dependencies (jQuery Cookie, jQuery Confirm, jQuery UI CSS) and resolve Bootstrap button conflicts.
 * - Close parent dialog when instructed via hidden .closeme flag.
 * - Auto-select department email target based on contact user type.
 * - On initial lookup completion, mark form ready and backfill site name from cookie.
 * - Build CC email list before submit and normalize probe-related fields by ticket type.
 * 
 * Key Concepts:
 *  Dialog Looping Mechanism:
 *   The form is called as a popup dialog from other pages, and it communicates with the parent window to close the dialog and refresh the parent page after this page is submitted.
 *   This loop is essential to understand because it's a common pattern that you will see again and again any form which is being used as a popup. This form is one of those.
 *   The way it works is when this page loads initially, the $('.closeme input') is not provided from the query string, and so is set to the default value of 0.
 *   Submitting the form sets that value to 1. In LFF, when that the form is submitted it executes the workflow and then, 
 *   the On Event Completion event redirects back to this same page, but this time with the closeme value set to 1 in the query string. 
 *   This tells the page that it should close the dialog and refresh the parent page, so it sends off a message to the parent window to do that.
 * 
 *  User Permissions:
 *   There is a user permission model in place to restrict who can add/edit tasks based on their department and user type.
 *   Metrology users (user-type-id == 1) have elevated permissions and can add/edit tasks across departments.
 *   QE users can only add/edit tasks within their own department. They can also add notes to tasks in their department.
 *   Non-authenticated users (user-id == 0) are not allowed to add/edit tasks. This includes Cell Leads and anybody else who does not have a LaserFiche Forms account.
 *   This is how it works: when the user first loads the form, LFF fills in the .lf-user-name field with CRETEX\username, but we only want the username portion so we copy just the 
 *   username portion (trimming off the "CRETEX/" part) into the .network-user-name field, which is what gets posted back to the server.
 *   This will be matched against the user database to determine the user's ID, user type, and department.
 * 
 * LaserFiche Events:
 *   There are two key LaserFiche events used in this script:
 *      - onloadlookupfinished: The event fires only once, when all of the initial lookups have completed. 
 *      - lookupcomplete: This event fires each time a lookup completes after onloadlookupfinished. This generally occurs when the users
 *        changes a field where there is a LF Lookup rule. This event can fire multiple times during the lifetime of the form.
 *   Now this gets a bit tricky because the lookupcomplete event can fire multiple times, and we only want to do certain things once, so we need
 *   to put logic in there so that it's not doing expensive things again and again.
 *   There is a way of asking what the TriggerID of the lookup is. (A laserfiche function). But I found this to be kind of a pain to use because
 *   you have to know the TriggerID of the lookup that you want to respond to and it's just an integer. Also, if you ever change anything 
 *   in the form, you don't know if the trigger id has changed or not. So I found it easier to just put logic in the function that I want to run. 
 *   For an example of what I'm talking about, we're setting the user name field in code and causing a lookup, (see 'User Permissions' above).
 *   Because we're setting the field in code and causing a lookup, the onloadlookupfinished event has already fired. Therefore, any logic that 
 *   relies on user fields being populated won't work if you call them from the onloadlookupfinished event. Instead, we have to call them from the lookupcomplete event.
 *   The unfortunate side effect of this is that the lookupcomplete event can fire multiple times, so we have to put logic in there so that it's not doing expensive things again and again.
 *
 * Key DOM fields/classes (LF form conventions):
 * - .closeme input                     Controls dialog-close behavior (1 = close parent with refresh). (See Dialog Looping Mechanism)
 * - .contact-user-type-id input        Determines department email routing (Cell Lead/QE/ME).
 * - .cell-lead-email-address input     Cell Lead email address.
 * - .qe-email-address input            Quality Engineer email address.
 * - .me-email-address input            Manufacturing Engineer email address.
 * - .department-email-address input    Target department email set based on user type.
 * - .cc-email-col input                Repeating CC recipient fields.
 * - .cc-email-address-list input       Aggregated semicolon-delimited CC list (output).
 * - .site-name input                   Ticket site name (backfilled from cookie).
 * - .ttid input                        Ticket Type ID (numeric).
 * - .cmmid input, .probeid input     Related equipment/probe identifiers, reset by ticket type.
 * - .broken-probe-name select          Selected probe name; clears .probeid when empty.
 *
 * Custom events observed:
 * - onloadlookupfinished               Initial lookup hydration complete; finalize setup.
 * - lookupcomplete                     Hook available for later use (no-op here).
 *
 * Notes:
 * - fillCCList() concatenates non-empty CC inputs with ';' terminator (as expected by backend).
 * - Submit prevents default when ticket type is not chosen.
 * - No server calls here; all logic is client-side field orchestration.
 */

$(document).ready(function () {
  // Page title and submit wiring
  $(document).prop('title', 'Add Service Ticket');
  $('.Submit').click(function (e) { submitForm(e); });

  // Dependencies and styles
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');

  // Resolve Bootstrap/jQuery UI button plugin conflicts
  var bootstrapButton = $.fn.button.noConflict(); 
  $.fn.bootstrapBtn = bootstrapButton;
  
  // If flagged, instruct parent to close dialog and refresh. (See Dialog Looping Mechanism above.)
  if ($('.closeme input').val() == 1) {
    window.parent.postMessage('CloseDialogWithRefresh', '*');
  }

  // Route department email based on contact user type
  $(document).on('change', '.contact-user-type-id input', function (e) {
    var userTypeID = Number($('.contact-user-type-id input').val());
    var cellLeadEmail = $('.cell-lead-email-address input').val();
    var qeEmail = $('.qe-email-address input').val();
    var meEmail = $('.me-email-address input').val();
    var submitEmailAddressField = $('.department-email-address input');

    if (userTypeID == 0) {
      return;
    }

    switch (userTypeID) {
      case 1:
      case 2:
      case 5:
        $(submitEmailAddressField).val(cellLeadEmail);
        break;
      case 3:
        $(submitEmailAddressField).val(qeEmail);
        break;
      case 4:
        $(submitEmailAddressField).val(meEmail);
        break;
    }
  });

  // Initial load finalization
  $(document).on("onloadlookupfinished", function () {
    $('.closeme input').val(1);
    getSiteNameFromCookie();
  });

});


/**
 * Aggregates CC recipients from .cc-email-col input into a semicolon-delimited list.
 * Writes result to .cc-email-address-list input.
 * This is done here rather that in the workflow because there's no easy way to do this in the workflow.
 */
function fillCCList() {

  var ccUserNames = '';

  $('.cc-email-col input').each(function (index) {
    let ccUserName = $(this).val();
    if (ccUserName.length > 0) {
      ccUserNames += ccUserName + ';';
    }
  });
  $('.cc-email-address-list input').val(ccUserNames);
}


/**
 * Attempts to backfill .site-name input from the 'site_name' browser cookie.
 * Only sets if cookie exists and field is currently empty.
 */
function getSiteNameFromCookie() {
  var sitename = $.cookie('site_name');
  var siteNameFieldVal = $('.site-name input').val();
  if ((sitename != null) && (siteNameFieldVal == '')) {
    $('.site-name input').val(sitename).change();
  }
}


/**
 * Submit handler for the Add Service Ticket form.
 * - Prevents submission when ticket type is not selected.
 * - Builds CC list prior to submit.
 * - Normalizes equipment/probe fields for non-CMM ticket types.
 * - Clears .probeid when no broken probe is selected.
 * @param {Event} e The submit/click event.
 */
function submitForm(e) {
  var ticketType = Number($('.ttid input').val());
  console.log('about to call cclist');
  if (ticketType == 0) {
    e.preventDefault();
    return;
  }
  
  fillCCList();

  if (ticketType != 1) {
    $('.cmmid input').val(0);
    $('.probeid input').val(0);
  }

  if ($('.broken-probe-name select').val() == '') {
    $('.probeid input').val(0);
  }

}
