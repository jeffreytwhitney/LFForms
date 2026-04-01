/**
 * ProductionMachines.js
 * ---------------------
 * UI behavior and client-side interaction logic for the Production Machines maintenance screen.
 *
 * Responsibilities:
 * 1. Page initialization (title, styles, scripts, hidden field normalization).
 * 2. Persist and restore selected site via cookie.
 * 3. Manage Add/Edit state for machines (hidden id fields + Submit button visibility).
 * 4. Render pagination controls based on hidden page value (.pg) and table row count.
 * 5. Provide client-side filtering (currently by machine name / ticket number).
 * 6. Dynamically inject action buttons (Edit, Go Back, custom column buttons).
 * 7. Gate administrative actions based on the "Is Admin" hidden field (.user-isadmin).
 *
 * Conventions:
 * - Hidden field wrappers are addressed using class selectors (e.g., ".pg input", ".edit-machine-id input").
 * - Page number sentinel value "999" indicates uninitialized paging.
 * - Machine Add / Edit mode is toggled by radio button group #Field16-(0|1) and corresponding hidden ids.
 * - All DOM mutations that cause server-side refresh invoke .trigger("change") on the hidden input to trigger form logic.
 *
 * Dependencies Loaded Dynamically:
 * - jquery.cookie (persist site)
 * - jquery-confirm (dialog styling; may be used on other pages)
 * - jQuery UI (icons / theming)
 * - simplePagination (CSS only, custom HTML markup for pagination)
 *
 * Security / Permissions:
 * - Admin-only actions guarded by isAdminUser().
 *
 * Extension Points:
 * - generateTableButtons(...) can be reused for any column needing a button icon.
 * - filterTable() can be extended to add more filter criteria (mirror additional fields to hidden inputs before refresh).
 *
 * NOTE: This file assumes the server-side form process reacts to .trigger("change") events by re-querying data.
 */

$(document).ready(function () {
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simplePagination.js/1.6/simplePagination.min.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
  const bootstrapButton = $.fn.button.noConflict(); // return $.fn.button to previously assigned value
  $.fn.bootstrapBtn = bootstrapButton;

  // Normalize and capture the current user into a hidden field.
  const lfUserName = $('.lf-user-name input').val();
  if (lfUserName !== 'Anonymous User') {
    $('.network-user-name input').val(lfUserName.toUpperCase().substr(lfUserName.lastIndexOf('\\') + 1)).trigger("change");
  }

  // Persist selected site name in a cookie for 1 year.
  $(document).on('change', '.site-name select', function () {
    const sitename = $('.site-name select').val();
    $.cookie('site_name', sitename, { expires: 365, path: '/' });
  });

  $('.Submit').hide();
  $('.Submit').on("click", function (e) { submitForm(e); });
  $(document).prop('title', 'Production Machines');

  // Keep radio groups and hidden id fields in sync for "Is Active" and "Is Admin" controls.
  $(document).on('change', '.edit-is-active-value input', function () {
    const isActive = $('.edit-is-active-value input').val();
    $(`.edit-is-active-rdo input[type='radio'][value='${isActive}']`).prop("checked", true);
  });
  $(document).on('change', ".edit-is-active-rdo input[type='radio']", function () {
    const isActive = $(this).val();
    $('.edit-is-active-value input').val(isActive);
  });

  $(document).on("onloadlookupfinished", function () {
    // Initialize paging on first load (pg=999 indicates "uninitialized")
    if ($('.pg input').val() === '999') {
      $('.pg input').val(1).trigger("change");
    }
    generateGoBackButtons();
    generateEditButtons();
    // Restore site selection from cookie if present.
    const sitename = $.cookie('site_name');
    if (sitename !== null) {
      $('.site-name select').val(sitename).trigger("change");
    }
    $('.machine-table').show();
  });

  $(document).on('lookupcomplete', function (e) {
    appendPagination();
    generateFilterRow();
    generateTableButtons(".edit-button-col", "ui-icon-pencil", "Edit User", "callEditProductionMachine");
    $('.machine-table').show();
  });

});


