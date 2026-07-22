/**
  Programming Tickets - UI behaviors and helpers

  Author:   Jeffrey Whitney
            jtwhitney@machine.com
            651-391-7982
  Date:     9/29/2025

  Purpose:
  - Enhances a tabular "Programming Tickets" list with filtering, sorting, pagination, and detail dialogs.
  - Integrates lookup data (Departments, Initiators, Quality Engineers) to drive filters.
  - Provides actions to add a ticket and view ticket details in a popup iframe dialog.
 
  Permissions: (See "User Permissions" below for details)
    - Cell Leads (user-type-id == 5):               View only.
    - Manufacturing Engineers (user-type-id == 4):  View only.
    - Quality Engineers (user-type-id == 3):        Can add tickets.
    - Metrology users (user-type-id == 1):          Full permissions.

  Dependencies (loaded at runtime):
  - jQuery
  - jQuery UI (Dialog)
  - jquery-cookie (persist site selection)
  - jquery-confirm (lightweight dialogs)
  - simplePagination.css (styling only; pagination markup generated manually)

 KEY CONCEPTS:
    Dialog/Popup Mechanism:
     As with most things in LaserFiche Forms, there is no built-in way to open a popup dialog or iframe, so I had to build my own functionality.
     This is done via a combination of a hidden div on the form, and a jQuery UI dialog. The hidden div is populated with an iframe
     which loads the desired URL. The jQuery UI dialog is then opened, displaying the iframe. If you just close the dialog, nothing happens 
     to this form. If however, you submit the popup form, the first thing it does is to change a hidden field called 'closeme' to a value of 1. 
     (Its default is 0.)
     After the popup gets submitted to the server, the server processes it by sending its form fields to a LF Workflow. 
     When the workflow completes, it comes back to the server-side process which forwards back to the same form, but this time 
     with the closeme field set by the query string. (We set it when we submitted the form.)
     When the popup loads, it has its closeme value set by the query string, so it knows that it has just come back from being submitted. 
     Therefore, it will then send a message to its parent, (namely, this form), informing it that the server-side 
     data has changed. When this form receives such a message, it closes the popup dialog, and then it calls a function refreshes the page.
     
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
        In any case, if the user is logged in to LFF, it sets the .lf-user-name to CRETEX\username. However, we only want the username portion
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
          
    
      Now this gets a bit tricky. The lookupcomplete event can fire multiple times, and we only want to do certain things once, so we need
      to put logic in there so that it's not doing expensive things again and again.
      There is a way of asking what the TriggerID of the lookup is. (A laserfiche function). But I found this to be kind of a pain to use because
      you have to know the TriggerID of the lookup that you want to respond to, and it's just an integer. Also, if you ever change anything
      in the form, you don't know if the trigger id has changed or not. So I found it easier to just put logic in the function that I want to run
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
        We take that value, keeping only the username portion and put that in NetworkUserName.
        This causes a lookup for all the user-related fields, including SiteID. Once the SiteID is set, this in turn
        causes another lookup to pull in all the departments related to that site. The Department Lookup cannot be loaded until 
        we know which site we're talking about. Sometimes this daisy-chaining can get 3 and sometimes even 4 levels deep because of all the relationships between
        various fields on a form. This causes the form to be slower than it otherwise would have been, but there's not a lot we can do about it.
        It sort of is what it is. This is what happens when you have to make an application with a non-application framework.
   
   Page Refresh Quirks:
      There are two ways that the page can be programmatically refreshed. One is via the filter/sort/pagination mechanism described below       . The second is when our page receives a message from a popup that the information on the page has changed and should be refreshed,
      such as when the user changes the state of a row that is being displayed. You'd think this would be a rather straight-forward affair, 
      but as I will explain to you, it's quite complex.

      The first thing you need to know is that when LFF does a refresh, say, of a table, (which is really what we're talking about here),
      it does so via ajax. It doesn't refresh the page, per se, it just refreshes the stuff inside the page. So, it doesn't refresh the web
      page, it just replaces the guts inside the table. 
      
      This presents us with a problem because we have muddled with the table quite a lot, adding links and buttons dynamically using jQuery.
      For example, let's say we have a page of results that has a button in the first column. We put that button there. What was there
      natively, (what was put there by LFF) is a hidden text box with the ID for the record. We can use that to create a button on the fly
      and assign a JavaScript onclick to call a function sending the id of the record as an argument. But now LFF has just refreshed the data
      in the table, so if the hidden text box used to have an ID of 1, the button we made would have called someFunctionToDoSomething(1). 
      But now, because of the page refreshing, the first row has a different record in it, with an ID of 2. 
      Unfortunately, we still have that button sitting there which will call someFunctionToDoSomething(1) with the wrong argument. 
      
      Therefore, the first thing we have to do is rip out all the extra stuff we added: removeAppendedFields(). 
      Then we have to put back everything for the new page of data. All the buttons, links, checkboxes--everything.
      
      There's another problem when it comes to refreshing the page, but from the other end. Let me explain.
      As I stated above, there are two ways that a page is going to get refreshed. The filter/sort/pagination type, we can call a "soft" refresh,
      because it doesn't reload the web page. But there's another type of refresh that we perform: when a popup window sends us a message
      telling us that the underlying data has changed. The causes a "hard" refresh, meaning that the page itself is reloaded. 
      
      The reason we do this is that we don't know what was changed, we just know that something did. But none of the filters/sorts/pagination
      has changed, just the data that those things apply to. So we have to make the page itself refresh. Simple, right? Yeah, not so much.
      The complexity comes from the fact that we have filtering and sorting to worry about. Again, let me explain. 
      
      Let's say you have a page where you are filtering the records by Ticket Number. So you have 'P-12345' in the Filter Ticket Number text box. 
      So let's say you open that ticket (opening a popup pointing at the EditTicket page), and make a change that would cause that row in our table 
      to disappear. You submit the popup, it sends the info to the workflow and comes back to the popup page with closeme=1 set. This, in turn, causes
      the popup to call our page and says "refresh your stuff". Great, but....but the ticket number filter field has a value in it. 
      If we just refresh the page by calling window.url() with this page's url, guess what happens to the 'P-12345' that was sitting in the 
      Filter Ticket Number text box. It's gone. You've completely refreshed the page. The refreshed page has no idea what the user was 
      filtering on. That means that every time the user changes something via a popup, they'll have to re-apply their
      filter(s). That's annoying. 
      
      What to do? Two things. One done before doing the refresh, and one when you get back from refreshing.
        #1. Instead of just setting the url to this page's url, what we need to do is append all the currently chosen filters to the query 
            string. So http://rmslf/forms/mypage would become something like: http://rmslf/forms/mypage?ftname=P-12345sortfield=2&sortdirection=ASC&pg=1.
            Then we navigate to that url. This way, when the page reloads, the filter/sort/pagination values are in the query string.
            What this does is it causes LFF to set the hidden fields that drive filtering and sorting back to the values that were there
            to begin with. This way, when the page reloads, the filters and sorting are still in place LFF will automatically apply 
             them, causing the page to have the same filtering and sorting as it had before the refresh.
      
      But this still leaves us with a problem, namely, that while the hidden filtering and sorting fields are all correct, 
      the filter DISPLAY fields are not set. (Keep in mind, this is after the page has refreshed. LFF has set all the hidden fields correctly, but 
      the filter fields that the users see have not been set back to their original value.)
      
      Let's say you were filtering records by department. 
      You have a department dropdown filter set to "Ortho". But we're not using the value "Ortho" to filter the results. We're using the 
      DepartmentID for "Ortho", so using the logic above, we'd navigate to http://rmslf/forms/mypage?did=12&sortfield=2&sortdirection=ASC&pg=1. 
      The "did" value is the department ID. This will cause LFF to set the field named "did" to a value of 12, which will cause the 
      stored procedure which is tied to that field to filter the records by that department id. 
      But now the Filter Department dropdown, the thing the USER sees, is empty.
      So now we have a situation where the hidden filter field value and the filter display value are different. This is going to cause confusion.
      How to handle that? 
        
        #2. Once the filter row has been added back, you need to set all the filter display values back to the appropriate value.
            In the case of a text search, like 'Name', you set the display field equal to the hidden field.
            In the case of a dropdown, like Department, you have to do a reverse lookup to find the Department Name associated with the
            Department ID that is in the hidden field and set the dropdown to that value.
            
            Normally, such as when you open the page for the first time, these hidden filter fields are all blank, or are set to 
            a default value. But in the case of a hard refresh, the hidden filter fields may have values in them. So, for 
            our Department example, once the Filter Department dropdown exists, if the hidden department id field has a value in it, (which,
            in our example is set to 12), then we have to do a reverse lookup, finding the Department Name associated with that ID, and 
            setting the Filter Department dropdown's value to the Department Name. (Setting it back to "Ortho", in this case.
            
            This way, the whole thing happens without any inconvenience to the user. and everything works as the user would expect it. We just 
            had to jump through nineteen hoops to make it happen. Thanks LaserFiche!

   Filtering and Sorting:
      There is no way to filter or sort rows in LFF, so I had to build a custom filtering mechanism. This is done via a combination of hidden 
      fields which are arguments to a SQL Server stored procedure. The stored procedure returns a maximum of 25 rows at a time, 
      so we have to be able to filter and sort the rows on the server side.
      There are also two buttons that allow the user to change which page of results they are viewing.
      Here is a list of the hidden fields used for filtering and sorting:

        Filtering:
          .pg input: Page number (1-based), 999 = uninitialized. The page of results to return.   
          .ftname input: Task Name filter (partial match)
          .fpname input: Project Name filter (partial match)
          .fpid input: Ticket Number filter (exact match)
          .fdid input: Department ID filter (exact match)
          .fqeid input: Quality Engineer ID filter (exact match)
          .finitemp input: Initiator ID filter (exact match)
          .inccom input: Include Completed filter (1 = include completed, 0 = exclude completed)

        Sorting:
          .sort-field-ordinal input: Field to sort by (1 = Task Name, 2 = Task Type, 3 = Status, 4 = Assignee, 5 = Due Date, 6 = Priority)
          .sort-direction input: Sort direction (ASC or DESC)

      This gets us part of the way there, but we also need to have a way for the user to set these fields.
      This is done via a filter row which is added to the task list table. The filter row contains a text box for the task name filter,
      and dropdowns for the task type, status, and assignee filters. There is also a checkbox to include completed tasks.
      The change of these controls triggers the filterTable() function which reads the values from the controls and sets the
      hidden fields accordingly. Values from select controls are mapped from name to ID using the lookup maps.
      Sorting is handled via clickable column headers. Clicking a header sets the sort field and toggles the sort direction.
      If you click on a sort field that is already the current sort field, it toggles the direction.  
            
   Pagination:
     Pagination is related to filtering but serves a different purpose. (In actuality, it's really just another form of filtering,
     but instead of limiting rows by name or id, it's filtering which page of results to display.)
     
     There are a couple of things regarding pagination that you should know about.
     To begin with, pagination is necessary on this page because there might be hundreds or thousands of rows being returned from the database.
     This is a problem because the web page will time out formatting them all. 
     This was a pretty big hurdle to overcome at first. Luckily, LFF allows fields to be filled via stored procedure calls, which take 
     arguments. So, as described above in 'Filtering and Sorting', we call a stored procedure to fill the ticket table with information, 
     25 rows at a time. This makes things much more manageable. We have a hidden field called 'pg'. So, if pg=1, we return rows 1-25, 
     pg=2 returns rows 26-50, and so on. We just wire up the "Next Page" and "Previous Page" buttons to increment or decrement the pg field 
     and then trigger a change event on it.

     Quirk with LFF Events:
        Originally I had the table of results load as soon as the page loaded. It seemed obvious: other than the page, which should, of
        course, be defaulted to 1, there are no filters as yet. The problem occurred because I'm adding the filtering in
        by hand. The way filtering works is that there are a bunch of hidden lookup tables for stuff like Department. I grab all the
        Department Name values out of the lookup table and put them into the filter value. But I can only add the filter row once the rows are all
        there. Therein lies the rub: LFF Lookups.
        
        There are two kinds of lookups that LF does to populate fields: the kind without any arguments, and the kind with arguments. 
        An example of a lookup without any arguments would be TaskType. I want the hidden TaskType lookup table to get filled 
         immediately --there's no other information that it relies on.
        
        Now, Departments and the table rows both rely on one thing: Site. Which Site are we looking at, Coon Rapids or Anoka?
        Ok, so each of those things can only be looked up once we know which site we're talking about. Good enough.
        But now comes its issue of LFF Lookup Order. All the data lookups that LFF uses take place in the order you specify.
        So if you have Department first and the main table data second, that should mean that the department lookup data is there before
        we go get the main table data. And this is usually true, emphasis on usually. 
        
        I ran into an issue (and perhaps it's because the main table's data is being fed by a stored procedure instead of a simple query or table),
        but the load order was acting inconsistently. So in this case, we'd have the table data loaded, so we'd go to load the 
        filter dropdowns, and sometimes the lookup data wouldn't be there yet. It only happened some of the time, but it continued to 
        happen. It was absolutely maddening. The only way around this problem was to have the "pg" field (which is the page of data
        that is going to be returned), set to 999 by default. The sproc is looking for this value, and if it finds it, it won't return anything.
        Then, in the lookupcomplete() function, which fires AFTER all the initial lookups complete, then I ask if the page is set to 999 and 
        if it is, set it to 1 and initiate a lookup. This way, everything works as intended. The lookup data is there, so I can make the filter row,
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

  DOM assumptions (LF Forms-like structure):
  - Hidden fields drive server-side queries (e.g., `.pg input`, `.ftname input`, `.fpname input`, `.fpid input`, `.fdid input`, `.fqeid input`, `.finitemp input`, etc.).
  - Lookup tables exist in the page (e.g., `.department-lookup-table`, `.qe-lookup-table`, `.initiator-lookup-table`) and corresponding "combo" selects provide options.
  - Ticket grid is under `.projectlist-table` with a `thead` and `tbody`.
  - Specific column label IDs (`#q52`, `#q53`, `#q58`, `#q60`, `#q61`, `#q66`) are used for sorting.

 */

