/*!
  ScheduleUpdateRuns.js

  Author:   Jeffrey Whitney
            jtwhitney@machine.com
            651-391-7982
  Date:     9/29/2025
  
  Permissons Requirement: Must be a Metrology user to request a date refresh. (See "User Permissions" below.)

  Purpose:
    - Orchestrates the Task Maintenance page behavior:
    - Sets up page title, dependencies, and user display.
    - Persists selected site via cookie.
    - Generates action buttons in tables and handles navigation to details.
    - Builds simple pagination controls and handles page changes.
    - Provides "Refresh Dates" action for Metrology users.
    - Adds "Go Back" UI and supports returning from detail views.
 
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
        - onloadlookupfinished: The event fires only once, when all of the initial lookups have completed. 
                                The kinds of lookups that are completed under this event are the ones that do 

        - lookupcomplete: This event fires each time a lookup completes after the onloadlookupfinished event has been called. 
                          Laserfiche has lookup rules applied to certain fields, so that when a field is changed, 
                          it triggers a lookup to fill in other fields.
                          The fields themselves can either be changed by the user directly, or indirectly. 
                          An example of an direct change would be when the user chooses a Site from the dropdown. 
          
    
      Now this gets a bit tricky because the lookupcomplete event can fire multiple times, and we only want to do certain
      things once, so we need to put logic in there so that it's not doing expensive things again and again.
      There is a way of asking what the TriggerID of the lookup is. (A laserfiche function). But I found this 
      to be kind of a pain to use because you have to know the TriggerID of the lookup that you want to respond to 
      and it's just an integer. Also, if you ever change anything in the form, you don't know if the trigger id 
      has changed or not. So I found it easier to just put logic in the function that I want to run
      to make sure that it doesn't, say iterate through a table or something getting values again and 
      again when we only need it to do it once.
    
      For an example of what I'm talking about, we're setting the user name field in code and causing a lookup, 
      (see 'User Permissions' above). Because we're setting the field in code and causing a lookup, 
      the onloadlookupfinished event has already fired. Therefore, any logic that 
      relies on user fields being populated won't work if you call them from the onloadlookupfinished event. 
      Instead, we have to call them from the lookupcomplete event. The unfortunate side effect of this is 
      that the lookupcomplete event can fire multiple times, so we have to put logic in there so that it's 
      not doing expensive things again and again. If you do this wrong, you can seriously lengthen
      the load time of the form. Sometimes this is sort of unavoidable because of the way the LFF Lookup rules work, 
      but you want to minimize it as much as possible.

      Daisy-Chaining Lookups:
        A side-effect of the way lookups work is how they sometimes daisy-chain. Let me explain with an example:
        In our example, we have four fields: LFUserName, NetworkUserName, SiteID, DepartmentLookupTable.
        At the beginning the only field which has anything in it is LFUserName, because LF has filled it in for us.
        We take that value, keeping only the username portion an dput that in NetworkUserName. 
        This causes a lookup for all of the user related fields, including SiteID. Once the SiteID is set, this in turn
        causes another lookup to pull in all the departments related to that site. The Departments Lookup cannot be 
        loaded until we know which site we're talking about. Sometimes this daisy-chaining can get 3 and 
        sometimes even 4 levels deep because of all the relationships between various fields on a form. 
        This causes the form to be slower than it otherwise would have been, but there's not a lot we can do about it.
        It sort of is what it is. This is what happens when you have to make an application with a non-application framework.

  Key DOM contracts (expected elements/fields):
  - .lf-user-name input: contains the LF username (DOMAIN\user or "Anonymous User").
  - .network-user-name input: receives the network user (uppercased SAM).
  - .site-name select: site selector; persisted in cookie "site_name".
  - .schedule-runs-table: container for the runs table; tbody tr counts rows.
  - .edit-button-col input[type=text]: holds IDs used to build "Edit" buttons.
  - .pg input: current page index (number); 999 indicates "no pagination context".
  - .rid input: current run ID; 0 clears/returns to list.
  - .user-type-id input: numeric user type; 1 indicates a Metrology user.
 
  Custom events listened for:
  - lookupcomplete: fired after data lookup completes; triggers button creation, pagination, and Metrology UI.
  - onloadlookupfinished: fired after the page finishes initial data load; restores state and buttons.
 
  External dependencies (loaded dynamically where applicable):
  - jQuery, jQuery UI CSS (theme only), simplePagination CSS
  - jquery-cookie (for persisting site selection)
  - jquery-confirm (CSS/JS preloaded for dialogs elsewhere)
 
  Notes:
  - Pagination assumes a page size of 25 rows.
  - Inline onclick handlers are used for compatibility with existing markup.
  - This file adds only comments/documentation; no behavior changed.
 */

