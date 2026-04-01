/*
File: Schedule Maintenance.js

  Author:   Jeffrey Whitney
            jtwhitney@machine.com
            651-391-7982
  Date:     9/29/2025


Purpose: UI logic for the "Schedule Maintenance" page.

Permissions: Must be Metrology User to view. Only Admins can add/edit schedules. (See 'User Permissions' below.)

Overview:
- On DOM ready:
  - Sets the document title.
  - Normalizes and copies the current LF user name into the network user field.
  - Hides Submit controls.
  - Loads required external scripts and styles (jQuery Cookie, jQuery Confirm, jQuery UI theme, SimplePagination CSS).
  - Resolves Bootstrap/jQuery UI button plugin naming conflict via noConflict.
  - Wires up UI synchronization between hidden values and radio groups.
  - Persists site selection in a cookie.

Key Concepts:
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

      Mapping:
       There are several differnent lookup tables on the form which are used to populate dropdowns, nearly all of which are for filtering.
       Task types are stored both as ID?Name and Name?ID because LFF only stores the display value in the select, for example, the TaskType
       select shows the names of the task types, but we are storing the TaskTypeID in a the database, so we need to have a way to 
       figure out what the TaskTypeID is so that we can set the value of the hidden field that the workflow is going to use to 
       set the value in the task table. So we need to be able to look up the ID by name when the user selects a task type.
       The only way I've been able to figure out how to do this is to have a hidden lookup table on the page which contains all the 
       task types and their IDs. So when the page loads, we read that table and build two maps: one for ID?Name and one for Name?ID.
       When the user selects a task type, we look up the ID by name and set the value of the hidden field.

- On "lookupcomplete":
  - Generates per-row Edit buttons.
  - Loads Cell Lead maps and syncs the owner select.
  - Inserts a "Go Back" button where needed.
  - If the user is an admin, inserts an "Add Schedule" button.

- On "onloadlookupfinished":
  - Triggers change on the normalized network user field.
  - Restores previously selected site from cookie (if present).

Dependencies:
  - jQuery
  - jQuery Cookie (cdnjs)
  - jQuery Confirm (cdnjs)
  - jQuery UI CSS (code.jquery.com)
  - SimplePagination CSS (cdnjs)
  - Bootstrap JS (button plugin conflict resolved via noConflict)
 */

const cellLeadMap = new Map();      // Maps OwnerID -> OwnerName
const cellLeadNameMap = new Map();  // Maps OwnerName -> OwnerID

$(document).ready(function () {
  // Normalize and copy LF username into the network user field (USER portion of DOMAIN\USER).
  const lfUserName = $('.lf-user-name input').val();
  $('.network-user-name input').val(lfUserName.toUpperCase().substr(lfUserName.lastIndexOf('\\') + 1)).trigger("change");

  // Initial page setup.
  $('.Submit').hide();
  $(document).prop('title', 'Schedule Maintenance');

  // Load external scripts and styles needed by this page.
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simplePagination.js/1.6/simplePagination.min.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');

  // Resolve Bootstrap button plugin conflict with jQuery UI.
  const bootstrapButton = $.fn.button.noConflict(); // return $.fn.button to previously assigned value
  $.fn.bootstrapBtn = bootstrapButton;

  // Keep hidden "is active" value and radio group in sync (Edit section).
  $(document).on('change', '.edit-is-active-value input', function () {
    const isActive = $('.edit-is-active-value input').val();
    $(`.edit-schedule-is-active input[type='radio'][value='${isActive}']`).prop("checked", true);
  });
  $(document).on('change', ".edit-schedule-is-active input[type='radio']", function () {
    const isActive = $(this).val();
    $('.edit-is-active-value input').val(isActive);
  });

  // Keep hidden "name trimming" value and radio group in sync (Edit section).
  $(document).on('change', '.edit-name-trimming-value input', function () {
    const isAdmin = $('.edit-name-trimming-value input').val();
    $(`.edit-do-part-name-trimming input[type='radio'][value='${isAdmin}']`).prop("checked", true);
  });
  $(document).on('change', ".edit-do-part-name-trimming input[type='radio']", function () {
    const isAdmin = $(this).val();
    $('.edit-name-trimming-value input').val(isAdmin);
  });

  // When owner name changes, set the corresponding owner ID (Edit section).
  $(document).on('change', '.edit-schedule-owner-cbo select', function () {
    const ownerName = $(this).val();
    if (cellLeadNameMap.has(ownerName)) {
      const ownerID = cellLeadNameMap.get(ownerName);
      $('.edit-owner-id input').val(ownerID);
    }
    else {
      $('.edit-owner-id input').val(0);
    }
  });

  // Persist selected site to cookie.
  $(document).on('change', '.site-name select', function () {
    const sitename = $('.site-name select').val();
    $.cookie('site_name', sitename, { expires: 365, path: '/' });
  });

  $(document).on('lookupcomplete', function () {
    generateTableButtons(".edit-button-col", "ui-icon-pencil", "Edit Schedule", "callEditSchedule");
    fillCellLeadSelect();
    generateGoBackButtons();
    loadCellLeadMap();

    if (isAdminUser()) {
      if ($('.add-button').length === 0) {
        const add_button = '<div class="ui-button add-button" onclick="callAddSchedule()"><span title="Add Schedule" class="ui-button-icon ui-icon ui-icon-plusthick"></span>Add Schedule</div>';
        $(add_button).insertBefore('.schedule-table table');
      }
    }
  });

  /**
   * Custom event fired after all async onload lookup work finishes.
   * Restores user's previous site selection (if any) and triggers network user change.
   */
  $(document).on("onloadlookupfinished", function () {
    $('.network-user-name input').trigger("change");
    const sitename = $.cookie('site_name');
    if (sitename !== null) {
      $('.site-name select').val(sitename).trigger("change");
    }
  });
});


