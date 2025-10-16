/*# AddProgrammingTicket.js — Documentation

 Author:  Jeffrey Whitney
          jtwhitney@machine.com
          651-319-7982
 Date:    9/29/2025


Purpose
  Implements client-side behavior for the “Add Programming Ticket” form in LFForms/MPM-ProgrammingTickets.
  Handles UI initialization, dynamic task row operations, validation, bulk task generation, and form submission.
  The intent is to allow users to add multiple programming tasks efficiently, with validation to prevent duplicates and 
  ensure required fields are filled.

Permissions:
  Metrology users (user-type-id == 1) can add tickets regardless of department.
  QE users (user-type-id == 2) can add tickets only for their own department.
  If a QE user is adding tickets, the department and quality engineer fields are defaulted to their values and disabled.

Key Concepts:
    Dialog Looping Mechanism:
     The form is called as a popup dialog from other pages, and it communicates with the parent window to close the dialog and refresh the parent 
     page after this page is submitted.
     This loop is essential to understand because it's a common pattern that you will see again and again in any form which is being used as a popup. 
     This form is one of those. The way it works is when this page loads initially, the $('.closeme input') is not provided from the query string, 
     and so is set to the default value of 0.
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

    Mapping:
     Task types are stored both as ID?Name and Name?ID because LFF only stores the display value in the select, for example, the TaskType
     select shows the names of the task types, but we are storing the TaskTypeID in a the database, so we need to have a way to 
     figure out what the TaskTypeID is so that we can set the value of the hidden field that the workflow is going to use to 
     set the value in the task table. So we need to be able to look up the ID by name when the user selects a task type.
     The only way I've been able to figure out how to do this is to have a hidden lookup table on the page which contains all of the 
     task types and their IDs. So when the page loads, we read that table and build two maps: one for ID?Name and one for Name?ID.
     When the user selects a task type, we look up the ID by name and set the value of the hidden field.



Dependencies
  jQuery
  jQuery UI (Smoothness theme)
  jquery-confirm (CSS/JS)
  simplePagination.css (CSS)
  Relies on Parsley-style CSS classes for error styling (e.g., parsley-error).
  The parsley validation is something that LFForms uses natively. This just piggybacks on that by adding and removing the same classes.


Key DOM Structure (expected selectors)
  
   Hidden state fields:                 Notes:
    .closeme input                      See Dialog Looping Mechanism above
    .lf-username input                  Populated by LFF with CRETEX\username (see User Permissions above)
    .network-user-name input            Username portion only, uppercased (see User Permissions above)
    .user-type-id input                 User type ID (1=Metrology, 2=QE, 3=Not Authenticated)
    .user-department-name input         This is set on lookup. It is the department name of the user. Is only used when the user is QE 
                                        (user-type-id == 2). In that case, the department select is defaulted to this value and disabled.
    .user-employee-name input           Same thing as above. This is the name of the user. It is used to default the quality engineer field if the user is a QE.
  
   Ticket section fields                Notes:
    
    .department select                  The department of the tasks being added. If the user is QE, this is defaulted to their department and disabled.
    .quality-engineer select            The quality engineer for the tasks being added. If the user is QE, this is defaulted to their name and disabled.

  Task list table (.tasklist-table):
    Here the user can add multiple tasks, one at a time. The user can also clone an existing row to make it easier to add similar tasks.
    If they want to generate a large number of tasks, they can click the GenerateTasks button to open the task generation panel.

    COLUMNS:                            NOTES:
    .clone-col                          This column has a hidden input with the row number. Because the id isn't coming from the database, it is being 
                                        set by calling the generateTaskRowNumbers function. A button is added next to it to clone the row, so that 
                                        when CloneRow is called, it knows which row to clone.
    .task-name-col input
    .drawing-number-col input
    .task-type-col select
    .task-type-id-col input             Hidden. Set when the user selects a task type from the select. The task type select only has the name, not the ID, so we LFF look up the ID.
    .due-date-col input
    .op-number-col input
    .rev-number-col input
    .error-message input                This is typically empty, but if there is a validation error for the row, the error message is put in here.
    #q28                                This is the "Add" link which is generated by LFF. We hook into the click event to refresh the row numbers and add buttons.   


  Generation panel:    
   Fields                                       Notes:
    .show-generate-tasks input                  When set to 1, shows the task generation panel and hides the Task List Table and the submit button.
    #show-generate-tasks                        There are no buttons in LFF so we have to create our own. Placeholder for the GenerateTasks button.           
    .part-numbers-to-generate textarea
    .task-types-to-generate-table-name input
    .task-types-to-generate-table-id input
    .op-number-to-generate input
    .gen-drawing-number input
    .gen-due-date input
    .gen-rev-number input
    .execute-task-generation
    .gobackbutton                               There are no buttons in LFF so we have to create our own. This is a placeholder that gets replaced with a button.

  Lookup table:
    .task-type-lookup-table table has rows for each task type id and name.

  On lookupcomplete:
    loadTaskTypeMap() from lookup table.
    For userTypeID 3: default department and quality engineer fields and disable them.
    generateTaskRowNumbers() and add row action buttons (generateTableButtons).

  On onloadlookupfinished:
    Set .closeme input to 1, add hidden #popUpDiv.
    Trigger network user name change.
    Add “Go Back” and “GenerateTasks” buttons, wire up due date error clearing.
  On #q28 click: refresh row numbers and buttons (helps after dynamic table refreshes).

*/