$(document).ready(function () {
  // Hide default Submit button on load and set the page title.
  $('.Submit').hide();
  $(document).prop('title', 'Task Maintenance');

  // Load optional libraries used by this and related pages.
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');

  // Load UI styles required for controls/pagination/confirm dialogs.
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simplePagination.js/1.6/simplePagination.min.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');

  // Avoid Bootstrap/jQuery UI button plugin conflicts by renaming Bootstrap's .button to .bootstrapBtn.
  var bootstrapButton = $.fn.button.noConflict(); // return $.fn.button to previously assigned value
  $.fn.bootstrapBtn = bootstrapButton;

  // Populate ".network-user-name" from LF username when available (maps DOMAIN\user -> USER).
  var lfUserName = $('.lf-user-name input').val();
  if (lfUserName != 'Anonymous User') {
    $('.network-user-name input').val(lfUserName.toUpperCase().substr(lfUserName.lastIndexOf('\\') + 1)).change();
  }

  // Persist selected site to a cookie so it is restored on next visit.
  $(document).on('change', '.site-name select', function () {
    var sitename = $('.site-name select').val();
    $.cookie('site_name', sitename, { expires: 365, path: '/' });
  });

  // After lookup completes, finalize UI: action buttons, pagination, add Metrology-only actions, reveal table.
  $(document).on('lookupcomplete', function (e) {
    generateTableButtons(".edit-button-col", "ui-icon-pencil", "Edit User", "callShowDetails");
    appendPagination();
    if (isMetrologyUser()) {
      if ($('.add-button').length == 0) {
        // Adds a "Refresh Dates" button ahead of the schedule table for Metrology users.
        var add_button = '<div class="ui-button add-button" onclick="callStartRun()"><span title="Refresh Dates" class="ui-button-icon ui-icon ui-icon-plusthick"></span>Refresh Dates</div>';
        $(add_button).insertBefore('.schedule-runs-table table');
      }
    }

    $('.schedule-runs-table').show();
    
  });

  // On initial load completion, restore UI state (cookie, paging), wire "Go Back" buttons, ensure defaults.
  $(document).on("onloadlookupfinished", function (e) {

    // Hidden popup div placeholder used by other flows.
    $('#q0').append("<div class='hidden-text' id='popUpDiv'></div>");

    // Restore site from cookie, if present.
    var sitename = $.cookie('site_name');
    if (sitename != null) {
      $('.site-name select').val(sitename).change();
    }

    // Trigger user field change to propagate network user value.
    $('.network-user-name input').trigger("change");
   
    // Normalize paging default if sentinel value is present.
    if ($('.pg input').val() == '999') {
      $('.pg input').val(1).change();
    }

    // Replace placeholder "Go Back" controls with styled UI buttons.
    generateGoBackButtons();

  });

});

/**
 * Builds simple pagination controls beneath the schedule runs table.
 * 
 * Behavior:
 * - Determines the current page from ".pg input" and the row count from the runs table.
 * - Inserts a #user-pagination control with previous/next links.
 * - Disables links appropriately when at bounds or when fewer than a page of rows exist.
 * - Assumes a fixed page size of 25 rows.
 *
 * Edge cases:
 * - If current page is 999, pagination is skipped (no context).
 */
