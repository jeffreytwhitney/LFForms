/**
ServiceTickets.js

  Author:   Jeffrey Whitney
            jtwhitney@machine.com
            651-391-7982
  Date:     9/29/2025



Responsibilities:
- Initialize the Service Tickets list when lookups are finished.
- Maintain filter state (UI controls -> hidden fields) and re-query paging.
- Build lookup maps (Department, Initiator, Ticket Type) for name<->ID mapping.
- Render synthetic UI (filter row, ticket number links, pagination controls).
- Handle sorting state and icons.
- Open add/edit dialogs in an iframe-based jQuery UI dialog.
 
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
          down or needing service.)
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
   
   Page Refresh Quirks:
      There are two ways that the page can be programmatically refreshed. One is via the filter/sort/pagination mechanism described below, 
      and the second is when our page receives a message from a popup that the information on the page has changed and should be refreshed, 
      such as when the user changes the state of a row that is being displayed. You'd think this would be a rather straight-forward affair, 
      but as I will explain to you, it's quite complex.

      The first thing you need to know is that when LFF does a refresh, say, of a table, (which is really what we're talking about here),
      it does so via ajax. It doesn't refresh the page, per se, it just refreshes the stuff inside the page. So, it doesn't refresh the web
      page, it just replaces the guts inside the table. 
      
      This presents us with a problem, because we have muddled with the table quite a lot, adding links and buttons dynamically using jQuery.
      For example, let's say we have a page of results that has a button in the first column. We put that button there. What was there
      natively, (what was put there by LFF), is a hidden text box with the ID for the record. We can use that to create a button on the fly
      and assign a javascript onclick to call a function sending the id of the record as an argument. But now LFF has just refreshed the data
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
            them causing the page to have the same filtering and sorting as it had before the refresh. 
      
      But this still leaves us with a problem, namely, that while the hidden filtering and sorting fields are all correct, 
      the filter DISPLAY fields are not set. (Keep in mind, this is after the page has refreshed. LFF has set all the hidden fields correctly, but 
      the filter fields that the users sees have not been set back to their original value.)
      
      Let's say you were filtering records by department. 
      You have a department dropdown filter set to "Ortho". But we're not using the value "Ortho" to filter the results. We're using the 
      DepartmentID for "Ortho", so using the logic above, we'd navigate to http://rmslf/forms/mypage?did=12&sortfield=2&sortdirection=ASC&pg=1. 
      The "did" value is the department ID. This will cause LFF to set the field named "did" to a value of 12, which will cause the 
      stored procedure which is tied to that field to filter the records by that department id. 
      But now the Filter Department dropdown, the thing the USER sees, is empty.
      So now we have a situation where the hidden filter field value and the filter display value are different. This is going to cause confusion.
      How to handle that? 
        
        #2. Once the filter row has been added back, you need to set all the filter display values back to the appropriate value.
            In the case of a text search, like 'Name', you just set the display field equal to the hidden field. 
            In the case of a dropdown, like Department, you have to do a reverse lookup to find the Department Name associated with the
            Department ID that is in the hidden field, and set the dropdown to that value.
            
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
      There are also two buttons which allow the user to change which page of results they are viewing.
      Here is a list of the hidden fields used for filtering and sorting:

        Filtering:
          .pg input: Page number (1-based), 999 = uninitialized. The page of results to return.   
          .fttid input: Ticket Type ID filter (exact match)
          .fdid input: Department ID filter (exact match)
          .fiid input: Initiator ID filter (exact match)
          .ftname input: Ticket Name filter (substring match)
          .ftnum input: Ticket Number filter (substring match)
          .finccomp input: Include Completed (0 = no, 1 = yes)

        Sorting:
          Sorting is handled via clickable column headers. Clicking a header sets the sort field and toggles the sort direction.
          If you click on a sort field that is already the current sort field, it toggles the direction.  
          If you click on a different sort field, it sets that field as the sort field and sets the direction to ascending.
            
            Hidden Sort Fields:
              .sort-field-ordinal input: Field to sort by 
              .sort-direction input: Sort direction (ASC or DESC)

            Sort column mappings:
              #q15 => Ticket Number (default)
              #q18 => Ticket Name
              #q40 => Requester
              #q42 => Ticket Type
              #q43 => Department
              #q44 => Assignee
              #q45 => Status
              #q46 => Due Date
              #q47 => Last Updated
              #q51 => Created Date

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
     select shows the names of the task types, but we are storing the TaskTypeID in a the database, so we need to have a way to 
     figure out what the TaskTypeID is so that we can set the value of the hidden field that the workflow is going to use to 
     set the value in the task table. So we need to be able to look up the ID by name when the user selects a task type.
     The only way I've been able to figure out how to do this is to have a hidden lookup table on the page which contains all the 
     task types and their IDs. So when the page loads, we read that table and build two maps: one for ID?Name and one for Name?ID.
     When the user selects a task type, we look up the ID by name and set the value of the hidden field.    


Dependencies:
- jQuery, jQuery UI dialog, jquery-cookie, jquery-confirm, simplePagination.css

DOM/selector conventions used by this script:
- Hidden state fields (in the list form):
  .pg (page), .ftnum, .ftname, .finccomp, .fdid, .fttid, .fiid
  .sort-field-ordinal, .sort-direction
- Table containers:
  .service-ticket-table, .projectlist-table
- Lookup sources (rendered lookup tables):
  .department-lookup-table, .initiator-lookup-table, .ticket-type-lookup-table
- Lookup combos (rendered dropdowns):
  .department-lookup-combo, .initiator-lookup-combo, .ticket-type-lookup
- Column selectors:
  .ticket-number-col, .edit-ticket-col
 */

