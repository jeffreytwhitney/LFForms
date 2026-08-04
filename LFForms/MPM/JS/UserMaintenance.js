/**
 UserMaintenance.js
 
  Author:   Jeffrey Whitney
            jtwhitney@machine.com
            651-391-7982
  Date:     9/29/2025


 Purpose:
 - Client-side behaviors for the User Maintenance experience:
   - Pagination controls for the user list
   - Inline table actions (Edit/Add/Go Back)
   - Filtering (Department, User Type, Include Inactive)
   - Sorting indicators and sort toggling
   - Validation for Add/Edit actions


 Permissions: (See 'User Permissions' below for more detail)
   - Only admin users can add or edit users.
   - Non-admin metrology users can only view the user list.

 KEY CONCEPTS:
    User Permissions:
      There is a user permission model in place to restrict which updates a user can make.
      This is separate from LFF security, which can, (but in practice usually does not), limit who 
      can even access a particular form. For our purposes, this is not particularly useful for our needs because we want
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
                            An example of a direct change would be when the user chooses a Site from the dropdown. 
          
    
      Now this gets a bit tricky because the lookupcomplete event can fire multiple times, and we only want to do certain things once. Therefore, we need
      to put logic in there so that it's not doing expensive things again and again.
      There is a way of asking what the TriggerID of the lookup is. (A laserfiche function). But I found this to be kind of a pain to use because
      you have to know the TriggerID of the lookup that you want to respond to, and it's just an integer. Also, if you ever change anything 
      in the form, you don't know if the trigger id has changed or not. So, I found it easier to just put logic in the function.
      
    
      For an example of what I'm talking about, we're setting the username field in code and causing a lookup, (see 'User Permissions' above).
      Because we're setting the field in code and causing a lookup, the onloadlookupfinished event has already fired. Therefore, any logic that 
      relies on user fields being populated won't work if you call them from the onloadlookupfinished event. Instead, we have to call them from 
      the lookupcomplete event. The unfortunate side effect of this is that the lookupcomplete event can fire multiple times, 
      so we have to put logic in there so that it's not doing expensive things again and again. If you do this wrong, you can seriously lengthen
      the load time of the form. Sometimes this is sort of unavoidable because of the way the LFF Lookup rules work, 
      but you want to minimize it as much as possible.

      Daisy-Chaining Lookups:
        A side effect of the way lookups work is how they sometimes daisy-chain. Let me explain with an example:
        In our example, we have four fields: LFUserName, NetworkUserName, SiteID, DepartmentLookupTable.
        At the beginning the only field which has anything in it is LFUserName, because LF has filled it in for us.
        We take that value, keeping only the username portion and put that in NetworkUserName. 
        This causes a lookup for all the user related fields, including SiteID. Once the SiteID is set, this in turn
        causes another lookup to pull in all the departments related to that site. The Department Lookup cannot be loaded until 
        we know which site we're talking about. Sometimes this daisy-chaining can get 3 and sometimes even 4 levels deep because of all the relationships between
        various fields on a form. This causes the form to be slower than it otherwise would have been, but there's not a lot we can do about it.
        It sort of is what it is. This is what happens when you have to make an application with a non-application framework.
   
   Filtering and Sorting:
      There is no way to filter or sort rows in LFF, so I had to build a custom filtering mechanism. This is done via a combination of hidden 
      fields which are arguments to a SQL Server stored procedure. The stored procedure returns a maximum of 25 rows at a time, 
      so we have to be able to filter and sort the rows on the server side.
      There are also two buttons which allow the user to change which page of results they are viewing.
      Here is a list of the hidden fields used for filtering and sorting:

        Filtering:
         - .pg              => current page (integer)
         - .fdid            => department id
         - .futid           => user type id
         - .finc-inactive   => filter include inactive (0/1)

        Sorting:
          .sfo: Field to sort by (1 = Task Name, 2 = Task Type, 3 = Status, 4 = Assignee, 5 = Due Date, 6 = Priority)
          .sd: Sort direction (ASC or DESC)

        Sort column mappings:
          #q21    ->    User Name (default)
          #q22    ->    User Type
          #q23    ->    Department

      This gets us part of the way there, but we also need to have a way for the user to set these fields.
      This is done via a filter row which is added to the task list table. The filter row contains a text box for the task name filter,
      and dropdowns for the task type, status, and assignee filters. There is also a checkbox to include completed tasks.
      The change in any of these controls triggers the filterTable() function which reads the values from the controls and sets the 
      hidden fields accordingly. Values from select controls are mapped from name to ID using the lookup maps.
      Sorting is handled via clickable column headers. Clicking a header sets the sort field and toggles the sort direction.
      If you click on a sort field that is already the current sort field, it toggles the direction.  
            
   Pagination:
     Pagination is related to filtering but serves a different pupose. (In actuality, it's really just another form of filtering, 
     but instead of limiting rows by name or id, it's filtering which page of results to display.)
     
     There are a few things regarding pagination that you should know about.
     To begin with, pagination is necessary on this page because there might be hundreds or thousands of rows being returned from the database.
     This is a problem because the web page will time out formatting them all. 
     This was a pretty big hurdle to overcome at first. Luckily, LFF allows fields to be filled via stored procedure calls, which take 
     arguments. So, as described above in 'Filtering and Sorting', we call a stored procedure to fill the ticket table with information, 
     25 rows at a time. This makes things much more manageable. We have a hidden field called 'pg'. So, if pg=1, we return rows 1-25, 
     pg=2 returns rows 26-50, and so on. We just wire up the "Next Page" and "Previous Page" buttons to increment or decrement the pg field 
     and then trigger a change event on it.

     Quirk with LFF Events:
        Originally I had the table of results load as soon as the page loaded. It seemed obvious: other than the page, which should of
        course be defaulted to 1, there are no filters as yet. The problem occured because I'm adding the filtering in
        by hand. The way filtering works, is that there are a bunch of hidden lookup tables for stuff like Department. I grab all the 
        Department Name values out of the lookup table and put them into the filter value. But I can only add the filter row once the rows are all
        there. Therein lies the rub: LFF Lookups.
        
        There are two kinds of lookups that LF does to populate fields: the kind without any arguments, and the kind with arguments. 
        An example of a lookup without any arguments would be TaskType. I want the hidden TaskType lookup table to get filled 
        immediatly--there's no other information that it relies on. 
        
        Now, Departments and the table rows both rely on one thing: Site. Which Site are we looking at, Coon Rapids or Anoka?
        Ok so each of those things can only be looked up once we know which site we're talking about. Good enough. 
        But now comes it issue of LFF Lookup Order. All the data lookups that LFF uses take place in the order you specify. 
        So if you have Department first and the main table data second, that should mean than the department lookup data is there before 
        we go get the main table data. And this is usually true, emphasis on usually. 
        
        I ran into an issue, (and perhaps it's because the main table's data is being fed by a stored procedure instead of a simple query or table),
        but the load order was acting inconsistently. So in this case, we'd have the table data loaded, so we'd go to load the 
        filter dropdowns, and sometimes the lookup data wouldn't be there yet. It only happened some of the time, but it continued to 
        happen. It was absolutely maddening. The only way around this problem was to have the "pg" field, (which is the page of data
        that is going to be returned), set to 999 by default. The sproc is looking for this value and if it finds it, it won't return anything.
        Then, in the lookupcomplete() function, which fires AFTER all the initial lookups complete, then I ask if the page is set to 999 and 
        if it is, set it to 1 and initiate a lookup. This way, everything works as intended. The lookup data is there so I can make the filter row
        and the town rejoiced._

     Known bug: 
        There's a bug inherent in the pagination functionality, and that is how we currently enable/disable the "Next Page"
        button. The logic is: if there are 25 rows, there must be another page of results. If there are less than that, we know that there 
        isn't another page of results. Where this could come up is when there are a number of results which are exactly divisible by 25. 
        On the last page of results, we'll have 25 rows. According to our logic, we're assuming that there's another page of results, so the user
        can click the "Next Page" button and be presented with...nothing. No rows. This is a known issue. Here is my defense: 
        Point 1: Pagination isn't really used all that much. People generally filter on what they're looking for instead of paging through
                    zillions of rows.
        Point 1.1: Nobody has ever complained about it._
        Point 2: It's not like they can't just click the "Previous Page" button to see the last page.
        Point 3: This problem will only show up if the number of returned rows is divisible by 25, so the likelyhood that anybody is 
                    ever going to run into it is probably kind of small.

     Possible Improvement to Pagination:
        We could write a stored proc that would tell us how many pages there are for the given filters. That way we could change the pagination
        routine to insert buttons for each page of results. The reason I haven't done it is that it's a lot of fuss and bother just to 
        add functionality that nobody's really using anyway. No it wouldn't take long to write, but it seems like needless computation just
        so that the pagination logic is flawless. There are also a bunch of pages that use pagination, so we'd have to have an extra sproc
        for every page that uses pagination. And then there's the extra client-side processing of making a bunch of extra buttons and what not.
        Honestly, the page is slow enough as it is without adding a bunch of extra code for, again, functionality that no one really uses.

     Mapping:
     There are several differnent lookup tables on the form which are used to populate dropdowns, nearly all of which are for filtering.
     Task types are stored both as ID?Name and Name?ID because LFF only stores the display value in the select, for example, the TaskType
     select shows the names of the task types, but we are storing the TaskTypeID in the database, so we need to have a way to 
     figure out what the TaskTypeID is so that we can set the value of the hidden field that the workflow is going to use to 
     set the value in the task table. So we need to be able to look up the ID by name when the user selects a task type.
     The only way I've been able to figure out how to do this is to have a hidden lookup table on the page which contains all the 
     task types and their IDs. So when the page loads, we read that table and build two maps: one for ID?Name and one for Name?ID.
     When the user selects a task type, we look up the ID by name and set the value of the hidden field.    

 Key UI conventions:
 - Most form state is stored in hidden inputs that are read/written by handlers:
   - .pg               => current page (integer)
   - .sfo              => sort field ordinal (integer)
   - .sd               => sort direction (0 = ascending, 1 = descending)
   - .action-choice    => 1 = Add User, 2 = Edit User
   - .add-user-id      => toggles Add mode (1 = add mode active)
   - .edit-user-id     => identifies the user being edited (> 0)
   - .user-isadmin     => current user's admin flag ('1' when admin)
   - .fdid/.futid      => filter field hidden backing values (Department/UserType ids)
   - .finc-inactive    => filter include inactive (0/1)
 
 Dependencies loaded at runtime:
 - jQuery (core)
 - jquery-cookie (cookies) https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js
 - jquery-confirm (dialogs) https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js
 - jQuery UI CSS (icons used for sort and action buttons)
 - simplePagination CSS (styling only; markup is rendered manually here)
 
 Notable UI behaviors:
 - Page size: 25 rows per page.
 - A page value of 999 is treated as a sentinel and pagination is suppressed.
 - Filtering replicates options from hidden/lookup combo boxes into the header filter row.
 - Sorting only toggles indicators/hidden inputs; server or external components react to changes.
 
 Conventions in this file:
 - Functions are side-effect oriented; most trigger DOM updates and set hidden inputs, then call .trigger("change").
 - Uses <span> with jQuery UI icon classes for action buttons in table cells.
 */

