/** EditServiceTicket.js — Documentation

 Author:  Jeffrey Whitney
 jtwhitney@machine.com
 651-319-7982
 Date:    9/29/2025

 Overview
 - Client-side logic for the “Edit Service Ticket” form in LFForms/MPM.
 - Manages UI initialization, role-based enablement, printing, adding notes, status transitions, validation, and submission.

 Permissions: Metrology users (user-type-id 1 or 2) have full edit rights to change status, assign tickets, etc.
 Everyone else can edit fields not related to status or assignee. They can also and add a note.


 Key Concepts:
 Dialog Looping Mechanism:
 The form is called as a popup dialog from other pages, and it communicates with the parent window to close the dialog and refresh the
 parent page after this page is submitted. This loop is essential to understand because it's a common pattern that you will see
 again and again any form which is being used as a popup. This form is one of those.
 The way it works is when this page loads initially, the $('.closeme input') is not provided from the query string,
 and so is set to the default value of 0 by LFF. Submitting the form sets that value to 1.
 In LFF, when that the form is submitted it executes the workflow and then the On Event Completion event redirects back to this same page,
 but this time with the closeme value set to 1 in the query string.
 This tells the page that it should close the dialog and refresh the parent page, so it sends off a message to the parent window to do that.

 Printing:
 This functionality is similar to the dialog looping mechanism described above, except that in this case, this form is the parent window.
 When the user clicks the Print Ticket button, it loads a hidden iframe with the print view of the ticket.
 When that iframe finishes loading, it sends a message back to this parent window to tell it to print, basically saying,
 'OK, I'm ready, please print me.'
 We have to do it this way because LFF has no reporting functionality, so we have to roll our own, so to speak just using a
 printer-friendly HTML view of the ticket.

 User Permissions:
 There is a user permission model in place to restrict which updates a user can make.
 This is separate from LFF security, which can, (but in practice usually does not), limit who
 can even access a particular form. For our purposes, this is not particularly useful for our needs because we we want
 all users to be able to view the forms. What we want instead is to limit their ability to do certain things
 inside the application.
 There are several user types which are defined in the database users table, (tblUsers) each with their own
 level of permission. They are:
 - Cell Lead (user-type-id === 5). Cell Leads can only view tickets and tasks. They cannot make any changes.
 In fact, cell leads are not logged in to LFF at all because they do no have LFF accounts.
 - Manufacturing Engineer (user-type-id === 4). They do have LFF accounts, but still have read-only access.
 - Quality Engineers, (QE's) (user-type-id === 3). QE's can add tickets, add tasks to tickets, add notes.
 They cannot, however, change tickets outside their department.
 They also cannot change task statuses or assign them to anyone.
 - Metrology Calibration (user-type-id === 2). They have permissions to update Service Tickets, but not programming
 tickets. (A service ticket is a non-programming type of ticket used for things like a machine being
 down or needing service.)_
 - Metrology users (user-type-id === 1). They have full permissions to change the status of tasks,
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

 LaserFiche Events:
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

 Lifecycle and Events
 - Document ready:
 - Sets page title to “Edit Service Ticket”.
 - Loads jquery-cookie, jquery-confirm, and required CSS; resolves Bootstrap/jQuery UI button naming conflict.
 - Registers window message listener for “printme” to print #print-iframe (delay 800ms).
 - If .closeme is 1 and in an iframe, posts CloseDialogWithRefresh to parent.
 - Binds .Submit to submitForm.
 - Updates title on .ticket-number change.
 - Reapplies enabled/disabled state when .user-id changes.
 We have to do this because the user-id field is populated by a lookup rule after the form loads.
 Initially, it's 0, and then it gets set to the actual user id.
 If it stays 0, the form shows the anonymous user fields, but if it gets set to a real user id,
 we need to hide the anonymous user fields and show the editable fields such as status and assignee.
 - Handles window.onmessage to close/destroy popup iframe dialog (with optional refresh).
 - Double-click on [id^="Field20"] opens a dialog showing full note text.
 - onloadlookupfinished:
 - Injects #popUpDiv.
 - Adds “Add Note” button and ensures reusable #note-textarea inside #section-add-note-div.
 - If a broken probe is set, syncs .broken-probe-name-col select.
 - If status is Completed (5) or Cancelled (6), disables editing and hides Submit.
 - Triggers .network-user-name change when not closing.
 - lookupcomplete:
 - Calls setDepartmentEmail().
 - Defaults assignee and status selects from their name fields when blank.
 - Populates .network-user-name from .lf-user-name (uppercase, no domain).
 - Ensures metrology email is populated by triggering .site-id change when necessary.
 - Adds a “Print Ticket” button next to ticket number if missing.
 - Calls setFormEnabledState() once per session.

 Buttons and Actions
 - Add Note: addNote() opens a modal iframe to add a note to the ticket.
 - Print Ticket: printTicket() loads print view into #print-iframe, then external “printme” message triggers browser print.
 - Status flows on submit:
 - Cancel (6): cancelTicket() prompts for required reason, writes to .new-note, submits form.
 - Complete (5): completeTicket() optionally collects a note, writes to .new-note, submits form.
 - Waiting (3): setTicketToWaitingStatus() prompts for required reason, writes to .new-note, submits form.
 - Active/Awaiting (2/1): submits form directly.

 Functions (summary)
 - addNote(): Opens /Forms/MPM-AddServiceTicketNote?tid={tid}&uid={uid} in a dialog iframe.
 - cancelTicket(): Dialog for required cancellation reason; saves to .new-note and submits.
 - completeTicket(): Dialog hosting #section-add-note-div; optional note saved to .new-note, restores content, submits.
 - getUserID(): Returns network user ID or anonymous-entered user ID if present.
 - isMetrologyUser(): True when .user-type-id is 1 or 2.
 - loadiFrame(src): Inserts #print-iframe with src into #popUpDiv.
 - popupIFrame(src, title, height, width): Opens jQuery UI dialog with an embedded iframe.
 - printTicket(): Builds print URL /Forms/MPM-ServiceTicketPrint?tid={tid} and calls loadiFrame.
 - resetErrorFields(): Clears prior Parsley errors and helper lists for status/assignee.
 - setFormEnabledState(): Enables/disables status/assignee based on user type; toggles anonymous UI; sets enabledStateSet.
 - setDepartmentEmail(): Sets .department-email-address based on .contact-user-type-id (1/2/5→cell lead, 3→QE, 4→ME).
 - setTicketToWaitingStatus(): Dialog for required “waiting on” note; saves to .new-note and submits.
 - submitForm(e): Validates inputs, ensures email fields are present, normalizes anonymous fields and assignee ID, sets .closeme, and routes by new status.
 - validateForm(): Business rules:
 - Subject required; status required.
 - Anonymous user requires employee number.
 - Cannot unassign once assigned.
 - Active (> Awaiting) requires an assignee.
 - Awaiting cannot have an assignee.
 - Cannot revert from active back to Awaiting.
 - Adds parsley-error and inline messages on violations.

 */