const departmentMap = new Map();
const departmentNameMap = new Map();
const initiatorMap = new Map();
const initiatorNameMap = new Map();
const ticketTypeMap = new Map();
const ticketTypeNameMap = new Map();
const assigneeMap = new Map();
const assigneeNameMap = new Map();

/**
 * DOM ready bootstrap.
 * - Sets page title and loads required external scripts/styles.
 * - Normalizes the network user name field from the logged-in user.
 * - Wires window.onmessage to drive popup iframe lifecycle and refresh.
 * - Restores `site-name` from cookie on lookup load.
 * - On lookupcomplete: builds lookup maps, normalizes dates, renders
 *   ticket links, filter row, pagination, and shows the table.
 */
$(document).ready(function () {
  $(document).prop('title', 'ServiceTickets');
  $('.Submit').hide();
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simplePagination.js/1.6/simplePagination.min.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
  const bootstrapButton = $.fn.button.noConflict(); // return $.fn.button to previously assigned value
  $.fn.bootstrapBtn = bootstrapButton;
  $('#q0').append("<div class='hidden' id='popUpDiv'></div>");

  const lfUserName = $('.lf-user-name input').val();
  if (lfUserName !== 'Anonymous User') {
    $('.network-user-name input').val(lfUserName.toUpperCase().substr(lfUserName.lastIndexOf('\\') + 1)).trigger("change");
  }

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

  $(document).on("onloadlookupfinished", function () {
    const sitename = $.cookie('site_name');
    if (sitename !== null) {
      $('.site-name select').val(sitename).trigger("change");
    }
  });

  $(document).on('lookupcomplete', function (e) {
    $('.projectlist-table').hide();
    if ($('.pg input').val() === '999') {
      $('.pg input').val(1).trigger("change");

      $('.network-user-name input').trigger("change");
    }
    loadDepartmentMap();
    loadInitiatorMap();
    loadTicketTypeMap();
    loadAssigneeMap();
    $('.due-date-col input').each((i, dateField) => $(dateField).val($(dateField).val().split(" ")[0]));
    $('.create-date-col input').each((i, dateField) => $(dateField).val($(dateField).val().split(" ")[0]));
    generateTicketNumberColumn();
    generateFilterRow();
    //reApplyFilterValues();
    appendPagination();
    $('.service-ticket-table').show();

  });

  $(document).on('change', '.site-name select', function () {
    const sitename = $('.site-name select').val();
    $.cookie('site_name', sitename, { expires: 365, path: '/' });
  });
});


