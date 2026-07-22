/*!
# TaskGroupEdit.js - Documentation

  Author:   Jeffrey Whitney
            jtwhitney@machine.com
            651-391-7982
  Date:     9/29/2025

Permissions: Metrology users only.

## Overview

This script supports the Task Maintenance page, which allows batch updates to active tasks within a ticket.

Main responsibilities:
- Initialize scripts/styles, page title, and user display name.
- Load lookup tables into in-memory maps (assignees, task types).
- Normalize date fields and render read-only boolean checkboxes.
- Render and wire a filter row (Task Name, Task Type, Assignee).
- Enable select-all and per-row selection; maintain selected IDs and count.
- Provide sortable headers by writing sort state and updating icons.
- Validate before submission and enforce dialog notes for Cancelled/Waiting.
- Submit the form with appropriate hidden-field values.

KEY CONCEPTS:
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
          - onloadlookupfinished: The event fires only once, when all the initial lookups have completed. The kinds of lookups that are completed
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
        This causes a lookup for all the user related fields, including SiteID. Once the SiteID is set, this in turn
        causes another lookup to pull in all the departments related to that site. The Department Lookup cannot be loaded until 
        we know which site we're talking about. Sometimes this daisy-chaining can get 3 and sometimes even 4 levels deep because of all the relationships between
        various fields on a form. This causes the form to be slower than it otherwise would have been, but there's not a lot we can do about it.
        It sort of is what it is. This is what happens when you have to make an application with a non-application framework.
   
   Filtering and Sorting:
      There is no way to filter or sort rows in LFF, so I had to build a custom filtering mechanism. This is done via a combination of hidden 
      fields which are arguments to a SQL Server stored procedure. The stored procedure returns a maximum of 25 rows at a time, 
      so we have to be able to filter and sort the rows on the server side.

        Filtering:
          .ftname input: Task Name filter (partial match)
          .faid input:   Assignee ID filter (0 = show all, otherwise filter by assignee id)
          .fttid input:  Task Type ID filter (0 = show all, otherwise filter by task type id)

          This gets us part of the way there, but we also need to have a way for the user to set these fields.
          This is done via a filter row which is added to the table. The filter row contains a text box for the task name filter,
          and dropdowns for the task type, and assignee filters. 
          The change of any of these controls triggers the filterTable() function which reads the values from the controls and sets the 
          hidden fields accordingly. Values from select controls are mapped from name to ID using the lookup maps.
      
        Sorting:
          Sorting is handled via clickable column headers. Clicking a header sets the sort field and toggles the sort direction.
          If you click on a sort field that is already the current sort field, it toggles the direction.  
          If you click on a different sort field, it sets that field as the sort field and sets the direction to ascending.
            
            Hidden Sort Fields:
              .sort-field-ordinal input: Field to sort by 
              .sort-direction input: Sort direction (ASC or DESC)

            Sort column mappings:
              '#q24' -> Task Name (default sort)
              '#q25' -> Task Type
              '#q26' -> Assignee
              '#q27' -> Status
              '#q29' -> Due Date
              '#q30' -> Sched Due Date
              '#q31' -> Total Hours
          
    Mapping:
       There are several differnent lookup tables on the form which are used to populate dropdowns, nearly all of which are for filtering.
       Task types are stored both as ID?Name and Name?ID because LFF only stores the display value in the select, for example, the TaskType
       select shows the names of the task types, but we are storing the TaskTypeID in a the database, so we need to have a way to 
       figure out what the TaskTypeID is so that we can set the value of the hidden field that the workflow is going to use to 
       set the value in the task table. So we need to be able to look up the ID by name when the user selects a task type.
       The only way I've been able to figure out how to do this is to have a hidden lookup table on the page which contains all the 
       task types and their IDs. So when the page loads, we read that table and build two maps: one for ID?Name and one for Name?ID.
       When the user selects a task type, we look up the ID by name and set the value of the hidden field.

## External Dependencies

- jQuery
- jQuery UI (dialog, icons): https://code.jquery.com/ui/1.13.3/
- jquery-confirm: https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/
- simplePagination.css (styles only)

Dialogs
- `popupCancelNote(e)` - requires non-empty note; writes to `#Field90`, submits.
- `popupCompletionNote(e)` - optional note; writes to `#Field90`, submits.
- `popupWaitingNote(e)` - requires non-empty note; writes to `#Field90`, submits.

## Validation rules

- Must select at least one task to update.
- Cannot set status to Not Started if the row has logged hours (`totalHours > 0`).
- When changing Task Type:
  - Prevent duplicate tasks with same Task Name and OP Number (type is not actually part of check; see note below).
- Per-row errors:
  - Row marked with `.color-error` and message placed in `.error-message input`.


 */

