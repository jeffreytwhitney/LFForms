/**
 Service Ticket CMMs

  Author:   Jeffrey Whitney
            jtwhitney@machine.com
            651-391-7982
  Date:     9/29/2025

 This form requires Admin permissions. (See "User Permissons" below for explanation.)
 Client-side behaviors for the "Service Ticket CMMs" Laserfiche Forms view.
 This form is for editing Service Ticket CMMs.
 (When the user is filling out a service ticket, when they choose "CMM Down"
 it give them a list of CMM's to choose from. This form edits that list.)
 
 Responsibilities:
 - Prefill and normalize the current network user into '.network-user-name input'.
 - Set the page title and lazy-load external dependencies (jQuery Cookie, jQuery Confirm, UI CSS).
 - Drive UI state for Add/Edit/Go Back actions and toggle the Submit button accordingly.
 - Persist the selected site across sessions using the 'site_name' cookie.
 - Generate action buttons (Edit CMM, Add CMM, Go Back) once lookup data is rendered.
 - Keep radio groups in sync with their corresponding hidden/text value fields.

 KEY CONCEPTS:
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


 External dependencies loaded at runtime:
 - jQuery Cookie: https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js
 - jQuery Confirm: https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js
 - jQuery UI (CSS only) and SimplePagination (CSS only)

 Custom events expected from the hosting form:
 - 'lookupcomplete': fired when lookup results have been rendered to the DOM.
 - 'onloadlookupfinished': fired after initial form lookups are complete.

 Key selectors and conventions:
 - '.lf-user-name input': contains the raw domain\username from auth context.
 - '.network-user-name input': receives USERNAME (uppercase, sans domain).
 - '.Submit': container for the form's submit control; hidden until allowed.
 - '.site-name select': site dropdown persisted to cookie 'site_name'.
 - '.edit-is-active-value input' -> mirrors to radio group '.edit-cmm-is-active'.
 - '.edit-is-bns-value input'   -> mirrors to radio group '.edit-is-bns'.
 - '.action-choice' radio: 1 = Add, 2 = Edit.
 - '.add-id input' and '.edit-id input': hidden fields indicating current action target IDs.
 - '.user-isadmin input': '1' when current user is an admin (client-side hint only).
 - '.cmm-table table': CMM listing table; used as insertion point for the "Add CMM" button.
 - '.edit-button-col input[type=text]': placeholder values used to render inline Edit buttons.
 - '.gobackbutton': placeholder elements converted into standardized "Go Back" buttons.

 */

$(document).ready(function () {
  // Normalize logged-in user: extract USERNAME from DOMAIN\USERNAME, uppercase it, and sync the bound field.
  var lfUserName = $('.lf-user-name input').val();
  $('.network-user-name input').val(lfUserName.toUpperCase().substr(lfUserName.lastIndexOf('\\') + 1)).change();

  // Hide submit until an action is chosen and permitted.
  $('.Submit').hide();

  // Set document title.
  $(document).prop('title', 'Service Ticket CMMs');

  // Lazy-load optional libraries and CSS used by downstream UI interactions.
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simplePagination.js/1.6/simplePagination.min.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');

  // Resolve Bootstrap/jQuery UI button name collision if Bootstrap is present.
  var bootstrapButton = $.fn.button.noConflict(); // return $.fn.button to previously assigned value
  $.fn.bootstrapBtn = bootstrapButton;

  // Keep ".edit-cmm-is-active" radios in sync when the bound value field changes.
  $(document).on('change', '.edit-is-active-value input', function () {
    var isActive = $('.edit-is-active-value input').val();
    $(`.edit-cmm-is-active input[type='radio'][value='${isActive}']`).prop("checked", true);
  });

  // Keep ".edit-is-bns" radios in sync when the bound value field changes.
  $(document).on('change', '.edit-is-bns-value input', function () {
    var setValue = $('.edit-is-bns-value input').val();
    $(`.edit-is-bns input[type='radio'][value='${setValue}']`).prop("checked", true);
  });

  // Persist selected site to cookie to maintain user preference across sessions.
  $(document).on('change', '.site-name select', function () {
    var sitename = $('.site-name select').val();
    $.cookie('site_name', sitename, { expires: 365, path: '/' });
  });

  // After lookup results are rendered, add per-row Edit buttons and a global Add button (admins only). Also generate Go Back buttons.
  $(document).on('lookupcomplete', function (e) {
    generateTableButtons(".edit-button-col", "ui-icon-pencil", "Edit CMM", "callEditCMM");
    generateGoBackButtons();
    if (isAdminUser()) {
      if ($('.add-button').length == 0) {
        var add_button = '<div class="ui-button add-button" onclick="callAddCMM()"><span title="Add CMM" class="ui-button-icon ui-icon ui-icon-plusthick"></span>Add CMM</div>';
        $(add_button).insertBefore('.cmm-table table');
      }
    }
  });

  // On initial load, restore the last selected site and ensure the normalized username is propagated.
  $(document).on("onloadlookupfinished", function (e) {
    $('.network-user-name input').trigger("change");
    var sitename = $.cookie('site_name');
    if (sitename != null) {
      $('.site-name select').val(sitename).change();
    }
  });

});


