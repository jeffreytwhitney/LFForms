/**
 * AddServiceTicketNote.js
 *
 * Purpose:
 * Controls the UI behavior for adding a service ticket note.
 *
 * Responsibilities:
 * - Set page title and load client-side CSS dependencies.
 * - Resolve Bootstrap/jQuery UI button plugin conflict.
 * - Close parent dialog when `.closeme` is flagged.
 * - Gate the form based on required IDs (`.tid`, `.uid`) after lookups finish. 'tid' is task ID, 'uid' is user ID.
 * - Route the department email address based on contact user type.
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
 * Key DOM fields/classes:
 * - `.tid input`                         Task/ ticket ID; required to enable submit.
 * - `.uid input`                         User ID; required to enable submit.
 * - `.note-text textarea`                Note body; disabled if required IDs are missing.
 * - `.contact-user-type-id input`        Contact user type used for department email routing.
 * - `.cell-lead-email-address input`     Cell Lead email address.
 * - `.qe-email-address input`            Quality Engineer email address.
 * - `.me-email-address input`            Manufacturing Engineer email address.
 * - `.department-email-address input`    Target email address derived from user type.
 * - `.closeme input`                     When set to 1, instructs parent to close with refresh.
 *
 * Custom events observed:
 * - `onloadlookupfinished`               Finalizes initial state; validates required IDs.
 * - `lookupcomplete`                     Triggers department email routing.
 *
 * Dependencies loaded:
 * - jQuery UI CSS (smoothness theme)
 * - simplePagination.css
 * - jQuery Confirm CSS
 *
 * Notes:
 * - Submit button is hidden and note textarea is disabled when `.tid` or `.uid` are empty.
 * - `setDepartmentEmail()` maps user type to the proper department email address.
 */

$(document).ready(function () {
  $(document).prop('title', 'Add Service Ticket Note');
  
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simplePagination.js/1.6/simplePagination.min.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
  var bootstrapButton = $.fn.button.noConflict(); // return $.fn.button to previously assigned value
  $.fn.bootstrapBtn = bootstrapButton;
   

  if ($('.closeme input').val() == 1) {
      window.parent.postMessage('CloseDialogWithRefresh', '*');
  }

  // Finalize initial state once all lookups are finished.
  $(document).on("onloadlookupfinished", function () {
    if ($('.tid input').val() == '') {
      $('.Submit').hide();
      $('.note-text textarea').addClass("ui-state-disabled");
    }
    if ($('.uid input').val() == '') {
      $('.Submit').hide();
      $('.note-text textarea').addClass("ui-state-disabled"); 
    }
    $('.closeme input').val(1);
  });

  // Route department email whenever lookups complete.
  $(document).on('lookupcomplete', function (e) {
    setDepartmentEmail();
  });
});


/**
 * Sets the department email address based on contact user type.
 * This is used to route the note notification email to the appropriate department when updates happen to the ticket.
 * Mapping:
 * - 1, 2, 5 -> Cell Lead email
 * - 3       -> QE email
 * - 4       -> ME email
 * No action when user type is 0 (unset).
 * Side effects:
 * - Writes resolved address into `.department-email-address input`.
 * Note: 
 *   1 is Metrology, 2 is Metrology Calibration, 5 is Cell Lead. 
 *   They're all lumped together because there's a "CellLeadEmail" in the Department table. 
 *   If the user entering the note is from Metrology, for example, it's going to grab the Cell Lead email from that department.
 *   So in this one case, we treat those three user types the same.
 *   3 is QE, 4 is ME, which have their own email fields in the Department table.
 */
function setDepartmentEmail() {
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
}
