/*!
TaskTypes.js UI behavior and helpers for the "Task Type Maintenance" page.

 Author:   Jeffrey Whitney
            jtwhitney@machine.com
            651-391-7982
  Date:     9/29/2025

 Permissions: Metrology Admins only.


Responsibilities:
- Initialize page state (title, user display, hiding submit).
- Load required external scripts and styles (jQuery Cookie, jQuery Confirm, jQuery UI theme, SimplePagination CSS).
- Synchronize form fields between hidden inputs and visible radio/select controls.
- Generate per-row action buttons (Edit) and a global "Add TaskType" button for admins.
- Provide navigation helpers (Go Back) and entry points for add/edit actions.

KEY CONCEPTS:
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



External Dependencies (loaded dynamically):
- jQuery (assumed present by the host page)
- jQuery Cookie (1.4.1)
- jQuery Confirm (3.3.2)
- jQuery UI (theme CSS only)
- SimplePagination CSS

Expected Markup (selected elements/classes):
- .lf-user-name input                Source of the domain\username value.
- .network-user-name input           Destination for uppercase SAM account name (part after '\').
- .Submit                            Submit button area to show/hide based on context/admin.
- .user-isadmin input                "1" if current user is admin; otherwise not "1".
- .tasktype-table table              Grid hosting Task Type rows.
- .edit-button-col input[type=text]  Hidden text input holding row identifier used to build action buttons.
- .gobackbutton                      Placeholder element replaced with a real "Go Back" button.
- .action-choice input[type=radio]   Operation mode: "1"=Add, "2"=Edit.
- .add-id input                      Hidden state used by backend to switch to "Add" mode.
- .edit-id input                     Hidden state used by backend to select an item for "Edit".
- .edit-tasktype-is-active           Radio group for TaskType "Is Active". Tells Workflow which thing we're doing.
- .edit-is-active-value input        Hidden mirror for "Is Active" selection.
- .edit-requires-job-number-choice   Radio group for "Requires Job Number". Whether job number needs to be generated
                                     when a new task is created of this type.
- .edit-requires-job-number-value    Value set by the "Requires Job Number" selection.
- .edit-task-type-group-cbo select   Which task type group this task type belongs to. This is for the task summary on the "Programming Tasks" page.
- .edit-tasktype-group-name input    The Task Type Group Code (text) that corresponds to the selected group in the select. 
 */

$(document).ready(function () {
  // Normalize the displayed network user name to a SAM-style uppercase username (portion after '\').
  var lfUserName = $('.lf-user-name input').val();
  $('.network-user-name input').val(lfUserName.toUpperCase().substr(lfUserName.lastIndexOf('\\') + 1)).change();

  // Initial page state.
  $('.Submit').hide();
  $(document).prop('title', 'Task Type Maintenance');

  // Load optional client-side dependencies (best-effort; no await needed for current usage).
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');

  // Theme and component styles.
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simplePagination.js/1.6/simplePagination.min.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');

  // Resolve Bootstrap $.fn.button conflicts (retain original via alias).
  var bootstrapButton = $.fn.button.noConflict(); // return $.fn.button to previously assigned value
  $.fn.bootstrapBtn = bootstrapButton;

  // Keep radio group "Is Active" in sync with hidden value.
  $(document).on('change', '.edit-is-active-value input', function () {
    var isActive = $('.edit-is-active-value input').val();
    $(`.edit-tasktype-is-active input[type='radio'][value='${isActive}']`).prop("checked", true);
  });

  // Keep radio group "Requires Job Number" in sync with hidden value.
  $(document).on('change', '.edit-requires-job-number-value input', function () {
    var requiresJobNumber = $('.edit-requires-job-number-value input').val();
    $(`.edit-requires-job-number-choice input[type='radio'][value='${requiresJobNumber}']`).prop("checked", true);
  });

  // Mirror radio "Is Active" selection back to the hidden field.
  $(document).on('change', ".edit-tasktype-is-active input[type='radio']", function () {
    var isActive = $(this).val();
    $('.edit-is-active-value input').val(isActive);
  });

  // Mirror radio "Requires Job Number" selection back to the hidden field.
  $(document).on('change', ".edit-requires-job-number-choice input[type='radio']", function () {
    var requiresJobNumber = $(this).val();
    $('.edit-requires-job-number-value input').val(requiresJobNumber);
  });

  // Keep the group name text input and the select in sync (text -> select).
  $(document).on('change', ".edit-tasktype-group-name input", function () {
    $('.edit-task-type-group-cbo select').val($(this).val());
  });

  // After lookup populates the grid, attach per-row Edit buttons, Go Back buttons, and Add button for admins.
  $(document).on('lookupcomplete', function (e) {
    generateTableButtons(".edit-button-col", "ui-icon-pencil", "Edit TaskType", "callEditTaskType");
    generateGoBackButtons();
    if (isAdminUser()) {
      if ($('.add-button').length == 0) {
        var add_button = '<div class="ui-button add-button" onclick="callAddTaskType()"><span title="Add TaskType" class="ui-button-icon ui-icon ui-icon-plusthick"></span>Add TaskType</div>';
        $(add_button).insertBefore('.tasktype-table table');
      }
    }
  });

  // Normalize the displayed user name once initial data load completes.
  $(document).on("onloadlookupfinished", function (e) {
    $('.network-user-name input').trigger("change");
  });

});


