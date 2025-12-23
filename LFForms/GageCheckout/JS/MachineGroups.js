/**
 * @fileoverview Machine Group Maintenance Module
 * 
 * This module provides client-side functionality for managing machine groups,
 * including CRUD operations, department associations, user permissions, and
 * dynamic UI generation based on user roles.
 * 
 * @author Jeffrey T. Whitney
 * @version 1.0
 * 
 * @requires jQuery
 * @requires jQuery Cookie (v1.4.1) - Loaded dynamically from CDN
 * @requires jQuery Confirm (v3.3.2) - Loaded dynamically from CDN
 * @requires jQuery UI (v1.13.3) - Loaded dynamically from CDN
 * @requires Bootstrap - For button components
 * 
 * @description
 * Key Features:
 * - Add/Edit machine groups with department associations
 * - Permission-based UI controls (admin vs. regular users)
 * - Two-way data binding between hidden fields and visible controls
 * - Department mapping for ID/name conversion
 * - Dynamic button generation based on user permissions
 * 
 * Custom Events:
 * - 'onloadlookupfinished': Fired when initial lookup data is loaded
 * - 'lookupcomplete': Fired when all lookup operations complete
 * 
 * Expected HTML Structure:
 * - Form fields with specific CSS classes (see function documentation)
 * - Machine group table with .machinegroup-table class
 * - Department lookup table with .department-lookup-table class
 * - User information fields (.user-employee-number, .user-isactive)
 */

/**
 * Global map storing department ID to department name mappings.
 * Populated by loadDepartmentMap() function.
 * @type {Map<number, string>}
 * @example departmentMap.get(5) // Returns "Engineering"
 */
var departmentMap = new Map();

/**
 * Global map storing department name to department ID mappings.
 * Reverse lookup of departmentMap for efficient bidirectional conversion.
 * Populated by loadDepartmentMap() function.
 * @type {Map<string, number>}
 * @example departmentNameMap.get("Engineering") // Returns 5
 */
var departmentNameMap = new Map();

/**
 * Document ready handler - Initializes the Machine Group Maintenance interface.
 * 
 * Initialization sequence:
 * 1. Loads external dependencies (jQuery Cookie, jQuery Confirm)
 * 2. Injects required CSS stylesheets
 * 3. Resolves Bootstrap/jQuery UI button conflicts
 * 4. Sets up form submission handlers
 * 5. Configures page title
 * 6. Wires up change event handlers for form synchronization
 * 7. Registers custom event listeners
 */
$(document).ready(function () {
  // Load external JavaScript dependencies from CDN
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');

  // Inject required CSS stylesheets
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');

  // Resolve Bootstrap/jQuery UI button conflict
  var bootstrapButton = $.fn.button.noConflict(); // return $.fn.button to previously assigned value
  $.fn.bootstrapBtn = bootstrapButton;


  $('.Submit').click(function (e) { validateForm(e); });
  $('.Submit').hide();

  $(document).prop('title', 'Machine Group Maintenance');

  wireUpChangeEvents();


  /**
   * Event handler for 'onloadlookupfinished' - Fired when initial lookup data is loaded.
   * Generates UI controls and displays the machine group table.
   */
  $(document).on("onloadlookupfinished", function () {
    generateAddButton();      // Create "Add Machine Group" button if user has permissions
    generateGoBackButtons();  // Create "Go Back" navigation buttons
    generateEditButtons();    // Create "Edit" buttons for each machine group row
    $('.machinegroup-table').show();
  });

  /**
   * Event handler for 'lookupcomplete' - Fired when all lookup operations complete.
   * Loads reference data and transforms field values for display.
   */
  $(document).on('lookupcomplete', function (e) {
    loadDepartmentMap();                // Populate department ID/name mappings
    changeNumericToYesNo('Field36');    // Convert active status from 0/1 to Yes/No
    $('.machinegroup-table').show();
  });

});


/**
 * Initiates the "Add Machine Group" workflow.
 * 
 * Sets the form to add mode and displays the submit button.
 * Called when the user clicks the "Add Machine Group" button.
 * 
 * @function callAddMachineGroup
 * @returns {void}
 * 
 * @description
 * Actions performed:
 * 1. Sets Field9-1 to checked (indicates add mode)
 * 2. Sets add-machinegroup-id to 1 (default new ID)
 * 3. Shows the submit button
 * 
 * @example
 * // Called via onclick handler in generated button
 * callAddMachineGroup();
 */