var taskTypeMap = new Map();
var taskTypeByNameMap = new Map();

/*Document ready handler
  Description: Initializes the page, loads UI assets, binds event handlers, and performs role-based defaulting.
  Side effects:
    Sets document title.
    Loads jquery-confirm JS and relevant CSS files (jQuery UI theme, pagination CSS, confirm CSS).
    Resolves Bootstrap/jQuery UI button conflict with $.fn.button.noConflict().
    If .closeme input equals 1, posts CloseDialogWithRefresh to parent window.
    Binds .Submit click ? submitForm.
    Uppercases user-related inputs:
      Copies network username from .lf-username to .network-user-name uppercased, without domain.
      Uppercases .task-name-col input on keyup.
      Uppercases .manf-rev input on change.
*/
$(document).ready(function () {

  $(document).prop('title', 'Add Programming Ticket');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simplePagination.js/1.6/simplePagination.min.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
  var bootstrapButton = $.fn.button.noConflict(); // return $.fn.button to previously assigned value so that popup close button displays correctly.
  $.fn.bootstrapBtn = bootstrapButton;

  if ($('.closeme input').val() == 1) {
    window.parent.postMessage('CloseDialogWithRefresh', '*');
  }


  $('.Submit').click(function (e) { submitForm(e); });
  $('.network-user-name input').val($('.lf-username input').val().toUpperCase().substr($('.lf-username input').val().lastIndexOf('\\') + 1)).change();
  $('.task-name-col input').keyup(function () { this.value = this.value.toLocaleUpperCase(); });
  $('.manf-rev input').change(function () { $('.manf-rev input').val($('.manf-rev input').val().toUpperCase()); });

  /**
   * On change of .task-type-col select, looks up TaskTypeID via taskTypeByNameMap and writes it to .task-type-id-col input.
   */
  $(document).on('change', '.task-type-col select', function (e) {
    var taskName = $(this).val();
    var taskID = taskTypeByNameMap.get(taskName);
    $(this).closest('tr').find('.task-type-id-col input').val(taskID);
  });

  /**
   * Calls loadTaskTypeMap(). 
     For userTypeID === 3, defaults and disables .department select and .quality-engineer select when empty.
     Calls generateTaskRowNumbers() and generateTableButtons(".clone-col", "ui-icon-newwin", "Clone Task", "cloneRow").
   */
  $(document).on('lookupcomplete', function (e) {
    loadTaskTypeMap();

    var userTypeID = Number($('.user-type-id input').val());
    if ((userTypeID == 3) && ($('.department select option').length > 1)) {
      if ($('.department select').val() == '') {
        let userDepartmentName = $('.user-department-name input').val();
        $('.department select').val(userDepartmentName).change();
        $('.department select').addClass('ui-state-disabled');
      }
    }

    if ((userTypeID == 3) && ($('.quality-engineer select option').length > 1)) {
      if ($('.quality-engineer select').val() == '') {
        let userQEName = $('.user-employee-name input').val();
        $('.quality-engineer select').val(userQEName).change();
        $('.quality-engineer select').addClass('ui-state-disabled');
      }
    }
    generateTaskRowNumbers();
    generateTableButtons(".clone-col", "ui-icon-newwin", "Clone Task", "cloneRow");

  });

  /**
   * Sets .closeme input to 1.
      Injects a hidden #popUpDiv.
      Triggers .network-user-name input change.
      Calls generateGoBackButtons(), createShowGenerateButton(), and createExecuteTaskGenerationButton().
      Wires due date change to clear parsley errors.
   */
  $(document).on("onloadlookupfinished", function (e) {
    $('.closeme input').val(1);
    $('#q0').append("<div class='hidden-text' id='popUpDiv'></div>");
    $('.network-user-name input').trigger("change");
    generateGoBackButtons();
    createShowGenerateButton();
    createExecuteTaskGenerationButton();
    $('.gen-due-date input').on('change', function () {
      if ($('.gen-due-date input').val() != '') {
        $('#empty-due-date-error').remove();
        $('.gen-due-date input').removeClass('parsley-error');
      }
    });
  });

  /**
   * When the "Add" link gets clicked, LFF adds a row in the LFF code. I'm not privy to that code so I have to respond
   * instead to the click of that link. This re-runs row numbering and re-does the table buttons.
   */
  $(document).on('click', '#q28', function (e) {
    generateTaskRowNumbers();
    generateTableButtons(".clone-col", "ui-icon-newwin", "Clone Task", "cloneRow");
  });

});