/**
 * Enter "Add TaskType" mode.
 * - Selects action choice "1" (Add).
 * - Sets ".add-id" to 1 and triggers change (backend signal).
 * - Shows the ".Submit" area.
 */
function callAddTaskType() {
  $(`.action-choice input[type='radio'][value='1']`).prop("checked", true);
  $('.add-id input').val(1).change();
  $('.Submit').show();
}


/**
 * Enter "Edit TaskType" mode for a given TaskType identifier.
 * - Selects action choice "2" (Edit).
 * - Sets ".edit-id" to the provided id and triggers change (backend signal).
 * - Shows the ".Submit" area only for admin users.
 *
 * @param {number|string} tasktypeID - Identifier of the TaskType to edit.
 */
function callEditTaskType(tasktypeID) {
  $(`.action-choice input[type='radio'][value='2']`).prop("checked", true);
  $('.edit-id input').val(tasktypeID).change();
  if (isAdminUser()) {
    $('.Submit').show();
  }
}


/**
 * Return to neutral state from Add/Edit modes.
 * - Clears ".add-id" and ".edit-id".
 * - Hides the ".Submit" area.
 */
function callGoBack() {
  $(".add-id input").val(0).change();
  $(".edit-id input").val(0).change();
  $('.Submit').hide();
}


/**
 * Replace placeholder elements with real "Go Back" buttons.
 * Looks for elements with class ".gobackbutton", appends a new UI button that calls callGoBack(),
 * then removes the placeholder element.
 */
function generateGoBackButtons() {
  var $goback_buttons = $(".gobackbutton");
  $goback_buttons.each(function (index) {
    $(this).parent().append("<div id='go-back' class='ui-button ui-corner-all ui-widget' onclick='callGoBack()'><span class='ui-icon ui-icon-arrowreturnthick-1-w'></span>Go Back</div>");
  });
  $(".gobackbutton").remove();
}


/**
 * Create per-row action buttons in a table/grid.
 * Scans for text inputs inside the provided selector, reads each input's value (assumed row id),
 * and appends a clickable UI button that invokes the provided global function name with the id.
 * A button is added only if one with the same icon class is not already present.
 *
 * Example:
 *   generateTableButtons(".edit-button-col", "ui-icon-pencil", "Edit TaskType", "callEditTaskType");
 *
 * @param {string} buttonSelector - CSS selector for the container holding a text input with the row id.
 * @param {string} buttonClass - jQuery UI icon class to display on the button (e.g., "ui-icon-pencil").
 * @param {string} buttonTitle - Tooltip/title attribute for the button icon.
 * @param {string} buttonFunction - Global function name to call on click; receives the row id as an argument.
 */
function generateTableButtons(buttonSelector, buttonClass, buttonTitle, buttonFunction) {
  var selectionString = buttonSelector + " input[type=text]";
  var buttons = $(selectionString);
  buttons.each(function () {
    var btn_value = $(this).val();
    var btn_html = `<div class='table-button ui-button' onclick='${buttonFunction}(${btn_value})'><span title='${buttonTitle}' class='ui-button-icon ui-icon ${buttonClass}'/></div>`

    var has_button = $(this).parent().find(`.${buttonClass}`).length;
    if (has_button == 0) {
      $(this).parent().append(btn_html);
    }
  });
}


/**
 * Determine whether the current user has admin privileges.
 *
 * @returns {boolean} True if ".user-isadmin input" has value "1"; otherwise false.
 */
function isAdminUser() {
  if ($('.user-isadmin input').val() == '1') {
    return true;
  }
  return false;
}

