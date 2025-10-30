/**
UpdateProgrammingTask.js — Documentation
 
  Author:   Jeffrey Whitney
            jtwhitney@machine.com
            651-391-7982
  Date:     9/29/2025

Permissions:
    - Metrology users (user-type-id == 1) have full permissions.
        This includes:
          - Changing task status
          - Changing task assignee
          - Adding notes
          - Generating pester messages to QE's.
    - Metrology Admins can do everything a regular Metrology user can do, plus:
        - Pester messages to assignees
    - Quality Engineers (user-type-id == 3) can edit tasks only within their department. But they cannot change task status or assignment.
    - Other user types have read-only access.

Overview - Form for viewing/editing a programming task.


 KEY CONCEPTS:
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
      can even access a particular form. For our purposes, the LFF security model is not particularly useful for our needs because we we want
      all users to be able to view the forms. What we want instead is to limit their ability to do certain things inside the application. 
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
          down or needing service, gaging, etc.)
        - Metrology users (user-type-id == 1). They have full permissions to change the status of tasks,
          assign tasks. They can also add tickets, add tasks to tickets, add notes, etc.
      
          There is also a special case Metrology user, the Admin. This is designated in the Users table by the Admin 
          flag being set to 1. Admins can access forms that are not available to the "regular" Metrology user, such 
          as "Department", or "Task Types". (Lookup values which are not likely to change very often, if ever.) There are also a 
          few little things here and there that an Admin can do that a regular Metrology user cannot, such as 
          sending off an Assignee Pester Message. (Emailing the Assignee of a task, asking what's going on with it.)
      
      Lastly, there is a separate flag in the database called IsActive. If a user is inactivated, they have 
      read-only access to the system, regardless of their former user type.
      
      How authentication is performed: 
        When the form first loads, LFF fills in the .lf-user-name field with CRETEX\username. 
        (Predicated on the fact that the user has a LFF account and is logged in to LFF).
        Because of the expense, Cell Leads have not been given LFF accounts, so the .lf-user-name field will be set to "Anonymous User" for them.
        In any case, if the user is logged in to LFF, it sets the .lf-user-name to CRETEX\username, but we only want the username portion 
        so we copy just the username portion (trimming off the "CRETEX\" part) into the .network-user-name field, 
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


Validation rules (`validateForm()`)
- Required fields: task name, operation number, manuf rev, due date, scheduled due date.
- Duplicate prevention: If `.existing-task-id select option` contains any non-zero option different from current task id, flag task name and operation 
                        with duplicate error. If there is an existing task that has the same task name, operation number, 
                        and task type within the same project, the system will not allow you to save the task.
- Status/Hours consistency: Cannot set status to Not Started if `tracked-hours > 0`.
- Assignment rules:
  - You cannot unassign a task once it was assigned.
  - Any status other than Not Started / Cancelled / Not Scheduled requires a valid assignee.
- Returns boolean; `submitForm` halts on false and focuses offending fields.

Status change flows (intercepted in `submitForm`)
- Waiting: `callSetTaskToWaiting()`
  - Requires selecting a waiting reason radio option.
  - If “Other” (value 3) is chosen, a free-text note is required.
  - Sets `.update-waiting-id` and optional `.submit-note` before submit.
- Completed: `callCompleteTask()`
  - Optional completion note; time addition: if “custom” (radio value `X`), amount must be > 1.
  - Sets `.submit-note` then submits.
- Cancelled: `callCancelTask()`
  - Cancellation reason is required; sets `.submit-note` before submit.

Dialogs, popups, and printing
- Popup iframe host: `popupIFrame(src, title, height, width, cancelSubmit)` opens a jQuery UI dialog with an iframe.
  - Used by: Add Note, Pester QE/Assignee, View Notes.
  - Parent window listens for postMessage “CloseDialog” and “CloseDialogWithRefresh”.
- Printing:
  - `printTask()` loads `/Forms/MPM-ProgrammingTicketPrint?tid=...` into a hidden iframe via `loadiFrame`.
  - A postMessage listener for “printme” triggers iframe printing with a slight delay.

Cross-window messaging
- Listeners:
  - “printme” from child print iframe to trigger printing.
  - “CloseDialog”/“CloseDialogWithRefresh” from note/view popups to close iframe dialog and optionally submit parent form.

User experience notes
- Title is updated as the task name changes.
- “Manual Date” checkbox reflects and controls `.man-date input` values (0/1). Tasks with Manual Date set do not have their due dates updated
   by the Schedule Refresh process.
 */

