/**
 AddServiceTicket.js
 
 Author:  Jeffrey Whitney
          jtwhitney@machine.com
          651-319-7982
 Date:    9/29/2025

 Permissions: Anybody can add a service ticket. 


 Purpose:
 Initializes and drives the Add Service Ticket form UI behavior.

 Responsibilities:
 - Set document title and wire submit handler.
 - Load client-side dependencies (jQuery Cookie, jQuery Confirm, jQuery UI CSS) and resolve Bootstrap button conflicts.
 - Close parent dialog when instructed via hidden .closeme flag.
 - Auto-select department email target based on contact user type.
 - On initial lookup completion, mark form ready and backfill site name from cookie.
 - Build CC email list before submit and normalize probe-related fields by ticket type.
 
 Key Concepts:
  Dialog Looping Mechanism:
   The form is called as a popup dialog from other pages, and it communicates with the parent window to close the dialog and refresh the parent 
   page after this page is submitted.    This loop is essential to understand because it's a common pattern that you will see again and again any 
   form which is being used as a popup. This form is one of those.
   The way it works is when this page loads initially, the $('.closeme input') is not provided from the query string, and so is set to the default value of 0.
   Submitting the form sets that value to 1. In LFF, when that the form is submitted it executes the workflow and then, 
   the On Event Completion event redirects back to this same page, but this time with the closeme value set to 1 in the query string. 
   This tells the page that it should close the dialog and refresh the parent page, so it sends off a message to the parent window to do that.
 
   User Permissions:
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

   LaserFiche Events:
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

 Key DOM fields/classes (LF form conventions):
 - .closeme input                     Controls dialog-close behavior (1 = close parent with refresh). (See Dialog Looping Mechanism)
 - .contact-user-type-id input        Determines department email routing (Cell Lead/QE/ME).
 - .cell-lead-email-address input     Cell Lead email address.
 - .qe-email-address input            Quality Engineer email address.
 - .me-email-address input            Manufacturing Engineer email address.
 - .department-email-address input    Target department email set based on user type.
 - .cc-email-col input                Repeating CC recipient fields.
 - .cc-email-address-list input       Aggregated semicolon-delimited CC list (output).
 - .site-name input                   Ticket site name (backfilled from cookie).
 - .ttid input                        Ticket Type ID (numeric).
 - .cmmid input, .probeid input     Related equipment/probe identifiers, reset by ticket type.
 - .broken-probe-name select          Selected probe name; clears .probeid when empty.

 Custom events observed:
 - onloadlookupfinished               Initial lookup hydration complete; finalize setup.
 - lookupcomplete                     Hook available for later use (no-op here).

 Notes:
 - fillCCList() concatenates non-empty CC inputs with ';' terminator (as expected by backend).
 - Submit prevents default when ticket type is not chosen.
 - No server calls here; all logic is client-side field orchestration.
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
