/**
 EditProgrammingTicket.js
 
 Purpose:
 Drives the Edit Programming Ticket UI: loads lookup data, manages permissions, filters/sorts the task list,
 and wires actions such as Add Task, Add Time, Clone Task, Group Edit, Print, and Show Details.
 
 Permissions: (See 'User Permissions' below for details)
    - Cell Leads (user-type-id == 5) have read-only access.
    - Manufacturing Engineers (user-type-id == 4) have read-only access.
    - Quality Engineers (user-type-id == 3) can add tickets/tasks/notes, but not change tickets 
      outside their department or modify task statuses/assignees.
    - Metrology users (user-type-id == 1) have full permissions.

 Responsibilities:
  - Load CSS/JS dependencies and resolve Bootstrap/jQuery UI button conflicts.
  - Maintain lookup maps (ME/QE/Assignee/TaskType/Status) for fast name<->ID translation.
  - Enforce permissions (Metrology users or same-department users) and enable/disable UI accordingly.
  - Generate dynamic UI (task table buttons, filter row, checkboxes, task links).
  - Wire custom events: window message print handler, lookupcomplete/onloadlookupfinished, filter and sort controls.
  - Open modal dialogs/iframes for editing, adding tasks/time, cloning, printing, and history display.
 
 Key Concepts:
    Dialog/Popup Mechanism:
     As with most things in LaserFiche Forms, there is no built-in way to open a popup dialog or iframe, so I had to build my own functionality.
     This is done via a combination of a hidden div on the form, and a jQuery UI dialog. The hidden div is populated with an iframe
     which loads the desired URL. The jQuery UI dialog is then opened, displaying the iframe. If you just close the dialog, nothing happens 
     to this form. 
     If however, you submit the popup form, the first thing it does is to change a hidden field called 'closeme' to a value of 1. (Its default is 0.)
     After the popup gets submitted to the server, the server processes it by sending its form fields to a LF Workflow. When the workflow completes, 
     it comes back to the server-side process which forwards back to the same form, but this time with the closeme field set by the query string. 
     (We set it when we submitted the form.)
     When the popup loads, it has its closeme value set by the query string, so it knows that it has just come back from being submitted. 
     Therefore, it will then send a message to its parent, (namely, this form), informing it that the server-side 
     data has changed. When this form receives such a message, it closes the popup dialog, and then it calls a function refreshes the page.

     Just keep in mind that this page is also a popup, so when this page submits, it also sets its own closeme field to 1, 
     so that when it comes back from the server, it will also send a message to its parent to refresh. That will cause the parent form
     to refresh and close the popup dialog that is hosting this page. This is a bit convoluted, but it works, and it's the only way it will
     work because of the limitations of LaserFiche Forms.
     
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

    Filtering and Sorting:
     There is no way to filter or sort rows in LFF, so I had to build a custom filtering mechanism. This is done via a combination of hidden fields which are arguments to a 
     SQL Server stored procedure. The stored procedure returns a maximum of 25 rows at a time, so we have to be able to filter and sort the rows on the server side.
     There are also two buttons which allow the user to change which page of results they are viewing.
     Here is a list of the hidden fields used for filtering and sorting:
      Filtering:
        .ftname input: Task name filter (partial match)
        .fttid input: Task type ID filter (exact match)
        .fsid input: Status ID filter (exact match)
        .faid input: Assignee ID filter (exact match)
        .fincomp input: Include completed tasks (1 = include, 0 = exclude)
        Sorting:
        .sort-field-ordinal input: Field to sort by (1 = Task Name, 2 = Task Type, 3 = Status, 4 = Assignee, 5 = Due Date, 6 = Priority)
        .sort-direction input: Sort direction (ASC or DESC)
      This gets us part of the way there, but we also need to have a way for the user to set these fields.
      This is done via a filter row which is added to the task list table. The filter row contains a text box for the task name filter,
      and dropdowns for the task type, status, and assignee filters. There is also a checkbox to include completed tasks.
      The change of any of these controls triggers the filterTable() function which reads the values from the controls and sets the hidden fields 
      ccordingly. Values from select controls are mapped from name to ID using the lookup maps.
      Sorting is handled via clickable column headers. Clicking a header sets the sort field and toggles the sort direction.
      If you click on a sort field that is already the current sort field, it toggles the direction.

    Mapping:
     There are several differnent lookup tables on the form which are used to populate dropdowns, nearly all of which are for filtering.
     Task types are stored both as ID?Name and Name?ID because LFF only stores the display value in the select, for example, the TaskType
     select shows the names of the task types, but we are storing the TaskTypeID in a the database, so we need to have a way to 
     figure out what the TaskTypeID is so that we can set the value of the hidden field that the workflow is going to use to 
     set the value in the task table. So we need to be able to look up the ID by name when the user selects a task type.
     The only way I've been able to figure out how to do this is to have a hidden lookup table on the page which contains all of the 
     task types and their IDs. So when the page loads, we read that table and build two maps: one for ID?Name and one for Name?ID.
     When the user selects a task type, we look up the ID by name and set the value of the hidden field.

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
 - User/permissions: `.user-type-id input`, `.user-department-id input`, `.user-isactive input`, `.ticket-department-id input`
 - Ticket/task identity: `.tid input` (ticket ID), `.ticket-number input`
 - ME/QE controls: `.manufacturing-engineer-combo select`, `.quality-engineer-combo select`, `.meid input`, `.qeid input`, `.mename input`, `.qename input`
 - Lookup sources (tables): `.me-lookup-table`, `.qe-lookup-table`, `.assignee-lookup-table`, `.tasktype-lookup-table`, `.status-lookup-table`
 - Filtering state: `.ftname input`, `.fttid input`, `.fsid input`, `.faid input`, `.fincomp input`, `#chkIncludeComplete`
 - Sorting state: `.sort-field-ordinal input`, `.sort-direction input`, headers `#q47..#q55`
 - Task list columns: `.tasklist-task-id-col`, `.tasklist-task-name-col`, `.tasklist-time-col`, `.task-list-clone-col`, `.tasklist-mandate-col`
 - Misc: `.add-button`, `.print-button`, `#popUpDiv`, `#print-iframe`, `#ticket-history`, `.tasklist-table`
 
 Custom events observed:
 - Window postMessage "printme" to print iframe, and "CloseDialogWithRefresh" to refresh.
 - `lookupcomplete` to load maps, set combos, enforce permissions, build UI, and wire filters.
 - `onloadlookupfinished` to finalize UI (history iframe, site-dependent reloads, defaults).
 
 Notes:
 - Assumes backend populates hidden inputs/lookup tables; this file translates and orchestrates UI behavior.
 - Uses jQuery UI Dialog for pop-up iframes.
 - Filtering writes to hidden fields and triggers LF lookup via `.change()` where appropriate.
 - Sorting only toggles indicators and hidden sort fields; actual sort performed by backend lookup.
 
 Potential improvements (informational only):
 - Replace `map.keys.length` checks with `map.size === 0`.
 - Replace `option_value == NaN` patterns (if any) with `Number.isNaN(option_value)`.
 - Debounce filter input changes to reduce backend calls.
 * - Centralize permission checks to avoid duplication.
 */