/**
 * Status identifiers used by the form.
 * 1: Not Started
 * 2: Started
 * 3: Waiting
 * 4: Completed
 * 5: Cancelled
 * 7: Not Scheduled
 */
const status_NotStarted = 1;
const status_Started = 2;
const status_Waiting = 3;
const status_Completed = 4;
const status_Cancelled = 5;
const status_NotSched = 7;

/**
 * Main initialization for the Edit Programming Task page.
 * - Injects required CSS/JS, resolves Bootstrap/jQuery UI button conflicts.
 * - Wires event handlers for submit, double-click to view description, title update, time add UI.
 * - Listens for postMessage to support print and popup lifecycle.
 * - On "lookupcomplete": augments UI (pester/print), sets fields and enabled state.
 * - On "onloadlookupfinished": adds buttons, history iframe, and file-path links.
 */
$(document).ready(function () {
  $(document).prop('title', 'Edit Programming Task');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');

  // Resolve Bootstrap v jQuery UI button name collision.
  var bootstrapButton = $.fn.button.noConflict();
  $.fn.bootstrapBtn = bootstrapButton;

  // Wire submit button and apply jQuery UI look.
  $('.Submit').addClass('ui-button ui-corner-all ui-widget');
  $('.Submit').click(function (e) { submitForm(e); });

  // Normalize and copy the network username (DOMAIN\user -> USER) if present.
  var lfUserName = $('.lf-user-name input').val();
  if (lfUserName != '') {
    let networkUserName = $('.lf-user-name input').val().toUpperCase();
    networkUserName = networkUserName.substr(networkUserName.lastIndexOf('\\') + 1);
    $('.network-user-name input').val(networkUserName).change();
  }

  // Cross-window listener to trigger printing from child iframe.
  var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
  var printEvent = window[eventMethod];
  var messageEvent = eventMethod === "attachEvent" ? "onmessage" : "message";
  printEvent(messageEvent, function (e) {

    if (e.data === "printme" || e.message === "printme") {
      function show_print() {
        $("#print-iframe").get(0).contentWindow.print();
      };
      window.setTimeout(show_print, 800); 
    }
  });

  // Keep page title in sync with task name.
  $(document).on('change', '.task-name input', function (e) {
    var task_name = $(this).val();
    $(document).prop('title', `Edit Task ${task_name}`);
  });

  // Default "date to add" to today.
  $('.date-to-add input').val(moment().format('MM/DD/YYYY'));

  // Quick view of long project description in a dialog on double-click.
  $(document).on('dblclick', '.project-description textarea', function (e) {
    var ticketDetail = $(this).val();

    $.dialog({
      escapeKey: true,
      backgroundDismiss: true,
      title: `Details:`,
      content: ticketDetail,
      resizable: true,
      width: 600,
      height: 400,
    });
  });

  // If server instructs close, hide form and request parent to refresh.
  if ($('.closeme input').val() == 1) {
    $('.cf-formwrap').hide();
    window.parent.postMessage('CloseDialogWithRefresh', '*');
  }

  // Time addition radio group -> writes to hidden ".time-to-add".
  $('.add-time fieldset').change(function () {
    var time_to_add = $('.add-time fieldset input[type="radio"]:checked').val();
    if (time_to_add != 'X') {
      $('.time-to-add input').val(time_to_add);
    }
    else {
      $('.time-to-add input').val(1);
    }
  });

  // Manual time amount controls ".time-to-add".
  $('.amount-of-time input').change(function () {
    $('.time-to-add input').val($('.amount-of-time input').val());
  });

  // Popup iframe lifecycle control via postMessage.
  window.onmessage = function (event) {
    if (event.data == "CloseDialog") {
      $("#popupIFrame").dialog("destroy");
      $("#popupIFrame").remove();
    }
    if (event.data == "CloseDialogWithRefresh") {
      $("#popupIFrame").dialog("destroy");
      $("#popupIFrame").remove();
      $("#form1").submit();
    }
  };

  // Data loaded and lookups ready: augment UI and set initial state.
  $(document).on('lookupcomplete', function (e) {
    if (isMetrologyUser()) {
      if (!$('#pester-qe').length) {
        $('.quality-engineer-name input').parent().append("<div id='pester-qe' class='table-button ui-button' onclick='callPesterQE()'><span title='Pester QE' class='ui-button-icon ui-icon ui-icon-mail-closed'/></div>");
      }
      if (!$('#pester-assignee').length) {
        $('.assigned-to select').parent().append(`<div id='pester-assignee' class='table-button ui-button' onclick='callPesterAssignee()'><span title='Pester Assignee' class='ui-button-icon ui-icon ui-icon-mail-closed'/></div>`);
      }
    }

    if (!$('#print-ticket').length) {
      $('.task-name input').parent().append(`<div id='print-ticket' class='table-button ui-button' onclick='printTask()'><span title='Print Task' class='ui-button-icon ui-icon ui-icon-print'/></div>`);
    }
    generateTotalTrackedHoursMessage();
    setFormFields();
    setFormFieldEnableState();
  });

  // Form fully initialized (custom host event).
  $(document).on("onloadlookupfinished", function (e) {
    let task_name = $('.task-name input').val();
    $('.closeme input').val(1);
    $('#q0').append("<div class='hidden-text' id='popUpDiv'></div>");
    $('.btn-wrapper').append("<div id='add-note' class='ui-button ui-corner-all ui-widget' onclick='callAddNote()'><span class='ui-button-icon ui-icon ui-icon-document'></span>Add Note</div>");
    $('.btn-wrapper').append("<div id='view-notes' class='ui-button ui-corner-all ui-widget' onclick='callViewNotes()'><span class='ui-button-icon ui-icon ui-icon-newwin'></span>View Notes</div>");
    $('.network-user-name input').trigger("change");
    var taskID = $('.tid input').val();
    if ((taskID != '') && (taskID != '0')) {
      $('#task-history').append(`<iframe id='task-history-iframe' name='task-history-iframe' src='http://rmslf/Forms/MPM-ProgamTaskHistory?tid=${taskID}' height='500' width='100%'/>`);
    }
    generateFilePathLinks();
  });
});