// Lookup maps between IDs and display names for filter synchronization.
const departmentMap = new Map();          // Map<number, string> departmentID -> departmentName
const departmentNameMap = new Map();      // Map<string, number> departmentName -> departmentID
const initiatorMap = new Map();           // Map<string|number, string> initiatorID -> initiatorName
const initiatorNameMap = new Map();       // Map<string, string|number> initiatorName -> initiatorID
const qualityEngineerMap = new Map();     // Map<number, string> qeID -> qeName
const qualityEngineerNameMap = new Map(); // Map<string, number> qeName -> qeID

$(document).ready(function () {
  // Initial UI setup
  $('.Submit').hide();
  $(document).prop('title', 'Programming Tickets');

  // Load client-side dependencies
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simplePagination.js/1.6/simplePagination.min.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');

  // Prevent Bootstrap/jQuery UI naming conflicts if Bootstrap is present
  $.fn.bootstrapBtn = $.fn.button.noConflict();

  // Sync the LF Forms username into the network username field
  const lfUserName = $('.lf-user-name input').val();
  if (lfUserName !== 'Anonymous User') {
    $('.network-user-name input').val(lfUserName.toUpperCase().slice(lfUserName.lastIndexOf('\\') + 1)).trigger("change");
  }

  // Listen for messages from child iframes to close dialogs and optionally refresh
  window.onmessage = function (event) {
    if (event.data === "CloseDialog") {
      $("#popupIFrame").dialog("destroy");
      $("#popupIFrame").remove();
    }
    if (event.data === "CloseDialogWithRefresh") {
      $("#popupIFrame").dialog("destroy");
      $("#popupIFrame").remove();
      refreshPage();
    }
  };

  // Persist selected site in a cookie for recall on subsequent loads
  $(document).on('change', '.site-name select', function () {
    const sitename = $('.site-name select').val();
    $.cookie('site_name', sitename, { expires: 365, path: '/' });
  });

  // Show long "Details" text in a quick modal on double-click (Field56 appears to be details)
  $(document).on('dblclick', '[id^="Field56"]', function () {
    const ticketDetail = $(this).val();
    const ticketNumber = $(this).closest('tr').find('.projectlist-ticket-number-col input[type="text"]').val();
    $.dialog({
      escapeKey: true,
      backgroundDismiss: true,
      title: `${ticketNumber} Details`,
      content: ticketDetail,
    });
  });

  // Fired after server-driven lookup completes and the grid is ready
  $(document).on('lookupcomplete', function () {
    $('.projectlist-table').hide();

    // Initialize paging on first load (pg=999 indicates "uninitialized")
    if ($('.pg input').val() === '999') {
      $('.pg input').val(1).trigger("change");
      $('.network-user-name input').trigger("change");
    }

    // Build lookup maps (Departments, Initiators, QEs) used by filters
    loadDepartmentMap();
    loadInitiatorMap();
    loadQualityEngineerMap();

    // Enhance grid
    generateTicketNumberColumn(); // Turns ticket number inputs into clickable links
    generateFilterRow();          // Adds filter UI and wires change handlers
    reApplyFilterValues();        // See "Page Refresh Quirks" above
    appendPagination();           // See "Pagination" above

    // Container for popup iframe dialogs
    if ($('#popUpDiv').length === 0) {
      $('.section-iframe').append("<div class='hidden-text' id='popUpDiv'></div>");
    }

    // Normalize Create Date display to just the date portion
    $('.create-date-col input').each((i, dateField) => $(dateField).val($(dateField).val().split(" ")[0]));

    // Enable Add button only for authorized user types (1 or 3)
    const userTypeID = Number($('.user-type-id input').val());
    if (typeof $('.user-type-id input').val() === 'undefined') {
      $('.add-button').addClass("ui-state-disabled");
    }
    else {
      if ((userTypeID !== 1) && (userTypeID !== 3)) {
        $('.add-button').addClass("ui-state-disabled");
      }
      else {
        $('.add-button').removeClass("ui-state-disabled");
      }
    }

    $('.projectlist-table').show();
  });

  // Restore previously selected site (from cookie) once all onload lookups have completed
  $(document).on("onloadlookupfinished", function () {
    const sitename = $.cookie('site_name');
    if (sitename !== null) {
      $('.site-name select').val(sitename).trigger("change");
    }
  });

});

