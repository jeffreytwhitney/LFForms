/**
 CurlLogs.js
 
 Author:  Jeffrey Whitney
          jtwhitney@machine.com
          651-319-7982
 Date:    9/29/2025

 UI controller for the Curl Logs page: handles pagination, filtering, sorting,
 site selection persistence, and late wiring after lookup data loads.

 Core Responsibilities:
  - Load required 3rd‑party scripts/styles (jquery-cookie, jquery-confirm, jQuery UI theme, simplePagination CSS).
  - Persist selected site to a cookie (`site_name`) and restore it on page activation.
  - Inject a dynamic filter header row with text + select controls and project their
    values into hidden backing inputs that drive server/data refresh.
  - Provide simple previous/next pagination controls (page size implicitly 25).
  - Provide client-side indication of sort state while delegating actual sorting
    to server / data refresh (via hidden sort fields).

 Key Concepts:
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
   

   Filtering and Sorting:
      There is no way to filter or sort rows in LFF, so I had to build a custom filtering mechanism. This is done via a combination of hidden 
      fields which are arguments to a SQL Server stored procedure. The stored procedure returns a maximum of 25 rows at a time, 
      so we have to be able to filter and sort the rows on the server side.
      There are also two buttons which allow the user to change which page of results they are viewing.
      Here is a list of the hidden fields used for filtering and sorting:

        Filtering:
          .pg input: Page number (1-based), 999 = uninitialized. The page of results to return.   
          .fpname input : Program name filter (partial match)
          .fmname input : machine name filter (Set by filter combo box of machines)
          .sid input    : result/status filter (set to -1 for "no filter")

        Sorting:
          .sfo input    : sort field ordinal (0-based, maps to column sequence below)
          .sfd input    : sort direction (0 = ascending, 1 = descending)

      This gets us part of the way there, but we also need to have a way for the user to set these fields.
      This is done via a filter row which is added to the task list table. The filter row contains a text box for the task name filter,
      and dropdowns for the task type, status, and assignee filters. There is also a checkbox to include completed tasks.
      The change of any of these controls triggers the filterTable() function which reads the values from the controls and sets the 
      hidden fields accordingly. Values from select controls are mapped from name to ID using the lookup maps.
      Sorting is handled via clickable column headers. Clicking a header sets the sort field and toggles the sort direction.
      If you click on a sort field that is already the current sort field, it toggles the direction.  
            
   Pagination:
     Pagination is related to filtering but serves a different pupose. (In actuality, it's really just another form of filtering, 
     but instead of limiting rows by name or id, it's filtering which page of results to display.)
     
     There are a couple things regarding pagination that you should know about.
     To begin with, pagination is necessary on this page because there might be hundreds or thousands of rows being returned from the database.
     This is a problem because the web page will time out formatting them all. 
     This was a pretty big hurdle to overcome at first. Luckily, LFF allows fields to be filled via stored procedure calls, which take 
     arguments. So, as described above in 'Filtering and Sorting', we call a stored procedure to fill the ticket table with information, 
     25 rows at a time. This makes things much more manageable. We have a hidden field called 'pg'. So, if pg=1, we return rows 1-25, 
     pg=2 returns rows 26-50, and so on. We just wire up the "Next Page" and "Previous Page" buttons to increment or decrement the pg field 
     and then trigger a change event on it.

     Quirk with LFF Events:
        Originally I had the table of results load as soon as the page loaded. It seemed obvious: other than the page, which should of
        course be defaulted to 1, there are no filters as yet. The problem occured because of the fact that I'm adding the filtering in
        by hand. The way filtering works, is that there are a bunch of hidden lookup tables for stuff like Department. I grab all of the 
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
        Then, in the lookupcomplete() function, which fires AFTER all of the initial lookups complete, then I ask if the page is set to 999 and 
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


 Column Ordinal Mapping used for sorting (newSortOrdinal values):
    0 -> #q20   Created Date (default sort)
    1 -> #q7    File Name
    2 -> #q1    Program Name
    3 -> #q84   Job Number
    4 -> #q6    Machine Name

    Note: The default sort, (Create Date), is sorted in descending order by default. (Because we want to see the most recent data first.)
    All of the other sorts are Ascending first and then descending. So if the current sort is Create Date and the user clicks on 
    the File Name column, it will flip the sort direction so the user will see file names in ascending order. Conversely, if they click 
    back on Created Date, it will flip the sort direction back to descending. This way, the user is seeing the data the way they expect to.
  

 CSS / Markup Expectations:
  - Table container: .log-table table (with THEAD + TBODY)
  - Pagination container appended after table parent: #log-pagination
  - Filter row id: #filterRow
  - Sort icon class injected: .sort-icon (uses jQuery UI icon classes)

 Pagination Logic:
  - Page size assumed to be 25. If fewer than 25 rows returned, disables "next".
  - Special page number 999 suppresses pagination (interpreted as "show nothing").
    This is the default state until initial lookups complete, then set to 1 and triggers data load. (See Pagination above for details.)

 Filtering Logic:
  - User changes in filter controls immediately push values to hidden fields and reset page to 1.
  - Double-click on a filter control clears or resets that control, then triggers the refresh.

 Sorting Logic:
  - Clicking a header toggles direction if already active; otherwise sets new sort field
    and default direction (descending for #q20, ascending for others).
  - Visual arrow (triangle) refreshed on each sort action; actual data refresh assumed to
    be handled by listeners on hidden sort field changes.
    Behind the scenes, the hidden fields are being watched by LFF and whenever any of them change, it triggers an ajax call
    back to the server to fire off the stored procedure which loads the data._

 */

