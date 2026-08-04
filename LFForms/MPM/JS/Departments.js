/**
 Departments.js
 
  Author:   Jeffrey Whitney
            jtwhitney@machine.com
            651-391-7982
  Date:     9/29/2025

 Purpose:
 Controls the Department Maintenance UI for listing, adding, and editing departments.

 Permissions: (See 'User Permissions' below for more detail)
   - Only admin users can add or edit departments.
   - Non-admin users can only view the department list.

 Responsibilities:
 - Normalize and propagate the network username from `domain\user`.
 - Lazy-load UI/library dependencies and resolve Bootstrap/jQuery UI button conflicts.
 - Manage Add/Edit/Go Back actions and show/hide the Submit button based on state and role.
 - Persist the selected site in a cookie and restore it on later loads.
 - Generate dynamic action buttons in table rows after data lookups are complete.
 
Key Concepts:
    User Permissions:
      There is a user permission model in place to restrict which updates a user can make.
      This is separate from LFF security, which can, (but in practice usually does not), limit who 
      can even access a particular form. For our purposes, this is not particularly useful for our needs because we want
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
        In any case, if the user is logged in to LFF, it sets the .lf-user-name to CRETEX\username. However, we only want the username portion,
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
                            The user can either change the fields themselves directly, or indirectly.
                            An example of a direct change would be when the user chooses a Site from the dropdown.
          
    
      Now this gets a bit tricky. The lookupcomplete event can fire multiple times, and we only want to do certain things once. Therefore, we need
      to put logic in there so that it's not doing expensive things again and again.
      There is a way of asking what the TriggerID of the lookup is. (A laserfiche function). But I found this to be kind of a pain to use because
      you have to know the TriggerID of the lookup that you want to respond to, and it's just an integer. Also, if you ever change anything
      in the form, you don't know if the trigger id has changed or not. So, I found it easier to just put logic in the function.
      to make sure that it doesn't, say, iterate through a table or something getting values again and again when we only need it to do it once.
    
      For an example of what I'm talking about, we're setting the username field in code and causing a lookup (see 'User Permissions' above).
      Because we're setting the field in code and causing a lookup, the onloadlookupfinished event has already fired. Therefore, any logic that 
      relies on user fields being populated won't work if you call them from the onloadlookupfinished event. Instead, we have to call them from 
      the lookupcomplete event. The unfortunate side effect of this is that the lookupcomplete event can fire multiple times, 
      so we have to put logic in there so that it's not doing expensive things again and again. If you do this wrong, you can seriously lengthen
      the load time of the form. Sometimes this is sort of unavoidable because of the way the LFF Lookup rules work, 
      but you want to minimize it as much as possible.

      Daisy-Chaining Lookups:
        A side effect of the way lookups work is how they sometimes daisy-chain. Let me explain with an example:
        In our example, we have four fields: LFUserName, NetworkUserName, SiteID, DepartmentLookupTable.
        In the beginning the only field which has anything in it is LFUserName, because LF has filled it in for us.
        We take that value, keeping only the username portion a dput that in NetworkUserName.
        This causes a lookup for all the user-related fields, including SiteID. Once the SiteID is set, this in turn
        causes another lookup to pull in all the departments related to that site. The Department Lookup cannot be loaded until
        we know which site we're talking about. Sometimes this daisy-chaining can get 3 and sometimes even 4 levels deep because of all the relationships between
        various fields on a form. This causes the form to be slower than it otherwise would have been, but there's not a lot we can do about it.
        It sort of is what it is. This is what happens when you have to make an application with a non-application framework.
  
 Key DOM fields/classes:
 - `.lf-user-name input`                 Raw network identity (domain\user).
 - `.network-user-name input`            Derived username (uppercased, no domain).
 - `.Submit`                             Form submit button; hidden by default.
 - `.gobackbutton`                       Placeholder element replaced by a dynamic Go Back button.
 - `.department-table table`             Target for inserting the Add Department button.
 - `.site-name select`                   Site selector; value is stored in cookie `site_name`.
 - `.edit-db-parent-name input`          Text representation of parent department; mirrors to select.
 - `.edit-parent-name select`            Parent department dropdown (edit).
 - `.action-choice`                      Radio group controlling add vs. edit action.
 - `.add-department-id input`            Flag/ID for add action (0 or 1).
 - `.edit-department-id input`           Department ID for edit action (0 or department ID).
 - `.user-isadmin input`                 Indicates whether the current user is an admin ('1' => admin).

 Custom events are observed:
 - `lookupcomplete`                      Used to render action buttons.
 - `onloadlookupfinished`                Used to restore cookie and fire username change.

 Notes:
 - Uses jQuery Cookie to persist the selected site name for 1 year.
 - Submit handler normalizes parent IDs when zero.
 - All dynamic buttons use jQuery UI icon classes.
 */