/**
 * Opens the Add Service Ticket dialog sized relative to the viewport height.
 * Uses jQuery UI dialog to host an iframe pointing to the add form.
 * @returns {void}
 */
function addTicket() {
  let widowHeight = $(window).height();
  widowHeight = widowHeight - 50;
  popUpIframe(`http://rmslf/Forms/RMS-MPM-AddServiceTicket`, 'Add Service Ticket', widowHeight, 1500);
}


/**
 * Appends a simple pagination control below the table based on:
 * - Current page (.pg)
 * - Row count in the current page
 * Renders prev/next buttons and wires them to page navigation helpers.
 * @returns {void}
 */
function appendPagination() {

  const current_page = Number($('.pg input').val());
  if (current_page === 999) { return; }

  const row_count = getTableRowCount();

  if (row_count > 0) {
    $('#table-pagination').remove();
    if ((current_page === 1) && (row_count < 25)) {
      $('.service-ticket-table table').parent().append("<div id='table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled'>ï¿½ï¿½</a></li><li><a class='page-link prev isDisabled'>ï¿½</a></li><li><a class='page-link next isDisabled'>ï¿½</a></li></ul></div>");
      return;
    }
    if ((current_page === 1) && (row_count === 25)) {
      $('.service-ticket-table table').parent().append("<div id='table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled'>ï¿½ï¿½</a></li><li><a class='page-link prev isDisabled'>ï¿½</a></li><li><a class='page-link next' onclick='callNextPage();' href='javascript:void(0);'>ï¿½</a></li></ul></div>")
      return;
    }
    if ((current_page > 1) && (row_count === 25)) {
      $('.service-ticket-table table').parent().append("<div id='table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev' onclick='resetPageNumber();' href='javascript:void(0);''>ï¿½ï¿½</a></li><li><a class='page-link prev' onclick='callPrevPage();' href='javascript:void(0);''>ï¿½</a></li><li><a class='page-link next' onclick='callNextPage();' href='javascript:void(0);'>ï¿½</a></li></ul></div>")
      return;
    }
    if ((current_page > 1) && (row_count < 25)) {
      $('.service-ticket-table table').parent().append("<div id='table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev' onclick='resetPageNumber();' href='javascript:void(0);''>ï¿½ï¿½</a></li><li><a class='page-link prev' onclick='callPrevPage();' href='javascript:void(0);''>ï¿½</a></li><li><a class='page-link next isDisabled'>ï¿½</a></li></ul></div>")
      return;
    }
  }
}


/**
 * Advances to the next page:
 * - Hides table, removes transient UI, increments .pg, and triggers change.
 * @returns {void}
 */
function callNextPage() {
  $('.service-ticket-table').hide();
  removeAppendedFields();
  current_page = Number($('.pg input').val());
  $('.pg input').val(current_page + 1).trigger("change");
}


/**
 * Navigates to the previous page:
 * - Hides table, removes transient UI, decrements .pg (min 1), and triggers change.
 * @returns {void}
 */
function callPrevPage() {
  $('.service-ticket-table').hide();
  removeAppendedFields();
  current_page = Number($('.pg input').val());
  if (current_page === 1) {
    return;
  }
  $('.pg input').val(current_page - 1).trigger("change");
}


/**
 * Opens the Edit Service Ticket dialog for a given ticket ID.
 * @param {number} ticketID - The ticket's unique identifier.
 * @returns {void}
 */
function editTicket(ticketID) {
  let widowHeight = $(window).height();
  widowHeight = widowHeight - 50;
  popUpIframe(`http://rmslf/Forms/MPM-EditServiceTicket?tid=${ticketID}`, 'Edit Service Ticket', widowHeight, 1200);
}


/**
 * Applies filter UI values to hidden query fields and reloads the first page.
 * - Reads inline filter controls in the header row.
 * - Maps selected names to IDs via lookup maps.
 * - Writes values into hidden inputs used by the backend query.
 * - Resets page to 1 and triggers change to reload.
 * @returns {void}
 */