// Lookup maps for departments and user types.
// - departmentMap:     departmentId (number) => departmentName (string)
// - departmentNameMap: departmentName (string) => departmentId (number)
// - userTypeMap:       userTypeId (number) => userTypeName (string)
// - userTypeNameMap:   userTypeName (string) => userTypeId (number)
const departmentMap = new Map();
const departmentNameMap = new Map();
const userTypeMap = new Map();
const userTypeNameMap = new Map();

$(function () {
  // Normalize Network User Name based on LF user name. Store uppercase simple username portion.
  const lfUserName = $('.lf-user-name input').val();
  $('.network-user-name input').val(lfUserName.toUpperCase().slice(lfUserName.lastIndexOf('\\') + 1)).trigger("change");

  // Initial UI setup.
  $('.Submit').hide();
  $(document).prop('title', 'User Maintenance');

  // Runtime script/styles injection (cookies, confirm dialogs, UI theme, pagination css).
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simplePagination.js/1.6/simplePagination.min.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');

  // Avoid Bootstrap/jQuery UI .button() conflicts.
  $.fn.bootstrapBtn = $.fn.button.noConflict(); // return $.fn.button to previously assigned value

  // Submit gate: defer to validateAdd/validateEdit based on action.
  $('.Submit').on("click", function (e) { submitForm(e); });

  // Keep radio groups and hidden id fields in sync for "Is Active" and "Is Admin" controls.
  $(document).on('change', '.edit-user-is-active-id input', function () {
    const isActive = $('.edit-user-is-active-id input').val();
    $(`.edit-user-is-active input[type='radio'][value='${isActive}']`).prop("checked", true);
  });
  $(document).on('change', '.edit-user-is-admin-id input', function () {
    const isAdmin = $('.edit-user-is-admin-id input').val();
    $(`.edit-user-is-admin input[type='radio'][value='${isAdmin}']`).prop("checked", true);
  });
  $(document).on('change', ".edit-user-is-active input[type='radio']", function () {
    const isActive = $(this).val();
    $('.edit-user-is-active-id input').val(isActive);
  });
  $(document).on('change', ".edit-user-is-admin input[type='radio']", function () {
    const isAdmin = $(this).val();
    $('.edit-user-is-admin-id input').val(isAdmin);
  });

  // Force uppercase for designated fields.
  $(document).on('keyup', '.capitalize-me input', function () {
    this.value = this.value.toUpperCase();
  });

  // Persist selected site name in a cookie for 1 year.
  $(document).on('change', '.site-name select', function () {
    const sitename = $('.site-name select').val();
    $.cookie('site_name', sitename, { expires: 365, path: '/' });
  });

  // Include Inactive checkbox toggles filter and reloads page 1.
  $(document).on('change', '#chkIncludeInActive', function () { filterTable(); });

  // Hook when lookup data (departments/user types) is available.
  $(document).on('lookupcomplete', function () {
    loadUserTypeMap();
    loadDepartmentMap();
    generateTableButtons(".edit-button-col", "ui-icon-pencil", "Edit User", "callEditUser");
    appendPagination();
    generateFilterRow();
    $('.user-table').show();
  });

  // Post-initialization after lookup load completes.
  $(document).on("onloadlookupfinished", function () {

    generateGoBackButtons();
    if ($('.pg input').val() === '999') {
      // If 999 sentinel slips through, reset to page 1.
      $('.pg input').val(1).trigger("change");
    }
    // Normalize network user name on load.
    $('.network-user-name input').trigger("change");

    // Restore site selection from cookie if present.
    const sitename = $.cookie('site_name');
    if (sitename !== null) {
      $('.site-name select').val(sitename).trigger("change");
    }
    $('.user-table').show();
  });

});


