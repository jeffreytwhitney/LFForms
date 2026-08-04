/**
AddTaskTime.js

 Author:  Jeffrey Whitney
          jtwhitney@machine.com
          651-319-7982
 Date:    9/29/2025

Purpose:
Controls the Add Task Time dialog behavior and field orchestration.

Permissions: Only Metrology users (user-type-id 1) can add time to a task.

Responsibilities:
- Load CSS/JS dependencies and resolve Bootstrap/jQuery UI button conflicts.
- Wire submit behavior to set   .closeme   and submit the form.
- Map radio/user-defined inputs into   .time-to-add  .
- Populate   .date-to-add   with today's date.
- Populate   .network-user-name   from   .lf-user-name   (uppercase, sans domain).
- Disable controls when no task id (  .tid  ) is present.

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
      can even access a particular form. For our purposes, this is not particularly useful for our needs because we want
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
        - onloadlookupfinished: The event fires only once, when all the initial lookups have completed. The kinds of lookups that are completed
                                under this event are the ones that do not have any arguments in them, meaning that they can be looked up immediately.
                                Examples of this would be Task Types and Task Statuses. These lookups do not depend on any other fields being set.
        - lookupcomplete: This event fires each time a lookup completes after the onloadlookupfinished event has been called. 
                          Laserfiche has lookup rules applied to certain fields, so that when a field is changed, it triggers a lookup to fill in other fields.
                          The fields themselves can either be changed by the user directly, or indirectly. 
                          An example of a direct change would be when the user chooses a Site from the dropdown. 
          
    
      Now this gets a bit tricky because the lookupcomplete event can fire multiple times, and we only want to do certain things once. Therefore, we need
      to put logic in there so that it's not doing expensive things again and again.
      There is a way of asking what the TriggerID of the lookup is. (A laserfiche function). But I found this to be kind of a pain to use because
      you have to know the TriggerID of the lookup that you want to respond to, and it's just an integer. Also, if you ever change anything 
      in the form, you don't know if the trigger id has changed or not. So, I found it easier to just put logic in the function.
      
    
      For an example of what I'm talking about, we're setting the username field in code and causing a lookup, (see 'User Permissions' above).
      Because we're setting the field in code and causing a lookup, the onloadlookupfinished event has already fired. Therefore, any logic that 
      relies on user fields being populated won't work if you call them from the onloadlookupfinished event. Instead, we have to call them from 
      the lookupcomplete event. The unfortunate side effect of this is that the lookupcomplete event can fire multiple times, 
      so we have to put logic in there so that it's not doing expensive things again and again. If you do this wrong, you can seriously lengthen
      the load time of the form. Sometimes this is sort of unavoidable because of the way the LFF Lookup rules work, 
      but you want to minimize it as much as possible.

      Daisy-Chaining Lookups:
        A side effect of the way lookups work is how they sometimes daisy-chain. Let me explain with an example:
        In our example, we have four fields: LFUserName, NetworkUserName, SiteID, DepartmentLookupTable.
        At the beginning the only field which has anything in it is LFUserName, because LF has filled it in for us.
        We take that value, keeping only the username portion and put that in NetworkUserName. 
        This causes a lookup for all the user related fields, including SiteID. Once the SiteID is set, this in turn
        causes another lookup to pull in all the departments related to that site. The Department Lookup cannot be loaded until 
        we know which site we're talking about. Sometimes this daisy-chaining can get 3 and sometimes even 4 levels deep because of all the relationships between
        various fields on a form. This causes the form to be slower than it otherwise would have been, but there's not a lot we can do about it.
        It sort of is what it is. This is what happens when you have to make an application with a non-application framework.

Key DOM fields/classes:
-   .add-time-radio fieldset input[type="radio"]    Preset time choices; 'X' enables custom entry.
-   .user-defined-hours input                       Custom hours; mirrors to .time-to-add  .
-   .time-to-add input                              Target hours value submitted.
-   .date-to-add input                              Target date; set to today via moment().format("l").
-   .lf-user-name input                             Domain\user; used to derive .network-user-name. See User Permissions above.
-   .network-user-name input                        Uppercased username without domain. See User Permissions above.
-   .tid input                                      Task ID; required to enable submit/inputs. This is filled by value via the query string.
-   .closeme input                                  1 triggers parent close with refresh. See Dialog Looping Mechanism above.

Custom events observed:
- onloadlookupfinished  Sets default date (today).
- lookupcomplete         Disables UI if .tid is empty.

Notes:
- Requires moment.js to be available globally (for date formatting).
- Uses jQuery Confirm CSS for consistent dialog styles.
 */

$(function () {

  const lfUserNameRaw = $('.lf-user-name input').val();
  const lfUserName = (typeof lfUserNameRaw === 'string') ? lfUserNameRaw.trim() : '';
  if ((lfUserName !== '') && (lfUserName !== 'Anonymous User')) {
    $('.network-user-name input').val(lfUserName.toUpperCase().slice(lfUserName.lastIndexOf('\\') + 1)).trigger("change");
  }

  $.when(
    $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js')
  ).done(function () {
    $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
    $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');

    $.fn.bootstrapBtn = $.fn.button.noConflict();
  }).fail(function () {
    console.error('Failed to load required scripts');
  });


  $('.Submit').addClass('ui-button ui-corner-all ui-widget');

  $('.Submit').on("click", function (e) {
    e.preventDefault();
    $('.closeme input').val(1);
    $(this.form).trigger("submit");
  });

  $('.add-time-radio fieldset').on("change", function () {
    const time_to_add = $('.add-time-radio fieldset input[type="radio"]:checked').val();
    if (time_to_add !== 'X') {
      $('.time-to-add input').val(time_to_add);
    }
    else {
      $('.time-to-add input').val(null);
    }
  });

  $('.user-defined-hours input').on("change", function () {
    $('.time-to-add input').val($('.user-defined-hours input').val());
  });

  if ($('.closeme input').val() === '1') {
    window.parent.postMessage('CloseDialogWithRefresh', '*');
  }

  $(document).on("onloadlookupfinished", function () {
    $('.date-to-add input').val(moment(fdmax).format("l"));
  });

  $(document).on('lookupcomplete', function () {
    if (($('.tid input').val() === null) || ($('.tid input').val().length === 0)) {
      $('.Submit').addClass("ui-state-disabled");
      $('.add-time-radio fieldset').addClass("ui-state-disabled");
    }
    generateTotalTrackedHoursMessage();
    

   
  });
});


function generateTotalTrackedHoursMessage() {
  $('#existing-time-msg').remove();
  let totalHours = parseFloat($('.total-task-hours input').val());
  let totalHoursMessage;
  if (isNaN(totalHours)) {
    totalHours = 0;
  }
  if (totalHours === 0) {
    totalHoursMessage = "<span id='existing-time-msg'>You currently have no hours logged for this task.</span>";
  }
  else if(totalHours === 1) {
    totalHoursMessage = "<span id='existing-time-msg'>You currently have 1 hour logged for this task.</span>";
  }
  else {
    totalHoursMessage = `<span id='existing-time-msg'>You currently have ${totalHours.toFixed(2)} hours logged for this task.</span>`;
  }

  $('#existing-time-div').append(totalHoursMessage);
}
