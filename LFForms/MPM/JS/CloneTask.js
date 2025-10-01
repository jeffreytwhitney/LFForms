/**
  CloneTask.js
 
  Purpose:
  Orchestrates the Clone Task dialog behavior and validation.
 
  Permissions: (See 'User Permissions' below for details.)
    QE's and Metrology users can clone tasks; others cannot. QE's can only clone tasks within their department.

  Responsibilities:
    - Load CSS/JS dependencies and resolve Bootstrap/jQuery UI conflicts.
    - Normalize the network username from domain\user.
    - Pre-fill new task fields from current task values after lookups.
    - Enforce permission-based enable/disable states.
    - Validate uniqueness (Name + Type + Op) before submit and surface errors.
 
 Key Concepts:
  Dialog Looping Mechanism:
    The form is called as a popup dialog from other pages, and it communicates with the parent window to close the dialog and refresh the parent page after this 
    is page submitted. This loop is essential to understand because it's a common pattern that you will see again and again any form which is being used as a popup. 
    This form is one of those. The way it works is when this page loads initially, the $('.closeme input') is not provided from the query string, 
    and so is set to the default value of 0. Submitting the form sets that value to 1. In LFF, when that the form is submitted it executes the workflow and then, 
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
 - .tid input                         Current Task ID (required; disables submit when 0).
 - .current-task-type-name input      Current Task Type (text).
 - .current-op input                  Current Op number.
 - .current-task-name input           Current Task Name.
 - .new-task-type select              Target Task Type.
 - .new-op input                      Target Op number.
 - .new-task-name input               Target Task Name.
 - .existing-task-ids select option   Options representing conflicting existing tasks.
 - .user-type-id input                User type (1=Metrology, 3=Dept user).
 - .user-department-id input          Current user department.
 - .department-id input               Task’s department.
 - .department-email-address input    Department email (populated on lookup).
 - .new-assignee-id input             Optional new assignee; defaults to 0 on submit.
 - #error-message                     Container for permission error text.
 - .closeme input                     When set to 1, closes parent dialog with refresh.

 Custom events observed:
 - onloadlookupfinished               Initializes form values and submit state.
 - lookupcomplete                     Triggers dependent field population if missing.

 Notes:
 - All text inputs are uppercased on blur.
 - checkExistingTaskIDs() uses option_value == NaN which never evaluates true; prefer isNaN(option_value).
 */

$(document).ready(function () {
  
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
  var bootstrapButton = $.fn.button.noConflict();
  $.fn.bootstrapBtn = bootstrapButton;
  $('.Submit').addClass('ui-button ui-corner-all ui-widget');
  $('.Submit').click(function (e) { submitForm(e); });
  $('.network-user-name input').val($('.lf-user-name input').val().toUpperCase().substr($('.lf-user-name input').val().lastIndexOf('\\') + 1)).change();

  if ($('.closeme input').val() == 1) {
    window.parent.postMessage('CloseDialogWithRefresh', '*');
  }

  // Uppercase all text inputs on blur
  $(document).on('blur', "input[type=text]", function () {
    $(this).val(function (_, val) {
      return val.toUpperCase();
    });
  });

  // Initialize new task fields from current values after lookups
  $(document).on("onloadlookupfinished", function (e) {
    if ($('.tid input').val() == 0) {
      $('.Submit').addClass("ui-state-disabled");
      return;
    } 

    $('.new-task-type select').val($('.current-task-type-name input').val()).change();
    $('.new-op input').val($('.current-op input').val()).change();
    $('.new-task-name input').val($('.current-task-name input').val()).change();
    

  });

  // Fill missing dependent values when available
  $(document).on('lookupcomplete', function (e) {
    if (Number($('.user-id input').val()) == 0) {
      $('.network-user-name input').trigger("change");
    }
    if (Number($('.pid input').val()) == 0) {
      $('.tid input').trigger("change");
    }
    if ((Number($('.department-id input').val()) != 0) && ($('.department-email-address input').val() == '')){
      $('.department-id input').trigger("change");
    }
  });

});