/**
 * Renders pagination controls under the user table based on the current page and row count.
 * - Page size is assumed to be 25.
 * - Disables/enables prev/next arrows accordingly.
 * - No-op when page is the sentinel 999.
 */
function appendPagination() {

  const current_page = Number($('.pg input').val());
  if (current_page === 999) { return; }

  const row_count = getTableRowCount();

  if (row_count > 0) {
    $('#user-pagination').remove();
    if ((current_page === 1) && (row_count < 25)) {
      $('.user-table table').parent().append("<div id='user-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled'>&laquo;</a></li><li><a class='page-link prev isDisabled'>&lsaquo;</a></li><li><a class='page-link next isDisabled'>&rsaquo;</a></li></ul></div>");
      return;
    }
    if ((current_page === 1) && (row_count === 25)) {
      $('.user-table table').parent().append("<div id='user-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled'>&laquo;</a></li><li><a class='page-link prev isDisabled'>&lsaquo;</a></li><li><a class='page-link next' onclick='callNextPage();' href='javascript:void(0);'>&rsaquo;</a></li></ul></div>")
      return;
    }
    if ((current_page > 1) && (row_count === 25)) {
      $('.user-table table').parent().append("<div id='user-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev' onclick='resetPageNumber();' href='javascript:void(0);'>&laquo;</a></li><li><a class='page-link prev' onclick='callPrevPage();' href='javascript:void(0);'>&lsaquo;</a></li><li><a class='page-link next' onclick='callNextPage();' href='javascript:void(0);'>&rsaquo;</a></li></ul></div>")
      return;
    }
    if ((current_page > 1) && (row_count < 25)) {
      $('.user-table table').parent().append("<div id='user-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev' onclick='resetPageNumber();' href='javascript:void(0);'>&laquo;</a></li><li><a class='page-link prev' onclick='callPrevPage();' href='javascript:void(0);'>&lsaquo;</a></li><li><a class='page-link next isDisabled'>&rsaquo;</a></li></ul></div>")
    }
  }
}