/* Status constants used for validation and dialog routing */
const status_NotStarted = 1;
const status_Started = 2;
const status_Waiting = 3;
const status_Completed = 4;
const status_Cancelled = 5;
const status_NotSched = 7;

/* Lookup maps:
 * - assigneeMap: id -> name
 * - assigneeNameMap: name -> id
 * - taskTypeMap: id -> name
 * - taskTypeByNameMap: name -> id
 */
const assigneeMap = new Map();
const assigneeNameMap = new Map();
const taskTypeMap = new Map();
const taskTypeByNameMap = new Map();

$(document).ready(function () {
  /* Page bootstrap: set title, load assets, wire submit, compute user display name */
  $(document).prop('title', 'Task Maintenance');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simplePagination.js/1.6/simplePagination.min.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');

  $('.Submit').on("click", function (e) { submitForm(e); });

  /* Avoid Bootstrap/jQuery UI plugin name conflicts */
  $.fn.bootstrapBtn = $.fn.button.noConflict(); // return $.fn.button to previously assigned value

  /* Compute DOMAIN\user -> USER and push into .network-user-name. See 'User Permissions' above */
  $('.network-user-name input').val($('.lf-username input').val().toUpperCase().slice($('.lf-username input').val().lastIndexOf('\\') + 1)).trigger("change");

  /* If host requests dialog close, notify parent See 'Dialog Looping Mechanism' above */
  if ($('.closeme input').val() === '1') {
    window.parent.postMessage('CloseDialogWithRefresh', '*');
  }

  /* After lookup tables load, build maps and prepare UI */
  $(document).on('lookupcomplete', function () {
    loadAssigneeMap();
    loadTaskTypeMap();

    /* Normalize date display to yyyy-MM-dd (drop time) */
    $('.due-date-col input').each((i, dateField) => $(dateField).val($(dateField).val().split(" ")[0]));
    $('.sched-due-date-col input').each((i, dateField) => $(dateField).val($(dateField).val().split(" ")[0]));

    /* Mirror "1"/"0" Manual Date text fields to disabled checkboxes for visual clarity */
    generateTableCheckBox(".man-date-col", "mandate-chk");

    /* Inject and wire filter row and sort handlers */
    generateFilterRow();

    /* Reveal table after initialization */
    $('.tasklist-table').show();
  });

  /* Finalize UI after on-load lookup work finishes */
  $(document).on("onloadlookupfinished", function () {
    $('.closeme input').val(1);
    $('#q0').append("<div class='hidden-text' id='popUpDiv'></div>");

    /* Trigger bindings that rely on .tid and user name changes */
    $('.tid input').trigger("change");
    $('.network-user-name input').trigger("change");

    /* Ensure site-specific assignee combo is populated */
    if (($('.site-id input').val() !== '0') && ($('.site-id input').val().length > 0)) {
      if ($('.assignee-name-combo select option').length < 2) {
        $('.site-id input').trigger("change");
      }
    }

    /* Mirror checkbox toggles to hidden update fields */
    $(document).on('change', '#Field18-0', function () {
      if (this.checked) {
        $('.update-man-date input').val(1);
      }
      else {
        $('.update-man-date input').val(0);
      }
    });

    $(document).on('change', '#Field94-0', function () {
      if (this.checked) {
        $('.update-remove-rev-letter input').val(1);
      }
      else {
        $('.update-remove-rev-letter input').val(0);
      }
    });

    /* Row selection tracking: update per-row marker, CSV list, and count */
    $(document).on('change', 'input[id^="Field21"]', function () {
      fillSelectedIDs();
      if (this.checked) {
        $(this).closest('tr').find('.selected-value input').val(1);
      } else {
        $(this).closest('tr').find('.selected-value input').val(0);
      }
      $('.select-task-count input').val(getSelectedCount());
    });

    /* Reveal table */
    $('.tasklist-table').show();
  });

});