/**
 * Append/injects pagination controls under the grid based on current page and row count.
 * Reads `.pg input` for current page and inspects grid row count.
 * Produces a simple 3-button widget: first/prev and next (with disabled states).
 */
function appendPagination() {
  const current_page = Number($('.pg input').val());
  if (current_page === 999) { return; }

  const row_count = $('.projectlist-table table tbody tr').length;

  if (row_count > 0) {
    $('#projectlist-pagination').remove();

    // Page 1 with less than one page of rows: only disabled arrows
    if ((current_page === 1) && (row_count < 25)) {
      $('.projectlist-table table').parent().append("<div id='projectlist-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled'>&laquo;</a></li><li><a class='page-link prev isDisabled'>&lsaquo;</a></li><li><a class='page-link next isDisabled'>&rsaquo;</a></li></ul></div>");
      return;
    }
    // Page 1 with exactly one page: can go next
    if ((current_page === 1) && (row_count === 25)) {
      $('.projectlist-table table').parent().append("<div id='projectlist-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled'>&laquo;</a></li><li><a class='page-link prev isDisabled'>&lsaquo;</a></li><li><a class='page-link next' onclick='callNextPage();' href='javascript:void(0);'>&rsaquo;</a></li></ul></div>")
      return;
    }
    // Middle pages: can go first, prev, next
    if ((current_page > 1) && (row_count === 25)) {
      $('.projectlist-table table').parent().append("<div id='projectlist-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev' onclick='resetPageNumber();' href='javascript:void(0);'>&laquo;</a></li><li><a class='page-link prev' onclick='callPrevPage();' href='javascript:void(0);'>&lsaquo;</a></li><li><a class='page-link next' onclick='callNextPage();' href='javascript:void(0);'>&rsaquo;</a></li></ul></div>")
      return;
    }
    // Last page: can go first, prev; next disabled
    if ((current_page > 1) && (row_count < 25)) {
      $('.projectlist-table table').parent().append("<div id='projectlist-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev' onclick='resetPageNumber();' href='javascript:void(0);'>&laquo;</a></li><li><a class='page-link prev' onclick='callPrevPage();' href='javascript:void(0);'>&lsaquo;</a></li><li><a class='page-link next isDisabled'>&rsaquo;</a></li></ul></div>")
    }
  }
}