/**
 * Switches the UI into Add User mode.
 * - Selects the "Add" action radio
 * - Sets .add-user-id to 1
 * - Reveals the Submit button
 */
function callAddUser() {
  $(`.action-choice input[type='radio'][value='1']`).prop("checked", true);
  $('.add-user-id input').val(1).trigger("change");
  $('.Submit').show();
}


/**
 * Switches the UI into Edit User mode for the specified user.
 * - Selects the "Edit" action radio
 * - Sets .edit-user-id to the passed userID
 * - Reveals the Submit button only if current user is admin
 * @param {number} userID - The user ID to edit.
 */
function callEditUser(userID) {
  $(`.action-choice input[type='radio'][value='2']`).prop("checked", true);
  $('.edit-user-id input').val(userID).trigger("change");
  if (isAdminUser()) {
    $('.Submit').show();
  }
}


/**
 * Resets Add/Edit state and hides the Submit button.
 * - Clears .add-user-id and .edit-user-id
 */
function callGoBack() {
  $(".add-user-id input").val(0).trigger("change");
  $(".edit-user-id input").val(0).trigger("change");
  $('.Submit').hide();
}


/**
 * Goes to the next page of results.
 * - Hides table for refresh
 * - Clears existing table action buttons
 * - Increments .pg
 */