function callAddMachineGroup() {
  $("#Field9-1").prop("checked", true).change();  // Set form to add mode
  $(".add-machinegroup-id input").val(1).change(); // Initialize ID
  $('.Submit').show();  // Display submit button
}


/**
 * Initiates the "Edit Machine Group" workflow for a specific machine group.
 * 
 * Sets the form to edit mode, loads the specified machine group ID, and displays the submit button.
 * Called when the user clicks an "Edit" button next to a machine group in the table.
 * 
 * @function callEditMachineGroup
 * @param {number} machinegroup_id - The ID of the machine group to edit
 * @returns {void}
 * 
 * @description
 * Actions performed:
 * 1. Sets Field9-0 to checked (indicates edit mode)
 * 2. Populates edit-machinegroup-id with the specified ID
 * 3. Shows the submit button
 * 4. Triggers change events to load existing data into the form
 * 
 * @example
 * // Edit machine group with ID 42
 * callEditMachineGroup(42);
 */
function callEditMachineGroup(machinegroup_id) {
  $("#Field9-0").prop("checked", true).change();  // Set form to edit mode
  $(".edit-machinegroup-id input").val(machinegroup_id).change();  // Load machine group ID
  $('.Submit').show();  // Display submit button
}


/**
 * Converts numeric boolean values (0/1) to human-readable "Yes/No" strings.
 * 
 * Finds all fields matching the selector pattern and converts their values
 * for improved readability in the UI.
 * 
 * @function changeNumericToYesNo
 * @param {string} selector - CSS selector prefix for fields to convert (e.g., 'Field36')
 * @returns {void}
 * 
 * @description
 * Conversion rules:
 * - '1' or 'Yes' → 'Yes'
 * - Any other value → 'No'
 * 
 * Uses attribute starts-with selector to find all matching fields.
 * 
 * @example
 * // Convert all Field36 variants to Yes/No
 * changeNumericToYesNo('Field36');
 * // Field36-1, Field36-2, etc. will all be converted
 */
function changeNumericToYesNo(selector) {
  var isactive = $(`[id^='${selector}']`);  // Find all fields starting with selector
  isactive.each(function (index) {
    var isactive_value = $(this).val();
    if ((isactive_value === '1') || (isactive_value === 'Yes')) {
      $(this).val('Yes');
    }
    else {
      $(this).val('No');
    }
  });
}


/**
 * Validates whether the current user has administrative permissions.
 * 
 * Checks user active status and employee number to determine if the user
 * should have access to administrative functions (Add/Edit machine groups).
 * 
 * @function checkPermissions
 * @returns {boolean} true if user has valid permissions, false otherwise
 * 
 * @description
 * Validation rules:
 * 1. User must be active (is_user_active == 1)
 * 2. Employee number must not be empty
 * 
 * Data sources:
 * - .user-employee-number input: Current user's employee number
 * - .user-isactive input: Current user's active status (1 = active, 0 = inactive)
 * 
 * @security
 * NOTE: This is client-side validation only. Server-side authorization
 * should also be implemented to prevent unauthorized access.
 * 
 * @example
 * if (checkPermissions()) {
 *   // Show admin controls
 *   generateAddButton();
 * }
 */
function checkPermissions() {
  var employee_number = $(".user-employee-number input").val();
  var is_user_active = Number($(".user-isactive input").val());
  var return_val = true;

  // Check if user is active
  if (is_user_active == 0) {
    return_val = false;
  }

  // Check if employee number exists
  if (employee_number === '') {
    return_val = false;
  }

  return return_val;
}


/**
 * Dynamically generates the "Add Machine Group" button based on user permissions.
 * 
 * Replaces placeholder .addbutton elements with functional buttons if the user
 * has administrative permissions, otherwise removes the placeholders.
 * 
 * @function generateAddButton
 * @returns {void}
 * 
 * @description
 * Behavior:
 * - If user has permissions: Creates clickable "Add Machine Group" button
 * - If user lacks permissions: Removes button placeholder
 * 
 * Generated button HTML:
 * <input class='return' style='visibility:visible' type='button' 
 *        value='Add Machine Group' onclick='callAddMachineGroup()' />
 * 
 * @requires checkPermissions - To validate user permissions
 * @see callAddMachineGroup
 * 
 * @example
 * // Called during initialization after lookup data loads
 * generateAddButton();
 */