/**
 * Switches the form into "Add Schedule" mode and reveals the Submit button.
 * Sets the action choice to Add (value = 1).
 */
function callAddSchedule() {
  $(`.action-choice input[type='radio'][value='1']`).prop("checked", true);
  $('.add-id input').val(1).trigger("change");
  $('.Submit').show();
}


/**
 * Switches the form into "Edit Schedule" mode for the specified schedule ID.
 * If the user is an admin, reveals the Submit button.
 *
 * @param {number|string} scheduleID - The ID of the schedule to edit.
 */
function callEditSchedule(scheduleID) {
  $(`.action-choice input[type='radio'][value='2']`).prop("checked", true);
  $('.edit-id input').val(scheduleID).trigger("change");
  if (isAdminUser()) {
    $('.Submit').show();
  }
}


/**
 * Resets add/edit state and hides the Submit button.
 * Intended for use by the dynamically generated "Go Back" buttons.
 */
function callGoBack() {
  $(".add-id input").val(0).trigger("change");
  $('.add-owner-id input').val(0).trigger("change");
  $('.add-department-id input').val(0).trigger("change");
  $('.add-schedule-owner-cbo select').val('');

  $(".edit-id input").val(0).trigger("change");
  $('.edit-owner-id input').val(0).trigger("change");
  $('.edit-department-id input').val(0).trigger("change");
  $('.edit-schedule-owner-cbo select').val('');

  $('.Submit').hide();
}


/**
 * Selects the owner in the edit owner combo based on the current hidden owner ID,
 * if that ID exists in the loaded Cell Lead map.
 */
function fillCellLeadSelect() {
  const ownerID = Number($('.edit-owner-id input').val());
  const selectLength = $('.edit-schedule-owner-cbo select option').length;

  if ((cellLeadMap.has(ownerID)) && (selectLength > 1)) {
    const ownerName = cellLeadMap.get(ownerID);
    $('.edit-schedule-owner-cbo select').val(ownerName);
  }
  else {
    $('.edit-schedule-owner-cbo select').val('');
  }
}


/**
 * Replaces placeholder elements having class "gobackbutton" with functional "Go Back" buttons.
 * The original placeholder elements are removed.
 */
function generateGoBackButtons() {
  const $goback_buttons = $(".gobackbutton");
  $goback_buttons.each(function () {
    $(this).parent().append("<div id='go-back' class='ui-button ui-corner-all ui-widget' onclick='callGoBack()'><span class='ui-icon ui-icon-arrowreturnthick-1-w'></span>Go Back</div>");
  });
  $(".gobackbutton").remove();
}


/**
 * Generates per-row table action buttons by inspecting hidden text inputs within the target selector.
 *
 * @param {string} buttonSelector - CSS selector scoping the search (e.g., a column/cell selector).
 * @param {string} buttonClass - Icon class to apply (e.g., "ui-icon-pencil").
 * @param {string} buttonTitle - Title/tooltip for the button.
 * @param {string} buttonFunction - Global function name to invoke on click; receives the hidden input's value.
 */
function generateTableButtons(buttonSelector, buttonClass, buttonTitle, buttonFunction) {
  const selectionString = buttonSelector + " input[type=text]";
  const buttons = $(selectionString);
  buttons.each(function () {
    const btn_value = $(this).val();
    const btn_html = `<div class='table-button ui-button' onclick='${buttonFunction}(${btn_value})'><span title='${buttonTitle}' class='ui-button-icon ui-icon ${buttonClass}'/></div>`;

    const has_button = $(this).parent().find(`.${buttonClass}`).length;
    if (has_button === 0) {
      $(this).parent().append(btn_html);
    }
  });
}


/**
 * Indicates whether the current user has admin privileges.
 *
 * @returns {boolean} True if user is admin; otherwise, false.
 */
function isAdminUser() {
  if ($('.user-isadmin input').val() === '1') {
    return true;
  }
  return false;
}


/**
 * Loads cell lead data from the lookup table into in-memory maps (ID->Name and Name->ID).
 * Safe to call multiple times; only loads when the map is empty and rows exist.
 */
function loadCellLeadMap() {
  if (cellLeadMap.size === 0) {
    const cellLead_rows = $('.celllead-lookup-table table tbody tr');
    if (cellLead_rows.length === 0) {
      return;
    }
    cellLead_rows.each(function () {
      const cellLeadID = Number($(this).find('.celllead-lookup-table-id input').val());
      const cellLeadName = $(this).find('.celllead-lookup-table-name input').val();
      cellLeadMap.set(cellLeadID, cellLeadName);
      cellLeadNameMap.set(cellLeadName, cellLeadID);
    });
  }
}
