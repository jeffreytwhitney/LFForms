/**
 @file PurchaseOrders.js
 @summary Client-side behavior for the Purchase Orders list page: wiring, filtering, sorting, pagination,
          modal dialogs (add/edit/note), printing, row color-coding, and state persistence.

Author:   Jeffrey Whitney
          jtwhitney@machine.com
          651-391-7982
Date:     10/24/2025


 Overview
 - Initializes the PO list page (hides submit button, sets title, loads external libs/CSS).
 - Wires UI interactions: filtering, sorting, pagination, printing, and admin-only actions.
 - Opens add/edit/note forms in jQuery UI modal dialogs via iframes.
 - Persists site selection in a cookie and filter values in hidden fields for server-roundtrips.
 - Receives postMessage events from child iframes (print and close behaviors).
 - Applies row color-coding based on status and age for quick scanning.

 KEY CONCEPTS:
    DIALOG/POPUP MECHANISM:
     As with most things in LaserFiche Forms, there is no built-in way to open a popup dialog or iframe, so I had to build my own functionality.
     This is done via a combination of a hidden div on the form, and a jQuery UI dialog. The hidden div is populated with an iframe
     which loads the desired URL. The jQuery UI dialog is then opened, displaying the iframe. If you just close the dialog, nothing happens
     to this form. If, however, you submit the popup form, the first thing it does is to change a hidden field called 'closeme' to a value of 1.
     (Its default is 0.)
     After the popup gets submitted to the server, the server processes it by sending its form fields to a LF Workflow.
     When the workflow completes, it comes back to the server-side process which forwards back to the same form, but this time
     with the closeme field set by the query string. (We set it when we submitted the form.)
     When the popup loads, it has its closeme value set by the query string, so it knows that it has just come back from being submitted.
     Therefore, it will then send a message to its parent, (namely, this form), informing it that the server-side
     data has changed. When this form receives such a message, it closes the popup dialog, and then it calls a function refreshes the page.

    USER PERMISSIONS:
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

   LASERFICHE EVENTS:
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

   PAGE REFRESH QUIRKS:
      There are two ways that the page can be programmatically refreshed. One is via the filter/sort/pagination mechanism described below.
      The second is when our page receives a message from a popup that the information on the page has changed and should be refreshed,
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
      As I stated above, there are two ways that a page is going to get refreshed. The filter/sort/pagination type, we can call a "soft" refresh
      because it doesn't reload the web page. But there's another type of refresh that we perform: when a popup window sends us a message
      telling us that the underlying data has changed. This causes a "hard" refresh, meaning that the page itself is reloaded.

      The reason we do this is that we don't know what was changed, we just know that something did. But none of the filters/sorts/pagination
      has changed, just the data that those things apply to. So we have to make the page itself refresh. Simple, right? Yeah, not so much.
      The complexity comes from the fact that we have filtering and sorting to worry about. Again, let me explain.

      Let's say you have a page where you are filtering the records by Ticket Number. So you have 'P-12345' in the Filter Ticket Number text box.
      So let's say you open that ticket (opening a popup pointing at the EditTicket page) and make a change that would cause that row in our table
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
            to begin with. This way, when the page reloads, the filters and sorting are still in place, LFF will automatically apply
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

            Normally, such as when you open the page for the first time, these hidden filter fields are all blank or are set to
            a default value. But in the case of a hard refresh, the hidden filter fields may have values in them. So, for
            our Department example, once the Filter Department dropdown exists, if the hidden department id field has a value in it, (which,
            in our example is set to 12), then we have to do a reverse lookup, finding the Department Name associated with that ID, and
            setting the Filter Department dropdown's value to the Department Name. (Setting it back to "Ortho", in this case.)

            This way, the whole thing happens without any inconvenience to the user. and everything works as the user would expect it. We just
            had to jump through nineteen hoops to make it happen. Thanks LaserFiche!

   FILTERING AND SORTING:
      There is no way to filter or sort rows in LFF, so I had to build a custom filtering mechanism. This is done via a combination of hidden
      fields which are arguments to a SQL Server stored procedure. The stored procedure returns a maximum of 25 rows at a time,
      so we have to be able to filter and sort the rows on the server side.
      There are also two buttons that allow the user to change which page of results they are viewing.
      Here is a list of the hidden fields used for filtering and sorting:

        Filtering:
         - .pg             => Page number (1-based), 999 = uninitialized. The page of results to return.
         - .poid           => purchase order id (integer)
         - .sid            => site id (integer)
         - .fincom         => include (1) or exclude (0) completed POs (integer)
         - .freqid         => requester id (integer)
         - .fvname         => vendor name (string)
         - .fpodesc        => purchase order description (string)
         - .fponum         => purchase order number (string)
         - .fdmin          => creation date minimum (date)
         - .fdmax          => creation date maximum (date)


        Sorting:
          .sfo             => Field to sort by (1 = Task Name, 2 = Task Type, 3 = Status, 4 = Assignee, 5 = Due Date, 6 = Priority)
          .sd              => Sort direction (ASC or DESC)

      This gets us part of the way there, but we also need to have a way for the user to set these fields.
      This is done via a filter row which is added to the task list table. The filter row contains a text box for the task name filter,
      and dropdowns for the task type, status, and assignee filters. There is also a checkbox to include completed tasks.
      The change of these controls triggers the filterTable() function which reads the values from the controls and sets the
      hidden fields accordingly. Values from select controls are mapped from name to ID using the lookup maps.
      Sorting is handled via clickable column headers. Clicking a header sets the sort field and toggles the sort direction.
      If you click on a sort field that is already the current sort field, it toggles the direction.

   PAGINATION:
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
        So if you have Department first and the main table data second, that should meaner than the department lookup data is there before
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
        button. The logic is: if there are 25 rows, there must be another page of results. If there is less than that, we know that there
        isn't another page of results. Where this could come up is when there are a number of results that are exactly divisible by 25.
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
        add functionality that nobody's really using anyway. No, it wouldn't take long to write, but it seems like needless computation just
        so that the pagination logic is flawless. There are also a bunch of pages that use pagination, so we'd have to have an extra sproc
        for every page that uses pagination. And then there's the extra client-side processing of making a bunch of extra buttons and what not.
        Honestly, the page is slow enough as it is without adding a bunch of extra code for, again, functionality that no one really uses.

     MAPPING:
       There are several different lookup tables on the form that are used to populate dropdowns, nearly all of which are for filtering.
       Task types are stored both as ID?Name and Name?ID because LFF only stores the display value in the select, for example, the TaskType
       select shows the names of the task types, but we are storing the TaskTypeID in the database, so we need to have a way to
       figure out what the TaskTypeID is so that we can set the value of the hidden field that the workflow is going to use to
       set the value in the task table. So we need to be able to look up the ID by name when the user selects a task type.
       The only way I've been able to figure out how to do this is to have a hidden lookup table on the page which contains all the
       task types and their IDs. So when the page loads, we read that table and build two maps: one for ID?Name and one for Name?ID.
       When the user selects a task type, we look up the ID by name and set the value of the hidden field.


 External Dependencies (loaded at runtime)
 - jQuery, jQuery UI (dialog, icons)
 - jquery-cookie (persist site), jquery-confirm (quick dialogs)
 - moment.js (date parsing/formatting)
 - simplePagination.css (styling only)

 Expected DOM Contract (key elements/fields)
 - Main table container:    .purchase-order-table
 - Hidden/Backing fields:   .pg (page), .finccom (include completed),
                            .freqid (requester id), .fvname (vendor name),
                            .fponum (PO number), .fpodesc (description),
                            .fdmin/.fdmax (date range), .sfo (sort field ordinal), .sd (sort direction)
 - Lookup tables (hidden):  .requester-lookup-table, .status-lookup-table
 - Lookup combos (hidden):  .requester-lookup-cbo select, .vendor-lookup-cbo select
 - User fields:             .lf-user-name input, .network-user-name input, .user-isadmin input
 - Site fields:             .site-name selects, .site-id input
 - Print host:              #popUpDiv (created on demand), #print-iframe (injected)
 - Modal iframe:            #popupIFrame (created on demand)


 Paging
 - Page size assumed: 25 rows.
 - Hidden field .pg tracks the current page (1-based). Special value 999 short-circuits pagination rendering.
 - Navigation: callNextPage, callPrevPage, resetPageNumber (all cause server refresh by changing .pg).

 Sorting
 - Hidden fields: .sfo (sort field ordinal), .sd (direction: 0=asc, 1=desc).
 - UI: sortTable toggles state and updates a jQuery UI triangle icon in column headers.
 - wireUpSortFields binds clickable headers to sort ordinals; the default sort is Create Date (#q37).

 Filtering
 - Header filter row injected via generateFilterRow (requester/vendor dropdowns, PO number, description, date min/max).
 - filterTable mirrors UI values into hidden fields, resets to page 1, then triggers server refresh.
 - Reapply: reApplyFilterValues hydrates the filter UI from backing fields on a load.
 - Requester uses the name<->id maps (built from .requester-lookup-table).

 Modals and Printing
 - popupIFrame opens add/edit/note forms:
     /Forms/MPM-AddPurchaseOrder?siteid=...
     /Forms/MPM-EditPurchaseOrder?poid=...
     /Forms/MPM-AddPurchaseOrderNote?poid=...&nt=1
 - printReport builds /Forms/MPM-PurchaseOrderPrint?sid=... and injects #print-iframe into #popUpDiv.
 - Parent listens for "printme" postMessage to print the iframe.

 Row Color-Coding
 - colorCodeRows marks rows:
     - "colorClosedCancelled" for Completed/Canceled
     - "colorOverDue" if the creation date is older than 30 days

 Cookies/State
 - Persists last-selected site name in cookie "site_name" (365-day expiration).
 - Normalizes the network user from .lf-user-name into .network-user-name (domain-less, uppercase).

 */