function callNextPage() {
  $('.user-table').hide();
  $('.table-button').remove();

  let current_page = Number($('.pg input').val());
  $('.pg input').val(current_page + 1).trigger("change");
}


/**
 * Goes to the previous page of results.
 * - No-op when already on page 1
 * - Hides table for refresh
 * - Clears existing table action buttons
 */
function callPrevPage() {
  $('.user-table').hide();
  $('.table-button').remove();

  let current_page = Number($('.pg input').val());
  if (current_page === 1) {
    return;
  }
  $('.pg input').val(current_page - 1).trigger("change");
}


/**
 * Applies table filters based on header controls:
 * - Include Inactive checkbox -> .finc-inactive
 * - Department/User Type dropdowns:
 *   - Converts names to IDs using departmentNameMap/userTypeNameMap
 *   - Writes values to .fdid/.futid hidden inputs
 * - Resets page to 1 and triggers refresh.
 */
function filterTable() {
  if ($('#filterRow').length === 0) {
    return;
  }

  if ($("#chkIncludeInActive").is(":checked")) {
    $('.finc-inactive input').val(1);
  }
  else {
    $('.finc-inactive input').val(0);
  }

  const departmentFilterVal = $('#cboFilter_Department').val();
  const userTypeFilterVal = $('#cboFilter_UserType').val();

  if ((departmentFilterVal !== null) && (departmentFilterVal.length > 0)) {
    const departmentID = departmentNameMap.get(departmentFilterVal);
    $('.fdid input').val(departmentID);
  }
  else {
    $('.fdid input').val(0);
  }

  if ((userTypeFilterVal !== null) && (userTypeFilterVal.length > 0)) {
    const userTypeID = userTypeNameMap.get(userTypeFilterVal);
    $('.futid input').val(userTypeID);
  }
  else {
    $('.futid input').val(0);
  }

  $('.user-table').hide();
  $('.table-button').remove();
  $('.pg input').val(1).trigger("change");

}


/**
 * Ensures the filter row and related controls exist/wired:
 * - Adds a header row with UserType and Department dropdowns if not present.
 * - Wires change and dblclick (to clear) events on filter dropdowns.
 * - Adds "Add User" button and "Include Inactive" checkbox for admin users.
 * - Mirrors options from hidden combo-boxes into the filter dropdowns.
 * - Wires table sort column handlers and default sort indicator.
 */
