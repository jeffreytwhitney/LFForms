/**
ServiceTicketProbes.js

  Author:   Jeffrey Whitney
            jtwhitney@machine.com
            651-391-7982
  Date:     9/29/2025

 

Purpose:
  Client-side behaviors for the "Service Ticket Probes" Laserfiche Forms view.
  This form is for editing Service Ticket Probes.
  (When the user is filling out a service ticket, when they choose "CMM Down" 
  there's a list of CMM's but also a list of broken probes to choose from. This form
  is to manage that list of probes.)

Permissions: Metrology Admins only.

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

 On DOM ready this script:
  - Normalizes the current user name into a network-style account and assigns it to `.network-user-name`.
  - Hides the `.Submit` action until an add/edit flow is initiated (and user is admin for edit).
  - Sets the document title to �Service Ticket Probes�.
  - Loads required UI libraries (via CDN) and resolves Bootstrap�s `button` plugin conflict.
  - Subscribes to application events to inject �Edit�/�Add�/�Go Back� buttons and restore previously selected site from a cookie.

 External Dependencies (loaded/assumed):
  - jQuery (required)
  - jquery-cookie (1.4.1) for cookie handling (loaded dynamically)
  - jquery-confirm (3.3.2) CSS/JS (loaded dynamically)
  - jQuery UI CSS (theme: smoothness) (loaded dynamically)
  - simplePagination (1.6) CSS (loaded dynamically)
  - Bootstrap�s jQuery `button` plugin (assumed present; `$.fn.button.noConflict()` is called)

 Custom Events Consumed:
  - document#lookupcomplete: renders row Edit buttons, Go Back buttons, and admin-only Add button.
  - document#onloadlookupfinished: triggers `.network-user-name` change and restores `.site-name` from cookie.

 DOM Contract (required elements/classes):
  - `.lf-user-name input`            : source user value (e.g., DOMAIN\user)
  - `.network-user-name input`       : target normalized user (uppercase username after last backslash)
  - `.Submit`                        : main submit action (hidden until add/edit)
  - `.action-choice input[type=radio]`: action selector (values: `1` Add, `2` Edit)
  - `.add-id input`                  : nonzero indicates Add flow active (set to `1`)
  - `.edit-id input`                 : holds the Probe ID for Edit flow
  - `.user-isadmin input`            : value `'1'` indicates admin
  - `.site-name select`              : selected site persisted to `site_name` cookie
  - `.edit-is-active-value input`    : mirrored to `.edit-probe-is-active` radio group
  - `.edit-probe-is-active input[type=radio]`
  - `.edit-is-bns-value input`       : mirrored to `.edit-is-bns` radio group
  - `.edit-is-bns input[type=radio]`
  - `.probe-table table`             : insertion point for �Add Probe� button
  - `.edit-button-col input[type=text]` : value used as Probe ID to render per-row Edit button
  - `.gobackbutton`                  : placeholder(s) replaced with a �Go Back� button

 */
