/**
AddServiceTicketNote.js

 Author:  Jeffrey Whitney
          jtwhitney@machine.com
          651-319-7982
 Date:    9/29/2025

Purpose:
Controls the UI behavior for adding a service ticket note.

Responsibilities:
- Set page title and load client-side CSS dependencies.
- Resolve Bootstrap/jQuery UI button plugin conflict.
- Close parent dialog when `.closeme` is flagged.
- Gate the form based on required IDs (`.tid`, `.uid`) after lookups finish. 'tid' is task ID, 'uid' is user ID.
- Route the department email address based on contact user type.

Key Concepts:
  Dialog Looping Mechanism:
    The form is called as a popup dialog from other pages, and it communicates with the parent window to close the dialog and refresh the parent page after this page is submitted.
    This loop is essential to understand because it's a common pattern that you will see again and again any form which is being used as a popup. This form is one of those.
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


Key DOM fields/classes:
- `.tid input`                         Task/ ticket ID; required to enable submit.
- `.uid input`                         User ID; required to enable submit.
- `.note-text textarea`                Note body; disabled if required IDs are missing.
- `.contact-user-type-id input`        Contact user type used for department email routing.
- `.cell-lead-email-address input`     Cell Lead email address.
- `.qe-email-address input`            Quality Engineer email address.
- `.me-email-address input`            Manufacturing Engineer email address.
- `.department-email-address input`    Target email address derived from user type.
- `.closeme input`                     When set to 1, instructs parent to close with refresh.

Custom events observed:
- `onloadlookupfinished`               Finalizes initial state; validates required IDs.
- `lookupcomplete`                     Triggers department email routing.

Dependencies loaded:
- jQuery UI CSS (smoothness theme)
- simplePagination.css
- jQuery Confirm CSS

Notes:
- Submit button is hidden and note textarea is disabled when `.tid` or `.uid` are empty.
- `setDepartmentEmail()` maps user type to the proper department email address.
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