/**
 * Validates whether the current user has permission to perform updates.
 * Reads hidden fields: `.user-id`, `.user-isactive`, `.user-type-id`.
 * @returns {boolean} True when user is active, has a non-zero ID, and user_type_id == '1'.
 */
function checkPermissions() {

  const user_id = $(".user-id input").val();
  const is_active_user = $(".user-isactive input").val();
  const user_type_id = $(".user-type-id input").val();
  let return_val = true;

  if ((user_type_id === null) || (user_type_id === '')) {
    return_val = false;
  }

  if ((user_id === null) || (user_id === '')) {
    return_val = false;
  }
  if ((is_active_user === null) || (is_active_user === '')) {
    return_val = false;
  }

  if (is_active_user === '0') {
    return_val = false;
  }

  if (user_id === '0') {
    return_val = false;
  }

  if (user_type_id !== '1') {
    return_val = false;
  }

  return return_val;

}

/**
 * Checks if a task with the same name and OP number already exists
 * (excluding the given task ID).
 * Data source: `.preexisting-task-lookup-table`.
 * @param {string} taskName - The task name to check.
 * @param {number} taskID - The current task ID (to exclude).
 * @param {string} opNumber - Operation number.
 * @returns {boolean} True if a different task exists with same name and OP number.
 */
function hasPreexistingTask(taskName, taskID, opNumber) {

  let return_val = false;
  const preexisting_rows = $('.preexisting-task-lookup-table table tbody tr');
  preexisting_rows.each(function () {
    const preexistingTaskName = $(this).find('.preexisting-task-lookup-table-name input').val();
    const preexistingTaskID = Number($(this).find('.preexisting-task-lookup-table-id input').val());
    const preexistingOpNumber = $(this).find('.preexisting-task-lookup-table-op input').val();
    if ((taskName === preexistingTaskName) && (opNumber === preexistingOpNumber) && (taskID !== preexistingTaskID)) {
      return_val = true;
    }
  });
  return return_val;
}

/**
 * Applies filter UI values to hidden fields and triggers a table reload.
 * - Writes `.ftname`, `.fttid`, `.faid` using lookup maps.
 * - Clears UI extras, unselects all, and triggers `.tid` change to refresh.
 */
function filterTable() {
  if ($('#filterRow').length === 0) {
    return;
  }

  const taskNameFilterValue = $('#txtFilter_TaskName').val();
  const taskTypeFilterVal = $('#cboFilter_TaskType').val();
  const assigneeFilterVal = $('#cboFilter_Assignee').val();

  $('.ftname input').val(taskNameFilterValue);

  if ((taskTypeFilterVal !== null) && (taskTypeFilterVal.length > 0)) {
    const taskTypeID = taskTypeByNameMap.get(taskTypeFilterVal);
    $('.fttid input').val(taskTypeID);
  }
  else {
    $('.fttid input').val(0);
  }

  if ((assigneeFilterVal !== null) && (assigneeFilterVal.length > 0)) {
    const assigneeID = assigneeNameMap.get(assigneeFilterVal);
    $('.faid input').val(assigneeID);
  }
  else {
    $('.faid input').val(0);
  }

  $('.tasklist-table').hide();
  $('.mandate-chk').remove();
  $("#chkSelectAll").prop('checked', false);
  selectAllTasks(false);
  $('.tid input').trigger("change");
}