/**
 * Opens the "Add Note" popup for the current task.
 * Side effects:
 * - Opens jQuery UI dialog with an iframe via popupIFrame.
 */
function callAddNote() {
  var task_id = $('.tid input').val();
  var task_name = $('.task-name input').val();
  popupIFrame(`http://rmslf/Forms/MPMAddNote?TaskID=${task_id}&nt=1`, `Add Note for task '${task_name}'`, 400, 650, false);
}


/**
 * Initiates cancellation flow:
 * - Opens a dialog requiring a cancellation reason.
 * - On OK: writes note to '.submit-note input' and submits the form.
 * Validation:
 * - Cancellation note must be non-empty.
 */
function callCancelTask() {
  var noteField = $('.section-cancellation-note');
  $(noteField).dialog({
    title: 'Add Cancellation Reason (Required)',
    modal: true,
    width: 650,
    height: 425,
    autoOpen: false,
    resizable: false,
    buttons: {
      'OK': function () {

        if ($('.cancellation-note textarea').val().trim() == '') {
          $.alert({ title: 'Must supply cancellation reason!', content: 'Sorry, you need to provide a reason for cancelling this ticket.' });
          return;
        }
        $('.submit-note input').val($('.cancellation-note textarea').val());
        $(this).dialog('close');
        $('#form1').submit();
      }
    }
  });

  $(noteField).dialog("open");
}


/**
 * Initiates completion flow:
 * - Opens a dialog for optional completion note and time addition.
 * - If "custom" time selected (value 'X'), amount must be > 1.
 * - On OK: writes note to '.submit-note input' and submits the form.
 */
function callCompleteTask() {
  var noteField = $('.section-completion-time-note');
  $(noteField).dialog({
    title: 'Add Completion Note (Optional)',
    modal: true,
    width: 800,
    height: 600,
    autoOpen: false,
    resizable: false,
    buttons: {
      'OK': function () {
        let selectedTimeAmount = $('.add-time .radio-checkbox-fieldset input[type="radio"]:checked').val(); 
        let timeAmount = Number($('.amount-of-time input').val());
        if (selectedTimeAmount == 'X') {
          if (timeAmount <= 1) {
            $.alert({ title: 'Must supply amount of time to add!', content: 'Sorry, you need to provide a valid number of hours. (1 hour or greater).' });
            return;
          }
        }
        $('.submit-note input').val($('.completion-note textarea').val());
        $(this).dialog('close');
        $('#form1').submit();
      }
    }
  });

  $(noteField).dialog("open");
}