let enabledStateSet = false;

$(document).ready(function () {
  $(document).prop('title', 'Edit Service Ticket');
  $('.Submit').on("click", function (e) {
    submitForm(e);
  });
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
  $.fn.bootstrapBtn = $.fn.button.noConflict();

  //See Printing section in documentation above for explanation
  let eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
  let printEvent = window[eventMethod];
  let messageEvent = eventMethod === "attachEvent" ? "onmessage" : "message";
  printEvent(messageEvent, function (e) {

    if (e.data === "printme" || e.message === "printme") {
      function show_print() {
        $("#print-iframe").get(0).contentWindow.print();
      }

      window.setTimeout(show_print, 800);
    }
  });

  //See Dialog Looping Mechanism section in documentation above for explanation
  if ($('.closeme input').val() === '1') {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage('CloseDialogWithRefresh', '*');
    }
  }

  //Changes the title when LFF sets the ticket number
  $(document).on('change', '.ticket-number input', function (e) {
    let ticket_name = $(this).val();
    $(document).prop('title', `Edit Ticket ${ticket_name}`);
  });

  $(document).on('change', '.user-id input', function (e) {
    enabledStateSet = false;
    setFormEnabledState();
  });

  //See Dialog Looping Mechanism above for explanation
  window.onmessage = function (event) {
    if (event.data === "CloseDialog") {
      $("#popupIFrame").dialog("destroy");
      $("#popupIFrame").remove();
    }
    if (event.data === "CloseDialogWithRefresh") {
      $("#popupIFrame").dialog("destroy");
      $("#popupIFrame").remove();
      window.location = window.location.href
    }
  };


  //Opens a dialog showing the full note text when the note field is double-clicked
  $(document).on('dblclick', '[id^="Field20"]', function () {
    let ticketDetail = $(this).val();

    $.dialog({
      escapeKey: true,
      backgroundDismiss: true,
      title: `Note:`,
      content: ticketDetail,
    });
  });

  $(document).on("onloadlookupfinished", function () {
    //This div is used for the printing iframe and the add note iframe
    $('#q0').append("<div class='hidden-text' id='popUpDiv'></div>");

    //Adds the Add Note button if it doesn't already exist
    $('#add-note-button').append('<div class="table-button ui-button add-button" onclick="addNote()"><span title="Add Note" class="ui-button-icon ui-icon ui-icon-plusthick"></span>Add Note</div>');

    //Adds a div around the note section if it doesn't already exist
    //This is used to host the note textarea in a dialog when completing the ticket
    //It also lets us put the values back, because the way jQuery UI dialog works is that it removes the content from the DOM
    if ($('#note-textarea').length === 0) {
      $('.section-add-note').append('<div class="section-add-note-content"><textarea id="note-textarea" rows="5" cols="50"></textarea></div>');
      $('.section-add-note').contents().wrapAll('<div id="section-add-note-div"></div>');
    }

    //If a broken probe is already set, make sure the broken probe name select is set correctly
    let brokenProbeID = Number($('.broken-probe-id input').val());
    if (brokenProbeID > 0) {
      let brokenProbeName = $('.broken-probe-name input').val();
      $('.broken-probe-name-col select').val(brokenProbeName).trigger("change");
    }

    //If the ticket is completed or canceled, disable editing and hide the submit button
    if ((Number($('.sid input').val()) === 5) || (Number($('.sid input').val()) === 6)) {
      $('.ticket-status select').addClass('ui-state-disabled');
      $('.assignee-combo select').addClass('ui-state-disabled');
      $('.ticket-subject input').addClass('ui-state-disabled');
      $('.ticket-details textarea').addClass('ui-state-disabled');
      $('.Submit').hide();
    }

    if (isMetrologyUser()) {
      if (Number($('.poid input').val()) === 0) {
        $('.section-purchase-order ul').prepend($('<li><div class="po-buttons"><div class="table-button ui-button add-po-button" onclick="addPurchaseOrder()"><span title="Add Purchase Order" class="ui-button-icon ui-icon ui-icon-plusthick"></span>Add New Purchase Order</div><div class="table-button ui-button link-po-button" onclick="linkPurchaseOrder()"><span title="Link Purchase Order" class="ui-button-icon ui-icon-transferthick-e-w"></span>Link Purchase Order</div></div></li>'));
      }
    }



    //Triggers the network username change if we're not closing the dialog
    if ($('.closeme input').val() !== '1') {
      $('.network-user-name input').trigger("change");
    }


  });

  $(document).on('lookupcomplete', function () {

    if ($('.department-email-address input').val() === '') {
      setDepartmentEmail();
    }

    if (($('.assignee-name input').val() !== '') && ($('.assignee-combo select').val() === '')) {
      console.log('Assigning assignee name to combo box');
      $('.assignee-combo select').val($('.assignee-name input').val()).trigger("change");
    }
    if (($('.status-name input').val() !== '') && ($('.ticket-status select').val() === '')) {
      console.log('Assigning status name to combo box');
      $('.ticket-status select').val($('.status-name input').val()).trigger("change");
    }
    let lfUserName = $('.lf-user-name input').val();
    let networkUserName = $('.network-user-name input').val();
    if (lfUserName !== 'Anonymous User' && networkUserName === '') {
      $('.network-user-name input').val(lfUserName.toUpperCase().slice(lfUserName.lastIndexOf('\\') + 1)).trigger("change");
    }
    if ((Number($('.site-id input').val()) !== 0) && ($('.metrology-email input').val() === '')) {
      $('.site-id input').trigger("change");
    }
    if (!$('#print-ticket').length) {
      $('.ticket-number input').parent().append(`<div id='print-ticket' class='table-button ui-button' onclick='printTicket()'><span title='Print Ticket' class='ui-button-icon ui-icon ui-icon-print'/></div>`);
    }
    if (enabledStateSet === false) {
      setFormEnabledState();
    }

    if ($('#pester-assignee').length === 0) {
      $('.assignee-combo select').parent().append(`<div id='pester-assignee' class='table-button ui-button' onclick='callPesterAssignee()'><span title='Pester Assignee' class='ui-button-icon ui-icon ui-icon-mail-closed'/></div>`);
    }

    $('#pester-assignee').removeClass("ui-state-disabled");
    if (!isUserAdmin()) {
      $('#pester-assignee').addClass("ui-state-disabled");
    } else {
      if ($('.aid input').val() === '') {
        $('#pester-assignee').addClass("ui-state-disabled");
      } else {
        if ($('.aid input').val() !== $('.new-aid input').val()) {
          $('#pester-assignee').addClass("ui-state-disabled");
        }
      }
    }


  });
});