function appendPagination() {

  var current_page = Number($('.pg input').val());
  if (current_page == 999) { return; }

  var row_count = getTableRowCount();

  if (row_count > 0) {
    $('#user-pagination').remove();
    if ((current_page == 1) && (row_count < 25)) {
      $('.schedule-runs-table table').parent().append("<div id='user-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled'>‹‹</a></li><li><a class='page-link prev isDisabled'>‹</a></li><li><a class='page-link next isDisabled'>›</a></li></ul></div>");
      return;
    }
    if ((current_page == 1) && (row_count == 25)) {
      $('.schedule-runs-table table').parent().append("<div id='user-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled'>‹‹</a></li><li><a class='page-link prev isDisabled'>‹</a></li><li><a class='page-link next' onclick='callNextPage();' href='javascript:void(0);'>›</a></li></ul></div>")
      return;
    }
    if ((current_page > 1) && (row_count == 25)) {
      $('.schedule-runs-table table').parent().append("<div id='user-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev' onclick='resetPageNumber();' href='javascript:void(0);''>‹‹</a></li><li><a class='page-link prev' onclick='callPrevPage();' href='javascript:void(0);''>‹</a></li><li><a class='page-link next' onclick='callNextPage();' href='javascript:void(0);'>›</a></li></ul></div>")
      return;
    }
    if ((current_page > 1) && (row_count < 25)) {
      $('.schedule-runs-table table').parent().append("<div id='user-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev' onclick='resetPageNumber();' href='javascript:void(0);''>‹‹</a></li><li><a class='page-link prev' onclick='callPrevPage();' href='javascript:void(0);''>‹</a></li><li><a class='page-link next isDisabled'>›</a></li></ul></div>")
      return;
    }
  }
}

/**
 * Submits the main form to trigger the "Refresh Dates" workflow.
 * Typically available only to Metrology users via a UI button.
 */
function callStartRun() {
  $('#form1').submit();
}

/**
 * Navigates to the details view for a given run ID by setting ".rid" and triggering change.
 * 
 * @param {number|string} runID - The run identifier to load.
 */
function callShowDetails(runID) {
  $('.rid input').val(runID).change();
  
}

/**
 * Returns from a details view to the list by clearing the current run ID and triggering change.
 */
function callGoBack() {
  $('.rid input').val(0).change(); 
}

/**
 * Advances to the next page of results.
 * - Hides the table and removes any prior table-button elements before changing page.
 * - Increments ".pg input" and triggers change to re-query/bind.
 */
function callNextPage() {
  $('.schedule-runs-table').hide();
  $('.table-button').remove();

  current_page = Number($('.pg input').val());
  $('.pg input').val(current_page + 1).change();
}

/**
 * Moves to the previous page of results when not already on the first page.
 * - Hides the table and removes any prior table-button elements before changing page.
 * - Decrements ".pg input" and triggers change to re-query/bind.
 */
function callPrevPage() {
  $('.schedule-runs-table').hide();
  $('.table-button').remove();

  current_page = Number($('.pg input').val());
  if (current_page == 1) {
    return;
  }
  $('.pg input').val(current_page - 1).change();
}

/**
 * Converts placeholder ".gobackbutton" elements into fully styled "Go Back" UI buttons
 * that invoke callGoBack(), then removes the placeholders.
 */
function generateGoBackButtons() {
  var $goback_buttons = $(".gobackbutton");
  $goback_buttons.each(function (index) {
    $(this).parent().append("<div id='go-back' class='ui-button ui-corner-all ui-widget' onclick='callGoBack()'><span class='ui-icon ui-icon-arrowreturnthick-1-w'></span>Go Back</div>");
  });
  $(".gobackbutton").remove();
}

/**
 * Scans a given column selector for hidden text inputs containing IDs and appends a single
 * button per row if not already present.
 *
 * Intended use:
 * - Create per-row action buttons in table columns that already include a hidden value.
 *
 * @param {string} buttonSelector - Selector for the target column cells (e.g., ".edit-button-col").
 * @param {string} buttonClass - jQuery UI icon class to render on the button (e.g., "ui-icon-pencil").
 * @param {string} buttonTitle - Tooltip/title for the button.
 * @param {string} buttonFunction - Global function name that receives the hidden input value (e.g., "callShowDetails").
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
 * Returns the current number of data rows rendered in the runs table.
 * 
 * @returns {number} Count of tbody rows within ".schedule-runs-table".
 */
function getTableRowCount() {
  var row_count = $('.schedule-runs-table tbody tr').length;
  return row_count;
}

/**
 * Determines whether the current user is a Metrology user.
 * 
 * @returns {boolean} True if ".user-type-id input" equals 1; otherwise false.
 */
function isMetrologyUser() {
  if (Number($('.user-type-id input').val()) == 1) {
    return true;
  }
  return false;
}

/**
 * Resets paging back to the first page and hides the table to allow rebind.
 */
function resetPageNumber() {
  $('.schedule-runs-table').hide();
  $('.pg input').val(1).change();
}