var mfgEngineerMap = new Map();
var mfgEngineerNameMap = new Map();
var qualEngineerMap = new Map();
var qualEngineerNameMap = new Map();
var assigneeMap = new Map();
var assigneeNameMap = new Map();
var taskTypeMap = new Map();
var taskTypeByNameMap = new Map();
var taskStatusMap = new Map();
var taskStatusNameMap = new Map();


$(document).ready(function () {
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
  var bootstrapButton = $.fn.button.noConflict();
  $.fn.bootstrapBtn = bootstrapButton;

  // Window message print hook
  var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
  var printEvent = window[eventMethod];
  var messageEvent = eventMethod === "attachEvent" ? "onmessage" : "message";
  printEvent(messageEvent, function (e) {

    if (e.data === "printme" || e.message === "printme") {
      function show_print() {
        $("#print-iframe").get(0).contentWindow.print();
      };
      window.setTimeout(show_print, 800); // 2 seconds
    }
  });

  $('.Submit').addClass('ui-button ui-corner-all ui-widget');
  $('.Submit').click(function (e) { submitForm(e); });

  // Normalize network username from domain\user
  var lfUserName = $('.lf-user-name input').val();
  if (lfUserName != "") {
    let networkUserName = lfUserName.toUpperCase();
    networkUserName = networkUserName.substr(networkUserName.lastIndexOf('\\') + 1);
    $('.network-user-name input').val(networkUserName).change();
  }

  // Reflect ticket number in document title
  $(document).on('change', '.ticket-number input', function (e) {
    var ticket_name = $(this).val();
    $(document).prop('title', `Edit Ticket ${ticket_name}`);
  });

  // Close/refresh integration for dialog hosting
  if ($('.closeme input').val() == 1) {
    $('#form1').hide();
    window.parent.postMessage('CloseDialogWithRefresh', '*');
  }

  // Keep hidden QE/ME ID fields in sync with selected names
  $(document).on('change', '.quality-engineer-combo select', function () {
    let qeName = $('.quality-engineer-combo select').val();
    let qeID = qualEngineerNameMap.get(qeName);
    $('.qeid input').val(qeID);
  });

  $(document).on('change', '.manufacturing-engineer-combo select', function () {
    let meName = $('.manufacturing-engineer-combo select').val();
    if (meName.length == 0) {
      $('.meid input').val(0);
    }
    else {
      let meID = mfgEngineerNameMap.get(meName);
      $('.meid input').val(meID);
    }
  });



  // Dialog close from child iframes should refresh this form
  window.onmessage = function (event) {

    if (event.data == "CloseDialogWithRefresh") {
      $("#popupIFrame").dialog("destroy");
      $("#popupIFrame").remove();
      refreshForm();
    }
  };

  // After lookups populate, load maps, set default selections, and build UI
  $(document).on('lookupcomplete', function (e) {
    loadMfgEngineerMap();
    loadQualEngineerMap();
    loadAssigneeMap();
    loadStatusMap();
    loadTaskTypeMap();

    if (($('.mename input').val() != null) && ($('.manufacturing-engineer-combo select option').length > 0)) {
      $('.manufacturing-engineer-combo select').val($('.mename input').val());
      $('.meid input').val(mfgEngineerNameMap.get($('.mename input').val()));
    }
    if (($('.qename input').val() != null) && ($('.quality-engineer-combo select option').length > 0)) {
      $('.quality-engineer-combo select').val($('.qename input').val());
      $('.qeid input').val(qualEngineerNameMap.get($('.qename input').val()));
    }
    generateTaskListColumnFields();

    // Enforce permissions for editing and adding
    if (checkPermissions() == false) {
      $('.Submit').hide();
      $('.manufacturing-engineer-combo select').removeClass('ui-state-disabled').addClass('ui-state-disabled');
      $('.quality-engineer-combo select').removeClass('ui-state-disabled').addClass('ui-state-disabled');
      $('.cell-leader-combo select').removeClass('ui-state-disabled').addClass('ui-state-disabled');
      $('.add-button').addClass("ui-state-disabled");
    }
    else {
      $('.Submit').show();
      $('.manufacturing-engineer-combo select').removeClass('ui-state-disabled');
      $('.quality-engineer-combo select').removeClass('ui-state-disabled');
      $('.cell-leader-combo select').removeClass('ui-state-disabled');
      $('.add-button').removeClass("ui-state-disabled");
    }

    // Add group edit button (Metrology users) and Include Completed checkbox
    if (isMetrologyUser()) {
      if ($('.group-edit-button').length == 0) {
        $('.tasklist-table .cf-section-header').prepend('<div class="choice include-choice"><input name="chkIncludeComplete" id="chkIncludeComplete" type="checkbox" ><label class="form-option-label" for="chkIncludeComplete">Include Completed</label></div><div class="ui-button group-edit-button" onclick="callGroupEdit()"><span title="Group Edit" class="ui-button-icon ui-icon ui-icon-clipboard"></span>Group Edit</div>');
      }
    }
    else {
      if ($('.include-choice').length > 0) {
        let include_chk = '<div class="choice include-choice"><input name="chkIncludeComplete" id="chkIncludeComplete" type="checkbox" ><label class="form-option-label" for="chkIncludeComplete">Include Completed</label></div>'
        $('.tasklist-table .cf-section-header').prepend(include_chk);
      }
    }

    // Add "Add Task" button if missing
    if ($('.add-button').length == 0) {
      let add_button = '<div class="ui-button add-button" onclick="addTask()"><span title="AddTicket" class="ui-button-icon ui-icon ui-icon-plusthick"></span>Add Task</div>';
      $(add_button).insertBefore('.tasklist-table table')
    }

    // Wire Include Completed and build the filter row
    $('#chkIncludeComplete').on('change', function () {
      filterTable();
    });
    generateFilterRow();

    // Add print button once
    if (!$('#print-ticket').length) {
      $('.ticket-number input').parent().append(`<div id='print-ticket' class='print-button ui-button' onclick='printTicket()'><span title='Print Ticket' class='ui-button-icon ui-icon ui-icon-print'/></div>`);
    }


    $('.tasklist-table').show();
  });

  // Finalize initial UI once all lookups are done
  $(document).on("onloadlookupfinished", function (e) {
    $('.closeme input').val(1);
    $('#q0').append("<div class='hidden-text' id='popUpDiv'></div>");
    $('.detail-input div').on("dblclick", function (e) {
      var notes = $(this).find('textarea').val();
      console.log(notes);
      $.dialog({
        escapeKey: true,
        backgroundDismiss: true,
        title: 'Ticket Details',
        content: notes,
      });
    });

    var ticketID = $('.tid input').val();
    if ((ticketID != '') && (ticketID != '0')) {
      $('#ticket-history').append(`<iframe id='ticket-history-iframe' name='ticket-history-iframe' src='http://rmslf/Forms/MPM-ProgamTicketHistory?tid=${ticketID}' height='500' width='100%'/>`);
      if ($('.quality-engineer-combo select option').length == 1) {
        console.log('No QE');
        $('.ticket-department-id input').trigger("change");
      }
    }

    if (($('.site-id input').val() != '0') && ($('.site-id input').val() != '')) {
      let assingeesCombo = $('.assignee-lookup-combo select option');
      if (typeof assingeesCombo !== 'undefined') {
        $('.site-id input').trigger("change");
      }
      else if (assingeesCombo.length < 2) {
        $('.site-id input').trigger("change");
      }
    }

    $('.network-user-name input').trigger("change");
    $('.fincomp input').val(0).change();
  });
});