/**
 * Opens a popup iframe to add a note to the current ticket.
 * Reads ticket id/number and current user id from the DOM and launches the note form.
 * @returns {void}
 */
function addNote() {
  let ticket_id = $('.tid input').val();
  let ticket_number = $('.ticket-number input').val();
  let user_id = getUserID();
  popupIFrame(`http://rmslf/Forms/MPM-AddServiceTicketNote?tid=${ticket_id}&uid=${user_id}`, `Add Note for task '${ticket_number}'`, 400, 650, false);
}


/**
 * Opens a popup iframe to add a new purchase order to the current ticket.
 * Reads ticket id/number from the DOM and launches the po form.
 * @returns {void}
 */
function addPurchaseOrder() {
  const siteid = $('.site-id input').val();
  let ticket_id = $('.tid input').val();
  let ticket_number = $('.ticket-number input').val();
  let widowHeight = $(window).height();
  widowHeight = widowHeight - 50;
  popupIFrame(`http://rmslf/Forms/MPM-AddPurchaseOrder?sid=${ticket_id}&siteid=${siteid}`, `Add Purchase Order for Service Ticket '${ticket_number}'`, widowHeight, 1200, false);
}


/**
 * Calls the Pester Assignee popup iframe.
 * @returns {void}
 */
function callPesterAssignee() {
  let ticket_id = $('.tid input').val();
  let ticket_number = $('.ticket-number input').val();
  let assignee_name = $('.assignee-combo select').val();

  popupIFrame(`http://rmslf/Forms/MPM-PesterServiceTicketAssignee?tid=${ticket_id}`, `Pester '${assignee_name}' regarding service ticket '${ticket_number}'`, 400, 750, false);
}