function filterTable() {
  if ($('#filterRow').length === 0) {
    return;
  }

  if ($("#chkIncludeComplete").is(":checked")) {
    $('.finccomp input').val(1);
  }
  else {
    $('.finccomp input').val(0);
  }

  if ($("#chkExcludeGaging").is(":checked")) {
    $('.fexgage input').val(1);
  }
  else {
    $('.fexgage input').val(0);
  }


  const ticketNumberFilterValue = $('#txtFilter_TicketNumber').val();
  const ticketNameFilterValue = $('#txtFilter_TicketName').val();
  const initiatorFilterVal = $('#cboFilter_Initiator').val();
  const ticketTypeFilterVal = $('#cboFilter_TicketType').val();
  const departmentFilterVal = $('#cboFilter_Department').val();
  const assigneeFilterVal = $('#cboFilter_Assignee').val();

  $('.ftnum input').val(ticketNumberFilterValue);
  $('.ftname input').val(ticketNameFilterValue);

  if ((departmentFilterVal !== null) && (departmentFilterVal.length > 0)) {
    const departmentID = departmentNameMap.get(departmentFilterVal);
    $('.fdid input').val(departmentID);
  }
  else {
    $('.fdid input').val(0);
  }

  if ((initiatorFilterVal !== null) && (initiatorFilterVal.length > 0)) {
    const initiatorID = initiatorNameMap.get(initiatorFilterVal);
    $('.fiid input').val(initiatorID);
  }
  else {
    $('.fiid input').val(0);
  }

  if ((ticketTypeFilterVal !== null) && (ticketTypeFilterVal.length > 0)) {
    const ticketTypeID = ticketTypeNameMap.get(ticketTypeFilterVal);
    $('.fttid input').val(ticketTypeID);
  }
  else {
    $('.fttid input').val(0);
  }

  console.log("Assignee Filter Value: " + assigneeFilterVal);
  if ((assigneeFilterVal !== null) && (assigneeFilterVal.length > 0)) {
    const assigneeID = assigneeNameMap.get(assigneeFilterVal);
    console.log("Mapped Assignee ID: " + assigneeID);
    $('.faid input').val(assigneeID);
  }
  else {
    $('.faid input').val(0);
  }

  $('.service-ticket-table').hide();
  removeAppendedFields();
  $('.pg input').val(1).trigger("change");

}


/**
 * Ensures the filter UI row exists, wires its events, and populates dropdowns.
 * - Inserts an "Add Ticket" button and "Include Completed" checkbox.
 * - Adds a header row with filter inputs.
 * - Wires change/dblclick handlers for filter application/reset.
 * - Populates filter dropdowns from existing lookup combos.
 * - Preserves filter values from hidden fields when present.
 * @returns {void}
 */