/**
 * Opens Add Task dialog for the current ticket in a popup iframe.
 */
function addTask() {
  var ticketID = $('.tid input').val();
  var widowHeight = $(window).height();
  widowHeight = widowHeight - 50;
  popUpIframe(`http://rmslf/Forms/MPM-AddProgrammingTask?pid=${ticketID}`, 'Add Task', widowHeight, 1300);
}

/**
 * Opens Add Time dialog for the selected task, if permissions allow.
 * @param {number} task_id
 */
function callAddTime(task_id) {
  if (checkPermissions() == true) {
    var task_name = getColumnValueByTaskID(task_id, '.tasklist-task-name-col input[type="text"]');
    popUpIframe(`http://rmslf/Forms/MPMAddTaskTime?tid=${task_id}`, `Add Time to task '${task_name}'`, 300, 800, false, task_id);
  }
}

/**
 * Opens Clone Task dialog after checking user type and department permissions.
 * @param {number} task_id
 */
function callCloneTask(task_id) {
  var user_type_id = Number($(".user-type-id input").val());
  var userDepartmentID = $(".user-department-id input").val();
  var departmentID = $(".ticket-department-id input").val();

  if (user_type_id == 2 || user_type_id == 4 || user_type_id == 5) {
    $.alert({ title: 'Nope!', content: 'Sorry, you do not have permissions to do this.' });
    return;
  }

  if (user_type_id == 3) {
    if (departmentID != userDepartmentID) {
      $.alert({ title: 'Nope!', content: 'Sorry, you do not have permissions to do this.' });
      return;
    }
  }

  var task_name = getColumnValueByTaskID(task_id, '.tasklist-task-name-col input[type="text"]');
  popUpIframe(`http://rmslf/Forms/MPMCloneTask?tid=${task_id}`, `Clone task '${task_name}'`, 300, 750, false, task_id);
}