/**
 * Prompts the user for a required cancellation reason and submits the form.
 * Writes the reason into `.new-note textarea` before submission.
 * @returns {void}
 */
function cancelTicket() {
  let noteField = $('#note-textarea');
  $(noteField).dialog({
    title: 'Add Cancellation Reason (Required)',
    modal: true,
    width: 600,
    height: 400,
    autoOpen: false,
    resizable: false,
    buttons: {
      'OK': function () {

        if ($('#note-textarea').val().trim() === '') {
          $.alert({
            title: 'Must supply cancellation reason!',
            content: 'Sorry, you need to provide a reason for cancelling this ticket.'
          });
          return;
        }

        $('.new-note textarea').val($(noteField).val().trim());
        $(this).dialog('close');
        $('#form1').trigger("submit");
      }
    }
  });
  let resizeableStyle = $('#note-textarea').attr('style');
  let newStyle = resizeableStyle + 'border-width: thin;border-color: black;border-style: solid;';
  $('#note-textarea').attr('style', newStyle);
  $(noteField).dialog("open");
}


/**
 * Collects an optional completion note in a dialog and submits the form.
 * Preserves and restores the note section DOM because jQueryUI dialog removes it from the DOM, so it won't be there when the form submits.
 * Also enables broken-probe inputs prior to submission.
 * @returns {void}
 */