/**
   - Description: Replaces any `.execute-task-generation` placeholder with an `<input type="button">` labeled “GenerateTasks” that calls `generateTasks()`.
     LFF doesn't provide buttons, so we have to create our own.
   - Side effects: DOM replacement.
 */
function createExecuteTaskGenerationButton() {
  var add_buttons = $(".execute-task-generation");
  add_buttons.each(function (index) {
    $(this).replaceWith("<input class='return' style='visibilty:visible' type='button' value='GenerateTasks' onclick='generateTasks()' />");
  });
}


/**
 * Description: Hides the main form and shows the task generation panel, clearing all generation inputs.
   Side effects:
      - Hides `.Submit`.
      - Clears `.gen-drawing-number`, `.gen-due-date`, `.gen-rev-number`, and `.part-numbers-to-generate`.
      - Clears `.op-number-to-generate` and `.task-types-to-generate-table-name`.
      - Deletes all but the first rows in `.task-types-to-generate-table` and `.op-numbers-table` via `.cf-table-delete`.
      - Sets `.show-generate-tasks input` to `1` and triggers change. This is actually what shows and hides stuff because there is a LFF rule bound to that field.
 */
function callShowGenerateTasks() {

  $('.Submit').hide();
  $('.gen-drawing-number input').val('');

  $('.task-types-to-generate-table .cf-table-delete:visible').trigger('click');
  $('.op-numbers-table .cf-table-delete:visible').trigger('click');

  $('.task-types-to-generate-table tbody tr').each(function (index) {
    if (index > 0) {
      var deleteLink = $(this).find('.cf-table-delete');
      deleteLink.trigger('click');
    }
  });

  $('.op-numbers-table tbody tr').each(function (index) {
    if (index > 0) {
      var deleteLink = $(this).find('.cf-table-delete');
      deleteLink.trigger('click');
    }
  });

  $('.op-number-to-generate input').val('');
  $('.task-types-to-generate-table-name input').val('');


  $('.gen-drawing-number input').val('');
  $('.gen-due-date input').val('');
  $('.gen-rev-number input').val('');
  $('.part-numbers-to-generate textarea').text('');

  $('.show-generate-tasks input').val(1).change();
}


/*
 Sets the value of .show-generate-tasks input to null and triggers change. 
 This hides the task generation panel and shows the main form again.
 This works because there is a LFF rule bound to that field which shows and hides stuff.
*/
function callGoBack() {
  $(".show-generate-tasks input").val(null).change();
  $('.Submit').show();
}


/**
 * Description: Clones values from the task row whose .clone-col input equals cloneRowID into the last row (adding a row if necessary).
  Parameters:
      cloneRowID  : 1-based row identifier stored in   .clone-col input  .
  Behavior:
    If the last row is not empty, triggers .cf-table-add-row which is a LFF-generated link.
    Copies values for task name, drawing number, task type (text), task type ID, due date, op number, rev number into the last row.
  Side effects: Mutates table rows.
 */