/**
 * Opens Group Edit dialog for the current ticket.
 */
function callGroupEdit() {
  var ticketId = $('.tid input').val();
  var ticketNumber = $('.ticket-number input').val();
  var widowHeight = $(window).height();
  widowHeight = widowHeight - 50;
  popUpIframe(`http://rmslf/Forms/MPM-TaskGroupEdit?tid=${ticketId}`, `Group Edit Ticket '${ticketNumber}'`, widowHeight, 1300);
}

/**
 * Opens Task Details dialog for the selected task.
 * @param {number} task_id
 */
function callShowDetails(task_id) {
  var widowHeight = $(window).height();
  widowHeight = widowHeight - 50;
  popUpIframe(`http://rmslf/Forms/MPM-EditProgrammingTask?tid=${task_id}`, 'Task Details', widowHeight, 1300);
}

/**
 * Returns true if user can edit this ticket:
 * - Metrology user (type 1), or
 * - Same department as the ticket.
 * @returns {boolean}
 */
function checkPermissions() {
  var user_type_id = Number($(".user-type-id input").val());
  var user_department_id = Number($(".user-department-id input").val());
  var ticket_department_id = Number($(".ticket-department-id input").val());

  if (typeof $('.user-type-id input').val() === 'undefined') {
    return false;
  }

  if (user_type_id == 1) {
    return true;
  }
  else {
    if (user_department_id == ticket_department_id) {
      return true;
    }
  }

  return false;
}