function generateFilterRow() {

  if ($('#filterRow').length === 0) {
    const add_button = '<div class="table-button ui-button add-button" onclick="addTicket()"><span title="AddTicket" class="ui-button-icon ui-icon ui-icon-plusthick"></span>Add Ticket</div>'

    $(add_button).insertBefore('.service-ticket-table table');

    const includeCompleteCheckbox = '<div class="choice include-choice"><input name="chkIncludeComplete" id="chkIncludeComplete" type="checkbox" ><label class="form-option-label" for="chkIncludeComplete">Show Completed</label></div>'
    $('.service-ticket-table table').parent().prepend(includeCompleteCheckbox)

    const excludeGagingCheckbox = '<div class="choice exclude-gaging-choice"><input name="chkExcludeGaging" id="chkExcludeGaging" type="checkbox" ><label class="form-option-label" for="chkExcludeGaging">Exclude Gaging</label></div>'
    $(excludeGagingCheckbox).insertAfter('.add-button');


    const filter_row = "<TR id='filterRow'><TH><input id='txtFilter_TicketNumber'/></TH><TH><input id='txtFilter_TicketName'/></TH><TH><select id='cboFilter_Initiator'/></TH><TH><select id='cboFilter_TicketType'/></TH><TH><select id='cboFilter_Department'/></TH><TH><select id='cboFilter_Assignee'/></TH><TH></TH><TH></TH><TH></TH><TH></TH><TH></TH><TH></TH></TR>"


    $('.service-ticket-table table thead').append(filter_row);

    $("#chkIncludeComplete").on("change", function () { filterTable(); });
    $("#chkExcludeGaging").on("change", function () { filterTable(); });

    $("#txtFilter_TicketNumber").on("change", function () { filterTable(); });
    $("#txtFilter_TicketName").on("change", function () { filterTable(); });
    $("#cboFilter_Initiator").on("change", function () { filterTable(); });
    $("#cboFilter_TicketType").on("change", function () { filterTable(); });
    $("#cboFilter_Department").on("change", function () { filterTable(); });
    $("#cboFilter_Assignee").on("change", function () { filterTable(); });

    $("#txtFilter_TicketNumber").on("dblclick", function () { $("#txtFilter_TicketNumber").val(null).trigger("change"); });
    $("#txtFilter_TicketName").on("dblclick", function () { $("#txtFilter_TicketName").val(null).trigger("change"); });
    $("#cboFilter_Initiator").on("dblclick", function () { $("#cboFilter_Initiator").val(0).trigger("change"); });
    $("#cboFilter_TicketType").on("dblclick", function () { $("#cboFilter_TicketType").val(0).trigger("change"); });
    $("#cboFilter_Department").on("dblclick", function () { $("#cboFilter_Department").val(null).trigger("change"); });
    $("#cboFilter_Assignee").on("dblclick", function () { $("#cboFilter_Assignee").val(0).trigger("change"); });
    wireUpSortFields();
  }

  if ((($('.ftnum input').val() !== null) && ($('.ftnum input').val().length > 0)) && (($('#txtFilter_TicketNumber').val() === null) || ($('#txtFilter_TicketNumber').val() === ''))) {
    $('#txtFilter_TicketNumber').val($('.ftnum input').val());
  }

  if ((($('.ftname input').val() !== null) && ($('.ftname input').val().length > 0)) && (($('#txtFilter_TicketName').val() === null) || ($('#txtFilter_TicketName').val() === ''))) {
    $('#txtFilter_TicketName').val($('.ftname input').val());
  }

  if (($(".initiator-lookup-combo select option").length > 1) && ($("#cboFilter_Initiator option").length === 0)) {
    $("#cboFilter_Initiator").html($(".initiator-lookup-combo select").html());
  }

  if (($(".ticket-type-lookup select option").length > 1) && ($("#cboFilter_TicketType option").length === 0)) {
    $("#cboFilter_TicketType").html($(".ticket-type-lookup select").html());
  }

  if (($(".department-lookup-combo select option").length > 1) && ($("#cboFilter_Department option").length === 0)) {
    const departmentOptions = $(".department-lookup-combo select").html();
    $("#cboFilter_Department").html(departmentOptions);
  }

  if (($(".assignee-lookup-combo select option").length > 1) && ($("#cboFilter_Assignee option").length === 0)) {
    $("#cboFilter_Assignee").html($(".assignee-lookup-combo select").html());
    $("#cboFilter_Assignee option").eq(0).after($('<option>', {
      value: 'Unassigned',
      text: 'Unassigned'
    }));
  }

}


/**
 * Renders clickable ticket number links in the ticket number column.
 * - Uses the text input values to generate an anchor that calls editTicket(id).
 * - Ids are read from `.edit-ticket-col` inputs aligned by row index.
 * @returns {void}
 */
function generateTicketNumberColumn() {
  const ticket_numbers = $('.ticket-number-col input[type="text"]');
  const ticket_ids = $('.edit-ticket-col input[type="text"]');
  ticket_numbers.each(function (index) {
    const ticket_id = $(ticket_ids[index]).val();
    const ticket_number = $(this).val();
    const ticket_link = $("<a>", { text: ticket_number.substr(0, 30), class: 'ticket-link', href: `javascript:void(0);`, onclick: `editTicket(${ticket_id})` });
    if ($(this).parent().find('.ticket-link').length === 0) {
      $(this).parent().append(ticket_link);
    }
  });
}