function cloneRow(cloneRowID) {

  var rowToClone = $(".tasklist-table tbody tr").filter(function () {
    return Number($(this).find(".clone-col input").val()) == cloneRowID;
  });

  if (isLastRowEmpty() == false) {
    $('.tasklist-table').find('.cf-table-add-row').trigger("click");
  }
  var newTaskRow = $('.tasklist-table table tbody tr:last-child');

  newTaskRow.find('.task-name-col input').val(rowToClone.find('.task-name-col input').val());
  newTaskRow.find('.drawing-number-col input').val(rowToClone.find('.drawing-number-col input').val());
  newTaskRow.find('.task-type-col select').val(rowToClone.find('.task-type-col select').val());
  newTaskRow.find('.task-type-id-col input').val(rowToClone.find('.task-type-id-col input').val());
  newTaskRow.find('.due-date-col input').val(rowToClone.find('.due-date-col input').val());
  newTaskRow.find('.op-number-col input').val(rowToClone.find('.op-number-col input').val());
  newTaskRow.find('.rev-number-col input').val(rowToClone.find('.rev-number-col input').val());
}


/**
 * Description: Replaces   #show-generate-tasks   placeholder with a “GenerateTasks” button that calls callShowGenerateTasks()  .
   Side effects: DOM replacement.
 */
function createShowGenerateButton() {
  var add_buttons = $("#show-generate-tasks");
  add_buttons.each(function (index) {
    $(this).replaceWith("<input class='return' style='visibilty:visible' type='button' value='GenerateTasks' onclick='callShowGenerateTasks()' />");
  });

}


/**
  Signature:   checkForDuplicateRows(): boolean  
  Description: Detects duplicate task rows (same task name, task type, op number, rev number) among valid rows.
  Returns: true if any duplicates are found; otherwise false  .
  Behavior:
    Clears previous parsley error classes and .error-message contents.
    For each pair of rows considered valid by isRowValid, flags duplicates by:
      Writing “Duplicate Row” into both rows’   .error-message input  .
      Adding   parsley-error   to both rows’ relevant inputs.
 */
function checkForDuplicateRows() {
  console.log('checkForDuplicateRows');
  $('.task-name-col input').removeClass('parsley-error');
  $('.task-type-col select').removeClass('parsley-error');
  $('.op-number-col input').removeClass('parsley-error');
  $('.rev-number-col input').removeClass('parsley-error');
  $('.error-message input').removeClass('parsley-error');
  $('.error-message input').val('');

  var returnVal = false;

  var taskRows = $('.tasklist-table tbody tr');
  var rowCount = taskRows.length;
  taskRows.each(function (index) {
    console.log('checkForDuplicateRows index: ' + index);
    let currentTaskName = $(this).find('.task-name-col input');
    let currentTaskType = $(this).find('.task-type-col select');
    let currentOpNumber = $(this).find('.op-number-col input');
    let currentRevNumber = $(this).find('.rev-number-col input');
    let currentErrorMessage = $(this).find('.error-message input');
    let errorMessageValue = $(this).find('.error-message input').val();
    if (isRowValid(index) == false) {
    }
    if (errorMessageValue.length == 0) {
      for (i = index + 1; i < rowCount; i++) {
        console.log('checkForDuplicateRows i: ' + i);
        if (isRowValid(i) == false) {
          return;
        }
        let rowToCheck = $(taskRows[i]);
        let chkErrorMessage = $(rowToCheck).find('.error-message input');
        let chkErrorMessageValue = $(chkErrorMessage).val();
        if (chkErrorMessageValue.length == 0) {
          let chkTaskName = $(rowToCheck).find('.task-name-col input');
          let chkTaskType = $(rowToCheck).find('.task-type-col select');
          let chkOpNumber = $(rowToCheck).find('.op-number-col input');
          let chkRevNumber = $(rowToCheck).find('.rev-number-col input');
          if ((currentTaskName.val() == chkTaskName.val())
            && (currentTaskType.val() == chkTaskType.val())
            && (currentOpNumber.val() == chkOpNumber.val())
            && (currentRevNumber.val() == chkRevNumber.val())) {
            $(currentErrorMessage).val('Duplicate Row');
            $(currentTaskName).addClass('parsley-error');
            $(currentTaskType).addClass('parsley-error');
            $(currentOpNumber).addClass('parsley-error');
            $(currentRevNumber).addClass('parsley-error');
            $(currentErrorMessage).addClass('parsley-error');
            $(chkTaskName).addClass('parsley-error');
            $(chkTaskType).addClass('parsley-error');
            $(chkOpNumber).addClass('parsley-error');
            $(chkRevNumber).addClass('parsley-error');
            $(chkErrorMessage).addClass('parsley-error');
            $(chkErrorMessage).val('Duplicate Row');
            returnVal = true;
          }
        }
      }
    }
  });
  return returnVal;
}