/**
 * Checks for any nonzero option value under .existing-task-ids select.
 * Indicates that a conflicting task (Name + Type + Op) exists in the project.
 * Note: option_value == NaN is always false; use isNaN(option_value) if refactoring.
 * @returns {boolean} True if at least one nonzero ID exists; otherwise false.
 */
function checkExistingTaskIDs() {
  var existing_task_ids = $('.existing-task-ids select option');
  var returnVal = false;
  existing_task_ids.each(function (index) {
    option_value = Number($(this).val());
    if (option_value == NaN) {
      return;
    }
    if (option_value != 0) {
      returnVal = true;
    }
  });
  return returnVal;
}


/**
 * Returns true when the current user is a Metrology user (user-type-id == 1).
 * @returns {boolean}
 */
function isMetrologyUser() {
  if ($('.user-type-id input').val() == 1) {
    return true;
  }
  return false;
}

/**
 * Enforces permission rules; disables form and shows message for unauthorized users.
 * - Dept user (3) must match task department.
 * - All other non-metrology, non-dept users are denied.
 */
function setFormEnabledState() {

  if ($('.user-type-id input').val() == 3) {
    if ($('.user-department-id input').val() != $('.department-id input').val()) {
      $('.Submit').addClass("ui-state-disabled");
      $('.new-task-type select').addClass("ui-state-disabled");
      $('.new-op input').addClass("ui-state-disabled");
      $('.new-task-name input').addClass("ui-state-disabled");
      $('#error-message').html('<b><font size="5">You do not have permission to clone this task.</font></b>').show();
    }
  }
  if (($('.user-type-id input').val() != 1) && ($('.user-type-id input').val() != 3)) {
    $('.Submit').addClass("ui-state-disabled");
    $('.new-task-type select').addClass("ui-state-disabled");
    $('.new-op input').addClass("ui-state-disabled");
    $('.new-task-name input').addClass("ui-state-disabled");
    $('#error-message').html('<b><font size="5">You do not have permission to clone this task.</font></b>').show();
  }

}


/**
 * Submit handler.
 * - Validates uniqueness and blocks submit on failure.
 * - Defaults empty new assignee to 0.
 * - Sets close flag to instruct parent to refresh/close after server post.
 * @param {Event} e Click/submit event.
 */
function submitForm(e) {
  if (validateForm() == false) {
    console.log('form is invalid');
    e.preventDefault();
    return;
  }
  var newAssigneeID = $('.new-assignee-id input').val();
  if (newAssigneeID == '') {
    $('.new-assignee-id input').val(0);
  }


  $('.closeme input').val(1);
}


/**
 * Validates new task values.
 * - Fails when a duplicate (Name + Type + Op) exists in project.
 * - Adds Parsley-style inline error markup to each invalid field.
 * @returns {boolean} True if valid; otherwise false.
 */
function validateForm() {
  var task_name_field = $('.new-task-name input');
  var task_type_field = $('.new-task-type select');
  var opnumber_field = $('.new-op input');

  var return_val = true;

  $('#taskname-error').remove();
  $('#tasktype-error').remove();
  $('#operation-error').remove();
  
  task_name_field.removeClass('parsley-error');
  task_type_field.removeClass('parsley-error');
  opnumber_field.removeClass('parsley-error');

  if (checkExistingTaskIDs()) {
    task_name_field.addClass('parsley-error');
    task_name_field.parent().append("<ul id='taskname-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>A task with this Name, Type, and Op already exist in this project.</li></ul>");
    task_type_field.addClass('parsley-error');
    task_type_field.parent().append("<ul id='tasktype-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>A task with this Name, Type, and Op already exist in this project.</li></ul>");
    opnumber_field.addClass('parsley-error');
    opnumber_field.parent().append("<ul id='operation-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>A task with this Name, Type, and Op already exist in this project.</li></ul>");
    return_val = false;
  }

  return return_val;

}