/**
 * Opens the "Add Programming Ticket" form in a modal iframe dialog sized to the current window.
 */
function addTicket() {
  let widowHeight = $(window).height();
  widowHeight = widowHeight - 50;
  popUpIframe(`http://rmslf/Forms/RMS-MPM-AddProgrammingTicket`, 'Add Programming Ticket', widowHeight, 1500);
}

/**
 * Advances to the next page of results:
 * - Hides grid, removes dynamic UI, increments `.pg input`, and triggers change to reload.
 */
function callNextPage() {
  $('.projectlist-table').hide();
  removeAppendedFields();
  let current_page = Number($('.pg input').val());
  $('.pg input').val(current_page + 1).trigger("change");
}

/**
 * Goes back one page (no-op at page 1).
 */
function callPrevPage() {
  $('.projectlist-table').hide();
  removeAppendedFields();
  let current_page = Number($('.pg input').val());
  if (current_page === 1) {
    return;
  }
  $('.pg input').val(current_page - 1).trigger("change");
}

/**
 * Opens a ticket details editor in a popup iframe dialog.
 * @param {number|string} ticket_id - The ticket ID used by the edit form.
 */
function callShowDetails(ticket_id) {
  let widowHeight = $(window).height();
  widowHeight = widowHeight - 50;
  popUpIframe(`http://rmslf/Forms/MPM-EditProgrammingTicket?tid=${ticket_id}`, 'Ticket Details', widowHeight, 1500);
}

