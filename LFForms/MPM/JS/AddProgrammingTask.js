/**
 AddProgrammingTask.js
  
 Author:  Jeffrey Whitney
          jtwhitney@machine.com
          651-319-7982
 Date:    9/29/2025

 Purpose:
   Handles initialization and validation logic for the Add/Edit Programming Task form.
   It's called when the user is on the Ticket Details page and clicks the "Add Task" button.
   (Generally, when the QE has forgotten to add a task when creating the ticket, or when they need to add additional tasks later.)

Permissions:
   - Metrology users (user-type-id == 1) can add/edit tasks across all departments.
   - QE users can only add tasks for tickets within their own department. This way, if one QE is on vacation, 
     another QE can add ta sks to tickets in that department.
 
 KEY CONCEPTS:
  Dialog Looping Mechanism:
   The form is called as a popup dialog from other pages, and it communicates with the parent window to close the dialog and refresh the parent 
   page after this page is submitted. This loop is essential to understand because it's a common pattern that you will see again and again 
   any form that is being used as a popup. This form is one of those.
   The way it works is when this page loads initially, the $('.closeme input') is not provided from the query string, and so is set to the 
   default value of 0. Submitting the form sets that value to 1. In LFF, when that the form is submitted, it executes the workflow, and then,
   the On Event Completion event redirects back to this same page, but this time with the closeme value set to 1 in the query string. 
   This tells the page that it should close the dialog and refresh the parent page, so it sends off a message to the parent window to do that.

  User Permissions:
      There is a user permission model in place to restrict which updates a user can make.
      This is separate from LFF security, which can, (but in practice usually does not), limit who 
      can even access a particular form. For our purposes, this is not particularly useful for our needs because we want
      all users to be able to view the forms. What we want instead is to limit their ability to do certain things
      inside the application. 
      There are several user types that are defined in the database users table, (tblUsers) each with their own
      level of permission. They are:
        - Cell Lead (user-type-id == 5). Cell Leads can only view tickets and tasks. They cannot make any changes.
          In fact, cell leads are not logged in to LFF at all because they do not have LFF accounts.
        - Manufacturing Engineer (user-type-id == 4). They do have LFF accounts but still have read-only access.
        - Quality Engineers, (QE's) (user-type-id == 3). QE's can add tickets, add tasks to tickets, add notes. 
          They cannot, however, change tickets outside their department.
          They also cannot change task statuses or assign them to anyone.
        - Metrology Calibration (user-type-id == 2). They have permissions to update Service Tickets but not programming
          tickets. (A service ticket is a non-programming type of ticket used for things like a machine being
          down or needing service.)_
        - Metrology users (user-type-id == 1). They have full permissions to change the status of tasks,
          assign tasks. They can also add tickets, add tasks to tickets, add notes, etc.
      
      There is also a special case Metrology user, the Admin. This is designated in the User's table by the Admin 
      flag being set to 1. Admins can access forms that are not available to the "regular" Metrology user, such
      as "Department", or "Task Types". Lookup values which are not likely to change very often, if ever. There are also a 
      few little things here and there that an Admin can do that a regular Metrology user cannot, such as 
      sending off an Assignee Pester Message. (Emailing the Assignee of a task asking what's going on with it.)
      
      Lastly, there is a separate flag in the database called IsActive. If a user is inactivated, they have 
      read-only access to the system, regardless of their former user type.
      
      How authentication is performed: 
        When the user first loads the form, LFF fills in the .lf-user-name field with CRETEX\username. 
        (Predicated on the fact that the user has a LFF account and is logged in to LFF).
        Because of the expense, Cell Leads have not been given LFF accounts, so the .lf-user-name field will be set to "Anonymous User" for them.
        In any case, if the user is logged in to LFF, it sets the .lf-user-name to CRETEX\username. However, we only want the username portion,
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
                          The user can either change the fields themselves directly, or indirectly.
                          An example of a direct change would be when the user chooses a Site from the dropdown.
          
    
      Now this gets a bit tricky. The lookupcomplete event can fire multiple times, and we only want to do certain things once, so we need
      to put logic in there so that it's not doing expensive things again and again.
      There is a way of asking what the TriggerID of the lookup is. (A laserfiche function). But I found this to be kind of a pain to use because
      you have to know the TriggerID of the lookup that you want to respond to, and it's just an integer. Also, if you ever change anything
      in the form, you don't know if the trigger id has changed or not. So I found it easier to just put logic in the function that I want to run
      to make sure that it doesn't, say, iterate through a table or something getting values again and again when we only need it to do it once.
    
      For an example of what I'm talking about, we're setting the username field in code and causing a lookup (see 'User Permissions' above).
      Because we're setting the field in code and causing a lookup, the onloadlookupfinished event has already fired. Therefore, any logic that 
      relies on user fields being populated won't work if you call them from the onloadlookupfinished event. Instead, we have to call them from 
      the lookupcomplete event. The unfortunate side effect of this is that the lookupcomplete event can fire multiple times, 
      so we have to put logic in there so that it's not doing expensive things again and again. If you do this wrong, you can seriously lengthen
      the load time of the form. Sometimes this is sort of unavoidable because of the way the LFF Lookup rules work, 
      but you want to minimize it as much as possible.

      Daisy-Chaining Lookups:
        A side effect of the way lookups work is how they sometimes daisy-chain. Let me explain with an example:
        In our example, we have four fields: LFUserName, NetworkUserName, SiteID, DepartmentLookupTable.
        In the beginning the only field which has anything in it is LFUserName, because LF has filled it in for us.
        We take that value, keeping only the username portion and put that in NetworkUserName.
        This causes a lookup for all the user-related fields, including SiteID. Once the SiteID is set, this in turn
        causes another lookup to pull in all the departments related to that site. The Department Lookup cannot be loaded until
        we know which site we're talking about. Sometimes this daisy-chaining can get 3 and sometimes even 4 levels deep because of all the relationships between
        various fields on a form. This causes the form to be slower than it otherwise would have been, but there's not a lot we can do about it.
        It sort of is what it is. This is what happens when you have to make an application with a non-application framework.


 
 Responsibilities:
  - Load required external scripts and styles.
  - Normalize and populate the network username field.
  - Enforce permission-based UI state (enabling/disabling submit).
  - Detect duplicate (existing) task combinations (Name + Type + Operation).
  - Provide client-side validation feedback with a Parsley-style error UI.
  - Coordinate with lookup-driven field population events.

 Key DOM Class / Field Conventions (inputs/selects wrapped in LF form markup):
  .lf-user-name                -> Original (possibly domain-qualified) user identifier.
  .network-user-name           -> Normalized network username (post-back target).
  .closeme                     -> Flag (1 = instruct parent frame to close dialog).
  .existing-task-id            -> Field indicating an existing duplicate task match (server driven).
  .user-id                     -> Numeric user ID (0 = unauthenticated / invalid).
  .user-department-id          -> Department ID associated with the current user.
  .did                         -> Department ID tied to the task/ticket being edited.
  .user-type-id                -> User type (1 = Metrology user with elevated permissions).
  .task-name                   -> Task name input (text).
  .task-type                   -> Task type select.
  .op-number                   -> Operation number input.

 Custom Events Observed:
  lookupcomplete               -> Fired after dependent lookup fields resolve (enables permission logic).
  onloadlookupfinished         -> Indicates initial lookup hydration is fully complete (sets a close flag).

 Validation Strategy:
  - Permission check precedes all other validation.
  - Duplicate detection is driven by `.existing-task-id` being non-empty (populated externally).
  - Error messages added inline using <ul.parsley-errors-list> structure.

 Accessibility / UI Notes:
  - Uses class 'parsley-error' to style invalid fields.
  - Disables submitting by adding 'ui-state-disabled' (maintains original approach-no structural change).

 Potential Improvements (not implemented, informational only):
  - Replace class-based disabling with .prop('disabled', true) for semantic clarity.
  - Refactor duplicate error block creation into a helper to reduce repetition.
  - Improve NaN check in checkExistingTaskIDs() (see inline note).
 */