function generateAddButton() {
  var add_buttons = $(".addbutton");
  var is_admin = checkPermissions();

  add_buttons.each(function (index) {
    if (is_admin) {
      // Replace placeholder with functional button
      $(this).replaceWith("<input class='return' style='visibilty:visible' type='button' value='Add Machine Group' onclick='callAddMachineGroup()' />");
    }
    else {
      // Remove placeholder for non-admin users
      $(this).replaceWith("");
    }
  });
}


/**
 * Creates "Edit" buttons for each machine group row in the table.
 * 
 * Dynamically generates edit buttons next to each machine group if the user
 * has administrative permissions. Each button is bound to the specific machine group ID.
 * 
 * @function generateEditButtons
 * @returns {void}
 * 
 * @description
 * Process:
 * 1. Removes any existing .table-button elements (cleanup)
 * 2. Checks user permissions
 * 3. For each machine group row, appends an "Edit" button with the machine group ID
 * 
 * Generated button HTML:
 * <input class='table-button' type='button' value='Edit' 
 *        onclick='callEditMachineGroup(123)' />
 * 
 * Target elements:
 * - .edit-button input[type=text]: Contains the machine group ID value
 * 
 * @requires checkPermissions - To validate user permissions
 * @see callEditMachineGroup
 * 
 * @example
 * // Called during initialization and when table is refreshed
 * generateEditButtons();
 */
function generateEditButtons() {
  var is_admin = checkPermissions();
  $('.table-button').remove();  // Clean up existing buttons
  var edit_buttons = $(".edit-button input[type=text]");

  edit_buttons.each(function (index) {
    var btn_value = $(this).val();  // Machine group ID
    if (is_admin) {
      // Append edit button with machine group ID
      $(this).parent().append("<input class='table-button' type='button' value='Edit' onclick='callEditMachineGroup(" + btn_value + ")' />");
    }
  });
}



/**
 * Creates "Go Back" navigation buttons.
 * 
 * Replaces placeholder .gobackbutton elements with functional navigation buttons
 * that return the user to the main machine group list view.
 * 
 * @function generateGoBackButtons
 * @returns {void}
 * 
 * @description
 * Generated button HTML:
 * <input class='return' type='button' value='Go Back' onclick='goBack()' />
 * 
 * @see goBack
 * 
 * @example
 * // Called during initialization
 * generateGoBackButtons();
 */
function generateGoBackButtons() {
  var $goback_buttons = $(".gobackbutton");
  $goback_buttons.each(function (index) {
    // Replace placeholder with functional Go Back button
    $(this).replaceWith("<input class='return' type='button' value='Go Back' onclick='goBack()' />");
  });
}


/**
 * Returns to the main machine group list view, canceling any add/edit operation.
 * 
 * Clears form state and hides the submit button, effectively canceling
 * the current add or edit operation.
 * 
 * @function goBack
 * @returns {void}
 * 
 * @description
 * Actions performed:
 * 1. Clears the edit machine group ID field
 * 2. Clears the add machine group ID field
 * 3. Hides the submit button
 * 4. Triggers change events to reset form state
 * 
 * @example
 * // Called when user clicks "Go Back" button
 * goBack();
 */
function goBack() {
  $(".edit-machinegroup-id input").val("").change();  // Clear edit ID
  $(".add-machinegroup-id input").val("").change();   // Clear add ID
  $('.Submit').hide();  // Hide submit button
}


/**
 * Populates the department mapping objects from the department lookup table.
 * 
 * Extracts department ID and name pairs from the HTML table and creates
 * bidirectional mappings for efficient ID/name conversion.
 * 
 * @function loadDepartmentMap
 * @returns {void}
 * 
 * @description
 * Process:
 * 1. Checks if departmentMap is already populated (avoids redundant loading)
 * 2. Finds all rows in .department-lookup-table
 * 3. Extracts department ID and name from each row
 * 4. Populates both departmentMap (ID → name) and departmentNameMap (name → ID)
 * 
 * Data sources:
 * - .department-lookup-table-id input: Department ID
 * - .department-lookup-table-name input: Department name
 * 
 * @modifies departmentMap - Populated with ID to name mappings
 * @modifies departmentNameMap - Populated with name to ID mappings
 * 
 * @example
 * loadDepartmentMap();
 * // departmentMap: {1: "Engineering", 2: "Production", ...}
 * // departmentNameMap: {"Engineering": 1, "Production": 2, ...}
 */