/**
 * Applies filter UI values to the hidden query-driving inputs and reloads the first page.
 * Requires lookup maps to translate display names to IDs.
 */
function filterTable() {
  if ($('#filterRow').length === 0) {
    return;
  }

  // Include Completed checkbox -> hidden field
  if ($("#chkIncludeComplete").is(":checked")) {
    $('.inccom input').val(1);
  }
  else {
    $('.inccom input').val(0);
  }

  // Read filter UI values
  const taskNameFilterValue = $('#txtFilter_TaskName').val();
  const projectNameFilterValue = $('#txtFilter_ProjectName').val();
  const ticketNumberFilterValue = $('#txtFilter_TicketNumber').val();
  const departmentFilterVal = $('#cboFilter_Department').val();
  const qeFilterVal = $('#cboFilter_QE').val();
  const initiatorFilterVal = $('#cboFilter_Initiator').val();

  // Push straight text filters into hidden fields
  $('.ftname input').val(taskNameFilterValue);
  $('.fpname input').val(projectNameFilterValue);
  $('.fpid input').val(ticketNumberFilterValue);

  // Translate selected names to IDs using lookup maps
  if ((departmentFilterVal !== null) && (departmentFilterVal.length > 0)) {
    const departmentID = departmentNameMap.get(departmentFilterVal);
    $('.fdid input').val(departmentID);
  }
  else {
    $('.fdid input').val(0);
  }

  if ((qeFilterVal !== null) && (qeFilterVal.length > 0)) {
    const qeID = qualityEngineerNameMap.get(qeFilterVal);
    $('.fqeid input').val(qeID);
  }
  else {
    $('.fqeid input').val(0);
  }

  if ((initiatorFilterVal !== null) && (initiatorFilterVal.length > 0)) {
    const initiatorID = initiatorNameMap.get(initiatorFilterVal);
    $('.finitemp input').val(initiatorID);
  }
  else {
    $('.finitemp input').val(0);
  }

  // Reload from page 1
  $('.projectlist-table').hide();
  removeAppendedFields();
  $('.pg input').val(1).trigger("change");
}

/**
 * Adds the filter row, "Include Completed" checkbox, and "Add Ticket" button to the grid header.
 * Wires change/dblclick handlers and populates the Department/QE/Initiator selects from lookup combos.
 * Also initializes sort click handlers.
 */