$(document).ready(function () {
  // Hide submit controls and set page name.
  $('.Submit').hide();
  $(document).prop('title', '1Factory Curl Logs');

  // Load required 3rd-party scripts and styles used by this page.
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simplePagination.js/1.6/simplePagination.min.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');

  // Persist selected site name to a cookie.
  $(document).on('change', '.site-name select', function () {
    var sitename = $('.site-name select').val();
    $.cookie('site_name', sitename, { expires: 365, path: '/' });
  });

  // When lookup tables are available, finish wiring the grid (filter row + pagination).
  $(document).on('lookupcomplete', function (e) {
    appendPagination(); //See 'Pagination' section above.
    generateFilterRow(); //See 'Filtering and Sorting' section above.
  });

  // Final page activation after load / lookup completion.
  $(document).on("onloadlookupfinished", function (e) {
    
    if ($('.pg input').val() == '999') {
      $('.pg input').val(1).change();
    }

    // Quick view of long error in a dialog on double-click.
    $(document).on('dblclick', '.error-detail-col div', function (e) {
      var errorDetail = $(this).find('input').val();

      $.dialog({
        escapeKey: true,
        backgroundDismiss: true,
        title: `Error Details:`,
        content: errorDetail,
        resizable: true,
        width: 800,
        height: 600,
      });
    });


    // Restore last-selected site from cookie.
    var sitename = $.cookie('site_name');
    if (sitename != null) {
      $('.site-name select').val(sitename).change();
    }
  });

});


/**
 * Append simple pagination controls based on current page and row count.
 * Logic Matrix:
 *  - If page = 1 and < 25 rows => all navigation disabled.
 *  - If page = 1 and = 25 rows => enable next only.
 *  - If page > 1 and = 25 rows => enable prev + beginning + next.
 *  - If page > 1 and < 25 rows => enable prev + beginning; disable next.
 * Skips rendering entirely if current page is sentinel 999 (no pagination).
 */
function appendPagination() {
  var current_page = Number($('.pg input').val());
  if (current_page == 999) { return; }

  var row_count = getTableRowCount();

  if (row_count > 0) {
    $('#log-pagination').remove();
    if ((current_page == 1) && (row_count < 25)) {
      $('.log-table table').parent().append("<div id='log-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled'>‹‹</a></li><li><a class='page-link prev isDisabled'>‹</a></li><li><a class='page-link next isDisabled'>›</a></li></ul></div>");
      return;
    }
    if ((current_page == 1) && (row_count == 25)) {
      $('.log-table table').parent().append("<div id='log-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled'>‹‹</a></li><li><a class='page-link prev isDisabled'>‹</a></li><li><a class='page-link next' onclick='callNextPage();' href='javascript:void(0);'>›</a></li></ul></div>")
      return;
    }
    if ((current_page > 1) && (row_count == 25)) {
      $('.log-table table').parent().append("<div id='log-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev' onclick='resetPageNumber();' href='javascript:void(0);''>‹‹</a></li><li><a class='page-link prev' onclick='callPrevPage();' href='javascript:void(0);''>‹</a></li><li><a class='page-link next' onclick='callNextPage();' href='javascript:void(0);'>›</a></li></ul></div>")
      return;
    }
    if ((current_page > 1) && (row_count < 25)) {
      $('.log-table table').parent().append("<div id='log-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev' onclick='resetPageNumber();' href='javascript:void(0);''>‹‹</a></li><li><a class='page-link prev' onclick='callPrevPage();' href='javascript:void(0);''>‹</a></li><li><a class='page-link next isDisabled'>›</a></li></ul></div>")
      return;
    }
  }
}


/**
 * Advance to next page and trigger data refresh through change event.
 * Increments the hidden page (.pg input) then fires its change handler.
 */
function callNextPage() {
  current_page = Number($('.pg input').val());
  $('.pg input').val(current_page + 1).change();
}


/**
 * Go to previous page (if not already page 1) and trigger data refresh.
 */
function callPrevPage() {
  current_page = Number($('.pg input').val());
  if (current_page == 1) {
    return;
  }
  $('.pg input').val(current_page - 1).change();
}


/**
 * Apply filter control values to their corresponding hidden inputs and reset to page 1.
 * Mapping:
 *  - Program textbox -> .fpname input
 *  - Machine dropdown -> .fmname input
 *  - Result status dropdown -> .sid input ( -1 when cleared )
 */
