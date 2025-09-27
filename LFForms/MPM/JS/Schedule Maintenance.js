/*
File: Schedule Maintenance.js
Purpose: UI logic for the "Schedule Maintenance" page.

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
      There is a user permission model in place to restrict which updates the user can make.
      Metrology users (user-type-id == 1) and QE's (user-type-id == 3) have elevated permissions.
      Amoung Metrology users, there are Admins (is-admin == 1) and regular users (is-admin == 0).
      QE's can add tickets, add tasks to tickets, add notes. 
      They cannot, however, change tickets outside their department. They also cannot change task statuses or assign them to anyone.
      Only Metrology users can do that.
      How authentication is performed: 
      When the user first loads the form, LFF fills in the .lf-user-name field with CRETEX\username. 
      (Predicated on the fact that the user has a LFF account and is logged in to LFF).
      Because of the expense, Cell Leads have not been given LFF accounts, so the .lf-user-name field will be set to "Anonymous User" for them.
      In any case, if the user is logged in to LFF, it sets the .lf-user-name to CRETEX\username, but we only want the username portion 
      so we copy just the username portion (trimming off the "CRETEX/" part) into the .network-user-name field, 
      which is what gets posted back to the server.
      This will be matched against the user database table to determine the user's ID, user type, and department.

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

var cellLeadMap = new Map();      // Maps OwnerID -> OwnerName
var cellLeadNameMap = new Map();  // Maps OwnerName -> OwnerID

$(document).ready(function () {
  // Normalize and copy LF username into the network user field (USER portion of DOMAIN\USER).
  var lfUserName = $('.lf-user-name input').val();
  $('.network-user-name input').val(lfUserName.toUpperCase().substr(lfUserName.lastIndexOf('\\') + 1)).change();

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
  var bootstrapButton = $.fn.button.noConflict(); // return $.fn.button to previously assigned value
  $.fn.bootstrapBtn = bootstrapButton;

  // Keep hidden "is active" value and radio group in sync (Edit section).
  $(document).on('change', '.edit-is-active-value input', function () {
    var isActive = $('.edit-is-active-value input').val();
    $(`.edit-schedule-is-active input[type='radio'][value='${isActive}']`).prop("checked", true);
  });
  $(document).on('change', ".edit-schedule-is-active input[type='radio']", function () {
    var isActive = $(this).val();
    $('.edit-is-active-value input').val(isActive);
  });

  // Keep hidden "name trimming" value and radio group in sync (Edit section).
  $(document).on('change', '.edit-name-trimming-value input', function () {
    var isAdmin = $('.edit-name-trimming-value input').val();
    $(`.edit-do-part-name-trimming input[type='radio'][value='${isAdmin}']`).prop("checked", true);
  });
  $(document).on('change', ".edit-do-part-name-trimming input[type='radio']", function () {
    var isAdmin = $(this).val();
    $('.edit-name-trimming-value input').val(isAdmin);
  });

  // When owner name changes, set the corresponding owner ID (Edit section).
  $(document).on('change', '.edit-schedule-owner-cbo select', function () {
    var ownerName = $(this).val();
    if (cellLeadNameMap.has(ownerName)) {
      var ownerID = cellLeadNameMap.get(ownerName);
      $('.edit-owner-id input').val(ownerID);
    }
    else {
      $('.edit-owner-id input').val(0);
    }
  });

  // Persist selected site to cookie.
  $(document).on('change', '.site-name select', function () {
    var sitename = $('.site-name select').val();
    $.cookie('site_name', sitename, { expires: 365, path: '/' });
  });

  $(document).on('lookupcomplete', function () {
    generateTableButtons(".edit-button-col", "ui-icon-pencil", "Edit Schedule", "callEditSchedule");
    fillCellLeadSelect();
    generateGoBackButtons();
    loadCellLeadMap();

    if (isAdminUser()) {
      if ($('.add-button').length == 0) {
        var add_button = '<div class="ui-button add-button" onclick="callAddSchedule()"><span title="Add Schedule" class="ui-button-icon ui-icon ui-icon-plusthick"></span>Add Schedule</div>';
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
    var sitename = $.cookie('site_name');
    if (sitename != null) {
      $('.site-name select').val(sitename).change();
    }
  });
});


/**
 * Switches the form into "Add Schedule" mode and reveals the Submit button.
 * Sets the action choice to Add (value = 1).
 */
function callAddSchedule() {
  $(`.action-choice input[type='radio'][value='1']`).prop("checked", true);
  $('.add-id input').val(1).change();
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
  $('.edit-id input').val(scheduleID).change();
  if (isAdminUser()) {
    $('.Submit').show();
  }
}


/**
 * Resets add/edit state and hides the Submit button.
 * Intended for use by the dynamically generated "Go Back" buttons.
 */
function callGoBack() {
  $(".add-id input").val(0).change();
  $('.add-owner-id input').val(0).change();
  $('.add-department-id input').val(0).change();
  $('.add-schedule-owner-cbo select').val('');

  $(".edit-id input").val(0).change();
  $('.edit-owner-id input').val(0).change();
  $('.edit-department-id input').val(0).change();
  $('.edit-schedule-owner-cbo select').val('');

  $('.Submit').hide();
}


/**
 * Selects the owner in the edit owner combo based on the current hidden owner ID,
 * if that ID exists in the loaded Cell Lead map.
 */
function fillCellLeadSelect() {
  var ownerID = Number($('.edit-owner-id input').val());
  var selectLength = $('.edit-schedule-owner-cbo select option').length;

  if ((cellLeadMap.has(ownerID)) && (selectLength > 1)) {
    var ownerName = cellLeadMap.get(ownerID);
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
  var $goback_buttons = $(".gobackbutton");
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
  var selectionString = buttonSelector + " input[type=text]";
  var buttons = $(selectionString);
  buttons.each(function () {
    var btn_value = $(this).val();
    var btn_html = `<div class='table-button ui-button' onclick='${buttonFunction}(${btn_value})'><span title='${buttonTitle}' class='ui-button-icon ui-icon ${buttonClass}'/></div>`;

    var has_button = $(this).parent().find(`.${buttonClass}`).length;
    if (has_button == 0) {
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
  if ($('.user-isadmin input').val() == '1') {
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
    var cellLead_rows = $('.celllead-lookup-table table tbody tr');
    if (cellLead_rows.length == 0) {
      return;
    }
    cellLead_rows.each(function () {
      var cellLeadID = Number($(this).find('.celllead-lookup-table-id input').val());
      var cellLeadName = $(this).find('.celllead-lookup-table-name input').val();
      cellLeadMap.set(cellLeadID, cellLeadName);
      cellLeadNameMap.set(cellLeadName, cellLeadID);
    });
  }
}