function generateFilterRow() {
  if ($('#filterRow').length === 0) {
    // Add Ticket button
    const add_button = '<div class="table-button ui-button add-button" onclick="addTicket()"><span title="AddTicket" class="ui-button-icon ui-icon ui-icon-plusthick"></span>Add Ticket</div>'
    $(add_button).insertBefore('.projectlist-table table');

    // Include Completed toggle
    const includeCompleteCheckbox = '<div class="choice include-choice"><input name="chkIncludeComplete" id="chkIncludeComplete" type="checkbox" ><label class="form-option-label" for="chkIncludeComplete">Show Completed</label></div>'
    $('.projectlist-table table').parent().prepend(includeCompleteCheckbox)

    // Filter row with text and select controls
    const filter_row = "<TR id='filterRow'><TH><input id='txtFilter_TicketNumber'/></TH><TH><input type='text' id='txtFilter_ProjectName'></TH><TH/><TH><select id='cboFilter_Department'/></TH><TH/><TH/><TH><select id='cboFilter_QE'/></TH><TH><select id='cboFilter_Initiator'/></TH><TH/><TH><input type='text' id='txtFilter_TaskName'></TH></TR>"

    // Clarify the purpose of the last column
    $('.projectlist-table table thead th:last-child').text('Search By Task Name');

    // Append filter UI and wire handlers
    $('.projectlist-table table thead').append(filter_row);

    $("#txtFilter_TicketNumber").on("change", function () { filterTable(); });
    $("#txtFilter_ProjectName").on("change", function () { filterTable(); });
    $("#cboFilter_Department").on("change", function () { filterTable(); });
    $("#cboFilter_QE").on("change", function () { filterTable(); });
    $("#cboFilter_Initiator").on("change", function () { filterTable(); });
    $("#txtFilter_TaskName").on("change", function () { filterTable(); });
    $("#chkIncludeComplete").on("change", function () { filterTable(); });

    // Quick clear via double-click
    $("#txtFilter_TicketNumber").on("dblclick", function () { $("#txtFilter_TicketNumber").val(null).trigger("change"); });
    $("#txtFilter_ProjectName").on("dblclick", function () { $("#txtFilter_ProjectName").val(null).trigger("change"); });
    $("#cboFilter_Department").on("dblclick", function () { $("#cboFilter_Department").val(null).trigger("change"); });
    $("#cboFilter_QE").on("dblclick", function () { $("#cboFilter_QE").val(0).trigger("change"); });
    $("#cboFilter_Initiator").on("dblclick", function () { $("#cboFilter_Initiator").val(0).trigger("change"); });
    $("#txtFilter_TaskName").on("dblclick", function () { $("#txtFilter_TaskName").val(null).trigger("change"); });

    // Sorting hooks on column headers
    wireUpSortFields();
  }

  // Pre-fill filter inputs from hidden fields when present (restores state across reloads)
  if ((($('.ftname input').val() !== null) && ($('.ftname input').val().length > 0)) && (($('#txtFilter_TaskName').val() === null) || ($('#txtFilter_TaskName').val() === ''))) {
    $('#txtFilter_TaskName').val($('.ftname input').val());
  }

  if ((($('.fpname input').val() !== null) && ($('.fpname input').val().length > 0)) && (($('#txtFilter_ProjectName').val() === null) || ($('#txtFilter_ProjectName').val() === ''))) {
    $('#txtFilter_ProjectName').val($('.fpname input').val());
  }

  if ((($('.fpid input').val() !== null) && ($('.fpid input').val().length > 0)) && (($('#txtFilter_TicketNumber').val() === null) || ($('#txtFilter_TicketNumber').val() === ''))) {
    $('#txtFilter_TicketNumber').val($('.fpid input').val());
  }

  // Populate select options from hidden lookup combos (avoids duplicating source of truth)
  if (($(".department-lookup-combo select option").length > 1) && ($("#cboFilter_Department option").length === 0)) {
    const departmentOptions = $(".department-lookup-combo select").html();
    $("#cboFilter_Department").html(departmentOptions);
  }

  if (($(".qe-lookup-combo select option").length > 1) && ($("#cboFilter_QE option").length === 0)) {
    $("#cboFilter_QE").html($(".qe-lookup-combo select").html());
  }

  if (($(".initiator-lookup-combo select option").length > 1) && ($("#cboFilter_Initiator option").length === 0)) {
    $("#cboFilter_Initiator").html($(".initiator-lookup-combo select").html());
  }
}

/**
 * Replaces plain ticket number inputs with clickable links that open the detail dialog.
 * Assumes `.projectlist-ticket-id-col` and `.projectlist-ticket-number-col` column structure.
 */
function generateTicketNumberColumn() {
  const ticket_ids = $('.projectlist-ticket-id-col input[type="text"]');
  const ticket_numbers = $('.projectlist-ticket-number-col input[type="text"]');

  ticket_numbers.each(function (index) {
    const ticket_id = $(ticket_ids[index]).val();
    const ticket_number = $(this).val();
    const project_link = $("<a>", { text: ticket_number, class: 'project-link', href: `javascript:void(0);`, onclick: `callShowDetails(${ticket_id})` });
    if ($(this).parent().find('.project-link').length === 0) {
      $(this).parent().append(project_link);
    }
  });
}

/**
 * Loads Department ID<->Name maps from the lookup table in the DOM.
 * Note: Guard uses Map.keys.length which is always 0; function executes each time.
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
 * Loads QE ID<->Name maps from the lookup table in the DOM.
 * Note: Guard uses Map.keys.length which is always 0; function executes each time.
 */