/**
 * Description: Builds a semicolon-separated list of CC emails from .cc-email-col input in the CC Table and writes it to .cc-email-address-list input.
 */
function fillCCList() {

  var ccUserNames = '';

  $('.cc-email-col input').each(function (index) {
    let ccUserName = $(this).val();
    if (ccUserName.length > 0) {
      ccUserNames += ccUserName + ';';
    }
  });
  $('.cc-email-address-list input').val(ccUserNames);
}


/**
 * Description: Converts placeholder with class .gobackbutton into a styled “Go Back” UI button that calls callGoBack() and removes the placeholder.
 */
function generateGoBackButtons() {
  var goback_buttons = $(".gobackbutton");
  goback_buttons.each(function (index) {
    $(this).parent().append("<div id='go-back' class='ui-button ui-corner-all ui-widget' onclick='callGoBack()'><span class='ui-icon ui-icon-arrowreturnthick-1-w'></span>Go Back</div>");
  });
  $(".gobackbutton").remove();
}


/**
- Signature: `generateTableButtons(buttonSelector: string, buttonClass: string, buttonTitle: string, buttonFunction: string): void`
- Description: Appends a small clickable UI button next to each text input inside `buttonSelector` that calls `buttonFunction(value)` when clicked.
- Parameters:
  - `buttonSelector`: CSS selector; a container that holds text inputs (e.g., `.clone-col`).
  - `buttonClass`: CSS class for the icon (e.g., `ui-icon-newwin`).
  - `buttonTitle`: Tooltip text.
  - `buttonFunction`: Global function name to call in `onclick`.
- Notes:
  - Skips adding a button if one with `buttonClass` already exists in the same parent.
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
 * Description: Writes sequential row numbers (1-based) into each `.clone-col input`. Used as IDs for cloning.
 */
function generateTaskRowNumbers() {
  $('.clone-col input').each(function (index) {
    $(this).val(index + 1);
  });
}


/**
- Description: Bulk-generates task rows from the generation panel inputs.
- Behavior:
  - Validates generation inputs via `ValidateGenerateForm()`; exits if invalid.
  - Splits `.part-numbers-to-generate` text by newline into parts (ignoring blank lines).
  - Iterates the Cartesian product of:
    - Each part number
    - Each `.task-types-to-generate-table-name input` with its corresponding `.task-types-to-generate-table-id input`
    - Each `.op-number-to-generate input`
  - For each combination:
    - Ensures the last row is empty (or adds a row).
    - Fills task name (part number), optional drawing number, task type, task type ID, due date, op number, and rev number.
  - Calls `callGoBack()` when finished.
 */