function completeTicket() {
  let contentClone = $('#section-add-note-div');
  $(contentClone).dialog({
    title: 'Add Completion Note (Optional)',
    modal: true,
    width: 600,
    height: 600,
    autoOpen: false,
    resizable: false,
    buttons: {
      'OK': function () {
        let noteText = contentClone.find('#note-textarea').val().trim();
        $('.new-note textarea').val(noteText);
        contentClone.find('#note-textarea').remove();
        $('.section-add-note').append(contentClone.contents());
        $(this).dialog('close');
        $('#form1').trigger("submit");
      }
    }
  });


  //This is the style of the stuff we're going to display in the dialog.
  //We have to do this because jQuery UI dialog remove the content from the DOM, so that it
  //looses the style we assigned to it originally. (Dialog adds its own style).
  //This basically sets it back to the way it was before, or at least sets it so that it looks ok when it's in the dialog.
  //Notice that it's taking the existing style and appending to it. If we don't do that, we have to set all the style properties.
  //That's a lot of work, so we just append to the existing style, which works the same way as CSS does, meaning that if you
  //define a style in one spot, and then define it again later, the later definition takes precedence.
  let resizeableStyle = $('#note-textarea').attr('style');
  let newStyle = resizeableStyle + 'border-width: thin;border-color: black;border-style: solid;height:250px;width:100%;';
  let newSectionStyle = 'list-style-type:none;';

  $('#note-textarea').attr('style', newStyle);
  $('.broken-probe-table').attr('style', newSectionStyle);
  $('.broken-probe-name-col select').prop("disabled", false);
  $('.replacement-number-col input').prop("disabled", false);
  $(contentClone).dialog("open");

}


/**
 * Resolves the current user's ID.
 * Prefers the network user ID; falls back to the anonymous-entered user ID.
 * @returns {number|undefined} The user id if available; otherwise undefined.
 */
function getUserID() {
  let networkUserID = Number($('.user-id input').val());
  let userEnteredUserID = Number($('.anonymous-user-id input').val());

  if (networkUserID > 0) {
    return networkUserID;
  }
  if (userEnteredUserID > 0) {
    return userEnteredUserID;
  }


}


/**
 * Checks if the current user is an admin.
 * @returns {boolean}
 */