/**
 * Opens a "Pester Assignee" note popup for the current task.
 * Side effects:
 * - Opens jQuery UI dialog with an iframe via popupIFrame.
 */
function callPesterAssignee() {
  var task_id = $('.tid input').val();
  var task_name = $('.task-name input').val();
  var assignee_name = $('.assigned-to select').val();
  popupIFrame(`http://rmslf/Forms/MPMAddNote?TaskID=${task_id}&nt=3`, `Pester '${assignee_name}' regarding task '${task_name}'`, 400, 650, false);
}


/**
 * Opens a "Pester QE" note popup for the current task.
 * Side effects:
 * - Opens jQuery UI dialog with an iframe via popupIFrame.
 */
function callPesterQE() {
  var task_id = $('.tid input').val();
  var task_name = $('.task-name input').val();
  var qe_name = $('.quality-engineer-name input').val();
  popupIFrame(`http://rmslf/Forms/MPMAddNote?TaskID=${task_id}&nt=2`, `Pester '${qe_name}' regarding task '${task_name}'`, 400, 650, false);
}


/**
 * Initiates "Waiting" flow:
 * - Requires selecting a waiting reason. If "Other" (value 3), a note is required.
 * - Writes selected reason to '.update-waiting-id input' and optional note to '.submit-note input'.
 * - Submits the form on success.
 */
function callSetTaskToWaiting() {
  var noteField = $('.section-waiting-note');
  $(noteField).dialog({
    title: 'Add What you are waiting on (Required)',
    modal: true,
    width: 650,
    height: 600,
    autoOpen: false,
    resizable: false,
    buttons: {
      'OK': function () {
        var selectedLength = $('.waiting-reason .radio-checkbox-fieldset input[type="radio"]:checked').length;
        
        if (selectedLength == 0) {
          $.alert({ title: 'Must select waiting reason!', content: 'Sorry, you need to select what you are waiting on.' });
          return;
        }

        let selectedWaitingValue = Number($('.waiting-reason .radio-checkbox-fieldset input[type="radio"]:checked').val());
        if (selectedWaitingValue == 3) {
          if ($('.waiting-note textarea').val().trim() == '') {
            $.alert({ title: 'Must supply waiting reason!', content: 'Sorry, you need to provide what you are waiting on.' });
            return;
          }
          $('.submit-note input').val($('.waiting-note textarea').val());
        }
        $('.update-waiting-id input').val(selectedWaitingValue).change();
        $(this).dialog('close');
        
        $('#form1').submit();
      }
    }
  });
  $(noteField).dialog("open");
}


/**
 * Shows a copyable schedule file path for the given row index.
 * @param {number} index - Index of the schedule/file-path row in the UI.
 * Side effects:
 * - Opens a jquery-confirm modal with a prefilled input containing the path.
 */
function callShowScheduleFilePath(index) {
  var schedule_name = $('.schedule-col input[type="text"]').eq(index).val();
  var file_path = $('.file-path-col input[type="text"]').eq(index).val();
  

  $.confirm({
    title: `File path for ${schedule_name} schedule`,
    content: '' +
      '<form action="" class="formName">' +
      '<div class="form-group">' +
      '<label>Copy this and paste into Windows Explorer</label>' +
      `<input type="text" value="${file_path}" class="name form-control"/>` +
      '</div>' +
      '</form>',
    buttons: {
      close: function () {
        close
      },
    },
  });

}


/**
 * Opens the "View Notes" popup for the current task.
 * Side effects:
 * - Opens jQuery UI dialog with an iframe via popupIFrame.
 */
function callViewNotes() {
  var task_id = $('.tid input').val();
  var qe_name = $('.quality-engineer-name input').val();
  popupIFrame(`http://rmslf/Forms/MPM-ViewTaskNotes?tid=${task_id}`, `Notes`, 800, 1000, false);
}


/**
 * Synchronizes the "manual date" checkbox with the hidden field '.man-date input':
 * - Checked => value 1
 * - Unchecked => value 0
 * Side effects:
 * - Updates the underlying hidden input value.
 */