/**
 * Renders pagination controls under the user table based on the current page and row count.
 * - Page size is assumed to be 25.
 * - Disables/enables prev/next arrows accordingly.
 * - No-op when page is the sentinel 999.
 */
function appendPagination() {
  const current_page = Number($('.pg input').val());
  if (current_page === 999) { return; }

  const row_count = getTableRowCount();

  if (row_count > 0) {
    $('#user-pagination').remove();
    if ((current_page === 1) && (row_count < 25)) {
      $('.machine-table table').parent().append("<div id='user-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled'>ï¿½ï¿½</a></li><li><a class='page-link prev isDisabled'>ï¿½</a></li><li><a class='page-link next isDisabled'>ï¿½</a></li></ul></div>");
      return;
    }
    if ((current_page === 1) && (row_count === 25)) {
      $('.machine-table table').parent().append("<div id='user-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled'>ï¿½ï¿½</a></li><li><a class='page-link prev isDisabled'>ï¿½</a></li><li><a class='page-link next' onclick='callNextPage();' href='javascript:void(0);'>ï¿½</a></li></ul></div>")
      return;
    }
    if ((current_page > 1) && (row_count === 25)) {
      $('.machine-table table').parent().append("<div id='user-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev' onclick='resetPageNumber();' href='javascript:void(0);''>ï¿½ï¿½</a></li><li><a class='page-link prev' onclick='callPrevPage();' href='javascript:void(0);''>ï¿½</a></li><li><a class='page-link next' onclick='callNextPage();' href='javascript:void(0);'>ï¿½</a></li></ul></div>")
      return;
    }
    if ((current_page > 1) && (row_count < 25)) {
      $('.machine-table table').parent().append("<div id='user-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev' onclick='resetPageNumber();' href='javascript:void(0);''>ï¿½ï¿½</a></li><li><a class='page-link prev' onclick='callPrevPage();' href='javascript:void(0);''>ï¿½</a></li><li><a class='page-link next isDisabled'>ï¿½</a></li></ul></div>")
      return;
    }
  }
}


/**
 * Enter "Add Machine" mode:
 * - Sets radio #Field16-0 (assumed Add flag) and .add-machine-id to 1.
 * - Reveals Submit button for admin users.
 * Side Effects: Mutates hidden fields and may trigger server refresh via .trigger("change").
 */
function callAddProductionMachine() {
  $("#Field16-0").prop("checked", true).trigger("change");
  $(".add-machine-id input").val(1).trigger("change");
  if (isAdminUser()) {
    $('.Submit').show();
  }
}


/**
 * Enter "Edit Machine" mode for a specific machine id.
 * @param {number|string} machine_id - Identifier of machine to edit.
 * Side Effects: Sets radio #Field16-1, populates .edit-machine-id, shows Submit when admin.
 */
function callEditProductionMachine(machine_id) {
  $("#Field16-1").prop("checked", true).trigger("change");
  $(".edit-machine-id input").val(machine_id).trigger("change");
  if (isAdminUser()) {
    $('.Submit').show();
  }
}


/**
 * Resets Add/Edit state and hides the Submit button.
 * - Clears .add-machine-id and .edit-machine-id hidden values to 0.
 * Side Effects: Hides .Submit.
 */
function callGoBack() {
  $(".add-machine-id input").val(0).trigger("change");
  $(".edit-machine-id input").val(0).trigger("change");
  $('.Submit').hide();
}


/**
 * Goes to the next page of results.
 * - Hides table for refresh.
 * - Clears existing table action buttons.
 * - Increments .pg hidden field.
 * Preconditions: .pg must hold a numeric current page.
 * Side Effects: Triggers data reload (server-side) via .trigger("change").
 */