/**
 * Builds a CSV of selected task IDs from checked row checkboxes,
 * storing it in `.selected-id-list input`.
 * Side effects: updates the hidden CSV field.
 */
function fillSelectedIDs() {
  const checkboxes = $("input[id^='Field21']");
  const selectedIDField = $('.selected-id-list input');
  $(selectedIDField).val('');
  if (checkboxes.length === 0) {
    return;
  }
  checkboxes.each(function () {
    if ($(this).is(':checked')) {
      const taskID = $(this).closest('tr').find('.task-id-col input').val();
      if (selectedIDField.val() === '') {
        selectedIDField.val(taskID);
      }
      else {
        selectedIDField.val(selectedIDField.val() + ',' + taskID);
      }
    }
  });
}

/**
 * Renders disabled checkboxes next to text inputs under `selector`,
 * interpreting value "1" as checked and otherwise unchecked.
 * Ensures a single checkbox per cell by checking for existing `.checkboxClass`.
 * @param {string} selector - Column selector (e.g., ".man-date-col").
 * @param {string} checkboxClass - CSS class for appended checkbox.
 */
function generateTableCheckBox(selector, checkboxClass) {
  const selectionString = selector + " input[type=text]";
  const checkboxes = $(selectionString);
  checkboxes.each(function () {
    const btn_value = $(this).val();
    if (btn_value === '1') {
      const btn_html = "<input class='" + checkboxClass + "' type='checkbox' disabled checked/>";
      const has_button = $(this).parent().find(`.${checkboxClass}`).length;
      if (has_button === 0) {
        $(this).parent().append(btn_html);
      }
    }
    else {
      const btn_html = "<input class='" + checkboxClass + "' type='checkbox' disabled/>";
      const has_button = $(this).parent().find(`.${checkboxClass}`).length;
      if (has_button === 0) {
        $(this).parent().append(btn_html);
      }
    }
  });
}

/**
 * Creates the filter header row if not present and wires its behavior:
 * - Select-all toggle.
 * - Change handlers for Task Name/Type/Assignee.
 * - Double-click to clear individual filters.
 * - Copies options from hidden lookup combos into filter selects.
 * - Wires sort headers via `wireUpSortFields()`.
 * - Syncs UI from hidden `.ft*` fields if present.
 */
function generateFilterRow() {

  if ($('#filterRow').length === 0) {
    const filter_row = "<TR id='filterRow'><TH><input name='chkSelectAll' id='chkSelectAll' type='checkbox' class='check-all-manual'></TH><TH/><TH><input id='txtFilter_TaskName' type='text'/></TH><TH><select id='cboFilter_TaskType'/></TH><TH/><TH><select id='cboFilter_Assignee'/></TH><TH/><TH/><TH/><TH/><TH/><TH/><TH/></TR>"

    $('.tasklist-table table thead').append(filter_row);

    //If they check or uncheck this checkbox, it checks or unchecks all the other checkboxes so that the user
    //doesn't have to manually check each one.
    $("#chkSelectAll").on("click", function () {
      if ($("#chkSelectAll").is(":checked")) {
        selectAllTasks(true);
      }
      else {
        selectAllTasks(false);
      }
    });

    $("#txtFilter_TaskName").on("change", function () { filterTable(); });
    $("#cboFilter_TaskType").on("change", function () { filterTable(); });
    $("#cboFilter_Assignee").on("change", function () { filterTable(); });

    $("#txtFilter_TaskName").on("dblclick", function () { $("#txtFilter_TaskName").val(null).trigger("change"); });
    $("#cboFilter_TaskType").on("dblclick", function () { $("#cboFilter_TaskType").val(0).trigger("change"); });
    $("#cboFilter_Assignee").on("dblclick", function () { $("#cboFilter_Assignee").val(0).trigger("change"); });
    wireUpSortFields();
  }

  if ((($('.ftname input').val() !== null) && ($('.ftname input').val().length > 0)) && (($('#txtFilter_TaskName').val() === null) || ($('#txtFilter_TaskName').val() === ''))) {
    $('#txtFilter_TaskName').val($('.ftname input').val());
  }
  if (($(".tasktype-lookup-combo select option").length > 1) && ($("#cboFilter_TaskType option").length === 0)) {
    $("#cboFilter_TaskType").html($(".tasktype-lookup-combo select").html());
  }
  if (($(".assignee-lookup-combo select option").length > 1) && ($("#cboFilter_Assignee option").length === 0)) {
    $("#cboFilter_Assignee").html($(".assignee-lookup-combo select").html());
  }

}