/**
 * Applies current filter controls to hidden filter fields and triggers lookup refresh.
 */
function filterTable() {
  if ($('#filterRow').length == 0) {
    return;
  }

  //$('.tasklist-table').hide();
  var includeCompleted = $('#chkIncludeComplete').is(':checked');
  var taskNameFilterValue = $('#txtFilter_TaskName').val();
  var taskTypeFilterVal = $('#cboFilter_TaskType').val();
  var statusFilterVal = $('#cboFilter_Status').val();
  var assigneeFilterVal = $('#cboFilter_Assignee').val();


  $('.ftname input').val(taskNameFilterValue);

  if ((taskTypeFilterVal != null) && (taskTypeFilterVal.length > 0)) {
    let taskTypeID = taskTypeByNameMap.get(taskTypeFilterVal);
    $('.fttid input').val(taskTypeID);
  }
  else {
    $('.fttid input').val(0);
  }


  if ((statusFilterVal != null) && (statusFilterVal.length > 0)) {
    let statusID = taskStatusNameMap.get(statusFilterVal);
    $('.fsid input').val(statusID);
  }
  else {
    $('.fsid input').val(0);
  }

  if ((assigneeFilterVal != null) && (assigneeFilterVal.length > 0)) {
    let assigneeID = assigneeNameMap.get(assigneeFilterVal);
    $('.faid input').val(assigneeID);
  }
  else {
    $('.faid input').val(0);
  }

  removeAppendedFields();

  /**We only want to call .change() once at the very end by which time all of the filter fields have been set.*/
  if (includeCompleted) {
    $('.fincomp input').val(1).change();
  }
  else {
    $('.fincomp input').val(0).change();
  }

}

/**
 * Creates a filter row (if missing) and wires change events.
 * Also hydrates filter selects from lookup combos. 
 * As an example, Assignees are filtered by name, so a filter select is created and populated from the Assignee lookup combo.
 * What this does is for each filter dropdown, if it's empty it copies the options from the corresponding lookup combo.
 * And then every filter field is wired to call filterTable() on change.
 * It also adds a double-click event to each filter control to clear it.
 * Finally, the Assignee filter gets an "Unassigned" option added to it.
 */
function generateFilterRow() {

  if ($('#filterRow').length == 0) {

    var filter_row = "<TR id='filterRow'><TH/><TH/><TH/><TH><input type='text' id='txtFilter_TaskName'></TH><TH/><TH/><TH><select id='cboFilter_TaskType'/></TH><TH><select id='cboFilter_Assignee'/></TH><TH><select id='cboFilter_Status'/></TH><TH/><TH/><TH/><TH><TH/><TH/></TR>"
    $('.tasklist-table table thead').append(filter_row);
    $("#txtFilter_TaskName").on("change", function () { filterTable(); });
    $("#cboFilter_Status").on("change", function () { filterTable(); });
    $("#cboFilter_TaskType").on("change", function () { filterTable(); });
    $("#cboFilter_Assignee").on("change", function () { filterTable(); });

    $("#txtFilter_TaskName").dblclick(function () { $("#txtFilter_TaskName").val(null).change(); });
    $("#cboFilter_Status").dblclick(function () { $("#cboFilter_Status").val(0).change(); });
    $("#cboFilter_TaskType").dblclick(function () { $("#cboFilter_TaskType").val(0).change(); });
    $("#cboFilter_Assignee").dblclick(function () { $("#cboFilter_Assignee").val(0).change(); });
    wireUpSortFields();
  }

  if ((($('.ftname input').val() != null) && ($('.ftname input').val().length > 0)) && (($('#txtFilter_TaskName').val() == null) || ($('#txtFilter_TaskName').val() == ''))) {
    $('#txtFilter_TaskName').val($('.ftname input').val());
  }

  if (($(".status-lookup-combo select option").length > 1) && ($("#cboFilter_Status option").length == 0)) {
    $("#cboFilter_Status").html($(".status-lookup-combo select").html());
  }
  if (($(".tasktype-lookup-combo select option").length > 1) && ($("#cboFilter_TaskType option").length == 0)) {
    $("#cboFilter_TaskType").html($(".tasktype-lookup-combo select").html());
  }
  if (($(".assignee-lookup-combo select option").length > 1) && ($("#cboFilter_Assignee option").length == 0)) {
    $("#cboFilter_Assignee").html($(".assignee-lookup-combo select").html());
    $("#cboFilter_Assignee option").eq(0).after($('<option>', {
      value: 'Unassigned',
      text: 'Unassigned'
    }));

  }
  
}