/**
 * Returns the number of data rows in the service ticket table body.
 * @returns {number} Count of rows.
 */
function getTableRowCount() {
  const row_count = $('.service-ticket-table tbody tr').length;
  return row_count;
}


/**
 * Populates Assignee lookup maps from the assignee lookup table.
 * - Fills both ID->Name and Name->ID maps.
 * - No-op if the lookup table isn't present.
 * @returns {void}
 */
function loadAssigneeMap() {
  if (assigneeMap.keys.length === 0) {
    const assignee_rows = $('.assignee-lookup-table table tbody tr');
    if (assignee_rows.length === 0) {
      return;
    }
    assignee_rows.each(function (index) {
      assigneeID = Number($(this).find('.assignee-lookup-table-id input').val());
      assigneeName = $(this).find('.assignee-lookup-table-name input').val();
      assigneeMap.set(assigneeID, assigneeName);
      assigneeNameMap.set(assigneeName, assigneeID);
    });
    assigneeMap.set(-1, 'Unassigned');
    assigneeNameMap.set('Unassigned', -1);
  }
}


/**
 * Populates Department lookup maps from the department lookup table.
 * - Fills both ID->Name and Name->ID maps.
 * - No-op if the lookup table isn't present.
 * @returns {void}
 */
function loadDepartmentMap() {
  if (departmentMap.keys.length === 0) {
    const department_rows = $('.department-lookup-table table tbody tr');
    if (department_rows.length === 0) {
      return;
    }
    department_rows.each(function (index) {
      departmentID = Number($(this).find('.department-lookup-table-id input').val());
      departmentName = $(this).find('.department-lookup-table-name input').val();
      departmentMap.set(departmentID, departmentName);
      departmentNameMap.set(departmentName, departmentID);
    });
  }
}


/**
 * Populates Initiator lookup maps from the initiator lookup table.
 * - Fills both ID->Name and Name->ID maps.
 * - No-op if the lookup table isn't present.
 * @returns {void}
 */
function loadInitiatorMap() {
  if (initiatorMap.keys.length === 0) {
    const initiator_rows = $('.initiator-lookup-table table tbody tr');
    if (initiator_rows.length === 0) {
      return;
    }
    initiator_rows.each(function (index) {
      initiatorID = Number($(this).find('.initiator-lookup-table-id input').val());
      initiatorName = $(this).find('.initiator-lookup-table-name input').val();
      initiatorMap.set(initiatorID, initiatorName);
      initiatorNameMap.set(initiatorName, initiatorID);
    });
  }
}


/**
 * Populates Ticket Type lookup maps from the ticket type lookup table.
 * - Fills both ID->Name and Name->ID maps.
 * - No-op if the lookup table isn't present.
 * @returns {void}
 */
function loadTicketTypeMap() {
  if (ticketTypeMap.keys.length === 0) {
    const ticketType_rows = $('.ticket-type-lookup-table table tbody tr');
    if (ticketType_rows.length === 0) {
      return;
    }
    ticketType_rows.each(function (index) {
      ticketTypeID = Number($(this).find('.ticket-type-lookup-table-id input').val());
      ticketTypeName = $(this).find('.ticket-type-lookup-table-name input').val();
      ticketTypeMap.set(ticketTypeID, ticketTypeName);
      ticketTypeNameMap.set(ticketTypeName, ticketTypeID);
    });
  }
}


/**
 * Creates and opens a jQuery UI dialog hosting an iframe.
 * - Ensures any existing iframe dialog is removed first.
 * - Sizes and positions the dialog, and adjusts resizable styles.
 * @param {string} src - Iframe source URL.
 * @param {string} title - Dialog title.
 * @param {number} height - Dialog height in pixels.
 * @param {number} width - Dialog width in pixels.
 * @returns {void}
 */
