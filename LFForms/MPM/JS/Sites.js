/**
' Sites.js - UI behaviors for Site Maintenance.

  Author:   Jeffrey Whitney
            jtwhitney@machine.com
            651-391-7982
  Date:     9/29/2025

 Permissions: Metrology Admins only.

 Purpose:
 - This is an Admin form, (see "User Permissions" below).
 - Initializes the Site Maintenance view, normalizes the current user display, and wires up
   dynamic action buttons for adding/editing sites.
 - Coordinates visibility of the submitted control based on user actions and admin status.

 KEY CONCEPTS:
   User Permissions:
      There is a user permission model in place to restrict which updates a user can make.
      This is separate from LFF security, which can, (but in practice usually does not), limit who 
      can even access a particular form. For our purposes, this is not particularly useful for our needs because we we want
      all users to be able to view the forms. What we want instead is to limit their ability to do certain things
      inside the application. 
      There are several user types that are defined in the database users table, (tblUsers) each with their own
      level of permission. They are:
        - Cell Lead (user-type-id == 5). Cell Leads can only view tickets and tasks. They cannot make any changes.
          In fact, cell leads are not logged in to LFF at all because they do not have LFF accounts.
        - Manufacturing Engineer (user-type-id == 4). They do have LFF accounts but still have read-only access.
        - Quality Engineers, (QE's) (user-type-id == 3). QE's can add tickets, add tasks to tickets, add notes. 
          They cannot, however, change tickets outside their department.
          They also cannot change task statuses or assign them to anyone.
        - Metrology Calibration (user-type-id == 2). They have permissions to update Service Tickets but not programming
          tickets. (A service ticket is a non-programming type of ticket used for things like a machine being
          down or needing service.)_
        - Metrology users (user-type-id == 1). They have full permissions to change the status of tasks,
          assign tasks. They can also add tickets, add tasks to tickets, add notes, etc.
      
      There is also a special case Metrology user, the Admin. This is designated in the User's table by the Admin 
      flag being set to 1. Admins can access forms that are not available to the "regular" Metrology user, such
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

 External dependencies (loaded at runtime via CDN):
 - jQuery
 - jquery-cookie (used elsewhere on the page; loaded here)
 - jquery-confirm (modal styles + behavior; styles loaded here)
 - jQuery UI CSS theme (for UI icon classes)
 - simplePagination CSS (pagination styling; behavior loaded elsewhere)

 DOM contracts (expected elements/values on the page):
 - .lf-user-name input: contains the domain-qualified login (e.g., DOMAIN\jdoe).
 - .network-user-name input: will be set to the uppercased SAM account (e.g., JDOE).
 - .Submit: submit button container that is hidden until an actionable state.
 - .user-isadmin input: "1" if current user is an admin; otherwise not "1".
 - .action-choice input[type=radio]: action selector; "1" for Add, "2" for Edit.
 - .add-id input: numeric flag; set to 1 when adding a site, 0 otherwise.
 - .edit-id input: numeric site id to edit; 0 when not editing.
 - .site-table table: used to place the "Add Site" button before the table when appropriate.
 - .edit-button-col: column containing a hidden text input with the row/site id.
 - .gobackbutton: placeholder element replaced by an actual "Go Back" button.

 Custom events listened:
 - "lookupcomplete": indicates the data-bound table has finished populating.
 - "onloadlookupfinished": indicates the page initial lookup sequence has completed.

 Notes:
 - Maintains global functions (e.g., callAddSite, callEditSite) used by inline onclick handlers.
 - Uses jQuery UI icon classes for button glyphs.
 */

$(document).ready(function () {
  // Normalize and display the current user's network/SAM account (uppercase, post-back safe).
  const lfUserName = $('.lf-user-name input').val();
  $('.network-user-name input').val(lfUserName.toUpperCase().substr(lfUserName.lastIndexOf('\\') + 1)).trigger("change");

  // Hide the submit control by default; it will be shown on actionable states.
  $('.Submit').hide();

  // Set the page title.
  $(document).prop('title', 'Site Maintenance');

  // Load auxiliary libraries/styles used across the page.
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simplePagination.js/1.6/simplePagination.min.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');

  // Resolve Bootstrap's $.fn.button conflict if Bootstrap is present.
  // Restores original $.fn.button and re-exports as $.fn.bootstrapBtn.
  const bootstrapButton = $.fn.button.noConflict(); // return $.fn.button to previously assigned value
  $.fn.bootstrapBtn = bootstrapButton;

  // When the data lookup completes, add per-row edit buttons and a global "Add Site" button (admins only).
  $(document).on('lookupcomplete', function (e) {
    // Add edit buttons to rows that have a hidden id text input in the ".edit-button-col".
    generateTableButtons(".edit-button-col", "ui-icon-pencil", "Edit Site", "callEditSite");

    // Replace any ".gobackbutton" placeholders with a functional "Go Back" button.
    generateGoBackButtons();

    // Add a top-level "Add Site" button once for admin users.
    if (isAdminUser()) {
      if ($('.add-button').length === 0) {
        const add_button = '<div class="ui-button add-button" onclick="callAddSite()"><span title="Add Site" class="ui-button-icon ui-icon ui-icon-plusthick"></span>Add Site</div>';
        $(add_button).insertBefore('.site-table table');
      }
    }
  });

  // Ensure the normalized network user name triggers any bound change handlers after initial load.
  $(document).on("onloadlookupfinished", function (e) {
    $('.network-user-name input').trigger("change");
  });

});