/**
 * Generates table buttons in a given column, respecting disabled state.
 * @param {string} buttonSelector Column selector prefix.
 * @param {string} buttonClass jQuery UI icon class.
 * @param {string} buttonTitle Tooltip.
 * @param {string} buttonFunction Function to call with ID.
 * @param {boolean} disabled Render disabled button when true.
 */
function generateTableButtons(buttonSelector, buttonClass, buttonTitle, buttonFunction, disabled) {
  var btn_html = '';
  var selectionString = buttonSelector + " input[type=text]";
  var buttons = $(selectionString);
  buttons.each(function () {
    let btn_value = $(this).val();
    $(this).parent().find(`.table-button`).remove();


    if (disabled == true) {
      btn_html = `<div class='table-button ui-button ui-state-disabled' onclick='javascript:void(0);'><span title='${buttonTitle}' class='ui-button-icon ui-icon ui-state-disabled ${buttonClass}'/></div>`
    }
    else {
      btn_html = `<div class='table-button ui-button' onclick='${buttonFunction}(${btn_value})'><span title='${buttonTitle}' class='ui-button-icon ui-icon ${buttonClass}'/></div>`
    }

    $(this).parent().append(btn_html);
  });
}

/**
 * Renders a disabled checkbox based on a hidden boolean value in the column.
 * It's a general purpose function, but currently used only for the Manual Date column.
 * @param {string} selector Column selector prefix.
 * @param {string} checkboxClass Class assigned to the added checkbox input.
 */
function generateTableCheckBox(selector, checkboxClass) {
  var selectionString = selector + " input[type=text]";
  var checkboxes = $(selectionString);
  checkboxes.each(function () {
    var btn_value = $(this).val();
    if (btn_value == '1') {
      var btn_html = "<input class='" + checkboxClass + "' type='checkbox' disabled checked/>";
      var has_button = $(this).parent().find(`.${checkboxClass}`).length;
      if (has_button == 0) {
        $(this).parent().append(btn_html);
      }
    }
    else {
      var btn_html = "<input class='" + checkboxClass + "' type='checkbox' disabled/>";
      var has_button = $(this).parent().find(`.${checkboxClass}`).length;
      if (has_button == 0) {
        $(this).parent().append(btn_html);
      }
    }
  });
}

/**
 * Adds a clickable task name link to open Task Details for each row (id->name col).
 */
function generateTaskColumn() {
  var task_names = $('.tasklist-task-name-col input[type="text"]');
  var task_ids = $('.tasklist-task-id-col input[type="text"]');
  task_names.each(function (index) {
    let has_link = $(this).parent().find('.task-link').length;
    if (!has_link) {
      let task_id = $(task_ids[index]).val();
      let task_name = $(this).val();
      let task_link = $("<a>", { text: task_name.substr(0, 30), class: 'task-link', href: `javascript:void(0);`, onclick: `callShowDetails(${task_id})` });
      $(this).parent().append(task_link);
    }
  });
}

/**
 * Generates row-level UI (buttons/checkboxes/links) depending on permissions.
 */
function generateTaskListColumnFields() {

  var has_permissions = checkPermissions();

  if ($('.tasklist-table table tbody tr').length > 0) {
    if (has_permissions == false) {
      generateTableButtons(".task-list-clone-col", "ui-icon-newwin", "Clone Task", "callCloneTask", true);
      generateTableButtons(".tasklist-time-col", "ui-icon-clock", "Add Time", "callAddTime", true);
    }
    else {
      if (!isMetrologyUser()) {
        generateTableButtons(".tasklist-time-col", "ui-icon-clock", "Add Time", "callAddTime", true);
      }
      else {
        generateTableButtons(".tasklist-time-col", "ui-icon-clock", "Add Time", "callAddTime", false);
      }
      generateTableButtons(".task-list-clone-col", "ui-icon-newwin", "Clone Task", "callCloneTask", false);
    }

    generateTableCheckBox(".tasklist-mandate-col", "mandate-chk");
    generateTaskColumn();

  }
}