/**
 * Counts selected task rows.
 * @returns {number} Number of checked row selectors.
 */
function getSelectedCount() {
  const checkboxes = $("input[id^='Field21']");
  if (checkboxes.length === 0) {
    return 0;
  }
  let count = 0;
  checkboxes.each(function () {
    if ($(this).is(':checked')) {
      count++;
    }
  });
  return count;
}

/**
 * Populates assignee maps (id<->name) from `.assignee-lookup-table`.
 * Guard: runs when map is uninitialized (note: uses .keys.length as guard in this code).
 */
function loadAssigneeMap() {

  if (assigneeMap.keys.length === 0) {
    const assignee_rows = $('.assignee-lookup-table table tbody tr');
    if (assignee_rows.length === 0) {
      return;
    }
      assignee_rows.each(function () {
      assigneeID = Number($(this).find('.assignee-lookup-table-id input').val());
      assigneeName = $(this).find('.assignee-lookup-table-name input').val();
      assigneeMap.set(assigneeID, assigneeName);
      assigneeNameMap.set(assigneeName, assigneeID);
    });
  }
}

/**
 * Populates task type maps (id<->name) from `.tasktype-lookup-table`.
 * Guard: runs when map is uninitialized (note: uses .keys.length as guard in this code).
 */
function loadTaskTypeMap() {

  if (taskTypeMap.keys.length === 0) {
    const tasktype_rows = $('.tasktype-lookup-table table tbody tr');
    if (tasktype_rows.length === 0) {
      return;
    }
      tasktype_rows.each(function () {
      tasktypeID = Number($(this).find('.tasktype-lookup-table-id input').val());
      tasktypeName = $(this).find('.tasktype-lookup-table-name input').val();
      taskTypeMap.set(tasktypeID, tasktypeName);
      taskTypeByNameMap.set(tasktypeName, tasktypeID);
    });
  }
}

/**
 * Opens a dialog requiring a cancellation reason.
 * - Trims `#Field80`, validates non-empty, writes to `#Field90`, submits form.
 * @param {Event} e - Submit event (default prevented by caller).
 */
function popupCancelNote() {
  $("#q80").dialog({
    title: "Please explain your reason for cancelling these tasks.",
    height: 350,
    width: 750,
    autoOpen: true,
    resizable: false,
    modal: true,
    close: function (event, ui) {
    },
    buttons: [
      {
        text: "OK",
        click: function () {
          $('#Field80').val($('#Field80').val().trim());
          const note_text = $('#Field80').val();
          if (note_text.length === 0) {
            $.alert({
              title: 'Error',
              content: 'You have to enter a reason for cancelling. You cannot save otherwise.',
              type: 'red',
              typeAnimated: true,
              buttons: {
                ok: function () { }
              }
            });
            return;
          }
          else {
            $('#Field90').val(note_text);
            $("#q80").dialog("close");
            $('#form1').trigger("submit");
          }
        }
      }
    ]
  });
}

/**
 * Opens a dialog allowing optional completion notes.
 * - Writes content (possibly empty) to `#Field90`, submits form.
 * @param {Event} e - Submit event (unused).
 */
function popupCompletionNote() {
  $("#q80").dialog({
    title: "Enter completion notes. (Not required.)",
    height: 350,
    width: 750,
    autoOpen: true,
    resizable: false,
    modal: true,
    close: function (event, ui) {
    },
    buttons: [
      {
        text: "OK",
        click: function () {
          const note_text = $('#Field80').val();
          $('#Field90').val(note_text);
          $("#q80").dialog("close");
          $('#form1').trigger("submit");
        }
      }
    ]
  });
}