function isUserAdmin() {
  let return_val = true;
  let is_admin_user = Number($(".is-admin input").val());

  if (typeof is_admin_user === 'undefined') {
    return false;
  }

  if ((is_admin_user === 0) || (is_admin_user === null)) {
    return_val = false;
  }
  return return_val;
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
 * Opens a popup iframe to link an existing purchase order to the current service ticket.
 * Reads ticket id/number from the DOM and launches the po form.
 * @returns {void}
 */
function linkPurchaseOrder() {
  let ticket_id = $('.tid input').val();
  let ticket_number = $('.ticket-number input').val();
  let widowHeight = $(window).height();
  widowHeight = widowHeight - 50;
  popupIFrame(`http://rmslf/Forms/MPM-LinkPurchaseOrder?sid=${ticket_id}`, `Link Existing Purchase Order to Service Ticket '${ticket_number}'`, widowHeight, 1200, false);
}


/**
 * Loads an iframe into `#popUpDiv` for printing.
 * @param {string} src - The report URL to load in the print iframe.
 * @returns {void}
 */
function loadiFrame(src) {
  $("#popUpDiv").html("<iframe id='print-iframe' name='print-iframe' src='" + src + "' />");
}


/**
 * Opens a jQuery UI dialog containing an embedded iframe.
 * @param {string} src - Iframe source URL.
 * @param {string} title - Dialog title.
 * @param {number} height - Dialog height in pixels.
 * @param {number} width - Dialog width in pixels.
 * @returns {void}
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
    close: function (event, ui) {

    }
  });


  $("#popupIFrame").dialog("open");
  $('#popupIFrame').attr('style', `width: 100%; height: ${height}px;`);
}


/**
 * Initiates printing by loading the ticket print view into the print iframe.
 * @returns {void}
 */
function printTicket() {

  let ticketID = $('.tid input').val();
  let report_url = `http://rmslf/Forms/MPM-ServiceTicketPrint?tid=${ticketID}`
  loadiFrame(report_url);
}


/**
 * Clears prior validation error messages and styles for assignee and status fields.
 * @returns {void}
 */
function resetErrorFields() {

  $('#assigned-cannot-unassign-error').remove();
  $('#active-ticket-requires-assignee-error').remove();
  $('#active-ticket-cannot-inactivate-error').remove();
  $('#assigned-needs-active-status-error').remove();
  $('.ticket-status select').removeClass('parsley-error');
  $('.assignee-combo select').removeClass('parsley-error');

}


/**
 * Enables or disables key form controls based on user identity and role.
 * - Non-metrology users cannot change status/assignee.
 * - Anonymous users trigger anonymous UI, disable actions, and block adding notes.
 * Sets the `enabledStateSet` flag when applied.
 * @returns {void}
 */
function setFormEnabledState() {

  let lfUserName = $('.lf-user-name input').val();
  if (lfUserName !== 'Anonymous User') {
    if (!isMetrologyUser()) {
      $('.ticket-status select').addClass('ui-state-disabled');
      $('.assignee-combo select').addClass('ui-state-disabled');
    } else {
      $('.ticket-status select').removeClass('ui-state-disabled');
      $('.assignee-combo select').removeClass('ui-state-disabled');
    }
  } else {
    $('.show-anonymous input').val(1).trigger("change");
    $('.ticket-status select').addClass('ui-state-disabled');
    $('.assignee-combo select').addClass('ui-state-disabled');
    $('#add-note-button').addClass('ui-state-disabled');
  }
  enabledStateSet = true;
}


/**
 * Sets the department email address used for notifications based on contact user type.
 * There are three possible emails in the Department table in the database: Cell Lead, QE, and ME.
 * This function selects the appropriate email based on the contact user type.
 * If the selected email is blank, it falls back to the submittor's email.
 * Mapping:
 * - 1, 2, 5 → Cell Lead email
 * - 3 → QE email
 * - 4 → ME email
 * @returns {void}
 */
function setDepartmentEmail() {
  let userTypeID = Number($('.contact-user-type-id input').val());
  let cellLeadEmail = $('.cell-lead-email-address input').val();
  let submittorEmail = $('.submittor-email-address input').val();
  let metrologyEmail = $('.metrology-email input').val();

  let qeEmail = $('.qe-email-address input').val();
  let meEmail = $('.me-email-address input').val();
  let submitEmailAddressField = $('.department-email-address input');


  if (userTypeID === 0) {
    console.log('No contact user type id; skipping department email set');
    return;
  }
  switch (userTypeID) {
    case 1:
      $(submitEmailAddressField).val(metrologyEmail);
      console.log('Setting department email to metrology email');
      break;
    case 2:
    case 5:
      $(submitEmailAddressField).val(cellLeadEmail);
      console.log('Setting department email to cell lead email');
      break;
    case 3:
      $(submitEmailAddressField).val(qeEmail);
      console.log('Setting department email to QE email');
      break;
    case 4:
      $(submitEmailAddressField).val(meEmail);
      console.log('Setting department email to ME email');
      break;
  }

  if ($(submitEmailAddressField).val() === '') {
    console.log('Falling back to submittor email');
    $(submitEmailAddressField).val(submittorEmail);
  }

}


/**
 * Prompts the user for a required “waiting on” reason and submits the form.
 * Writes the reason into `.new-note textarea` before submission.
 * @returns {void}
 */
function setTicketToWaitingStatus() {
  let noteField = $('#note-textarea');
  $(noteField).dialog({
    title: 'Add What you are waiting on (Required)',
    modal: true,
    width: 600,
    height: 400,
    autoOpen: false,
    resizable: false,
    buttons: {
      'OK': function () {

        if ($('#note-textarea').val().trim() === '') {
          $.alert({
            title: 'Must supply waiting reason!',
            content: 'Sorry, you need to provide what you are waiting on.'
          });
          return;
        }

        $('.new-note textarea').val($(noteField).val().trim());
        $(this).dialog('close');
        $('#form1').trigger("submit");
      }
    }
  });
  let resizeableStyle = $('#note-textarea').attr('style');
  let newStyle = resizeableStyle + 'border-width: thin;border-color: black;border-style: solid;';
  $('#note-textarea').attr('style', newStyle);
  $(noteField).dialog("open");

}


/**
 * Main submit handler.
 * - Runs business validation.
 * - Verifies key email fields exist.
 * - Normalizes anonymous user fields and new assignee ID.
 * - Sets `.closeme` flag to 1.
 * - Routes to additional dialogs or submits based on the new status value.
 * @param {JQuery.Event} e - The submit/click event from `.Submit`.
 * @returns {void}
 */
function submitForm(e) {

  if (!validateForm()) {
    e.preventDefault();
    return;
  }

  if ($('.metrology-email input').val() === '') {
    e.preventDefault();
    $.alert({
      title: 'No Metrology email address!',
      content: 'Sorry, an error has occurred. Please refresh and try again.'
    });
    return;
  }

  if ($('.department-email-address input').val() === '') {
    e.preventDefault();
    $.alert({
      title: 'No department email address!',
      content: 'Sorry, an error has occurred. Please refresh and try again.'
    });
    return;
  }

  let networkUserName = $('.network-user-name input').val();

  let anonymousUserID = Number($('.anonymous-user-id input').val());
  let anonymousEmployeeNumber = $('.anonymous-user-employee-number input').val();
  let networkUserIDField = $('.user-id input');
  let networkEmployeeNumberField = $('.user-employee-number input');
  let newAssigneeIDField = $('.new-aid input');
  let newAssigneeID = Number(newAssigneeIDField.val());

  if (networkUserName === 'Anonymous User') {
    $(networkUserIDField).val(anonymousUserID);
    $(networkEmployeeNumberField).val(anonymousEmployeeNumber);
  }

  if (newAssigneeID === 0) {
    $(newAssigneeIDField).val(0);
  }


  $('.closeme input').val(1);
  let newTicketStatusID = Number($('.new-sid input').val());
  e.preventDefault();
  switch (newTicketStatusID) {
    case 6:
      cancelTicket();
      break;
    case 5:
      completeTicket();
      break;
    case 3:
      setTicketToWaitingStatus();
      break;
    case 2:
    case 1:
      $('#form1').trigger("submit");
  }
}


/**
 * Validates the form using business rules and applies Parsley-like error markup.
 * Rules:
 * - Subject and status are required.
 * - Anonymous users must supply an employee number.
 * - Cannot unassign once assigned.
 * - Active statuses (> Awaiting) require an assignee.
 * - Awaiting cannot have an assignee.
 * - Cannot revert from active back to Awaiting.
 * @returns {boolean} True when valid; otherwise false.
 */
function validateForm() {
  let isValid = true;
  let ticketStatusField = $('.ticket-status select');
  let assigneeField = $('.assignee-combo select');
  let newTicketStatusID = Number($('.new-sid input').val());
  let oldTicketStatusID = Number($('.sid input').val());
  let newAssigneeID = Number($('.new-aid input').val());
  let oldAssigneeID = Number($('.assignee-id input').val());
  let networkUserName = $('.network-user-name input').val();
  let anonymousUserID = Number($('.anonymous-user-id input').val());
  let anonymousEmployeeNumberField = $('.anonymous-user-employee-number input');


  resetErrorFields();

  if ($('.ticket-subject input').val() === '') {
    $('.ticket-subject input').trigger("blur");
    isValid = false;
  }
  if ($(ticketStatusField).val() === '') {
    $('.ticket-subject input').trigger("blur");
    isValid = false;
  }
  if (networkUserName === 'Anonymous User') {
    if (anonymousUserID === '') {
      $(anonymousEmployeeNumberField).trigger("blur");
      isValid = false;
    }
  }

  if ((oldAssigneeID > 0) && (newAssigneeID === 0)) {
    assigneeField.addClass('parsley-error');
    assigneeField.parent().append("<ul id='assigned-cannot-unassign-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>You cannot unassign a ticket once it has been assigned.</li></ul>");
    isValid = false;
  }

  if ((newTicketStatusID > 1) && (newAssigneeID === 0)) {
    assigneeField.addClass('parsley-error');
    assigneeField.parent().append("<ul id='active-ticket-requires-assignee-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>An active ticket requires an assignee.</li></ul>");
    isValid = false;
  }

  if ((newTicketStatusID === 1) && (newAssigneeID > 0)) {
    assigneeField.addClass('parsley-error');
    assigneeField.parent().append("<ul id='assigned-needs-active-status-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>An assigned ticket must have an active status.</li></ul>");
    isValid = false;
  }

  if ((newTicketStatusID === 1) && (oldTicketStatusID > 1)) {
    ticketStatusField.addClass('parsley-error');
    ticketStatusField.parent().append("<ul id='active-ticket-cannot-inactivate-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>You cannot set status back to Awaiting Dispatch once it has been set to Work In Progress or Waiting on User.</li></ul>");
    isValid = false;
  }


  return isValid;
}