const machineTypeMap = new Map();
const  machineTypeNameMap = new Map();
$(document).ready(function () {
  // Normalize the current user name into a network-style account (substring after the last '\', uppercased)
  const lfUserName = $('.lf-user-name input').val();
  $('.network-user-name input').val(lfUserName.toUpperCase().substr(lfUserName.lastIndexOf('\\') + 1)).trigger("change");

  // Hide submit until an action (add/edit) is initiated
  $('.Submit').hide();

  // Set page title
  $(document).prop('title', 'Service Ticket Probes');

  // Dynamically load UI helpers and styles
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simplePagination.js/1.6/simplePagination.min.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');

  // Resolve Bootstrap button plugin conflict (restore previous $.fn.button and alias to $.fn.bootstrapBtn)
  const bootstrapButton = $.fn.button.noConflict(); // return $.fn.button to previously assigned value
  $.fn.bootstrapBtn = bootstrapButton;

  $('.Submit').on("click", function (e) { submitForm(e); });

  // Keep "Is Active" radio in sync with its corresponding text/value field
  $(document).on('change', '.edit-is-active-value input', function () {
    const isActive = $('.edit-is-active-value input').val();
    $(`.edit-probe-is-active input[type='radio'][value='${isActive}']`).prop("checked", true);
  });

  // Keep "Is BNS" radio in sync with its corresponding text/value field
  $(document).on('change', '.edit-is-bns-value input', function () {
    const setValue = $('.edit-is-bns-value input').val();
    $(`.edit-is-bns input[type='radio'][value='${setValue}']`).prop("checked", true);
  });

  // Keep "Is Ordered" radio in sync with its corresponding text/value field
  $(document).on('change', '.edit-is-ordered-value input', function () {
    const setValue = $('.edit-is-ordered-value input').val();
    $(`.edit-probe-is-ordered input[type='radio'][value='${setValue}']`).prop("checked", true);
  });

  $(document).on('change', '.edit-probe-is-ordered input[type=radio]', function () {
    const isOrdered = $(`.edit-probe-is-ordered input[type='radio']:checked`).val();
    $('.edit-is-ordered-value input').val(isOrdered).trigger("change");
  });

  // Persist selected site to a cookie for 365 days
  $(document).on('change', '.site-name select', function () {
    const sitename = $('.site-name select').val();
    $.cookie('site_name', sitename, { expires: 365, path: '/' });
  });

  $(document).on('change', '[id^="Field45"]', function (e) {
    generateMachineTypeIDList('add');
  });

  $(document).on('change', '[id^="Field49"]', function (e) {
    generateMachineTypeIDList('edit');
    const machineTypeID = $(this).val();
    const machineTypeName = machineTypeMap.get(Number(machineTypeID));
    const machineTypeNameField = $(this).closest('tr').find('.edit-machine-type-name select');
      machineTypeNameField.val(machineTypeName);

  });

  $(document).on('change', '[id^="Field50"]', function (e) {
    const machineTypeName = $(this).val();
    if (machineTypeName === "") {
      return;
    }
    
    const machineTypeID = machineTypeNameMap.get(machineTypeName);
    const machineTypeIDField = $(this).closest('tr').find('.edit-machine-type-id-col input');
    machineTypeIDField.val(machineTypeID);
    generateMachineTypeIDList('edit');

  });


  // After data lookup completes, inject row buttons and admin-only "Add" button; replace Go Back placeholders
  $(document).on('lookupcomplete', function (e) {
    generateTableButtons(".edit-button-col", "ui-icon-pencil", "Edit Probe", "callEditProbe");
    generateGoBackButtons();
    loadMachineTypeMap();
    if (isAdminUser()) {
      if ($('.add-button').length === 0) {
        const add_button = '<div class="ui-button add-button" onclick="callAddProbe()"><span title="Add Probe" class="ui-button-icon ui-icon ui-icon-plusthick"></span>Add Probe</div>';
        $(add_button).insertBefore('.probe-table table');
      }
    }
  });

  // On initial load completion, propagate user change and restore site from cookie
  $(document).on("onloadlookupfinished", function (e) {
    $('.network-user-name input').trigger("change");
    const sitename = $.cookie('site_name');
    if (sitename !== null) {
      $('.site-name select').val(sitename).trigger("change");
    }
  });



});


/**
 * Initiate the Add Probe flow.
 * - Selects `action-choice` with value `1` (Add)
 * - Sets `.add-id input` to `1`
 * - Shows the `.Submit` action
 *
 * @returns {void}
 */
function callAddProbe() {
  $(`.action-choice input[type='radio'][value='1']`).prop("checked", true);
  $('.add-id input').val(1).trigger("change");
  $('.Submit').show();
}


/**
 * Initiate the Edit Probe flow for a given Probe ID.
 * - Selects `action-choice` with value `2` (Edit)
 * - Sets `.edit-id input` to the provided probeID
 * - Shows `.Submit` only if the user is an admin
 *
 * @param {number|string} probeID - The identifier of the probe to edit.
 * @returns {void}
 */
function callEditProbe(probeID) {
  $(`.action-choice input[type='radio'][value='2']`).prop("checked", true);
  $('.edit-id input').val(probeID).trigger("change");
  if (isAdminUser()) {
    $('.Submit').show();
  }
}


/**
 * Exit Add/Edit mode and return to the default view.
 * - Resets `.add-id input` and `.edit-id input` to `0`
 * - Hides `.Submit`
 *
 * @returns {void}
 */
function callGoBack() {
  $(".add-id input").val(0).trigger("change");
  $(".edit-id input").val(0).trigger("change");
  $('.Submit').hide();
}


/**
 * Replace `.gobackbutton` placeholders by appending a styled "Go Back" button
 * next to each placeholder, then remove the placeholders.
 *
 * @returns {void}
 */