function popUpIframe(src, title, height, width) {
  $("#popupIFrame").remove();
  $("#popUpDiv").html(`<div height='${height}' width='${width}'><iframe id='popupIFrame' name='myname' src='${src}' height='${height}' width='${width}'/></div>`);
  $("#popupIFrame").dialog({
    title: title,
    height: height,
    width: width,
    autoOpen: false,
    resizable: true,
    modal: true,
    position: { my: "left top", at: "left top", of: window },
    close: function (event, ui) {

    }
  });

  $("#popupIFrame").dialog("open");
  $("#popupIFrame").attr('style', `width: ${width};`);
  const resizeableStyle = $('.ui-resizable').attr('style');
  const newStyle = resizeableStyle.replaceAll('width: 0px;', `width: ${width}px;`);
  $('.ui-resizable').attr('style', newStyle);
}


/**
 * Re-applies filter values from hidden fields back to the filter UI controls.
 * - Syncs include completed checkbox and text inputs.
 * - Translates stored IDs to names for select dropdowns via maps.
 * @returns {void}
 */
function reApplyFilterValues() {
  if ($('#filterRow').length === 0) {
    return;
  }

  const includeCompleted = Number($('.finccomp input').val());
  const ticketNumberFilterValue = $('.ftnum input').val();
  const ticketNameFilterValue = $('.ftname input').val();
  const initiatorFilterVal = $('.fiid input').val();
  const ticketTypeFilterVal = $('.fttid input').val();
  const departmentFilterVal = $('.fdid input').val();
  const assigneeFilterVal = $('.faid input').val();

  if (includeCompleted === 1) {
    $('#chkIncludeComplete').prop('checked', true);
  }
  else {
    $('#chkIncludeComplete').prop('checked', false);
  }

  if ((ticketNumberFilterValue !== null) && (ticketNumberFilterValue.length > 0)) {
    $('#txtFilter_TicketNumber').val(ticketNumberFilterValue);
  }

  if ((ticketNameFilterValue !== null) && (ticketNameFilterValue.length > 0)) {
    $('#txtFilter_TicketName').val(ticketNameFilterValue);
  }

  if (initiatorFilterVal !== 0) {
    const initiatorName = initiatorMap.get(initiatorFilterVal);
    $('#cboFilter_Initiator').val(initiatorName);
  }
  else {
    $("#cboFilter_Initiator").val($("#cboFilter_Initiator option:first").val());
  }

  if (departmentFilterVal !== 0) {
    const departmentName = departmentMap.get(departmentFilterVal);
    $('#cboFilter_Department').val(departmentName);
  }
  else {
    $("#cboFilter_Department").val($("#cboFilter_Department option:first").val());
  }

  if (assigneeFilterVal !== 0) {
    const assigneeName = assigneeMap.get(assigneeFilterVal);
    $('#cboFilter_Assignee').val(assigneeName);
  }
  else {
    $("#cboFilter_Assignee").val($("#cboFilter_Assignee option:first").val());
  }

  if (ticketTypeFilterVal !== 0) {
    const ticketTypeName = ticketTypeMap.get(ticketTypeFilterVal);
    $('#cboFilter_TicketType').val(ticketTypeName);
  }
  else {
    $("#cboFilter_TicketType").val($("#cboFilter_TicketType option:first").val());
  }
}


/**
 * Reloads the page building a querystring from current hidden filter/page fields.
 * - Reads .pg, .ftname, .ftnum, .fttid, .fiid, .finccomp, .fdid.
 * - Replaces the current URL's querystring and navigates.
 * @returns {void}
 */