/**
 * Enter "Add CMM" mode.
 * - Selects the "Add" action.
 * - Sets a non-zero add ID (1) to trigger related business rules.
 * - Reveals the Submit button.
 */
function callAddCMM() {
  $(`.action-choice input[type='radio'][value='1']`).prop("checked", true);
  $('.add-id input').val(1).change();
  $('.Submit').show();
}


/**
 * Enter "Edit CMM" mode for a given CMM ID.
 * - Selects the "Edit" action.
 * - Sets the target edit ID.
 * - Reveals the Submit button only for admin users.
 *
 * @param {number|string} cmmID - Identifier of the CMM row to edit.
 */
function callEditCMM(cmmID) {
  $(`.action-choice input[type='radio'][value='2']`).prop("checked", true);
  $('.edit-id input').val(cmmID).change();
  if (isAdminUser()) {
    $('.Submit').show();
  }
}


/**
 * Exit Add/Edit mode and return to neutral state.
 * - Clears both add and edit IDs.
 * - Hides the Submit button.
 */
function callGoBack() {
  $(".add-id input").val(0).change();
  $(".edit-id input").val(0).change();
  $('.Submit').hide();
}


/**
 * Replace all '.gobackbutton' placeholders with standardized "Go Back" UI buttons.
 * This ensures consistent look-and-feel and single-click behavior.
 */
function generateGoBackButtons() {
  var $goback_buttons = $(".gobackbutton");
  $goback_buttons.each(function (index) {
    $(this).parent().append("<div id='go-back' class='ui-button ui-corner-all ui-widget' onclick='callGoBack()'><span class='ui-icon ui-icon-arrowreturnthick-1-w'></span>Go Back</div>");
  });
  $(".gobackbutton").remove();
}


/**
 * Generate inline action buttons within a table column based on existing placeholder values.
 *
 * @param {string} buttonSelector - Selector for the column/inputs used as anchors (e.g., ".edit-button-col").
 * @param {string} buttonClass - jQuery UI icon class (e.g., "ui-icon-pencil") used for the button.
 * @param {string} buttonTitle - Tooltip/title for the action button.
 * @param {string} buttonFunction - Global function name to invoke on click, receives the placeholder value.
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
 * Indicates whether the current user is an administrator.
 * Reads a DOM-bound flag ('.user-isadmin input') where '1' means admin.
 * Note: This is a client-side hint; enforce permissions on the server.
 *
 * @returns {boolean} True if current user is admin; otherwise false.
 */
function isAdminUser() {
  if ($('.user-isadmin input').val() == '1') {
    return true;
  }
  return false;
}