/**
 * Opens a dialog requiring a waiting reason.
 * - Trims `#Field80`, validates non-empty, writes to `#Field90`, submits form.
 * @param {Event} e - Submit event (unused).
 */
function popupWaitingNote() {
  $("#q80").dialog({
    title: "Please explain what you are waiting on.",
    height: 350,
    width: 750,
    autoOpen: true,
    resizable: false,
    modal: true,
    buttons: [
      {
        text: "OK",
        click: function () {
          $('#Field80').val($('#Field80').val().trim());
          const note_text = $('#Field80').val();
          if (note_text.length === 0) {
            $.alert({
              title: 'Error',
              content: 'You have to enter what you are waiting on. You cannot save otherwise.',
              type: 'red',
              typeAnimated: true,
              buttons: {
                ok: function () { }
              }
            });
            return;
          }
          else {
            $('#Field90').val(note_text);
            $("#q80").dialog("close");
            $('#form1').trigger("submit");
          }
        }
      }
    ]
  });
}

/**
 * Removes transient UI elements appended to rows that should not persist
 * across re-renders/sorts.
 */
function removeAppendedFields() {

  $('.table-button').remove();
  $('.task-link').remove();
}

/**
 * Selects or deselects all task rows.
 * Side effects:
 * - Toggles all `input[id^='Field21']`.
 * - Rebuilds selected ID CSV and updates selected count.
 * @param {boolean} check_on - True to select all; false to clear.
 */
function selectAllTasks(check_on) {
  const checkboxes = $("input[id^='Field21']");
  if (checkboxes.length === 0) {
    return;
  }
  checkboxes.each(function () {
    if (check_on === true)
      $(this).prop('checked', true).trigger("change");
    else
      $(this).prop('checked', false).trigger("change");
  });
  fillSelectedIDs();
  $('.select-task-count input').val(getSelectedCount());
}

/**
 * Updates sort state when a header is clicked.
 * - Toggles `.sort-direction` when re-clicking the same column.
 * - Sets `.sort-field-ordinal` for a new column and resets direction to ascending.
 * - Updates the header icon and removes transient row widgets.
 * @param {number} newSortOrdinal - Column ordinal (0..6).
 * @param {string} selector - Header cell selector (e.g., "#q24").
 */
function sortTable(newSortOrdinal, selector) {

  removeAppendedFields();
  $('.sort-icon').remove();

  const currentSortOrdinal = Number($('.sort-field-ordinal input').val());
  let sortDirection = Number($('.sort-direction input').val());

  if (newSortOrdinal === currentSortOrdinal) {
    if (sortDirection === 0) {
      sortDirection = 1
      $('.sort-direction input').val(1).trigger("change");
    }
    else {
      sortDirection = 0;
      $('.sort-direction input').val(0).trigger("change");
    }
  }
  else {
    $('.sort-field-ordinal input').val(newSortOrdinal);
    $('.sort-direction input').val(0).trigger("change");
    sortDirection = 0;
  }

  if (sortDirection === 0) {
    $(`${selector} .cf-col-label`).append('<span class="ui-icon ui-icon-triangle-1-n sort-icon"></span>');
  }
  else {
    $(`${selector} .cf-col-label`).append('<span class="ui-icon ui-icon-triangle-1-s sort-icon"></span>');
  }
}

/**
 * Wires clickable sort headers and sets the initial sort icon.
 * Mapping:
 *  - #q24 Task Name, #q25 Task Type, #q26 Assignee, #q27 Status,
 *  - #q29 Due Date, #q30 Sched Due Date, #q31 Total Hours
 */
