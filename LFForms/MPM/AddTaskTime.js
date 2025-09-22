/**
AddTaskTime.js

Purpose:
Controls the Add Task Time dialog behavior and field orchestration.

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
    There is a user permission model in place to restrict who can add/edit tasks based on their department and user type.
    Metrology users (user-type-id == 1) have elevated permissions and can add/edit tasks across departments.
    QE users can only add/edit tasks within their own department. They can also add notes to tasks in their department.
    Non-authenticated users (user-id == 0) are not allowed to add/edit tasks. This includes Cell Leads and anybody else who does not have a LaserFiche Forms account.
    This is how it works: when the user first loads the form, LFF fills in the .lf-user-name field with CRETEX\username, but we only want the username portion so we copy just the 
    username portion (trimming off the "CRETEX/" part) into the .network-user-name field, which is what gets posted back to the server.
    This will be matched against the user database to determine the user's ID, user type, and department.

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

$(document).ready(function () {
  // Load visual dependencies (jQuery Confirm + jQuery UI theme)
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');

  // Resolve Bootstrap/jQuery UI button conflicts and style the submit button
  var bootstrapButton = $.fn.button.noConflict();
  $.fn.bootstrapBtn = bootstrapButton;
  $('.Submit').addClass('ui-button ui-corner-all ui-widget');

  // Submit: mark close flag and submit underlying form
  $('.Submit').click(function (e) {
    e.preventDefault();
    $('.closeme input').val(1);
    $(this.form).submit();
  });

  // Mirror radio selection into `.time-to-add`; 'X' means custom value (cleared here)
  $('.add-time-radio fieldset').change(function () {
    var time_to_add = $('.add-time-radio fieldset input[type="radio"]:checked').val();
    if (time_to_add != 'X') {
      $('.time-to-add input').val(time_to_add);
    }
    else {
      $('.time-to-add input').val(null);
    }
  });

  // Mirror custom hours into `.time-to-add`
  $('.user-defined-hours input').change(function () {
    $('.time-to-add input').val($('.user-defined-hours input').val());
  });

  // Close dialog if flagged
  if ($('.closeme input').val() == 1) {
    window.parent.postMessage('CloseDialogWithRefresh', '*');
  }

  // Derive network username from domain\user and uppercase it
  $('.network-user-name input').val($('.lf-user-name input').val().toUpperCase().substr($('.lf-user-name input').val().lastIndexOf('\\') + 1)).change();

  // After lookups, set today's date (locale format) in `.date-to-add`
  $(document).on("onloadlookupfinished", function (e) {
    $('.date-to-add input').val(moment().format("l"));
  });

  // Disable controls when no Task ID is available
  $(document).on('lookupcomplete', function (e) {
    if (($('.tid input').val() == null) || ($('.tid input').val().length == 0)) {
      $('.Submit').addClass("ui-state-disabled");
      $('.add-time-radio fieldset').addClass("ui-state-disabled");
    }
  });
});