/**
 * Finds a column value in the task list row matching task_id.
 * @param {number} task_id
 * @param {string} column_name jQuery selector for the column input.
 * @returns {string|undefined}
 */
function getColumnValueByTaskID(task_id, column_name) {

  var tasklist_rows = $(".tasklist-table table tbody tr");
  var task_ids = $('.tasklist-task-id-col input[type="text"]');
  var column_value;

  task_ids.each(function (index) {
    let row_task_id = $(this).val();
    if (row_task_id == task_id) {
      let tasklist_row = tasklist_rows[index];
      column_value = $(tasklist_row).find(column_name).val();
      return;
    }
  });
  return column_value;
}

/**
 * Returns true when the current user is active Metrology (type 1 and active).
 * @returns {boolean}
 */
function isMetrologyUser() {
  if (($('.user-type-id input').val() == '1') && ($('.user-isactive input').val() == '1')) {
    return true;
  }
  return false;
}

/**
 * Builds the Assignee lookup maps from the lookup table (id<->name).
 * No-ops if already loaded or table not present.
 */
function loadAssigneeMap() {

  if (assigneeMap.keys.length == 0) {
    var assignee_rows = $('.assignee-lookup-table table tbody tr');
    if (assignee_rows.length == 0) {
      return;
    }
    assignee_rows.each(function (index) {
      assigneeID = Number($(this).find('.assignee-lookup-table-id input').val());
      assigneeName = $(this).find('.assignee-lookup-table-name input').val();
      assigneeMap.set(assigneeID, assigneeName);
      assigneeNameMap.set(assigneeName, assigneeID);
    });
    assigneeMap.set(-1, 'Unassigned');
    assigneeNameMap.set('Unassigned', -1);
  }
}

/**
 * Loads an iframe into the placeholder element for dialogs.
 * @param {string} src URL to load.
 */
function loadiFrame(src) {
  $("#popUpDiv").html("<iframe id='print-iframe' name='print-iframe' src='" + src + "' />");
}

/**
 * Builds the ME lookup maps from the lookup table (id<->name).
 */
function loadMfgEngineerMap() {
  if (mfgEngineerMap.keys.length == 0) {
    var me_rows = $('.me-lookup-table table tbody tr');
    if (me_rows.length == 0) {
      return;
    }
    me_rows.each(function (index) {
      meID = Number($(this).find('.me-lookup-table-id input').val());
      meName = $(this).find('.me-lookup-table-name input').val();
      mfgEngineerMap.set(meID, meName);
      mfgEngineerNameMap.set(meName, meID);
    });
  }
}

/**
 * Builds the QE lookup maps from the lookup table (id<->name).
 */
function loadQualEngineerMap() {
  if (qualEngineerMap.keys.length == 0) {
    var qe_rows = $('.qe-lookup-table table tbody tr');
    if (qe_rows.length == 0) {
      return;
    }
    qe_rows.each(function (index) {
      qeID = Number($(this).find('.qe-lookup-table-id input').val());
      qeName = $(this).find('.qe-lookup-table-name input').val();
      qualEngineerMap.set(qeID, qeName);
      qualEngineerNameMap.set(qeName, qeID);
    });
  }
}

/**
 * Builds the Task Status lookup maps from the lookup table (id<->name).
 */
function loadStatusMap() {
  if (taskStatusMap.keys.length == 0) {
    var status_rows = $('.status-lookup-table table tbody tr');
    if (status_rows.length == 0) {
      return;
    }
    status_rows.each(function (index) {
      statusID = Number($(this).find('.status-lookup-table-id input').val());
      statusName = $(this).find('.status-lookup-table-name input').val();
      taskStatusMap.set(statusID, statusName);
      taskStatusNameMap.set(statusName, statusID);
    });
  }
}

/**
 * Builds the Task Type lookup maps from the lookup table (id<->name).
 */
function loadTaskTypeMap() {

  if (taskTypeMap.keys.length == 0) {
    var tasktype_rows = $('.tasktype-lookup-table table tbody tr');
    if (tasktype_rows.length == 0) {
      return;
    }
    tasktype_rows.each(function (index) {
      tasktypeID = Number($(this).find('.tasktype-lookup-table-id input').val());
      tasktypeName = $(this).find('.tasktype-lookup-table-name input').val();
      taskTypeMap.set(tasktypeID, tasktypeName);
      taskTypeByNameMap.set(tasktypeName, tasktypeID);
    });
  }
}