function callNextPage() {
  $('.machine-table').hide();
  $('.table-button').remove();
  current_page = Number($('.pg input').val());
  $('.pg input').val(current_page + 1).trigger("change");
}


/**
 * Goes to the previous page of results (no-op if already page 1).
 * - Hides table for refresh.
 * - Clears existing table action buttons.
 * Side Effects: Decrements .pg and triggers server refresh via .trigger("change").
 */
function callPrevPage() {
  $('.machine-table').hide();
  $('.table-button').remove();
  current_page = Number($('.pg input').val());
  if (current_page === 1) {
    return;
  }
  $('.pg input').val(current_page - 1).trigger("change");
}


/**
 * Applies table filters based on header controls:
 * - Machine name / ticket number text box (#txtFilter_TicketNumber) mirrored to .fmname hidden input.
 * - Resets page to 1 and triggers refresh.
 * Guards: Returns early if filter row not yet generated.
 * Side Effects: Mutates hidden inputs, resets pagination, hides table (awaiting refresh).
 */
function filterTable() {
  if ($('#filterRow').length === 0) {
    return;
  }

  $('.fmname input').val($('#txtFilter_TicketNumber').val()).trigger("change");
  $('.machine-table').hide();
  $('.table-button').remove();
  $('.pg input').val(1).trigger("change");
}


/**
 * Ensures the filter row and related controls exist/wired:
 * - Adds filter row with machine/ticket text input if not present.
 * - Wires change and dblclick (clear) events.
 * - Adds "Add Machine" button for admin users.
 * Side Effects: Mutates DOM (thead + optional button insertion).
 */
function generateFilterRow() {
  if ($('#filterRow').length === 0) {
    const filter_row = "<TR id='filterRow'><TH/><TH><input type='text' id='txtFilter_TicketNumber'></TH><TH/><TH/>"
    $('.machine-table table thead').append(filter_row);
    $("#txtFilter_TicketNumber").on("change", function () { filterTable(); });
    $("#txtFilter_TicketNumber").on("dblclick", function () { $("#txtFilter_TicketNumber").val(null).trigger("change"); });
  }

  if (isAdminUser()) {
    if ($('.add-button').length === 0) {
      const add_button = '<div class="ui-button add-button" onclick="callAddProductionMachine()"><span title="Add Machine" class="ui-button-icon ui-icon ui-icon-plusthick"></span>Add Machine</div>'
      $(add_button).insertBefore('.machine-table table');
    }
  }
}


/**
 * Injects "Edit" buttons into rows that have an .edit-button input.
 * Only adds buttons for admin users.
 * Side Effects: Appends <input.table-button> elements with onclick handlers calling callEditMachine().
 * NOTE: Uses callEditMachine(...) (assumed globally defined elsewhere).
 */
function generateEditButtons() {
  $('.table-button').remove();
  const edit_buttons = $(".edit-button input[type=text]");
  edit_buttons.each(function (index) {
    const btn_value = $(this).val();
    if (isAdminUser()) {
      $(this).parent().append("<input class='table-button' type='button' value='Edit' onclick='callEditMachine(" + btn_value + ")' />");
    }
  });
}


/**
 * Replaces any element with class .gobackbutton with a standardized "Go Back" button.
 * Side Effects: DOM replacement; new button triggers callGoBack().
 */
function generateGoBackButtons() {
  const $goback_buttons = $(".gobackbutton");
  $goback_buttons.each(function (index) {
    $(this).replaceWith("<input class='return' type='button' value='Go Back' onclick='callGoBack()' />");
  });
}


/**
 * Render a button-like div with an icon for each row in a given column.
 * @param {string} buttonSelector - Column selector (e.g., ".tasklist-note-col").
 * @param {string} buttonClass - jQuery UI icon CSS class to apply (e.g., "ui-icon-clock").
 * @param {string} buttonTitle - Tooltip for the icon/button.
 * @param {string} buttonFunction - Global function name to call on click.
 * @param {boolean} [isArgNumeric] - Whether the argument value is numeric (no quotes). Defaults to false.
 * Side Effects: Appends clickable div elements with icon spans.
 * Guard: Will not duplicate a button if an element with icon class already exists in the cell.
 */