function generateFilterRow() {

  if ($('#filterRow').length === 0) {
    const filter_row = "<TR id='filterRow'><TH/><TH/><TH/><TH><select id='cboFilter_UserType'/></TH><TH><select id='cboFilter_Department'/></TH><TH/><TH/><TH/></TR>"
    $('.user-table table thead').append(filter_row);

    $("#cboFilter_UserType").on("change", function () { filterTable(); });
    $("#cboFilter_Department").on("change", function () { filterTable(); });
    

    $("#cboFilter_Department").on("dblclick", function () { $("#cboFilter_Department").val(0).trigger("change"); });
    $("#cboFilter_UserType").on("dblclick", function () { $("#cboFilter_UserType").val(0).trigger("change"); });
    wireUpSortFields();
  }

  if (isAdminUser()) {
    if ($('.add-button').length === 0) {
      const add_button = '<div class="ui-button add-button" onclick="callAddUser()"><span title="Add User" class="ui-button-icon ui-icon ui-icon-plusthick"></span>Add User</div><div class="choice include-choice"><input name="chkIncludeInActive" id="chkIncludeInActive" type="checkbox"><label class="form-option-label" for="chkIncludeInActive">Include InActive</label></div>'
      $(add_button).insertBefore('.user-table table');
    }
  }

  // Populate filter dropdowns once lookup combos are loaded.
  if (($(".department-combo select option").length > 1) && ($("#cboFilter_Department option").length === 0)) {
    $("#cboFilter_Department").html($(".department-combo select").html());
  }
  if (($(".user-type-combo select option").length > 1) && ($("#cboFilter_UserType option").length === 0)) {
    $("#cboFilter_UserType").html($(".user-type-combo select").html());
  }
}


/**
 * Creates a "Go Back" button near each element with class .gobackbutton and removes the original placeholder.
 * The button invokes callGoBack().
 */
function generateGoBackButtons() {
  const $goback_buttons = $(".gobackbutton");
  $goback_buttons.each(function () {
    $(this).parent().append("<div id='go-back' class='ui-button ui-corner-all ui-widget' onclick='callGoBack()'><span class='ui-icon ui-icon-arrowreturnthick-1-w'></span>Go Back</div>");
  });
  $(".gobackbutton").remove();
}


/**
 * Ensures per-row action buttons exist inside the given column selector.
 * - Reads the button value from an input[type=text] in the column (usually a hidden id exposed via text field).
 * - Appends an icon button that calls the provided function with the value.
 * @param {string} buttonSelector - CSS selector matching cells to augment (e.g., ".edit-button-col").
 * @param {string} buttonClass - jQuery UI icon class (e.g., "ui-icon-pencil").
 * @param {string} buttonTitle - Tooltip/title for the icon.
 * @param {string} buttonFunction - Global function name to invoke, receives the value as first argument.
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
 * @returns {number} The number of data rows rendered in the user table tbody.
 */
function getTableRowCount() {
  return $('.user-table tbody tr').length;
}


/**
 * @returns {boolean} True when the current user is an admin user.
 */
function isAdminUser() {
  return $('.user-isadmin input').val() === '1';

}


/**
 * Initializes department lookup maps from the lookup table rendered on the page.
 * No-ops if the maps have already been initialized.
 * Expects each row to contain:
 *  - .department-lookup-table-id input  => numeric id
 *  - .department-lookup-table-name input=> name string
 */
function loadDepartmentMap() {
  if (departmentMap.keys.length === 0) {
    const department_rows = $('.department-lookup-table table tbody tr');
    if (department_rows.length === 0) {
      return;
    }
      department_rows.each(function () {
      let departmentID = Number($(this).find('.department-lookup-table-id input').val());
      let departmentName = $(this).find('.department-lookup-table-name input').val();
      departmentMap.set(departmentID, departmentName);
      departmentNameMap.set(departmentName, departmentID);
    });
  }
}


/**
 * Initializes user type lookup maps from the lookup table rendered on the page.
 * No-ops if the maps have already been initialized.
 * Expects each row to contain:
 *  - .usertype-lookup-table-id input   => numeric id
 *  - .usertype-lookup-table-name input => name string
 */
function loadUserTypeMap() {
  if (userTypeMap.keys.length === 0) {
    const userType_rows = $('.usertype-lookup-table table tbody tr');
    if (userType_rows.length === 0) {
      return;
    }
      userType_rows.each(function () {
      let userTypeID = Number($(this).find('.usertype-lookup-table-id input').val());
      let userTypeName = $(this).find('.usertype-lookup-table-name input').val();
      userTypeMap.set(userTypeID, userTypeName);
      userTypeNameMap.set(userTypeName, userTypeID);
    });
  }
}