function filterTable() {
  if ($('#filterRow').length == 0) {
    return;
  }

  var programFilterValue = $('#txtFilter_Program').val();
  var machineNameFilterValue = $('#cboMachineName').val();
  var resultFilterValue = $('#cboResultStatus').val();

  $('.fpname input').val(programFilterValue);
  $('.fmname input').val(machineNameFilterValue);

  if (resultFilterValue != '') {
    $('.sid input').val(resultFilterValue);
  }
  else {
    $('.sid input').val(-1);
  }

  $('.pg input').val(1).change();
}


/**
 * Create (once) the filter header row containing:
 *  - Program (text)
 *  - Machine (select)
 *  - Result Status (select)
 * Adds change listeners to trigger filtering, and double-click shortcuts to reset values.
 * Also populates dropdowns from hidden lookup markups when available.
 * Wires sorting after row insertion.
 */
function generateFilterRow() {
  if ($('#filterRow').length == 0) {
    var filter_row = "<TR id='filterRow'><TH/><TH><input id='txtFilter_Program'/></TH><TH/><TH/><TH><select id='cboMachineName'/></TH><TH><select id='cboResultStatus'/></TH><TH/><TH/><TH/></TR>"

    $('.log-table table thead').append(filter_row);
    $("#txtFilter_Program").on("change", function () { filterTable(); });
    $("#cboMachineName").on("change", function () { filterTable(); });
    $("#cboResultStatus").on("change", function () { filterTable(); });

    // Quick clear on double-click.
    $("#txtFilter_Program").dblclick(function () { $("#txtFilter_Program").val(null).change(); });
    $("#cboMachineName").dblclick(function () {
      $("#cboMachineName").val(0).change();
    });
    $("#cboResultStatus").dblclick(function () {
      $('#cboResultStatus option:first').prop('selected', true).change();
    });

    wireUpSortFields();
  }

  // Populate dropdowns from lookup combos (do this once).
  if (($(".machine-name-lookup select option").length > 1) && ($("#cboMachineName option").length == 0)) {
    $("#cboMachineName").html($(".machine-name-lookup select").html());
  }

  if (($(".status-lookup select option").length > 1) && ($("#cboResultStatus option").length == 0)) {
    $("#cboResultStatus").html($(".status-lookup select").html());
  }
}


/**
 * Return the count of data rows currently rendered in the log table body.
 * @returns {number} Row count
 */
function getTableRowCount() {
  var row_count = $('.log-table table tbody tr').length;
  return row_count;
}


/**
 * Reset page to 1 and refresh data through the .pg input change handler.
 */
function resetPageNumber() {
  $('.pg input').val(1).change();
}


/**
 * Update sort state based on a new column selection.
 * Behavior:
 *  - If the same column is clicked, toggles direction.
 *  - If a new column is selected, sets default direction:
 *      * Column #q20 (ordinal 0) defaults to descending (direction = 1)
 *      * Others default to ascending (direction = 0)
 *  - Removes any existing sort indicators, then appends an arrow icon to the active column.
 *
 * @param {number} newSortOrdinal Zero-based sort field ordinal.
 * @param {string} selector jQuery selector for the column header cell (e.g., '#q20').
 */
function sortTable(newSortOrdinal, selector) {
  $('.sort-icon').remove();

  var currentSortOrdinal = Number($('.sfo input').val());
  var sortDirection = Number($('.sfd input').val());

  if (newSortOrdinal == currentSortOrdinal) {
    if (sortDirection == 0) {
      sortDirection = 1
      $('.sfd input').val(1).change();
    }
    else {
      sortDirection = 0;
      $('.sfd input').val(0).change();
    }
  }
  else {
    if (selector == '#q20') {
      $('.sfo input').val(newSortOrdinal);
      $('.sfd input').val(1).change();
      sortDirection = 1;
    }
    else {
      $('.sfo input').val(newSortOrdinal);
      $('.sfd input').val(0).change();
      sortDirection = 0;
    }
  }

  if (sortDirection == 0) {
    $(`${selector} .cf-col-label`).append('<span class="ui-icon ui-icon-triangle-1-n sort-icon"></span>');
  }
  else {
    $(`${selector} .cf-col-label`).append('<span class="ui-icon ui-icon-triangle-1-s sort-icon"></span>');
  }
}


/**
 * Attach click handlers to header cells to enable sort changes and
 * render the initial default sort indication (descending on #q20).
 */
function wireUpSortFields() {
  $('#q20 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-s sort-icon"></span>');

  $('#q20').on('click', function () { sortTable(0, '#q20'); });
  $('#q7').on('click', function () { sortTable(1, '#q7'); });
  $('#q1').on('click', function () { sortTable(2, '#q1'); });
  $('#q84').on('click', function () { sortTable(3, '#q84'); });
  $('#q6').on('click', function () { sortTable(4, '#q6'); });
}