$(document).ready(function () {
  // Frame naming (maybe used by parent window logic).
  window.name = "Add Programming Task";

  // Dynamically load external dependencies (jQuery Confirm + jQuery UI theme).
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');

  // Avoid Bootstrap button plugin conflicts (restore the original jQuery UI button if needed).
  // This is specifically used so that the X button in the upper right of the dialog displays properly.
  // It's probably unnecessary on this form, but I have it in every form just so that I don't have to think about it.
    $.fn.bootstrapBtn = $.fn.button.noConflict();

  // Attach submit handler (centralized validation path).
  $('.Submit').on("click", function (e) { submitForm(e); });

  // Normalize and populate network username (strip domain, uppercase).
  const lfUserName = $('.lf-user-name input').val();
  if (lfUserName !== "") {
    let networkUserName = lfUserName.toUpperCase();
    networkUserName = networkUserName.substring(networkUserName.lastIndexOf('\\') + 1);
    $('.network-user-name input').val(networkUserName).trigger("change");
  }

  // If flagged, request parent window to close dialog (with refresh).
  if ($('.closeme input').val() === '1') {
    window.parent.postMessage('CloseDialogWithRefresh', '*');
  }

  // Re-validate when existing-task-id changes (server logic may have populated it).
  $('.existing-task-id input').on('change', function () {
    validateForm();
  });

  // After lookups complete, enforce permission-driven UI state; ensure department ID triggers downstream logic if missing email.
  $(document).on('lookupcomplete', function () {
    setFormFieldEnableState();
    if ($('.department-email-address input').val() === '') {
      $('.did input').trigger("change");
    }
  });

  // Signal initial load complete; flag for close and sync network user field.
  $(document).on("onloadlookupfinished", function () {
    $('.closeme input').val(1);
    $('.network-user-name input').trigger("change");
  });
});