const requesterMap = new Map();
const requesterNameMap = new Map();
const statusMap = new Map();
const statusNameMap = new Map();


$(document).ready(function () {
  $('.Submit').hide();
  $(document).prop('title', 'Purchase Orders');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simplePagination.js/1.6/simplePagination.min.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
  $.fn.bootstrapBtn = $.fn.button.noConflict();

  // Normalize and capture the current user into a hidden field.
  const lfUserName = $('.lf-user-name input').val();
  if (lfUserName !== 'Anonymous User') {
    $('.network-user-name input').val(lfUserName.toUpperCase().substring(lfUserName.lastIndexOf('\\') + 1)).trigger("change");
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


  const eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
  const printEvent = window[eventMethod];
  const messageEvent = eventMethod === "attachEvent" ? "onmessage" : "message";
  printEvent(messageEvent, function (e) {

    if (e.data === "printme" || e.message === "printme") {
      $("#print-iframe").get(0).contentWindow.print();
      $('.print-ticket-id input').val(null);
    }
  });

  // Persist selected site to a cookie.
  $(document).on('change', '.site-name select', function () {
    $('.purchase-order-table').hide();
    $('.table-button').remove();
    const sitename = $('.site-name select').val();
    $.cookie('site_name', sitename, { expires: 365, path: '/' });
  });

  // Include Inactive checkbox toggles filter and reloads page 1.
  $(document).on('change', '#chkIncludeInActive', function () { filterTable(); });

  // Quick view of description in a dialog on double-click.
  $(document).on('dblclick', '.description-col div', function () {
    const description = $(this).find('input').val();

    $.dialog({
      escapeKey: true,
      backgroundDismiss: true,
      title: `Purchase Order Description:`,
      content: description,
      resizable: true,
      width: 800,
      height: 600,
    });
  });

  // Quick view of long error in a dialog on double-click.
  $(document).on('dblclick', '.po-name-col div', function () {
    const poName = $(this).find('input').val();

    $.dialog({
      escapeKey: true,
      backgroundDismiss: true,
      title: `Gage ID/SN:`,
      content: poName,
      resizable: true,
      width: 800,
      height: 600,
    });
  });

  // When lookup tables are available, finish wiring the grid.
  $(document).on('lookupcomplete', function () {
    loadRequesterMap();
    loadStatusMap();

    // Trim date display to the date portion.
    $('.create-date-col input').each((i, dateField) => $(dateField).val($(dateField).val().split(" ")[0]));
    $('.last-updated-col input').each((i, dateField) => $(dateField).val($(dateField).val().split(" ")[0]));

    generateTableButtons(".edit-button-col", "ui-icon-pencil", "Edit Purchase Order", "callEditPurchaseOrder", true);
    appendPagination(); // See "Pagination" above.
    generateFilterRow(); // See "Filtering and Sorting" above.
    reApplyFilterValues();        // See "Page Refresh Quirks" above
    colorCodeRows();
    $('.purchase-order-table').show();

    let editStatusID;
    let editStatus;
    if (($('.edit-po-id input').val() !== '0') && ($('.edit-status-id input').val() !== '')) {
      editStatusID = Number($('.edit-status-id input').val());
      editStatus = statusMap.get(editStatusID);
      $('.edit-status-cbo select').val(editStatus).trigger("change");
    }

  });

  // Final page activation after load.
  $(document).on("onloadlookupfinished", function () {
    // Host element for modal iframe dialogs.    
    $('#q0').append("<div class='hidden-text' id='popUpDiv'></div>");


    //See "Page Refresh Quirks" above.
    if ($('.pg input').val() === '999') {
      $('.pg input').val(1).trigger("change");
    }

    // Restore last-selected site from cookie.
    const sitename = $.cookie('site_name');
    if (sitename !== null) {
      $('.site-name select').val(sitename).trigger("change");
    }

    // Trigger any dependent logic that listens to network-user-name changes.
    $('.network-user-name input').trigger("change");
    $('.purchase-order-table').show();
  });

});


/**
  * Append simple pagination controls based on the current page and row count.
 * Relies on '.pg input' value and current table rows.
 */
function appendPagination() {

  const current_page = Number($('.pg input').val());
  if (current_page === 999) { return; }

  const row_count = getTableRowCount();

  if (row_count > 0) {
    $('#po-pagination').remove();
    if ((current_page === 1) && (row_count < 25)) {
      $('.purchase-order-table table').parent().append("<div id='po-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled'>&laquo;</a></li><li><a class='page-link prev isDisabled'>&lsaquo;</a></li><li><a class='page-link next isDisabled'>&rsaquo;</a></li></ul></div>");
      return;
    }
    if ((current_page === 1) && (row_count === 25)) {
      $('.purchase-order-table table').parent().append("<div id='po-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled'>&laquo;</a></li><li><a class='page-link prev isDisabled'>&lsaquo;</a></li><li><a class='page-link next' onclick='callNextPage();' href='javascript:void(0);'>&rsaquo;</a></li></ul></div>")
      return;
    }
    if ((current_page > 1) && (row_count === 25)) {
      $('.purchase-order-table table').parent().append("<div id='po-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev' onclick='resetPageNumber();' href='javascript:void(0);'>&laquo;</a></li><li><a class='page-link prev' onclick='callPrevPage();' href='javascript:void(0);'>&lsaquo;</a></li><li><a class='page-link next' onclick='callNextPage();' href='javascript:void(0);'>&rsaquo;</a></li></ul></div>")
      return;
    }
    if ((current_page > 1) && (row_count < 25)) {
      $('.purchase-order-table table').parent().append("<div id='po-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev' onclick='resetPageNumber();' href='javascript:void(0);'>&laquo;</a></li><li><a class='page-link prev' onclick='callPrevPage();' href='javascript:void(0);'>&lsaquo;</a></li><li><a class='page-link next isDisabled'>&rsaquo;</a></li></ul></div>")

    }
  }
}


/**
 * Opens the "Add Note" popup for the current task.
 * Side effects:
 * - Opens jQuery UI dialog with an iframe via popupIFrame.
 */
function callAddNote() {
  const po_id = $('.edit-po-id input').val();
  const po_number = $('.edit-po-number input').val();
  const po_name = $('.edit-po-name input').val();
  let popupTitle;

  if (po_number.length > 0) {
    popupTitle = `Add Note for Purchase Order ${po_number}`;
  }
  else {
    popupTitle = `Add Note for Purchase Order '${po_name}'`;
  }


  popupIFrame(`http://rmslf/Forms/MPM-AddPurchaseOrderNote?poid=${po_id}&nt=1`, popupTitle, 400, 650);
}


/**
 * Opens the "Add Programming Ticket" form in a modal iframe dialog sized to the current window.
 */
function callAddPurchaseOrder() {
  let widowHeight = $(window).height();
  const siteid = $('.site-id input').val();
  widowHeight = widowHeight - 50;
  popupIFrame(`http://rmslf/Forms/MPM-AddPurchaseOrder?siteid=${siteid}`, 'Add Purchase Order', widowHeight, 1500);
}


/**
 * Switches the UI into Edit PO mode for the specified PO.
 * - Opens the "Edit Programming Ticket" form in a modal iframe dialog sized to the current window.
 * @param {number} poID - The PO ID to edit.
 */
function callEditPurchaseOrder(poID) {
  let widowHeight = $(window).height();
  widowHeight = widowHeight - 50;
  popupIFrame(`http://rmslf/Forms/MPM-EditPurchaseOrder?poid=${poID}`, 'Edit Purchase Order', widowHeight, 1500);
}


/** Advance to the next page and reload a list. */
function callNextPage() {
  $('.purchase-order-table').hide();
  $('.table-button').remove();
  current_page = Number($('.pg input').val());
  $('.pg input').val(current_page + 1).trigger("change");
}


/** Go to the previous page if possible and reload a list. */
function callPrevPage() {
  $('.purchase-order-table').hide();
  $('.table-button').remove();
  current_page = Number($('.pg input').val());
  if (current_page === 1) {
    return;
  }
  $('.pg input').val(current_page - 1).trigger("change");
}


/**
 * Apply CSS classes to rows based on status and dates for quick visual scanning.
 * - Overdue: due date <= today
 * - Started: started recently or long-running (> 30 days)
 * - Waiting: status waiting
 * - Completed/Canceled rows are ignored here (handled elsewhere)
 */
function colorCodeRows() {
  const purchase_order_rows = $(".purchase-order-table table tbody tr");
  $(purchase_order_rows).removeClass('colorOverDue');
  $(purchase_order_rows).removeClass('colorClosedCancelled');

  purchase_order_rows.each(function (index) {
    const purchase_order_row = purchase_order_rows[index];
    const is_past_due = $(purchase_order_row).find('.is-past-due-col input[type="text"]').val();
    const poStatus = $(purchase_order_row).find('.po-status-col input[type="text"]').val();

    if ((poStatus === 'Completed') || (poStatus === 'Cancelled')) {
      $(purchase_order_row).addClass('colorClosedCancelled');
      return;
    }

    if (is_past_due === 'True') {
      $(purchase_order_row).addClass('colorOverDue');

    }
  });
}


/**
 * Applies table filters based on header controls:
 * - Include Inactive checkbox -> .finccom
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
    $('.finccom input').val(1);
  }
  else {
    $('.finccom input').val(0);
  }

  const requesterFilterVal = $('#cboFilter_Requester').val();
  const vendorFilterVal = $('#cboFilter_Vendor').val();
  const descriptionFilterVal = $('#txtFilter_Description').val();

  if ((requesterFilterVal !== null) && (requesterFilterVal.length > 0)) {
    const requesterID = requesterNameMap.get(requesterFilterVal);
    $('.freqid input').val(requesterID);
  }
  else {
    $('.freqid input').val(0);
  }

  if ((vendorFilterVal !== null) && (vendorFilterVal.length > 0)) {
    $('.fvname input').val(vendorFilterVal);
  }
  else {
    $('.fvname input').val('');
  }

  $('.fponame input').val($('#txtFilter_POName').val());
  $('.fponum input').val($('#txtFilter_PONumber').val());
  $('.fdmin input').val($('#txtFilter_CreateDateMin').val());
  $('.fdmax input').val($('#txtFilter_CreateDateMax').val());
  $('.fpodesc input').val(descriptionFilterVal);


  $('.purchase-order-table').hide();
  $('.table-button').remove();
  $('.pg input').val(1).trigger("change");

}


/**
 * Create the filter header row and wire change/dblclick reset handlers.
 * Populates filter dropdowns from corresponding hidden lookup combos.
 */
function generateFilterRow() {

  if ($('#filterRow').length === 0) {

    const filter_row = "<TR id='filterRow'><TH/><TH><input id='txtFilter_PONumber'/></TH><TH/><TH><select id='cboFilter_Requester'/></TH><TH><input id='txtFilter_Description'/></TH><TH><select id='cboFilter_Vendor'/></TH><TH/><TH><input type='text' id='txtFilter_CreateDateMin' placeholder='Min Date'><input type='text' id='txtFilter_CreateDateMax' placeholder='Max Date'><TH/><TH/><TH/></TR>";


    $('.purchase-order-table table thead').append(filter_row);
    $("#txtFilter_PONumber").on("change", function () { filterTable(); });
    $("#txtFilter_Description").on("change", function () { filterTable(); });
    $("#txtFilter_CreateDateMin").on("change", function () { filterTable(); });
    $("#txtFilter_CreateDateMax").on("change", function () { filterTable(); });

    $("#cboFilter_Requester").on("change", function () { filterTable(); });
    $("#cboFilter_Vendor").on("change", function () { filterTable(); });

    // Quick clear on double-click.
    $("#txtFilter_PONumber").on("dblclick", function () { $("#txtFilter_PONumber").val(null).trigger("change"); });
    $("#txtFilter_Description").on("dblclick", function () { $("#txtFilter_Description").val(null).trigger("change"); });
    $("#txtFilter_CreateDateMin").on("dblclick", function () { $("#txtFilter_CreateDateMin").val(null).trigger("change"); });
    $("#txtFilter_CreateDateMax").on("dblclick", function () { $("#txtFilter_CreateDateMax").val(null).trigger("change"); });
    $("#cboFilter_Requester").on("dblclick", function () { $("#cboFilter_Requester").val(0).trigger("change"); });
    $("#cboFilter_Vendor").on("dblclick", function () { $("#cboFilter_Vendor").val(0).trigger("change"); });

    wireUpSortFields();
  }

  let chkIncludeCompleted;
  let printButton;
  if ($('#chkIncludeInActive').length === 0) {
    chkIncludeCompleted = '<div class="choice include-choice" id="divIncludeInactive"><input name="chkIncludeInActive" id="chkIncludeInActive" type="checkbox"><label class="form-option-label" for="chkIncludeInActive">Show Completed</label></div>'
    $(chkIncludeCompleted).insertBefore('.purchase-order-table table');
    printButton = '<div class="ui-button print-button" id="print-report" onclick="printReport()"><span title="Print Report" class="ui-button-icon ui-icon ui-icon-print"></span>Print</div>'
    $(printButton).insertAfter('#divIncludeInactive');
  }

  if (isMetrologyUser()) {
    if ($('.add-button').length === 0) {
      const add_button = '<div class="ui-button add-button" id="add-purchase-order" onclick="callAddPurchaseOrder()"><span title="Add Purchase Order" class="ui-button-icon ui-icon ui-icon-plusthick"></span>Add Purchase Order</div>'
      $(add_button).insertBefore('.purchase-order-table table');
    }
    if ($('.add-note-button').length === 0) {
      const add_note_button = '<div class="ui-button add-note-button" id="add-note-button" onclick="callAddNote()"><span title="Add Note" class="ui-button-icon ui-icon ui-icon-plusthick"></span>Add Note</div>'
      $('#spacer').append(add_note_button);
    }
  }


  // Repopulate the filter controls from backing fields if present.
  if ((($('.fpodesc input').val() !== null) && ($('.fpodesc input').val().length > 0)) && (($('#txtFilter_Description').val() === null) || ($('#txtFilter_Description').val() === ''))) {
    $('#txtFilter_Description').val($('.fpodesc input').val());
  }

  if ((($('.fponum input').val() !== null) && ($('.fponum input').val().length > 0)) && (($('#txtFilter_PONumber').val() === null) || ($('#txtFilter_PONumber').val() === ''))) {
    $('#txtFilter_PONumber').val($('.fponum input').val());
  }

  if ((($('.fdmax input').val() !== null) && ($('.fdmax input').val().length > 0)) && (($('#txtFilter_CreateDateMax').val() === null) || ($('#txtFilter_CreateDateMax').val() === ''))) {
    $('#txtFilter_CreateDateMax').val($('.fdmax input').val());
  }

  if ((($('.fdmin input').val() !== null) && ($('.fdmin input').val().length > 0)) && (($('#txtFilter_CreateDateMin').val() === null) || ($('#txtFilter_CreateDateMin').val() === ''))) {
    $('#txtFilter_CreateDateMin').val($('.fdmin input').val());
  }

  // Populate dropdowns from lookup combos (do this once).
  if (($(".requester-lookup-cbo select option").length > 1) && ($("#cboFilter_Requester option").length === 0)) {
    $("#cboFilter_Requester").html($(".requester-lookup-cbo select").html());
  }

  if (($(".vendor-lookup-cbo select option").length > 1) && ($("#cboFilter_Vendor option").length === 0)) {
    $("#cboFilter_Vendor").html($(".vendor-lookup-cbo select").html());
  }

}


/**
 * Render a button-like div with an icon for each row in a given column.
 * @param {string} buttonSelector - Column selector (e.g., ".tasklist-note-col")
 * @param {string} buttonClass - jQuery UI icon CSS class to apply (e.g., "ui-icon-clock")
 * @param {string} buttonTitle - Tooltip for the icon/button
 * @param {string} buttonFunction - Global function name to call on click
 * @param {boolean} isArgNumeric - Whether the argument value is numeric (no quotes)
 */
function generateTableButtons(buttonSelector, buttonClass, buttonTitle, buttonFunction, isArgNumeric) {
  let btn_html;
  const selectionString = buttonSelector + " input[type=text]";
  const buttons = $(selectionString);
  buttons.each(function () {
    const btn_value = $(this).val();
    if (isArgNumeric) {
      btn_html = `<div class='table-button ui-button' onclick='${buttonFunction}(${btn_value})'><span title='${buttonTitle}' class='ui-button-icon ui-icon ${buttonClass}'/></div>`
    }
    else {
      btn_html = `<div class='table-button ui-button' onclick='${buttonFunction}("${btn_value}")'><span title='${buttonTitle}' class='ui-button-icon ui-icon ${buttonClass}'/></div>`
    }


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
  return $('.purchase-order-table tbody tr').length;
}


/**
 * @returns {boolean} True when the current user is an admin user.
 */
function isAdminUser() {
  return $('.user-isadmin input').val() === '1';

}

/**
 * Determines whether the current user is classified as a "Metrology" user.
 * Business Rule: user-type-id == 1 => elevated privilege.
 * @returns {boolean} True if metrology user; false otherwise.
 */
function isMetrologyUser() {
  const userTypeId = Number($('.user-type-id input').val());
  return userTypeId === 1 || userTypeId === 2;
}

/**
 * Populate requester lookup maps (id->name and name->id) from a hidden lookup table.
 */
function loadRequesterMap() {

  if (requesterMap.keys.length === 0) {
    const requester_rows = $('.requester-lookup-table table tbody tr');
    if (requester_rows.length === 0) {
      return;
    }
    requester_rows.each(function () {
      let requesterID = Number($(this).find('.id input').val());
      let requesterName = $(this).find('.name input').val();
      requesterMap.set(requesterID, requesterName);
      requesterNameMap.set(requesterName, requesterID);
    });

  }
}


/** Populate task status lookup maps (id<->name). */
function loadStatusMap() {
  if (statusMap.keys.length === 0) {
    const status_rows = $('.status-lookup-table table tbody tr');
    if (status_rows.length === 0) {
      return;
    }
    status_rows.each(function () {
      let statusID = Number($(this).find('.id input').val());
      let statusName = $(this).find('.name input').val();
      statusMap.set(statusID, statusName);
      statusNameMap.set(statusName, statusID);
    });
  }
}


/**
 * Opens an iframe inside a jQuery UI dialog.
 * @param {string} src - Iframe URL.
 * @param {string} title - Dialog title.
 * @param {number} height - Dialog/iframe height in px.
 * @param {number} width - Dialog/iframe width in px.
 * Side effects:
 * - Creates and opens the '# popupIFrame' dialog containing an iframe.
 */
function popupIFrame(src, title, height, width) {

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
 * Constructs the report URL based on current filter values and loads it into the print iframe.
 * Side effects:
 * - Sets the 'src' of '#print-iframe' inside '#popUpDiv' to the constructed report URL.
 */
function printReport() {

  const domain = document.location.hostname;
  const url_root = "http://" + domain + "/Forms/";
  let report_url;
  const site_id = $('.site-id input').val();
  const finccom = Number($('.finccom input').val());
  const freqid = Number($('.freqid input').val());
  const fvname = $('.fvname input').val();
  const fpodesc = $('.fpodesc input').val();
  const fponum = $('.fponum input').val();


  report_url = url_root + "MPM-PurchaseOrderPrint?sid=" + site_id + "&fincom=" + finccom;

  if (freqid !== 0) {
    report_url = report_url + "&freqid=" + freqid;
  }

  if (fpodesc.length > 0) {
    report_url = report_url + "&fpodesc=" + encodeURIComponent(fpodesc);
  }

  if ((fvname !== null) && (fvname.length > 0)) {
    report_url = report_url + "&fvname=" + encodeURIComponent(fvname);
  }

  if (fponum.length > 0) {
    report_url = report_url + "&fponum=" + encodeURIComponent(fponum);
  }

  let min_Date;
  if ($('.fdmin input').val().length > 0) {

    min_Date = moment(fdmax).format("YYYY-M-D");
    report_url = report_url + "&fdmin=" + min_Date;
  }

  let max_Date;
  if ($('.fdmax input').val().length > 0) {
    max_Date = moment(fdmax).format("YYYY-M-D");
    report_url = report_url + "&fdmax=" + max_Date;
  }


  $("#popUpDiv").html("<iframe id='print-iframe' name='myname' src='" + report_url + "' />");
}


/**
 * Restores filter UI from querystring.
 */
function reApplyFilterValues() {
  if ($('#filterRow').length === 0) {
    return;
  }

  const includeCompleted = Number($('.finccom input').val());
  const requesterIDFilterValue = Number($('.freqid input').val());
  const vendorFilterValue = $('.fvname input').val();
  const poNumberFilterValue = $('.fponum input').val();
  const dateMinFilterValue = $('.fdmin input').val();
  const dateMaxFilterValue = $('.fdmax input').val();
  const descriptionFilterValue = $('.fpodesc input').val();

  if (includeCompleted === 1) {
    $('#chkIncludeInActive').prop('checked', true);
  }
  else {
    $('#chkIncludeInActive').prop('checked', false);
  }

  if ((!isNaN(requesterIDFilterValue)) && (requesterIDFilterValue > 0)) {
    const requesterName = requesterMap.get(requesterIDFilterValue);
    $('#cboFilter_Requester').val(requesterName);
  }

  if ((descriptionFilterValue !== null) && (descriptionFilterValue.length > 0)) {
    $('#txtFilter_Description').val(descriptionFilterValue);
  }

  if ((vendorFilterValue !== null) && (vendorFilterValue.length > 0)) {
    $('#txtFilter_Vendor').val(vendorFilterValue);
  }

  if ((poNumberFilterValue !== null) && (poNumberFilterValue.length > 0)) {
    $('#txtFilter_PONumber').val(poNumberFilterValue);
  }

  if ((dateMinFilterValue !== null) && (dateMinFilterValue.length > 0)) {
    $('#txtFilter_DateMin').val(dateMinFilterValue);
  }

  if ((dateMaxFilterValue !== null) && (dateMaxFilterValue.length > 0)) {
    $('#txtFilter_DateMax').val(dateMaxFilterValue);
  }
  
}


/**
 * Rebuilds the current page URL with query-string parameters mirroring the current filter state,
 * then navigates to that URL to cause a full server-side refresh.
 */
function refreshPage() {
  const includeCompleted = Number($('.finccom input').val());
  const requesterIDFilterValue = $('.freqid input').val();
  const vendorFilterValue = $('.fvname input').val();
  const poNumberFilterValue = $('.fponum input').val();
  const dateMinFilterValue = $('.fdmin input').val();
  const dateMaxFilterValue = $('.fdmax input').val();
  const taskListPage = Number($('.pg input').val());
  const sfo = Number($('.sfo input').val());
  const sd = Number($('.sd input').val());

  let current_url = window.location.href;
  let indexOfQuestionMark;
  if (current_url.includes('?')) {
    indexOfQuestionMark = current_url.indexOf('?');
    current_url = current_url.substring(0, indexOfQuestionMark);
  }

  if ((taskListPage !== null) && (!isNaN(taskListPage)) && (taskListPage > 0)) {
    current_url = current_url + `?pg=${taskListPage}`;
  }

  if ((requesterIDFilterValue !== null) && (requesterIDFilterValue.length > 0)) {
    current_url = current_url + `&freqid=${requesterIDFilterValue}`;
  }

  if ((includeCompleted !== null) && (!isNaN(includeCompleted)) && (includeCompleted > 0)) {
    current_url = current_url + `&finccom=${includeCompleted}`;
  }

  if ((vendorFilterValue !== null) && (vendorFilterValue.length > 0)) {
    current_url = current_url + `&fvname=${encodeURIComponent(vendorFilterValue)}`;
  }

  if ((poNumberFilterValue !== null) && (poNumberFilterValue.length > 0)) {
    current_url = current_url + `&fponum=${encodeURIComponent(poNumberFilterValue)}`;
  }

  if ((dateMinFilterValue !== null) && (dateMinFilterValue.length > 0)) {
    current_url = current_url + `&fdmin=${encodeURIComponent(dateMinFilterValue)}`;
  }

  if ((dateMaxFilterValue !== null) && (dateMaxFilterValue.length > 0)) {
    current_url = current_url + `&fdmax=${encodeURIComponent(dateMaxFilterValue)}`;
  }

  if ((sfo !== null) && (!isNaN(sfo))) {
    current_url = current_url + `&sfo=${sfo}`;
  }

  if ((sd !== null) && (!isNaN(sd))) {
    current_url = current_url + `&sd=${sd}`;
  }

  window.location = current_url;
}


// Reset to page 1 and refresh the list.
function resetPageNumber() {
  $('.purchase-order-table').hide();
  $('.table-button').remove();
  $('.pg input').val(1).trigger("change");
}


/**
 * Toggles sort state and updates the sort icons in the specified column header.
 * - Reads current sort field (.sfo) and direction (.sd).
 * - When the same field is clicked, toggles a direction; when a new field, sets ascending (0).
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
* Wires the sortable column headers and sets the initial sort indicator.
*/
function wireUpSortFields() {

  $('#q37 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-n sort-icon"></span>');
  $('#q37').on('click', function () { sortTable(0, '#q37'); });   //Create Date (default)
  $('#q20').on('click', function () { sortTable(1, '#q20'); });   //PO Number
  $('#q29').on('click', function () { sortTable(2, '#q29'); });   //Status
  $('#q24').on('click', function () { sortTable(3, '#q24'); });   //Vendor
  $('#q23').on('click', function () { sortTable(4, '#q23'); });   //Purchase Order Name
  $('#q28').on('click', function () { sortTable(5, '#q28'); });   //Requester

}
