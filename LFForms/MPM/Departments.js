/**
 * Departments.js
 *
 * Purpose:
 * Controls the Department Maintenance UI for listing, adding, and editing departments.
 *
 * Responsibilities:
 * - Normalize and propagate the network username from `domain\user`.
 * - Lazy-load UI/library dependencies and resolve Bootstrap/jQuery UI button conflicts.
 * - Manage Add/Edit/Go Back actions and show/hide the submit button based on state and role.
 * - Persist selected site in a cookie and restore it on subsequent loads.
 * - Generate dynamic action buttons in table rows after data lookups complete.
 * 
 *Key Concepts:
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
 * - `.lf-user-name input`                 Raw network identity (domain\user).
 * - `.network-user-name input`            Derived username (uppercased, no domain).
 * - `.Submit`                             Form submit button; hidden by default.
 * - `.gobackbutton`                       Placeholder element replaced by a dynamic Go Back button.
 * - `.department-table table`             Target for inserting the Add Department button.
 * - `.site-name select`                   Site selector; value is stored in cookie `site_name`.
 * - `.edit-db-parent-name input`          Text representation of parent department; mirrors to select.
 * - `.edit-parent-name select`            Parent department dropdown (edit).
 * - `.action-choice`                      Radio group controlling add vs edit action.
 * - `.add-department-id input`            Flag/ID for add action (0 or 1).
 * - `.edit-department-id input`           Department ID for edit action (0 or department ID).
 * - `.user-isadmin input`                 Indicates whether current user is an admin ('1' => admin).
 *
 * Custom events observed:
 * - `lookupcomplete`                      Used to render action buttons.
 * - `onloadlookupfinished`                Used to restore cookie and fire username change.
 *
 * Notes:
 * - Uses jQuery Cookie to persist the selected site name for 1 year.
 * - Submit handler normalizes parent IDs when zero.
 * - All dynamic buttons use jQuery UI icon classes.
 */

$(document).ready(function () {
  // Derive and set the network username (uppercase sans domain) See 'User Permissions' above
  var lfUserName = $('.lf-user-name input').val();
  $('.network-user-name input').val(lfUserName.toUpperCase().substr(lfUserName.lastIndexOf('\\') + 1)).change();

  // Hide submit by default; shown only for allowed actions/roles
  $('.Submit').hide();
  $('.Submit').click(function (e) { submitForm(e); });

  // Set document title for the maintenance page
  $(document).prop('title', 'Department Maintenance');

  // Load dependencies (cookie, confirm dialog CSS/JS, jQuery UI theme, pagination CSS)
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simplePagination.js/1.6/simplePagination.min.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');

  // Resolve Bootstrap/jQuery UI button plugin conflict
  var bootstrapButton = $.fn.button.noConflict(); // return $.fn.button to previously assigned value
  $.fn.bootstrapBtn = bootstrapButton;

  // When the text "parent name" field changes, mirror it to the select (edit mode)
  $(document).on('change', '.edit-db-parent-name input', function (e) {
    var editParentName = $('.edit-db-parent-name input').val();
    if (editParentName.length > 0) {
      $('.edit-parent-name select').val(editParentName).change();
    }
  });

  // Persist selected site in a cookie
  $(document).on('change', '.site-name select', function () {
    var sitename = $('.site-name select').val();
    $.cookie('site_name', sitename, { expires: 365, path: '/' });
  });

  // After department table loads, render row-level edit buttons and add the "Add Department" button for admins
  $(document).on('lookupcomplete', function (e) {
    generateTableButtons(".edit-button-col", "ui-icon-pencil", "Edit Department", "callEditDepartment");
    if (isAdminUser()) {
      if ($('.add-button').length == 0) {
        var add_button = '<div class="ui-button add-button" onclick="callAddDepartment()"><span title="Add Department" class="ui-button-icon ui-icon ui-icon-plusthick"></span>Add Department</div>'
        $(add_button).insertBefore('.department-table table');
      }
    }
  });

  // On full load completion, ensure Go Back buttons exist, fire username change, and restore site from cookie
  $(document).on("onloadlookupfinished", function (e) {
    generateGoBackButtons();
    $('.network-user-name input').trigger("change");
    var sitename = $.cookie('site_name');
    if (sitename != null) {
      $('.site-name select').val(sitename).change();
    }
  });

});