function wireUpSortFields() {

  $('#q24 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-n sort-icon"></span>');

  $('#q24').on('click', function () { sortTable(0, '#q24'); });//Task Name (default)
  $('#q25').on('click', function () { sortTable(1, '#q25'); });//Task Type
  $('#q26').on('click', function () { sortTable(2, '#q26'); });//Assignee
  $('#q27').on('click', function () { sortTable(3, '#q27'); });//Status
  $('#q29').on('click', function () { sortTable(4, '#q29'); });//Due Date
  $('#q30').on('click', function () { sortTable(5, '#q30'); });//Sched Due Date
  $('#q31').on('click', function () { sortTable(6, '#q31'); });//Total Hours
  

}

/**
 * Handles form submission:
 * - Validates via `validateForm()`.
 * - Normalizes empty update fields to 0.
 * - Routes to note dialogs for Cancelled/Completed/Waiting; otherwise submits.
 * @param {Event} e - Click/submit event; may be prevented.
 */
function submitForm(e) {
  if (validateForm() === false) {
    e.preventDefault();
    return;
  }

  if ($('.update-status-id input').val() === '') {
    $('.update-status-id input').val(0);
  }
  if ($('.update-assignee-id input').val() === '') {
    $('.update-assignee-id input').val(0);
  }
  if ($('.update-task-type-id input').val() === '') {
    $('.update-task-type-id input').val(0);
  }

  const statusID = Number($('.update-status-id input').val());

  if (statusID !== 0) {
    if (statusID === status_Cancelled) {
      e.preventDefault();
      popupCancelNote(e);
    }
    else if (statusID === status_Completed) {
      e.preventDefault();
      popupCompletionNote();
    }
    else if (statusID === status_Waiting) {
      e.preventDefault();
      popupWaitingNote();
    }
    else {
      $('#form1').trigger("submit");
    }
  }
 
}

/**
 * Validates current batch update:
 * - Requires at least one selected task.
 * - Disallows setting status to Not Started if total hours > 0.
 * - When updating Task Type, prevents duplicates by name + OP number.
 * Side effects:
 * - Marks invalid rows with `.color-error` and writes messages into `.error-message input`.
 * @returns {boolean} True if the form is valid; false otherwise.
 */
function validateForm() {
  $(".tasklist-table table tbody tr").removeClass('parsley-error');
  $('.error-message input').val('');
  $('.color-error').removeClass('color-error');

  let formIsValid = true;
  const selectedCount = getSelectedCount();
  if (selectedCount === 0) {
    $.alert({
      title: 'Error',
      content: 'Please select at least one task to update.',
      type: 'red',
      typeAnimated: true,
      buttons: {
        ok: function () { }
      }
    });
    formIsValid = false;
  }

  const updateTaskTypeID = Number($('.update-task-type-id input').val());
  const updateStatusID = Number($('.update-status-id input').val());
  const updateOpNumber = $('.update-op-number input').val();
  const checked_rows = $("input[id^='Field21']").filter(':checked').closest('tr');

  checked_rows.each(function () {
    const taskID = Number($(this).find('.task-id-col input').val());
    const totalHours = Number($(this).find('.total-hours-col input').val());
    const taskName = $(this).find('.task-name-col input').val();
    const opNumber = $(this).find('.op-number-col input').val();

    /* Rule: cannot return to Not Started if hours already logged */
    if (updateStatusID === status_NotStarted) {
      if (totalHours > 0) {
        formIsValid = false;
        $(this).addClass('color-error');
        $(this).find('.error-message input').val(`This task has hours logged to it. You cannot set its status to 'Not Started'.`);
      }
    }

    /* Rule: when changing Task Type, prevent duplicates by name + OP number */
    if (updateTaskTypeID > 0) {
      let preexistingTask = false;

      if (updateOpNumber.length > 0) {
        preexistingTask = hasPreexistingTask(taskName, taskID, updateOpNumber);
      }
      else {
        preexistingTask = hasPreexistingTask(taskName, taskID, opNumber);
      }
      if (preexistingTask) {
        formIsValid = false;
        $(this).addClass('color-error');
        $(this).find('.error-message input').val(`A task with this name, type, and op number already exists in this ticket.`);
      }

    }

  });

  return formIsValid;
}