function loadQualityEngineerMap() {
  if (qualityEngineerMap.keys.length === 0) {
    const qe_rows = $('.qe-lookup-table table tbody tr');
    if (qe_rows.length === 0) {
      return;
    }
    qe_rows.each(function () {
      let qeID = Number($(this).find('.qe-lookup-table-id input').val());
      let qeName = $(this).find('.qe-lookup-table-name input').val();
      qualityEngineerMap.set(qeID, qeName);
      qualityEngineerNameMap.set(qeName, qeID);
    });
  }
}

/**
 * Loads Initiator ID<->Name maps from the lookup table in the DOM.
 * Note: Guard uses Map.keys.length which is always 0; function executes each time.
 */
function loadInitiatorMap() {
  if (initiatorMap.keys.length === 0) {
    const initiator_rows = $('.initiator-lookup-table table tbody tr');
    if (initiator_rows.length === 0) {
      return;
    }
    initiator_rows.each(function () {
      let initiatorID = $(this).find('.initiator-lookup-table-id input').val();
      let initiatorName = $(this).find('.initiator-lookup-table-name input').val();
      initiatorMap.set(initiatorID, initiatorName);
      initiatorNameMap.set(initiatorName, initiatorID);
    });
  }
}

/**
 * Creates and opens a jQuery UI Dialog containing an iframe for forms/pages.
 * Also adjusts resizable container styles for consistent width.
 * @param {string} src - Iframe URL
 * @param {string} title - Dialog title
 * @param {number} height - Dialog height in pixels
 * @param {number} width - Dialog width in pixels
 */
function popUpIframe(src, title, height, width) {
  $("#popupIFrame").remove();
  $("#popUpDiv").html(`<div style='height:${height}px; width:${width}px;'><iframe id='popupIFrame' name='myname' src='${src}' height='${height}' width='${width}'/></div>`);
  $("#popupIFrame").dialog({
    title: title,
    height: height,
    width: width,
    autoOpen: false,
    resizable: true,
    modal: true,
    position: { my: "left top", at: "left top", of: window },
    close: function (event, ui) {
      // no-op
    }
  });
  $("#popupIFrame").dialog("open");
  $("#popupIFrame").attr('style', `width: ${width};`);

  // Tweak jQuery UI resizable inline style (ensures width is applied)
  const resizeableStyle = $('.ui-resizable').attr('style');
  const newStyle = resizeableStyle.replaceAll('width: 0px;', `width: ${width}px;`);
  $('.ui-resizable').attr('style', newStyle);
}

/**
 * Placeholder for restoring filter UI from hidden fields.
 */
function reApplyFilterValues() {
  //if ($('#filterRow').length == 0) {
  //  return;
  //}

  //var includeNotScheduled = Number($('.fincns input').val());
  //var includeCompleted = Number($('.finccom input').val());
  //var excludeWaiting = Number($('.fexw input').val());

  //if (includeNotScheduled == 1) {
  //  $('#Field206-0').prop('checked', true);
  //}
  //else {
  //  $('#Field206-0').prop('checked', false);
  //}

  //if (includeCompleted == 1) {
  //  $('#Field206-1').prop('checked', true);
  //}
  //else {
  //  $('#Field206-1').prop('checked', false);
  //}

  //if (excludeWaiting == 1) {
  //  $('#Field206-2').prop('checked', true);
  //}
  //else {
  //  $('#Field206-2').prop('checked', false);
  //}



  //var taskNameFilterValue = $('.ftname input').val();
  //var projectNameFilterValue = $('.fpname input').val();
  //var projectFilterValue = Number($('.fpid input').val());

  //var taskTypeFilterVal = Number($('.fttid input').val());
  //var statusFilterVal = Number($('.fsid input').val());
  //var assigneeFilterVal = Number($('faid input').val());
  //var departmentFilterVal = Number($('fdid input').val());


  //if ((taskNameFilterValue != null) && (taskNameFilterValue.length > 0)) {
  //  $('#txtFilter_TaskName').val(taskNameFilterValue);
  //}
  //if ((projectNameFilterValue != null) && (projectNameFilterValue.length > 0)) {
  //  $('#txtFilter_ProjectName').val(projectNameFilterValue);
  //}

  //if (projectFilterValue != NaN) {
  //  let projectName = projectMap.get(projectFilterValue);
  //  $('#cboFilter_TicketNumber').val(projectFilterValue);
  //}
  //if (taskTypeFilterVal != NaN) {
  //  let taskTypeName = taskTypeMap.get(taskTypeFilterVal);
  //  $('#cboFilter_TaskType').val(taskTypeName);
  //}
  //if (statusFilterVal != NaN) {
  //  let statusName = taskStatusMap.get(statusFilterVal);
  //  $('#cboFilter_Status').val(statusName);
  //}
  //if (assigneeFilterVal != NaN) {
  //  let assigneeName = assigneeMap.get(assigneeFilterVal);
  //  $('#cboFilter_Assignee').val(assigneeName);
  //}
  //if (departmentFilterVal != NaN) {
  //  let departmentName = departmentMap.get(departmentFilterVal);
  //  $('#cboFilter_Department').val(departmentName);
  //}
}

/**
 * Rebuilds current page URL with query-string parameters mirroring current filter state,
 * then navigates to that URL to cause a full server-side refresh.
 */