/**
 * Hides the Department table and shows the Add Department panel.
 * - Checks the appropriate radio option and sets `.add-department-id` to 1.
 *   This signals the workflow that this is an Add operation. The workflow is a big egg sorter that calls different 
 *   stored procedues based on whether this is an Add or Edit operation.
 * - Shows the submit button.
 */
function callAddDepartment() {
  $(`.action-choice input[type='radio'][value='1']`).prop("checked", true);
  $('.add-department-id input').val(1).change();
  $('.Submit').show();
}


/**
 * Initiates "Edit Department" mode for the given department ID. 
 * This is called from the dynamically-generated buttons that are created in the generateTableButtons() function.
 * - Checks the appropriate radio option and sets `.edit-department-id`.
 *    This signals the workflow that this is an Edit operation. The workflow is a big egg sorter that calls different 
 *    stored procedues based on whether this is an Add or Edit operation.
 * - Shows the submit button only for admin users.
 * @param {number} departmentID The department row ID to edit.
 */
function callEditDepartment(departmentID) {
  $(`.action-choice input[type='radio'][value='2']`).prop("checked", true);
  $('.edit-department-id input').val(departmentID).change();
  if (isAdminUser()) {
    $('.Submit').show();
  }
}


/**
 * Returns to the list (no add/edit), hides the submit button.
 * - Resets `.add-department-id` and `.edit-department-id` to 0.
 *   This hides the add/edit panels and shows the department table.
 *   This is done by use of LaserFiche Field Rules, which show/hide panels based on these values.
 */
function callGoBack() {
  $(".add-department-id input").val(0).change();
  $(".edit-department-id input").val(0).change();
  $('.Submit').hide();
}


/**
 * Converts placeholder `.gobackbutton` elements to functional "Go Back" buttons.
 * Removes the placeholder after injecting the real button.
 * This is done because there is no way to add a button in the LF Forms designer.
 */
function generateGoBackButtons() {
  var $goback_buttons = $(".gobackbutton");
  $goback_buttons.each(function (index) {
    $(this).parent().append("<div id='go-back' class='ui-button ui-corner-all ui-widget' onclick='callGoBack()'><span class='ui-icon ui-icon-arrowreturnthick-1-w'></span>Go Back</div>");
  });
  $(".gobackbutton").remove();
}


/**
 * Creates table action buttons in the specified column.
 * - Reads a value from an adjacent hidden/text input to pass to the click handler.
 * - Ensures only one button per row per `buttonClass`.
 * @param {string} buttonSelector  CSS selector for the column containing the hidden/text value.
 * @param {string} buttonClass     jQuery UI icon class for the button.
 * @param {string} buttonTitle     Tooltip/title for the button.
 * @param {string} buttonFunction  Function name to invoke with the row value.
 */
function generateTableButtons(buttonSelector, buttonClass, buttonTitle, buttonFunction) {
  var selectionString = buttonSelector + " input[type=text]";
  var buttons = $(selectionString);
  buttons.each(function () {
    var btn_value = $(this).val();
    var btn_html = `<div class='table-button ui-button' onclick='${buttonFunction}(${btn_value})'><span title='${buttonTitle}' class='ui-button-icon ui-icon ${buttonClass}' /></div>`

    var has_button = $(this).parent().find(`.${buttonClass}`).length;
    if (has_button == 0) {
      $(this).parent().append(btn_html);
    }
  });
}


/**
 * Determines whether the current user is an administrator.
 * @returns {boolean} True if `.user-isadmin` equals '1'; otherwise false.
 */
function isAdminUser() {
  if ($('.user-isadmin input').val() == '1') {
    return true;
  }
  return false;
}


/**
 * Normalizes parent IDs to 0 when empty before submit.
 * Keeps server-side model binding predictable.
 * @param {Event} e The submit/click event.
 * The reason I have to do this is because the Workflow doesn't handle null integer values very well.
 * This keeps it from erroring out when the parent ID is null.
 * The stored procedure expects a 0 when there is no parent department.
 */
function submitForm(e) {
  var editParentID = Number($('.edit-parent-id input').val());
  var addParentID = Number($('.add-parent-id input').val());
  if (editParentID == 0) {
    $('.edit-parent-id input').val(0);
  }
  if (addParentID == 0) {
    $('.add-parent-id input').val(0);
  }

}