function refreshPage() {

  const ticketNameFilter = $('.ftname input').val();
  const ticketNumberFilter = $('.ftnum input').val();
  const include_Complete = Number($('.finccomp input').val());
  const departmentIDFilter = Number($('.fdid input').val());
  const ticketTypeIDFilter = Number($('.fttid input').val());
  const initiatorIDFilter = Number($('.fiid input').val());

  const pageNumber = Number($('.pg input').val());

  let current_url = window.location.href;
  if (current_url.includes('?')) {
    indexOfQuestionMark = current_url.indexOf('?');
    current_url = current_url.substring(0, indexOfQuestionMark);
  }

  if ((pageNumber !== null) && (pageNumber !== NaN) && (pageNumber > 0)) {
    current_url = current_url + `?pg=${pageNumber}`;
  }

  if ((ticketNameFilter !== null) && (ticketNameFilter.length > 0)) {
    current_url = current_url + `&ftname=${ticketNameFilter}`;
  }

  if ((ticketNumberFilter !== null) && (ticketNumberFilter.length > 0)) {
    current_url = current_url + `&ftnum=${ticketNumberFilter}`;
  }

  if ((ticketTypeIDFilter !== null) && (ticketTypeIDFilter !== NaN) && (ticketTypeIDFilter > 0)) {
    current_url = current_url + `&fttid=${ticketTypeIDFilter}`;
  }

  if ((initiatorIDFilter !== null) && (initiatorIDFilter.length > 0)) {
    current_url = current_url + `&fiid=${initiatorIDFilter}`;
  }

  if ((include_Complete !== null) && (include_Complete !== NaN) && (include_Complete > 0)) {
    current_url = current_url + `&finccomp=${include_Complete}`;
  }

  if ((departmentIDFilter !== null) && (departmentIDFilter !== NaN) && (departmentIDFilter > 0)) {
    current_url = current_url + `&fdid=${departmentIDFilter}`;
  }
  window.location = current_url;
}


/**
 * Removes transient elements that are (re)built on each page/filter change:
 * - Pagination container
 * - Edit buttons
 * - Ticket number links
 * @returns {void}
 */
function removeAppendedFields() {
  $('#table-pagination').remove();
  $('.edit-button').remove();
  $('.ticket-link').remove();
}


/**
 * Resets the page to 1, hides table, removes transient UI, and triggers change.
 * Useful for "first page" navigation.
 * @returns {void}
 */
function resetPageNumber() {
  $('.service-ticket-table').hide();
  removeAppendedFields();
  $('.pg input').val(1).trigger("change");
}


// Sort the table by a given column, toggling direction if already sorted by that column.
function sortTable(newSortOrdinal, selector) {

  removeAppendedFields();
  $('.sort-icon').remove();

  const currentSortOrdinal = Number($('.sort-field-ordinal input').val());
  let sortDirection = Number($('.sort-direction input').val());

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
    if (newSortOrdinal === 1) {
      sortDirection = 1
      $('.sort-direction input').val(1).trigger("change");
    }
    else {
      sortDirection = 0;
      $('.sort-direction input').val(0).trigger("change");
    }
  }

  if (sortDirection === 0) {
    $(`${selector} .cf-col-label`).append('<span class="ui-icon ui-icon-triangle-1-n sort-icon"></span>');
  }
  else {
    $(`${selector} .cf-col-label`).append('<span class="ui-icon ui-icon-triangle-1-s sort-icon"></span>');
  }
}


/**
 * Adds the default sort icon and wires click handlers on column headers
 * to call sortTable with the corresponding ordinal.
 * Default sort is Ticket Number (ordinal 0).
 * @returns {void}
 */
function wireUpSortFields() {

  $('#q15 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-s sort-icon"></span>');

  $('#q15').on('click', function () { sortTable(0, '#q15'); });   // Ticket Number (default)
  $('#q18').on('click', function () { sortTable(1, '#q18'); });   // Ticket Name
  $('#q40').on('click', function () { sortTable(2, '#q40'); });   // Requester
  $('#q42').on('click', function () { sortTable(3, '#q42'); });   // Ticket Type
  $('#q43').on('click', function () { sortTable(4, '#q43'); });   // Department
  $('#q44').on('click', function () { sortTable(5, '#q44'); });   // Assignee
  $('#q45').on('click', function () { sortTable(6, '#q45'); });   // Status
  $('#q46').on('click', function () { sortTable(7, '#q46'); });   // Due Date
  $('#q47').on('click', function () { sortTable(8, '#q47'); });   // Last Updated
  $('#q51').on('click', function () { sortTable(9, '#q51'); });   // Created Date

}