function changeManualDate() {
  var manual_date_check = $('#manual-date-chk');
  if ($(manual_date_check).is(":checked")) {
    $('.man-date input[type="text"]').val(1);
  }
  else {
    $('.man-date input[type="text"]').val(0);
  }
}


/**
 * Checks for existing tasks (same Name/Type/Op in current project).
 * Reads options from '.existing-task-id select option' and compares to current '.tid input'.
 * @returns {boolean} True if any different non-zero existing task id is found; otherwise false.
 */
function checkExistingTaskIDs() {
  var existing_task_ids = $('.existing-task-id select option');
  var task_id = $('.tid input').val();
  var returnVal = false;
  existing_task_ids.each(function (index) {
    option_value = Number($(this).val());
    if (option_value == NaN) {
      return returnVal;
    }
    if ((option_value != 0) && (option_value != task_id)) {
      returnVal = true;
    }
  });
  return returnVal;
}


/**
 * Evaluates whether the current user has permission to edit the task.
 * Rules:
 * - user_type_id 1 => full access
 * - user_type_id 3 => access if user's department matches ticket's department
 * @returns {boolean} True if user has edit permissions; otherwise false.
 */
function checkPermissions() {

  var user_type_id = Number($(".user-type-id input").val());
  var user_department_id = Number($(".user-department-id input").val());
  var ticket_department_id = Number($(".ticket-department-id input").val());

  if (user_type_id == 1) {
    return true;
  }

  if (user_type_id == 3) {
    if (user_department_id == ticket_department_id) {
      return true;
    }
  }

  return false;
}


/**
 * Indicates whether the current user is a Metrology user.
 * @returns {boolean} True if '.user-type-id' is 1; otherwise false.
 */
function isMetrologyUser() {
  if ($('.user-type-id input').val() == 1) {
    return true;
  }
  return false;
}


/**
 * Builds clickable links for each schedule name that open a file-path dialog.
 * Expects aligned columns:
 * - '.schedule-col input[type="text"]' for names
 * - '.file-path-col input[type="text"]' for paths
 * Side effects:
 * - Appends anchor elements next to schedule names and a hidden div to hold path values.
 */
function generateFilePathLinks() {
  var scheduleNames = $('.schedule-col input[type="text"]'); 
  var filePaths = $('.file-path-col input[type="text"]');
  
  scheduleNames.each(function (index) {

    let file_path = $(filePaths[index]);
    let file_path_val = $(filePaths[index]).val();
    let schedule_name = $(scheduleNames[index]).val();
    let schedule_link = $("<a>", { text: schedule_name, class: 'schedule-link', href: `javascript:void(0);`, onclick: `callShowScheduleFilePath(${index})` });

    $(this).parent().append(schedule_link);
    $(file_path).parent().append(`<div id="filepath${index}" class="filepath${index}" value="${file_path_val}"/></div>`)
  });

}


/**
 * Renders the "manual date" checkbox next to '.man-date input' (if not already rendered)
 * and reflects the current value ('1' => checked, otherwise unchecked).
 * Side effects:
 * - Appends '#man-date-div' wrapper with '#manual-date-chk' checkbox.
 */
function generateManualCheckBox() {
  if ($('.man-date input').val().length) {
    if (!$('#manual-date-chk').length) {
      var manual_date_field = $('.man-date input');
      var manual_date_val = $('.man-date input').val();
      if (manual_date_val == '1') {
        var manual_chk_html = `<div id="man-date-div"><input id='manual-date-chk' type='checkbox' onchange='changeManualDate()' checked/></div>`;
        manual_date_field.parent().append(manual_chk_html);
      }
      else {
        var manual_chk_html = `<div id="man-date-div"><input id='manual-date-chk' type='checkbox' onchange='changeManualDate()' /></div>`;
        manual_date_field.parent().append(manual_chk_html);
      }
    }
  }
}



/**
 * Generates a message displaying the total tracked hours for the task.
 */
function generateTotalTrackedHoursMessage() {
  $('#existing-time-msg').remove();
  var totalHours = parseFloat($('.tracked-hours input').val());
  var totalHoursMessage = "";
  if (isNaN(totalHours)) {
    totalHours = 0;
  }
  if (totalHours == 0) {
    totalHoursMessage = "<span id='existing-time-msg'>You currently have no hours logged for this task.</span>";
  }
  else if (totalHours == 1) {
    totalHoursMessage = "<span id='existing-time-msg'>You currently have 1 hour logged for this task.</span>";
  }
  else {
    totalHoursMessage = `<span id='existing-time-msg'>You currently have ${totalHours.toFixed(2)} hours logged for this task.</span>`;
  }

  $('#existing-time-div').append(totalHoursMessage);
}