function loadDepartmentMap() {
  if (departmentMap.keys.length == 0) {  // Only load if not already populated
    var department_rows = $('.department-lookup-table table tbody tr');
    if (department_rows.length == 0) {
      return;  // No data available
    }

    // Extract and map department data
    department_rows.each(function (index) {
      departmentID = Number($(this).find('.department-lookup-table-id input').val());
      departmentName = $(this).find('.department-lookup-table-name input').val();
      departmentMap.set(departmentID, departmentName);        // ID → Name
      departmentNameMap.set(departmentName, departmentID);    // Name → ID
    });
  }
}



/**
 * Establishes two-way data binding between hidden form fields and visible UI controls.
 * 
 * Creates change event handlers that synchronize values between hidden input fields
 * (used for form submission) and visible dropdown/combo boxes (used for user interaction).
 * 
 * @function wireUpChangeEvents
 * @returns {void}
 * 
 * @description
 * Synchronized field pairs:
 * 
 * EDIT MODE:
 * - Active Status: .edit-isactive-value ↔ .edit-isactive-combo
 * - Department: .edit-department-id ↔ .edit-department-combo (uses departmentMap)
 * - Weekday: .edit-weekday-value ↔ .edit-weekday-combo
 * 
 * ADD MODE:
 * - Department: .add-department-id ↔ .add-department-combo (uses departmentMap)
 * - Weekday: .add-weekday-value ↔ .add-weekday-combo
 * 
 * Data flow example:
 * User selects "Engineering" from dropdown
 *   → Change event fires on .edit-department-combo
 *   → departmentNameMap.get("Engineering") returns 5
 *   → .edit-department-id value set to 5
 * 
 * @requires departmentMap - For ID to name conversion
 * @requires departmentNameMap - For name to ID conversion
 * 
 * @note This function should be called during initialization before user interaction.
 * 
 * @example
 * // Called in document ready handler
 * wireUpChangeEvents();
 */
function wireUpChangeEvents() {
  // EDIT MODE - Active Status synchronization
  $('.edit-isactive-value input').change(function () {
    $('.edit-isactive-combo select').val(Number($('.edit-isactive-value input').val()));
  });
  $('.edit-isactive-combo select').change(function () {
    $('.edit-isactive-value input').val(Number($('.edit-isactive-combo select').val()));
  });

  // EDIT MODE - Department synchronization (with name/ID conversion)
  $('.edit-department-combo select').change(function () {
    let departmentID = departmentNameMap.get($('.edit-department-combo select').val());
    $('.edit-department-id input').val(departmentID);
  });
  $('.edit-department-id input').change(function () {
    let departmentName = departmentMap.get(Number($('.edit-department-id input').val()));
    $('.edit-department-combo select').val(departmentName);
  });

  // ADD MODE - Department synchronization (with name/ID conversion)
  $('.add-department-combo select').change(function () {
    let departmentID = departmentNameMap.get($('.add-department-combo select').val());
    $('.add-department-id input').val(departmentID);
  });
  $('.add-department-id input').change(function () {
    let departmentName = departmentMap.get(Number($('.add-department-id input').val()));
    $('.add-department-combo select').val(departmentName);
  });

  // EDIT MODE - Weekday synchronization
  $('.edit-weekday-value input').change(function () {
    $('.edit-weekday-combo select').val(Number($('.edit-weekday-value input').val()));
  });
  $('.edit-weekday-combo select').change(function () {
    $('.edit-weekday-value input').val(Number($('.edit-weekday-combo select').val()));
  });

  // ADD MODE - Weekday synchronization
  $('.add-weekday-value input').change(function () {
    $('.add-weekday-combo select').val(Number($('.add-weekday-value input').val()));
  });
  $('.add-weekday-combo select').change(function () {
    $('.add-weekday-value input').val(Number($('.add-weekday-combo select').val()));
  });
}