function generateTasks() {
  var isGenerateFormValid = validateGenerateForm();
  if (isGenerateFormValid == false) {
    return;
  }
  var partNumberText = $(".part-numbers-to-generate textarea").val();
  var drawingNumberValue = $('.gen-drawing-number input').val();
  var dueDateValue = $('.gen-due-date input').val();
  var revNumberValue = $('.gen-rev-number input').val();

  var partNumbers = partNumberText.split(/\r?\n/);
  var taskTypes = $('.task-types-to-generate-table-name input');
  var taskTypeIDs = $('.task-types-to-generate-table-id input');
  var opNumbers = $('.op-number-to-generate input');
  $(partNumbers).each(function (i) {
    let partNumberValue = partNumbers[i].trim();
    if (partNumberValue.length == 0) {
      return;
    }
    $(taskTypes).each(function (j) {
      let taskTypeValue = $(this).val();
      let taskTypeIDValue = $(taskTypeIDs[j]).val();
      $(opNumbers).each(function (k) {
        let opNumberValue = $(this).val();

        if (isLastRowEmpty() == false) {
          $('.tasklist-table').find('.cf-table-add-row').trigger("click");
        }
        let newTaskRow = $('.tasklist-table table tbody tr:last-child');
        let taskNameField = $(newTaskRow).find('.task-name-col input');
        let drawingNumberField = $(newTaskRow).find('.drawing-number-col input');
        let taskTypeField = $(newTaskRow).find('.task-type-col select');
        let dueDateField = $(newTaskRow).find('.due-date-col input');
        let opNumberField = $(newTaskRow).find('.op-number-col input');
        let revNumberField = $(newTaskRow).find('.rev-number-col input');
        let taskTypeIDField = $(newTaskRow).find('.task-type-id-col input');

        taskNameField.val(partNumberValue);
        if (drawingNumberValue != '') {
          drawingNumberField.val(drawingNumberValue);
        }
        taskTypeField.val(taskTypeValue);
        taskTypeIDField.val(taskTypeIDValue);
        dueDateField.val(dueDateValue);
        opNumberField.val(opNumberValue);
        revNumberField.val(revNumberValue);

      });


    });

  });
  callGoBack();
}


/**
  Signature:   getRowCountOfTableWithValidValues(selector: string): number  
  Description: Counts the number of non-empty <input> elements under the given selector.
  Parameters:
      selector  : CSS selector for a container (e.g., .task-types-to-generate-table-name  ).
  Returns: Count of inputs whose value length > 0.
 */
function getRowCountOfTableWithValidValues(selector) {
  var taskTypes = $(`${selector} input`);
  if (taskTypes.length == 0) {
    return 0;
  }
  var count = 0;
  taskTypes.each(function () {
    if ($(this).val().length > 0) {
      count++;
    }
  });
  return count;
}


/**
 Signature:   isLastRowEmpty(): boolean  
  Description: Determines whether the last task row is considered empty by checking the following fields:
      .task-name-col, .drawing-number-col, .task-type-col, .task-type-id-col, .due-date-col, .op-number-col  .
  Returns: true if all those fields are empty; otherwise false.
 */
function isLastRowEmpty() {
  var lastTaskRow = $('.tasklist-table table tbody tr:last-child');
  var taskNameValue = $(lastTaskRow).find('.task-name-col input').val();
  var drawingNumberValue = $(lastTaskRow).find('.drawing-number-col input').val();
  var taskTypeValue = $(lastTaskRow).find('.task-type-col select').val();
  var taskTypeIDValue = $(lastTaskRow).find('.task-type-id-col input').val();
  var dueDateValue = $(lastTaskRow).find('.due-date-col input').val();
  var opNumberValue = $(lastTaskRow).find('.op-number-col input').val();

  if ((taskNameValue == '') && (drawingNumberValue == '') && (taskTypeValue == '') && (taskTypeIDValue == '') && (dueDateValue == '') && (opNumberValue == '')) {
    return true;
  }
  else {
    return false;
  }

}


/**
  Signature:   isRowValid(rowIndex: number): boolean  
  Description: Validates whether the row has non-empty values for:
    Task name, task type, due date, and op number.
  Parameters:
      rowIndex  : Intended row index.
  Returns:   true if all required fields are present; otherwise false  .
 */
function isRowValid(rowIndex) {
  var returnVal = true;

  var taskNameValue = $(`.tasklist-table tbody tr:nth-child(${rowIndex}) .task-name-col input`).val();
  var taskTypeValue = $(`.tasklist-table tbody tr:nth-child(${rowIndex}) .task-type-col select`).val();
  var dueDateValue = $(`.tasklist-table tbody tr:nth-child(${rowIndex}) .due-date-col input`).val();
  var opNumberValue = $(`.tasklist-table tbody tr:nth-child(${rowIndex}) .op-number-col input`).val();
  if (taskNameValue == '') {
    returnVal = false;
  }
  if (taskTypeValue == '') {
    returnVal = false;
  }
  if (dueDateValue == '') {
    returnVal = false;
  }
  if (opNumberValue == '') {
    returnVal = false;
  }
  return returnVal;
}