/**
 * Evaluates whether the current user has permission to act on the task.
 * Rules:
 *  - User ID must be non-zero.
 *  - Non-Metrology users (QE's) must belong to the same department as the ticket in order to be able to change anything.
 * @returns {boolean} True if permitted; false otherwise.
 */
function checkPermissions() {
  const user_id = Number($(".user-id input").val());
  const user_department_id = Number($(".user-department-id input").val());
  const ticket_department_id = Number($(".did input").val());

  let return_val = true;

  if (user_id === 0) {
    return_val = false;
  }

  if (!isMetrologyUser()) {
    if (user_department_id !== ticket_department_id) {
      return_val = false;
    }
  }

  return return_val
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
 * Clears all client-side validation artifacts:
 *  - Removes error lists for operation, task name, and task type.
 *  - Removes 'parsley-error' class from related inputs.
 */
function resetErrorFields() {
  const task_name = $('.task-name input');
  const task_type = $('.task-type select');
  const task_operation = $('.op-number input');

  $('#operation-error').remove();
  $('#taskname-error').remove();
  $('#tasktype-error').remove();

  task_name.removeClass('parsley-error');
  task_type.removeClass('parsley-error');
  task_operation.removeClass('parsley-error');
}


/**
 * Applies permission logic to determine whether the Submit button should be disabled.
 * Only executes when a user-type-id value is present (non-zero, non-empty).
 */
function setFormFieldEnableState() {
  if (($('.user-type-id input').val() !== 0) && ($('.user-type-id input').val() !== '')) {
    const has_permission = checkPermissions();
    if (!has_permission) {
      $('.Submit').addClass("ui-state-disabled");
    }
  }
}


/**
 * Entrypoint for form submission. Prevents submission if validation fails.
 * @param {Event} e The originating click or submit event.
 */
function submitForm(e) {
  if (!validateForm()) {
    e.preventDefault();

  }
}


/**
 * Performs full validation sequence:
 *  1. Permission verification (disables submitting if unauthorized).
 *  2. Duplicate task detection via `.existing-task-id` (populated from LFF).
 *  3. Error UI decoration (adds consistent messages to task name, type, and operation fields).
 *
 * Side Effects:
 *  - Mutates UI state (adds/removes classes and error markup).
 *  - Toggles submit button disabled state (class-based).
 *
 * @returns {boolean} True if form is valid and user is authorized; false otherwise.
 */
function validateForm() {
  const has_permission = checkPermissions();
  if (!has_permission) {
    $('.Submit').addClass("ui-state-disabled");
    return false;
  }

  resetErrorFields();
  let return_val = true;
  const task_name_field = $('.task-name input');
  const task_type_field = $('.task-type select');
  const opnumber_field = $('.op-number input');
  const existingTaskID = $('.existing-task-id input').val();

  if (existingTaskID !== '') {
    
    task_name_field.addClass('parsley-error');
    task_name_field.parent().append("<ul id='taskname-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>A task with this Name, Type, and Op already exists in this project.</li></ul>");
    task_type_field.addClass('parsley-error');
    task_type_field.parent().append("<ul id='tasktype-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>A task with this Name, Type, and Op already exists in this project.</li></ul>");
    opnumber_field.addClass('parsley-error');
    opnumber_field.parent().append("<ul id='operation-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>A task with this Name, Type, and Op already exists in this project.</li></ul>");
    $('.Submit').addClass("ui-state-disabled");
    return_val = false;
  }
  else {
    $('.Submit').removeClass("ui-state-disabled");
  }

  return return_val;
}