function generateGoBackButtons() {
  const $goback_buttons = $(".gobackbutton");
  $goback_buttons.each(function (index) {
    $(this).parent().append("<div id='go-back' class='ui-button ui-corner-all ui-widget' onclick='callGoBack()'><span class='ui-icon ui-icon-arrowreturnthick-1-w'></span>Go Back</div>");
  });
  $(".gobackbutton").remove();
}


/**
 * Generate a list of Machine Type IDs from input fields in the machine-type-id-col.
 *
 * @returns {void}
 */
function generateMachineTypeIDList(add_or_edit) {
  let machineTypeIDList = "";
  let selector = "";
  let machine_ids_selector = "";

  if (add_or_edit === 'edit') {
    selector = '[id^="Field49"]';
    machine_ids_selector = '.edit-machine-type-ids input';
  } else {
    selector = '[id^="Field45"]';
    machine_ids_selector = '.add-machine-type-ids input';
  }


  $(selector).each(function () {
    const machineTypeID = $(this).val();
    if (machineTypeIDList.length > 0) {
      machineTypeIDList = machineTypeIDList + ", ";
    }
    machineTypeIDList = machineTypeIDList + machineTypeID;

  });
  $(machine_ids_selector).val(machineTypeIDList);
}


/**
 * Generate action buttons inside a table column, one per value-bearing input.
 * It scans for `input[type=text]` under `buttonSelector`, and for each:
 *  - Reads the input's `value`
 *  - Appends a single `.table-button` with the configured UI icon and title
 *  - Sets onclick to `buttonFunction(value)` (e.g., `callEditProbe(123)`)
 *  - Skips if a button with the given `buttonClass` already exists in the same cell
 *
 * @param {string} buttonSelector - jQuery selector for the target cells/column (e.g., ".edit-button-col").
 * @param {string} buttonClass - CSS class for the UI icon (e.g., "ui-icon-pencil").
 * @param {string} buttonTitle - Tooltip/title attribute for the icon.
 * @param {string} buttonFunction - Global function name to invoke on click (receives input value).
 * @returns {void}
 *
 * @example
 * // HTML:
 * // <td class="edit-button-col"><input type="text" value="123" style="display:none" /></td>
 * // JS:
 * generateTableButtons(".edit-button-col", "ui-icon-pencil", "Edit Probe", "callEditProbe");
 * // Result: Renders an Edit button invoking callEditProbe(123)
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
 * @returns {boolean} True if `.user-isadmin input` value is `'1'`; otherwise false.
 */
function isAdminUser() {
  if ($('.user-isadmin input').val() === '1') {
    return true;
  }
  return false;
}


/**
 * Populate machine type lookup maps (id->name and name->id) from hidden lookup table.
 */
function loadMachineTypeMap() {

  if (machineTypeMap.keys.length === 0) {
    const machineType_rows = $('.machine-type-lookup-table table tbody tr');
    if (machineType_rows.length === 0) {
      return;
    }
    machineType_rows.each(function (index) {
      machineTypeID = Number($(this).find('.machine-type-lookup-id input').val());
      machineTypeName = $(this).find('.machine-type-lookup-name input').val();
      machineTypeMap.set(machineTypeID, machineTypeName);
      machineTypeNameMap.set(machineTypeName, machineTypeID);
    });
  }
}



function submitForm(e) {
  editID = Number($('.edit-id input').val());
  if (editID > 0) {
    if (!validateEdit()) {
      e.preventDefault();
      return;
    }
  }
}


function validateEdit() {
  let is_valid = true;
  $(`.edit-probe-is-ordered input[type='radio']`).removeClass('parsley-error');
  $('#is-ordered-value-error').remove();

  const currentQuantity = Number($('.edit-current-quantity input').val());
  const originalQuantity = Number($('.edit-original-quantity input').val());
  const isOrdered = Number($('.edit-is-ordered-value input').val());

  if ((isOrdered === 1) && (currentQuantity > originalQuantity)) {
    $(`.edit-probe-is-ordered input[type='radio']`).parent().addClass('parsley-error');
    $(`.edit-probe-is-ordered`).append("<ul id='is-ordered-value-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>Is Ordered cannot be 'Yes' when the Current Quantity is greater than its original value.</li></ul>");
    is_valid = false;
  }

  return is_valid;
}