/**
  Description: Populates taskTypeMap and taskTypeByNameMap from .task-type-lookup-table (id/name inputs) on first run.
  Behavior:
    If not already loaded, iterates table rows to map:
        taskTypeMap.set(id, name)  
        taskTypeByNameMap.set(name, id)  
  Notes:
    Checks emptiness with taskTypeMap.keys.length 
 */
function loadTaskTypeMap() {

  if (taskTypeMap.keys.length == 0) {
    var tasktype_rows = $('.task-type-lookup-table table tbody tr');
    if (tasktype_rows.length == 0) {
      return;
    }
    tasktype_rows.each(function (index) {
      tasktypeID = Number($(this).find('.task-type-lookup-table-id input').val());
      tasktypeName = $(this).find('.task-type-lookup-table-name input').val();
      taskTypeMap.set(tasktypeID, tasktypeName);
      taskTypeByNameMap.set(tasktypeName, tasktypeID);
    });
  }
}


/**
- Description: Final client-side submission handler.
- Behavior:
  - If `checkForDuplicateRows()` returns `true`, prevents submission.
  - Calls `fillCCList()` to aggregate CC addresses. This is the list of people who will get email notifications about the ticket.
  - Ensures `.ticket-me-id input` has a value; sets to `0` if blank. (ME stands for Manufacturing Engineer, 
    and this field is used to assign the ticket to a specific ME.) The reason for this is that the Workflow requires a value in this field.
    It errors out the call to the stored procedure if this field is blank. For some reason Workflow can not handle a null value in numeric fields.
- Parameters: `e` - Event object from the click event.
 */
function submitForm(e) {
  
  if (checkForDuplicateRows() == true) {
    e.preventDefault();
    return;
  }

  if (validateForm() == false) {
    e.preventDefault();
    return;
  }

  fillCCList();
  
  if ($('.ticket-me-id input').val().length == 0) {
    $('.ticket-me-id input').val(0);
  }
}


function validateForm() {
  $('#me-required-error').remove(); 

  var returnVal = true;
  $('.manufacturing-engineer select').removeClass('parsley-error');
  var meID = Number($('.ticket-me-id input').val());
  var requiresModels = Number($(".add-requires-models-choice input[type='radio']:checked").val());
  if (meID == 0 && requiresModels == 1) {
    $('.manufacturing-engineer select').addClass('parsley-error');
    $('.manufacturing-engineer').append("<ul id='me-required-error' class='parsley-errors-list filled'><li class='parsley-required'>This field is required.</li></ul>");
    returnVal = false;
  }
  return returnVal;
}


/**
- Description: Validates the generation panel inputs.
- Returns: `true` if valid; otherwise `false` and applies UI error indicators.
- Rules:
  - At least one task type (`.task-types-to-generate-table-name`) must be filled.
  - `.part-numbers-to-generate` must not be empty. This is a textarea where the user can enter multiple part numbers, one per line.
  - `.gen-rev-number` must not be empty.
  - `.gen-due-date` must not be empty.
  - At least one op number (`.op-number-to-generate`) must be filled.
  Note: the reason I'm using .blur() is to trigger the parsley validation that LFF is using natively.
 */
function validateGenerateForm() {
  var returnVal = true;
  $('#empty-due-date-error').remove();
  $('.gen-due-date input').removeClass('parsley-error');


  if (getRowCountOfTableWithValidValues('.task-types-to-generate-table-name') == 0) {
    $('.task-types-to-generate-table-name input').blur();
    returnVal = false;
  }

  var partNumberText = $(".part-numbers-to-generate textarea").val();
  if (partNumberText.length == 0) {
    $(".part-numbers-to-generate textarea").blur();
    returnVal = false;
  }

  var revNumberText = $(".gen-rev-number input").val();
  if (revNumberText.length == 0) {
    $(".gen-rev-number input").blur();
    returnVal = false;
  }


  var dueDateValue = $('.gen-due-date input').val();
  if (dueDateValue == '') {
    $('.gen-due-date input').addClass('parsley-error');
    $('.gen-due-date input').parent().append("<ul id='empty-due-date-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>Value Is Required.</li></ul>");
    returnVal = false;
  }

  if (getRowCountOfTableWithValidValues('.op-number-to-generate') == 0) {
    $('.op-number-to-generate input').blur();
    returnVal = false;
  }


  return returnVal;
}