function generateTableButtons(buttonSelector, buttonClass, buttonTitle, buttonFunction, isArgNumeric) {
  let btn_html
  const selectionString = buttonSelector + " input[type=text]";
  const buttons = $(selectionString);
  buttons.each(function () {
    const btn_value = $(this).val();
    if (isArgNumeric) {
      btn_html = `<div class='table-button ui-button' onclick='${buttonFunction}(${btn_value})'><span title='${buttonTitle}' class='ui-button-icon ui-icon ${buttonClass}'/></div>`
    }
    else {
      btn_html = `<div class='table-button ui-button' onclick='${buttonFunction}("${btn_value}")'><span title='${buttonTitle}' class='ui-button-icon ui-icon ${buttonClass}'/></div>`
    }

    const has_button = $(this).parent().find(`.${buttonClass}`).length;
    if (has_button === 0) {
      $(this).parent().append(btn_html);
    }
  });
}


/**
 * Get the number of data rows currently present in the machine table body.
 * @returns {number} Count of <tr> elements under .machine-table tbody.
 */
function getTableRowCount() {
  const row_count = $('.machine-table table tbody tr').length;
  return row_count;
}


/**
 * Determine whether current user is an admin.
 * @returns {boolean} True when the hidden .user-isadmin input has value '1'.
 */
function isAdminUser() {
  if ($('.user-isadmin input').val() === '1') {
    return true;
  }
  return false;
}


function resetPageNumber() {
  $('.pg input').val(1).trigger("change");
}


/**
* Centralized submit handler for the page.
* - Reads the selected action (Add or Edit)
* - Runs the appropriate validation routine
* - Prevents submit when validation fails
* @param {JQuery.Event} e - Click/submit event.
*/
function submitForm(e) {
  const actionID = Number($('.action-choice input[type="radio"]:checked').val());
  if (actionID === 1) {
    if (validateAdd() !== true) {
      e.preventDefault();
      return;
    }
  }
  if (actionID === 2) {
    if (validateEdit() !== true) {
      e.preventDefault();
      return;
    }
  }

}


/**
 * Validates Add User:
 * - Prevents adding a new ACTIVE user when another ACTIVE user with the same network username exists.
 * - Displays an inline parsley-style error near the network username field.
 * @returns {boolean} True when valid; false otherwise.
 */
function validateAdd() {
  $('#existing-machine-error').remove();
  const addMachineCount = $('.add-existing-machine-names select option').length;
  const addMachineNameField = $('.add-machine-name input');
  if (addMachineCount > 1) {
    addMachineNameField.parent().append("<ul id='existing-machine-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>There is another production machine with this name.</li></ul>");
    return false;
  }
  else {
    return true;
  }
}


/**
 * Validates Edit User:
 * - Prevents saving when another ACTIVE user exists with the same network username (different user id).
 * - Displays an inline parsley-style error near the network username field.
 * @returns {boolean} True when valid; false otherwise.
 */
function validateEdit() {
  $('#existing-machine-error').remove();
  let returnValue = true;
  const editMachineNameField = $('.edit-machine-name input');
  const editMachineID = Number($('.edit-machine-id input').val());
  const existingMachineIDs = $('.edit-existing-machine-names select option');

  $(existingMachineIDs).each(function (index) {
    const existingMachineID = Number($(this).val());
    if (existingMachineID === 0) {
      return;
    }
    if (existingMachineID !== editMachineID) {
      editMachineNameField.parent().append("<ul id='existing-machine-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>There is another production machine with this name.</li></ul>");
      returnValue = false;
    }
  });
  return returnValue;
}