/**
 * Opens a jQuery UI dialog containing an iframe with the given src.
 * @param {string} src
 * @param {string} title
 * @param {number} height
 * @param {number} width
 */
function popUpIframe(src, title, height, width) {

  $("#popupIFrame").remove();
  $("#popUpDiv").html(`<div height='${height}' width='${width}'><iframe id='popupIFrame' name='myname' src='${src}' height='${height}' width='${width}'/></div>`);
  $("#popupIFrame").dialog({
    title: title,
    height: height,
    width: width,
    autoOpen: false,
    resizable: true,
    modal: true,
    position: { my: "left top", at: "left top", of: window },
    close: function (event, ui) {

    }
  });


  $("#popupIFrame").dialog("open");
  $('#popupIFrame').attr('style', `width: 100%; height: ${height}px;`);
}

/**
 * Loads the ticket print report into an iframe for printing.
 * There is a print version of the ticket detail form that tells it self to print as soon as it loads.
 * This is necessary because LFF of course doesn't have reports or anyway of making one, so I had to roll my own.
 */
function printTicket() {

  var taskID = $('.tid input').val();
  var report_url = `http://rmslf/Forms/MPM-ProgrammingTicketPrint?tid=${taskID}`
  loadiFrame(report_url);
}

/**
 * Reloads the current page.
 */
function refreshForm() {
  var current_url = window.location.href;
  window.location = current_url;
}

/**
 * Removes dynamically appended UI (buttons/links) from the task list to avoid duplicates.
 * This is called before re-adding them after a lookup refresh, or a sort change or a pagination change.
 * Otherwise, the buttons and links would keep accumulating and/or point to the wrong task IDs.
 * So every time you have to refresh the page, you have to delete the old buttons and links first, then refresh, then add them all back again.
 * And they wonder why this page runs slow.
 */
function removeAppendedFields() {
  
  $('.table-button').remove();
  $('.task-link').remove();
}

/**
 * Normalizes ME ID on submit when empty.
 * @param {Event} e
 * This is done because the Manufacturing Engineer field is optional, so if it's left blank we want to submit a 0 instead of an empty string
 * because Laserfiche Workflow doesn't like empty strings in numeric fields.
 */
function submitForm(e) {
  if ($('.meid input').val() == '') {
    $('.meid input').val(0);
  }
}

/**
 * Toggles sort state and updates visible sort icons for the given header.
 * @param {number} newSortOrdinal Field ordinal to sort by (0-based).
 * @param {string} selector Header cell selector (e.g., '#q47').
 */
function sortTable(newSortOrdinal, selector) {
  
  removeAppendedFields();
  $('.sort-icon').remove();

  var currentSortOrdinal = Number($('.sort-field-ordinal input').val());
  var sortDirection = Number($('.sort-direction input').val());

  if (newSortOrdinal == currentSortOrdinal) {
    if (sortDirection == 0) {
      sortDirection = 1
      $('.sort-direction input').val(1).change();
    }
    else {
      sortDirection = 0;
      $('.sort-direction input').val(0).change();
    }
  }
  else {
    $('.sort-field-ordinal input').val(newSortOrdinal);
    $('.sort-direction input').val(0).change();
    sortDirection = 0;
  }

    if (sortDirection == 0) {
      $(`${selector} .cf-col-label`).append('<span class="ui-icon ui-icon-triangle-1-n sort-icon"></span>');
    }
    else {
      $(`${selector} .cf-col-label`).append('<span class="ui-icon ui-icon-triangle-1-s sort-icon"></span>');
    }
}

/**
 * Wires sort click handlers for the visible task list headers and sets default icon.
 * The 'q' numbers are the internal LF field IDs for the columns. Descriptive no?
 */
function wireUpSortFields() {

  $('#q47 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-n sort-icon"></span>');

  $('#q47').on('click', function () { sortTable(0, '#q47'); });
  $('#q48').on('click', function () { sortTable(1, '#q48'); });
  $('#q49').on('click', function () { sortTable(2, '#q49'); });
  $('#q50').on('click', function () { sortTable(3, '#q50'); });
  $('#q52').on('click', function () { sortTable(4, '#q52'); });
  $('#q53').on('click', function () { sortTable(5, '#q53'); });
  $('#q54').on('click', function () { sortTable(6, '#q54'); });
  $('#q55').on('click', function () { sortTable(7, '#q55'); });

}