/**
 * Enter "Add Site" mode.
 * - Selects the "Add" action choice.
 * - Sets the add-id flag to 1.
 * - Shows the submit control.
 */
function callAddSite() {
  $(`.action-choice input[type='radio'][value='1']`).prop("checked", true);
  $('.add-id input').val(1).trigger("change");
  $('.Submit').show();
}


/**
 * Enter "Edit Site" mode for a specific site id.
 * - Selects the "Edit" action choice.
 * - Stores the target site id.
 * - Shows the submit control only for admin users.
 *
 * @param {number} siteID - The numeric id of the site to edit.
 */
function callEditSite(siteID) {
  $(`.action-choice input[type='radio'][value='2']`).prop("checked", true);
  $('.edit-id input').val(siteID).trigger("change");
  if (isAdminUser()) {
    $('.Submit').show();
  }
}


/**
 * Exit Add/Edit mode and return to the neutral state.
 * - Resets add-id and edit-id to 0.
 * - Hides the submit control.
 */
function callGoBack() {
  $(".add-id input").val(0).trigger("change");
  $(".edit-id input").val(0).trigger("change");
  $('.Submit').hide();
}


/**
 * Replace placeholder elements with a functional "Go Back" button.
 * - For each element with class ".gobackbutton", appends a styled button that calls callGoBack().
 * - Removes the placeholder elements after replacement.
 *
 * Contract:
 * - Placeholder elements must exist at the desired insertion points.
 */
function generateGoBackButtons() {
  const $goback_buttons = $(".gobackbutton");
  $goback_buttons.each(function (index) {
    $(this).parent().append("<div id='go-back' class='ui-button ui-corner-all ui-widget' onclick='callGoBack()'><span class='ui-icon ui-icon-arrowreturnthick-1-w'></span>Go Back</div>");
  });
  $(".gobackbutton").remove();
}


/**
 * Ensure row-level action buttons exist for a given table column.
 *
 * Behavior:
 * - Locates text inputs under the provided column selector; each input's value is treated as the row id.
 * - For each input, appends a single action button (if not already present) that calls the given
 *   global function with the row id as its only argument.
 *
 * Important:
 * - The input value should be a numeric id; since inline onclick is used without quoting,
 *   non-numeric values may break the handler.
 * - Avoid passing untrusted values into the DOM as they will be embedded in an inline handler.
 *
 * @param {string} buttonSelector - Selector for the target column (e.g., ".edit-button-col").
 * @param {string} buttonClass - jQuery UI icon class to render (e.g., "ui-icon-pencil").
 * @param {string} buttonTitle - Title attribute text for accessibility/tooltip.
 * @param {string} buttonFunction - Name of the global function to invoke (e.g., "callEditSite").
 */
function generateTableButtons(buttonSelector, buttonClass, buttonTitle, buttonFunction) {
  const selectionString = buttonSelector + " input[type=text]";
  const buttons = $(selectionString);
  buttons.each(function () {
    const btn_value = $(this).val();
    const btn_html = `<div class='table-button ui-button' onclick='${buttonFunction}(${btn_value})'><span title='${buttonTitle}' class='ui-button-icon ui-icon ${buttonClass}'/></div>`

    const has_button = $(this).parent().find(`.${buttonClass}`).length;
    if (has_button === 0) {
      $(this).parent().append(btn_html);
    }
  });
}


/**
 * Determine whether the current user has admin privileges.
 *
 * @returns {boolean} True if ".user-isadmin input" has the value "1"; otherwise false.
 */
function isAdminUser() {
  if ($('.user-isadmin input').val() === '1') {
    return true;
  }
  return false;
}