/**
 * Loads an iframe into '#popUpDiv' for printing (hidden until printed).
 * @param {string} src - URL to load in the print iframe.
 * Side effects:
 * - Replaces '#popUpDiv' content with the print iframe.
 */
function loadiFrame(src) {
  $("#popUpDiv").html("<iframe id='print-iframe' name='print-iframe' src='" + src + "' />");
}


/**
 * Disables editing for users without permissions (read-only mode).
 * Side effects:
 * - Adds 'ui-state-disabled' to various actionable elements.
 */
function lockFormNoPermissions() {
  $('.Submit').addClass("ui-state-disabled");
  $('#add-note').addClass("ui-state-disabled");
  
  $('#pester-qe').addClass("ui-state-disabled");
  $('#pester-assignee').addClass("ui-state-disabled");
  $('.task-status select').addClass("ui-state-disabled");
  $('.assigned-to select').addClass("ui-state-disabled");
  $('.task-name input').addClass("ui-state-disabled");
  $('.drawing-number input').addClass("ui-state-disabled");
  $('.manf-rev input').addClass("ui-state-disabled");
  $('.op-number input').addClass("ui-state-disabled");
  $('.due-date input').addClass("ui-state-disabled");
  $('.sched-due-date input').addClass("ui-state-disabled");
  $('#manual-date-chk').parent().addClass("ui-state-disabled");
  $('.job-number input').addClass("ui-state-disabled");
  $('.status-combo select').addClass("ui-state-disabled");
}


/**
 * Disables editing when task is Completed or Cancelled.
 * Side effects:
 * - Adds 'ui-state-disabled' to various actionable elements (similar to no-permissions).
 */
function lockFormCompleteCancelled() {

  $('.Submit').addClass("ui-state-disabled");
  $('#pester-qe').addClass("ui-state-disabled");
  $('#pester-assignee').addClass("ui-state-disabled");
  $('.task-status select').addClass("ui-state-disabled");
  $('.assigned-to select').addClass("ui-state-disabled");
  $('.task-name input').addClass("ui-state-disabled");
  $('.drawing-number input').addClass("ui-state-disabled");
  $('.manf-rev input').addClass("ui-state-disabled");
  $('.op-number input').addClass("ui-state-disabled");
  $('.due-date input').addClass("ui-state-disabled");
  $('.sched-due-date input').addClass("ui-state-disabled");
  $('#manual-date-chk').parent().addClass("ui-state-disabled");
  $('.job-number input').addClass("ui-state-disabled");
  $('.status-combo select').addClass("ui-state-disabled");
}


/**
 * Opens an iframe inside a jQuery UI dialog.
 * @param {string} src - Iframe URL.
 * @param {string} title - Dialog title.
 * @param {number} height - Dialog/iframe height in px.
 * @param {number} width - Dialog/iframe width in px.
 * @param {boolean} cancelSubmit - If true, prevents dialog close from submitting.
 * Side effects:
 * - Creates and opens '#popupIFrame' dialog containing an iframe.
 */
function popupIFrame(src, title, height, width, cancelSubmit) {

  $("#popupIFrame").remove();
  $("#popUpDiv").html(`<div height='${height}' width='${width}'><iframe id='popupIFrame' name='myname' src='${src}' height='${height}' width='${width}'/></div>`);
  $("#popupIFrame").dialog({
    title: title,
    height: height,
    width: width,
    autoOpen: false,
    resizable: true,
    modal: true,
    close: function (event, ui) {
      if (cancelSubmit) {
        return false;
      }
    }
  });

  $("#popupIFrame").dialog("open");
  $('#popupIFrame').attr('style', `width: 100%; height: ${height}px;`);
}


/**
 * Initiates print of the current task by loading the print report in a hidden iframe.
 * Side effects:
 * - Calls loadiFrame with the task print URL; relies on postMessage "printme" to trigger printing.
 */
function printTask() {

  var taskID = $('.tid input').val();
  var report_url = `http://rmslf/Forms/MPM-ProgrammingTicketPrint?tid=${taskID}`
  loadiFrame(report_url);
}