$(function () {
  const lfUserNameRaw = $('.lf-user-name input').val();
  const lfUserName = (typeof lfUserNameRaw === 'string') ? lfUserNameRaw.trim() : '';
  if ((lfUserName !== '') && (lfUserName !== 'Anonymous User')) {
    $('.network-user-name input').val(lfUserName.toUpperCase().slice(lfUserName.lastIndexOf('\\') + 1)).trigger("change");
  }

  $('.Submit').hide();
  $('.Submit').on("click", function (e) { submitForm(e); });


  $.when(
    $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js'),
    $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js')
  ).done(function () {

    $(document).prop('title', 'Department Maintenance');
    $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
    $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simplePagination.js/1.6/simplePagination.min.css">');
    $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
    $.fn.bootstrapBtn = $.fn.button.noConflict();

  }).fail(function () {
    console.error('Failed to load required scripts');
  });

  $(document).on('change', '.edit-db-parent-name input', function () {
    const editParentName = $('.edit-db-parent-name input').val();
    if (editParentName.length > 0) {
      $('.edit-parent-name select').val(editParentName).trigger("change");
    }
  });

  $(document).on('change', '.site-name select', function () {
    const sitename = $('.site-name select').val();
    $.cookie('site_name', sitename, { expires: 365, path: '/' });
  });

  $(document).on('lookupcomplete', function () {
    generateTableButtons(".edit-button-col", "ui-icon-pencil", "Edit Department", "callEditDepartment");
    if (isAdminUser()) {
      if ($('.add-button').length === 0) {
        const add_button = '<div class="ui-button add-button" onclick="callAddDepartment()"><span title="Add Department" class="ui-button-icon ui-icon ui-icon-plusthick"></span>Add Department</div>'
        $(add_button).insertBefore('.department-table table');
      }
    }
  });

  $(document).on("onloadlookupfinished", function () {
    generateGoBackButtons();
    $('.network-user-name input').trigger("change");
    const sitename = $.cookie('site_name');
    if (sitename !== null) {
      $('.site-name select').val(sitename).trigger("change");
    }
  });

});


function callAddDepartment() {
  $(`.action-choice input[type='radio'][value='1']`).prop("checked", true);
  $('.add-department-id input').val(1).trigger("change");
  $('.Submit').show();
}


function callEditDepartment(departmentID) {
  $(`.action-choice input[type='radio'][value='2']`).prop("checked", true);
  $('.edit-department-id input').val(departmentID).trigger("change");
  if (isAdminUser()) {
    $('.Submit').show();
  }
}


function callGoBack() {
  $(".add-department-id input").val(0).trigger("change");
  $(".edit-department-id input").val(0).trigger("change");
  $('.Submit').hide();
}


function generateGoBackButtons() {
  const $goback_buttons = $(".gobackbutton");
  $goback_buttons.each(function () {
    $(this).parent().append("<div id='go-back' class='ui-button ui-corner-all ui-widget' onclick='callGoBack()'><span class='ui-icon ui-icon-arrowreturnthick-1-w'></span>Go Back</div>");
  });
  $(".gobackbutton").remove();
}


function generateTableButtons(buttonSelector, buttonClass, buttonTitle, buttonFunction) {
  const selectionString = buttonSelector + " input[type=text]";
  const buttons = $(selectionString);
  buttons.each(function () {
    const btn_value = $(this).val();
    const btn_html = `<div class='table-button ui-button' onclick='${buttonFunction}(${btn_value})'><span title='${buttonTitle}' class='ui-button-icon ui-icon ${buttonClass}' /></div>`

    const has_button = $(this).parent().find(`.${buttonClass}`).length;
    if (has_button === 0) {
      $(this).parent().append(btn_html);
    }
  });
}


function isAdminUser() {
  return $('.user-isadmin input').val() === '1';

}


function submitForm() {
  const editParentID = Number($('.edit-parent-id input').val());
  const addParentID = Number($('.add-parent-id input').val());
  if (editParentID === 0) {
    $('.edit-parent-id input').val(0);
  }
  if (addParentID === 0) {
    $('.add-parent-id input').val(0);
  }

}
