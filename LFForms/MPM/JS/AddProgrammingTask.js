/**
 AddProgrammingTask.js

 Purpose:
 Handles initialization and validation logic for the Add/Edit Programming Task form.
 It's called when the user is on the Ticket Details page and clicks the "Add Task" button.
 (Generally, when the QE has forgotten to add a task when creating the ticket, or when they need to add additional tasks later.)
 
 
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
 
 Responsibilities:
  - Load required external scripts and styles.
  - Normalize and populate network user name field.
  - Enforce permission-based UI state (enabling/disabling submit).
  - Detect duplicate (existing) task combinations (Name + Type + Operation).
  - Provide client-side validation feedback with Parsley-style error UI.
  - Coordinate with lookup-driven field population events.

 Key DOM Class / Field Conventions (inputs/selects wrapped in LF form markup):
  .lf-user-name                -> Original (possibly domain-qualified) user identifier.
  .network-user-name           -> Normalized network username (post back target).
  .closeme                     -> Flag (1 = instruct parent frame to close dialog).
  .existing-task-id            -> Field indicating an existing duplicate task match (server driven).
  .user-id                     -> Numeric user ID (0 = unauthenticated / invalid).
  .user-department-id          -> Department ID associated with current user.
  .did                         -> Department ID tied to the task/ticket being edited.
  .user-type-id                -> User type (1 = Metrology user with elevated permissions).
  .task-name                   -> Task name input (text).
  .task-type                   -> Task type select.
  .op-number                   -> Operation number input.

 Custom Events Observed:
  lookupcomplete               -> Fired after dependent lookup fields resolve (enables permission logic).
  onloadlookupfinished         -> Indicates initial lookup hydration is fully complete (sets close flag).

 Validation Strategy:
  - Permission check precedes all other validation.
  - Duplicate detection is driven by `.existing-task-id` being non-empty (populated externally).
  - Error messages added inline using <ul.parsley-errors-list> structure.

 Accessibility / UI Notes:
  - Uses class 'parsley-error' to style invalid fields.
  - Disables submit by adding 'ui-state-disabled' (maintains original approach—no structural change).

 Potential Improvements (not implemented, informational only):
  - Replace class-based disabling with .prop('disabled', true) for semantic clarity.
  - Refactor duplicate error block creation into a helper to reduce repetition.
  - Improve NaN check in checkExistingTaskIDs() (see inline note).
 */

$(document).ready(function () {
  // Frame naming (may be used by parent window logic).
  window.name = "AddEditTask";

  // Dynamically load external dependencies (jQuery Confirm + jQuery UI theme).
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');

  // Avoid Bootstrap button plugin conflicts (restore original jQuery UI button if needed).
  // This is specifically used so that the X button in the upper right of the dialog displays properly.
  // It's probably not needed on this form, but I have it in every form just so that I don't have to think about it.
  var bootstrapButton = $.fn.button.noConflict();
  $.fn.bootstrapBtn = bootstrapButton;

  // Attach submit handler (centralized validation path).
  $('.Submit').click(function (e) { submitForm(e); });

  // Normalize and populate network user name (strip domain, uppercase).
  var lfUserName = $('.lf-user-name input').val();
  if (lfUserName != "") {
    let networkUserName = lfUserName.toUpperCase();
    networkUserName = networkUserName.substr(networkUserName.lastIndexOf('\\') + 1);
    $('.network-user-name input').val(networkUserName).change();
  }

  // If flagged, request parent window to close dialog (with refresh).
  if ($('.closeme input').val() == 1) {
    window.parent.postMessage('CloseDialogWithRefresh', '*');
  }

  // Re-validate when existing-task-id changes (server logic may have populated it).
  $('.existing-task-id input').on('change', function (e) {
    validateForm();
  });

  // After lookups complete, enforce permission-driven UI state; ensure department ID triggers downstream logic if missing email.
  $(document).on('lookupcomplete', function (e) {
    setFormFieldEnableState();
    if ($('.department-email-address input').val() == '') {
      $('.did input').trigger("change");
    }
  });

  // Signal initial load complete; flag for close and sync network user field.
  $(document).on("onloadlookupfinished", function (e) {
    $('.closeme input').val(1);
    $('.network-user-name input').trigger("change");
  });
});