/**
 * Clears all client-side validation error messages and styles.
 * Side effects:
 * - Removes error lists and 'parsley-error' classes from fields.
 */
function resetErrorFields() {
  var task_name = $('.task-name input');
  var task_status = $('.status-combo select');
  var task_operation = $('.op-number input');
  var assignee = $('.assigned-to select');

  $('#operation-error').remove();
  $('#taskname-error').remove();
  $('#status-error').remove();
  $('#operation-error').remove();
  $('#assignee-error').remove();


  task_name.removeClass('parsley-error');
  task_status.removeClass('parsley-error');
  task_operation.removeClass('parsley-error');
  assignee.removeClass('parsley-error');
}


/**
 * Restores enabled state for all actionable fields (removes 'ui-state-disabled').
 * Side effects:
 * - Re-enables controls before applying permission/status-specific locks.
 */
function resetEnabledState() {
  $('.Submit').removeClass("ui-state-disabled");
  $('#add-note').removeClass("ui-state-disabled");
  $('#view-notes').removeClass("ui-state-disabled");
  $('#pester-qe').removeClass("ui-state-disabled");
  $('#pester-assignee').removeClass("ui-state-disabled");
  $('.task-status select').removeClass("ui-state-disabled");
  $('.assigned-to select').removeClass("ui-state-disabled");
  $('.task-name input').removeClass("ui-state-disabled");
  $('.drawing-number input').removeClass("ui-state-disabled");
  $('.manf-rev input').removeClass("ui-state-disabled");
  $('.op-number input').removeClass("ui-state-disabled");
  $('.due-date input').removeClass("ui-state-disabled");
  $('.sched-due-date input').removeClass("ui-state-disabled");
  $('#manual-date-chk').parent().removeClass("ui-state-disabled");
  $('.job-number input').removeClass("ui-state-disabled");
  $('.status-combo select').removeClass("ui-state-disabled");
}


/**
 * Applies enable/disable state to fields based on:
 * - Task existence, user permissions, and current task status.
 * - Metrology-specific rules for status/assignee changes and pester buttons.
 * Side effects:
 * - Calls resetEnabledState(), then conditionally locks form elements.
 */
function setFormFieldEnableState() {
  resetEnabledState();

  if ($('.tid input').val().length == 0) {
    lockFormNoPermissions();
    return;
  }

  if (!checkPermissions()) {
    lockFormNoPermissions();
    return;
  }

  var statusID = Number($('.sid input').val());
  if ((statusID == status_Completed) || (statusID == status_Cancelled)) {
    lockFormCompleteCancelled();
  }

  if (!isMetrologyUser()) {
    $('.status-combo select').addClass('ui-state-disabled');
    $('.assigned-to select').addClass('ui-state-disabled');
  }
  else {
    if ($('.aid input').val() == '') {
      $('#pester-assignee').addClass("ui-state-disabled");
    }
    if ($('.aid input').val() != $('.update-aid input').val()) {
      $('#pester-assignee').addClass("ui-state-disabled");
    }
  }
}


/**
 * Normalizes and back-fills form fields after data is loaded.
 * - Ensures related emails are loaded by triggering site change if needed.
 * - Trims times from note and started dates (keeps yyyy-mm-dd/mm-dd-yyyy).
 * - Syncs selects for assignee/status from name fields if needed.
 * - Renders manual date checkbox UI.
 * Side effects:
 * - May trigger '.site-id input' change, and update select values with .change() to fire downstream handlers.
 */
function setFormFields() {
  if ((Number($('.site-id input').val()) != 0) && ($('.metrology-email input').val() == '')) {
    $('.site-id input').trigger("change");
  }


  $('.note-date input').each((i, dateField) => $(dateField).val($(dateField).val().split(" ")[0]));
  $('.date-started input').each((i, dateField) => $(dateField).val($(dateField).val().split(" ")[0]));

  if (($('.assignee-name input').val() != '') && ($('.assigned-to select').val() == '')) {
    $('.assigned-to select').val($('.assignee-name input').val()).change();
  }
  if (($('.status-name input').val() != '') && ($('.status-combo select').val() == '')) {
    $('.status-combo select').val($('.status-name input').val()).change();
  }
  generateManualCheckBox();
}