/**
 * Toggles sort state and updates the sort icons in the specified column header.
 * - Reads current sort field (.sfo) and direction (.sd).
 * - When the same field is clicked, toggles direction; when new field, sets ascending (0).
 * - Appends a jQuery UI triangle icon to the header label.
 * @param {number} newSortOrdinal - The ordinal/index for the clicked field.
 * @param {string} selector - The column header selector (e.g., "#q21").
 */
function sortTable(newSortOrdinal, selector) {

  $('.table-button').remove();
  $('.sort-icon').remove();

  const currentSortOrdinal = Number($('.sfo input').val());
  let sortDirection = Number($('.sd input').val());

  if (newSortOrdinal === currentSortOrdinal) {
    if (sortDirection === 0) {
      sortDirection = 1
      $('.sd input').val(1).trigger("change");
    }
    else {
      sortDirection = 0;
      $('.sd input').val(0).trigger("change");
    }
  }
  else {
    $('.sfo input').val(newSortOrdinal);
    $('.sd input').val(0).trigger("change");
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
 * Centralized submit handler for the page.
 * - Reads the selected action (Add or Edit)
 * - Runs the appropriate validation routine
 * - Prevents submit when validation fails
 * @param {JQuery.Event} e - Click/submit event.
 */
function submitForm(e) {
  const actionID = Number($('.action-choice input[type="radio"]:checked').val());
  if (actionID === 1) {
    if (validateAdd() === false) {
      e.preventDefault();
      return;
    }
  }
  if (actionID === 2) {
    if (validateEdit() === false) {
      e.preventDefault();
    }
  }
  
}


/**
 * Validates Add User:
 * - Prevents adding a new ACTIVE user when another ACTIVE user with the same network username exists.
 * - Displays an inline parsley-style error near the network username field.
 * @returns {boolean} True when valid; false otherwise.
 */
function validateAdd() {
  $('#existing-user-error').remove();
  const addUserCount = $('.add-existing-users select option').length;
  const addNetworkUserNameField = $('.add-user-network-user-name input');
  if (addUserCount > 1) {
    addNetworkUserNameField.parent().append("<ul id='existing-user-error' aria-live='assertive' aria-atomic='true' class='parsley-errors-list filled'><li class='parsley-required'>There is another ACTIVE user with this network username. Please inactivate the other user first. Then you can add this one.</li></ul>");
    return false;
  }
  else {
    return true;
  }
}


/**
 * Validates Edit User:
 * - Prevents saving when another ACTIVE user exists with the same network username (different user id).
 * - Displays an inline parsley-style error near the network username field.
 * @returns {boolean} True when valid; false otherwise.
 */
function validateEdit() {
  $('#existing-user-error').remove();
  let returnValue = true;
  const editNetworkUserNameField = $('.edit-user-network-user-name input');
  const editUserID = Number($('.edit-user-id input').val());
  const existingUserIDs = $('.edit-existing-users select option');

  $(existingUserIDs).each(function () {
    const existingUserID = Number($(this).val());
    if (existingUserID === 0) {
      return;
    }
    if (existingUserID !== editUserID) {
      editNetworkUserNameField.parent().append("<ul id='existing-user-error' aria-live='assertive' aria-atomic='true' class='parsley-errors-list filled'><li class='parsley-required'>There is another ACTIVE user with this network username. Please inactivate the other user first. Then you can change this one.</li></ul>");
      returnValue = false;
    }
  });
  return returnValue;
}


/**
 * Wires the sortable column headers and sets the initial sort indicator.
 * Assumes headers with ids #q21, #q22, #q23 contain the .cf-col-label span where the icon is appended.
 */
function wireUpSortFields() {

  $('#q21 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-n sort-icon"></span>');

  $('#q21').on('click', function () { sortTable(0, '#q21'); });   //User Name (default)
  $('#q22').on('click', function () { sortTable(1, '#q22'); });   //User Type
  $('#q23').on('click', function () { sortTable(2, '#q23'); });   //Department


}