/**
 * Scans the existing task ID select options to determine if there are any task IDs
 * other than the current task ID present (indicating possible duplicates).
 * @returns {boolean} True if at least one different (non-zero) task ID is present; otherwise false.
 */
function checkExistingTaskIDs() {
  var existing_task_ids = $('.existing-task-id select option');
  var task_id = $('.tid input').val();
  var returnVal = false;
  existing_task_ids.each(function () {
    option_value = Number($(this).val());
    if isNaN(option_value) { 
      return;
    }
    if ((option_value != 0) && (option_value != task_id)) {
      returnVal = true;
    }
  });
  return returnVal;
}


/**
 * Evaluates whether the current user has permission to act on the task.
 * Rules:
 *  - User ID must be non-zero.
 *  - Non-Metrology users (QE's) must belong to the same department as the ticket in order to be able to change anything.
 * @returns {boolean} True if permitted; false otherwise.
 */
function checkPermissions() {
  var user_id = Number($(".user-id input").val());
  var user_department_id = Number($(".user-department-id input").val());
  var ticket_department_id = Number($(".did input").val());

  var return_val = true;

  if (user_id == 0) {
    return_val = false;
  }

  if (!isMetrologyUser()) {
    if (user_department_id != ticket_department_id) {
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
  if (Number($('.user-type-id input').val()) == 1) {
    return true;
  }
  return false;
}


/**
 * Clears all client-side validation artifacts:
 *  - Removes error lists for operation, task name, and task type.
 *  - Removes 'parsley-error' class from related inputs.
 */
function resetErrorFields() {
  var task_name = $('.task-name input');
  var task_type = $('.task-type select');
  var task_operation = $('.op-number input');

  $('#operation-error').remove();
  $('#taskname-error').remove();
  $('#tasktype-error').remove();

  task_name.removeClass('parsley-error');
  task_type.removeClass('parsley-error');
  task_operation.removeClass('parsley-error');
}


/**
 * Applies permission logic to determine whether the submit button should be disabled.
 * Only executes when a user-type-id value is present (non-zero, non-empty).
 */
function setFormFieldEnableState() {
  if (($('.user-type-id input').val() != 0) && ($('.user-type-id input').val() != '')) {
    var has_permission = checkPermissions();
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
    return;
  }
}


/**
 * Performs full validation sequence:
 *  1. Permission verification (disables submit if unauthorized).
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
  var has_permission = checkPermissions();
  if (!has_permission) {
    $('.Submit').addClass("ui-state-disabled");
    return false;
  }

  resetErrorFields();
  var return_val = true;
  var task_name_field = $('.task-name input');
  var task_type_field = $('.task-type select');
  var opnumber_field = $('.op-number input');
  var existingTaskID = $('.existing-task-id input').val();

  if (existingTaskID != '') {
    
    task_name_field.addClass('parsley-error');
    task_name_field.parent().append("<ul id='taskname-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>A task with this Name, Type, and Op already exist in this project.</li></ul>");
    task_type_field.addClass('parsley-error');
    task_type_field.parent().append("<ul id='tasktype-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>A task with this Name, Type, and Op already exist in this project.</li></ul>");
    opnumber_field.addClass('parsley-error');
    opnumber_field.parent().append("<ul id='operation-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>A task with this Name, Type, and Op already exist in this project.</li></ul>");
    $('.Submit').addClass("ui-state-disabled");
    return_val = false;
  }
  else {
    $('.Submit').removeClass("ui-state-disabled");
  }

  console.log('return_val: ' + return_val);
  return return_val;
}