/**
 * Submit handler for the form.
 * - Validates client-side rules via validateForm(); prevents submit on failure.
 * - Normalizes missing assignee numeric fields to 0.
 * - If status changes, intercepts and opens appropriate dialog flows (Waiting/Completed/Cancelled).
 * @param {JQuery.Event} e - Click/submit event to be optionally prevented.
 * Side effects:
 * - May open dialogs and delay submission until dialog completion.
 */
function submitForm(e) {
  
  var form_is_valid = validateForm();
  if (form_is_valid == false) {
    e.preventDefault();
    return;
  }

  var statusID = Number($('.sid input').val());
  var newStatusID = Number($('.update-sid input').val());

  if (!$('.aid input').val().length) {
    $('.aid input').val(0);
  }
  if (!$('.update-aid input').val().length) {
    $('.update-aid input').val(0);
  }
  $('#man-date-div').remove();

  if (statusID != newStatusID) { 

    if (newStatusID == status_Waiting) {
      e.preventDefault();
      callSetTaskToWaiting();
      return;
    }

    if (newStatusID == status_Completed) {
      e.preventDefault();
      callCompleteTask();
      return;
    }

    if (newStatusID == status_Cancelled) {
      
      e.preventDefault();
      callCancelTask();
      return;
    }
  }

}


/**
 * Client-side validation for the form.
 * Checks:
 * - Required fields: task name, op number, manuf rev, due date, scheduled due date.
 * - Duplicate tasks: via checkExistingTaskIDs().
 * - Status/hours: cannot set to Not Started when tracked hours > 0.
 * - Assignee rules: cannot unassign once assigned; non-start/cancel/not-sched statuses require assignee.
 * @returns {boolean} True if form is valid; otherwise false.
 * Side effects:
 * - Adds error messages and 'parsley-error' classes to offending fields.
 */
function validateForm() {
  var task_name_field = $('.task-name input');
  var status_field = $('.status-combo select');
  var opnumber_field = $('.op-number input');
  var assignee_field = $('.assigned-to select');
  var manf_rev = $('.manf-rev input');
  var due_date = $('.due-date input');
  var schedule_duedate = $('.sched-due-date input');

  var new_status_val = Number($('.update-sid input').val());
  var existing_assignee_val = $('.aid input').val();
  var new_assignee_val = Number($('.update-aid input').val());
  var tracked_hours_val = $('.tracked-hours input').val();

  var return_val = true;

  resetErrorFields();

  if (task_name_field.val() == "") {
    $('.task-name input').trigger("blur");
    return_val = false;
  }
  if (opnumber_field.val() == "") {
    $('.op-number input').trigger("blur");
    return_val = false;
  }
  if (manf_rev.val() == "") {
    $('.manf-rev input').trigger("blur");
    return_val = false;
  }
  if (due_date.val() == "") {
    $('.due-date input').trigger("blur");
    return_val = false;
  }
  if (schedule_duedate.val() == "") {
    $('.sched-due-date input').trigger("blur");
    return_val = false;
  }

  if (checkExistingTaskIDs()) {
    task_name_field.addClass('parsley-error');
    task_name_field.parent().append("<ul id='taskname-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>A task with this Name, Type, and Op already exist in this project.</li></ul>");
    opnumber_field.addClass('parsley-error');
    opnumber_field.parent().append("<ul id='operation-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>A task with this Name, Type, and Op already exist in this project.</li></ul>");
    return_val = false;
  }

  if ((new_status_val == status_NotStarted) && (tracked_hours_val > 0)) {
    status_field.addClass('parsley-error');
    status_field.parent().append("<ul id='status-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>You can't set a task to 'Not Started' if there are hours assigned to it.</li></ul>");
    return_val = false;
  }

  if (((existing_assignee_val != null) && (existing_assignee_val.length > 0)) && ((new_assignee_val == null) || (new_assignee_val.length == 0))) {
    assignee_field.addClass('parsley-error');
    assignee_field.parent().append("<ul id='status-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>You can't unassign a task once it's been assigned to someone.</li></ul>");
    return_val = false;
  }
 
  if (((new_status_val != status_NotStarted) && (new_status_val != status_Cancelled) && (new_status_val != status_NotSched)) && ((new_assignee_val == null) || (new_assignee_val == 0))) {
    assignee_field.addClass('parsley-error');
    assignee_field.parent().append("<ul id='status-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>You can't have a task status other than 'Not Started' if it's not assigned to someone.</li></ul>");
    return_val = false;
  }

  return return_val;

}