function refreshPage() {
  const taskNameFilter = $('.ftname input').val();
  const include_Complete = Number($('.inccom input').val());
  const projectIDFilter = Number($('.fpid input').val());
  const departmentIDFilter = Number($('.fdid input').val());
  const taskListPage = Number($('.tasklist-page input').val());

  let current_url = window.location.href;
  if (current_url.includes('?')) {
    let indexOfQuestionMark = current_url.indexOf('?');
    current_url = current_url.substring(0, indexOfQuestionMark);
  }

  if ((taskListPage !== null) && (!isNaN(taskListPage)) && (taskListPage > 0)) {
    current_url = current_url + `?pg=${taskListPage}`;
  }

  if ((taskNameFilter !== null) && (taskNameFilter.length > 0)) {
    current_url = current_url + `&ftname=${taskNameFilter}`;
  }

  if ((include_Complete !== null) && (!isNaN(include_Complete)) && (include_Complete > 0)) {
    current_url = current_url + `&inccom=${include_Complete}`;
  }

  if ((projectIDFilter !== null) && (!isNaN(projectIDFilter)) && (projectIDFilter > 0)) {
    current_url = current_url + `&fpid=${projectIDFilter}`;
  }

  if ((departmentIDFilter !== null) && (!isNaN(departmentIDFilter)) && (departmentIDFilter > 0)) {
    current_url = current_url + `&fdid=${departmentIDFilter}`;
  }
  window.location = current_url;
}

/**
 * Removes dynamic UI elements that get regenerated on each paging/sorting/filtering action.
 */
function removeAppendedFields() {
  $('#projectlist-pagination').remove();
  $('.project-link').remove();
}

/**
 * Resets paging to page 1 and reloads.
 */
function resetPageNumber() {
  $('.projectlist-table').hide();
  removeAppendedFields();
  $('.pg input').val(1).trigger("change");
}

/**
 * Toggles sort state and updates sort indicators for the given field ordinal.
 * Ordinals:
 *  0 -> #q53, 1 -> #q52, 2 -> #q58, 3 -> #q60, 4 -> #q61, 5 -> #q66
 * Updates hidden sort fields: `.sort-field-ordinal input`, `.sort-direction input`
 * @param {number} newSortOrdinal - The column ordinal to sort by.
 */
function sortTable(newSortOrdinal) {
  $('.projectlist-table').hide();
  removeAppendedFields();
  $('.sort-icon').remove();

  const currentSortOrdinal = Number($('.sort-field-ordinal input').val());
  let sortDirection = Number($('.sort-direction input').val());

  // Toggle direction if same column; otherwise set new column with ascending (0)
  if (newSortOrdinal === currentSortOrdinal) {
    if (sortDirection === 0) {
      sortDirection = 1
      $('.sort-direction input').val(1).trigger("change");
    }
    else {
      sortDirection = 0;
      $('.sort-direction input').val(0).trigger("change");
    }
  }
  else {
    $('.sort-field-ordinal input').val(newSortOrdinal);
    $('.sort-direction input').val(0).trigger("change");
    sortDirection = 0;
  }

  // Add visual sort indicators to the appropriate header label
  if (newSortOrdinal === 0) {
    if (sortDirection === 0) {
      $('#q53 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-n sort-icon"></span>');
    }
    else {
      $('#q53 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-s sort-icon"></span>');
    }
  }
  if (newSortOrdinal === 1) {

    if (sortDirection === 0) {
      $('#q52 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-n sort-icon"></span>');
    }
    else {
      $('#q52 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-s sort-icon"></span>');
    }
  }
  if (newSortOrdinal === 2) {
    if (sortDirection === 0) {
      $('#q58 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-n sort-icon"></span>');
    }
    else {
      $('#q58 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-s sort-icon"></span>');
    }
  }
  if (newSortOrdinal === 3) {
    if (sortDirection === 0) {
      $('#q60 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-n sort-icon"></span>');
    }
    else {
      $('#q60 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-s sort-icon"></span>');
    }
  }
  if (newSortOrdinal === 4) {
    if (sortDirection === 0) {
      $('#q61 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-n sort-icon"></span>');
    }
    else {
      $('#q61 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-s sort-icon"></span>');
    }
  }
  if (newSortOrdinal === 5) {
    if (sortDirection === 0) {
      $('#q66 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-n sort-icon"></span>');
    }
    else {
      $('#q66 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-s sort-icon"></span>');
    }
  }

}

/**
 * Wires click handlers to specific header labels for sorting and sets an initial sort icon.
 */
function wireUpSortFields() {
  // Default sort icon on #q53 ascending
  $('#q53 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-n sort-icon"></span>');

  // Map headers to sort ordinals
  $('#q52').on('click', function () { sortTable(1); });
  $('#q53').on('click', function () { sortTable(0); });
  $('#q58').on('click', function () { sortTable(2); });
  $('#q60').on('click', function () { sortTable(3); });
  $('#q61').on('click', function () { sortTable(4); });
  $('#q66').on('click', function () { sortTable(5); });
}
