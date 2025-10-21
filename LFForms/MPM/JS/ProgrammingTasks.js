/**
ProgrammingTasks.js

  Author:   Jeffrey Whitney
            jtwhitney@machine.com
            651-391-7982
  Date:     9/29/2025

Purpose:
  - Drive the Task Maintenance grid UI: loading lookups, filtering, sorting, pagination,
    row coloring, and actions (add note/time, open 1Factory, open details).

Permissions: Metrology users can add time to tasks and add notes to any task. 
             QE users can add notes for tasks in their department only. 
             All other users have read-only access.

High-level behavior:
  - On document ready:
    - Hides submit controls, sets page title, loads required scripts/styles.
    - Normalizes Bootstrap button namespace conflict.
    - Copies the current network username into a hidden form field (if not anonymous).
    - Wires window message handlers to close/refresh popup dialogs.
    - Persists selected site in a cookie.
  - On 'lookupcomplete':
    - Loads lookup Maps (assignees, status, departments, task types, initiators).
    - Trims date/time fields to dates for display.
    - Builds action columns, filter row, pagination, and locks rows as needed.
    - Restores previously chosen filters and shows the table.
  - On 'onloadlookupfinished':
    - Prepares a container for popup iframes.
    - Wires filter change events, normalizes default page, restores site from cookie,
      triggers user name propagation, and shows the table.

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
        #1. Instead of just setting the url to this page's url, what we need to do is append all of the currently chosen filters to the query 
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
        
        #2. Once the filter row has been added back, you need to set all of the filter display values back to the appropriate value.
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
          .ftname input: Task Name filter (partial match)
          .fpname input: Project Name filter (partial match)
          .fttid input: Task Type ID filter (exact match)
          .fsid input: Status ID filter (exact match)
          .faid input: Assignee ID filter (exact match)
          .fpid input: Ticket Number filter (exact match)
          .fdid input: Department ID filter (exact match)
          .fqeid input: Quality Engineer ID filter (exact match)
          .finitemp input: Initiator ID filter (exact match)
          .inccom input: Include Completed filter (1 = include completed, 0 = exclude completed)
          .incns input: Include Not Scheduled filter (1 = include not scheduled, 0 = exclude not scheduled) See an explanation of 'Not Scheduled' below.
          .fexsd input: Exclude Same Day filter (1 = exclude same day, 0 = include same day) See an explanation of 'Same Day' below
          .fexw input: Exclude Waiting filter. (Hide tasks where we're waiting on something. 1 = exclude waiting, 0 = include waiting)

          Not Scheduled:  There are times that a QE will put in a ticket for part families. (A group of parts all under the same
                          print that have differences. (Say, length for example.) We have only ever run 3 out of the 12 parts, so 
                          we're not sure if the other 9 part numbers will EVER run. In this situation, we will make the other part 
                          numbers "Not Scheduled", which means they are normally hidden from the list because we may or may not have to ever
                          do anything for them. However, if they ever do show up on a production schedule, the refresh job will mark the 
                          task as "Not Started" instead of "Not Scheduled", so that it will appear in our list.

          Same Day:       When the QE first puts in the ticket, the Due Date and Scheduled Due date are initially the same. 
                          (The Scheduled Due Date is the date that the floor needs it, the Due Date field is the date that we need to have it done by.)
                          When the schedule update runs, it will change the Due Date equal to 1 business day earlier than the Scheduled Due Date. 
                          When this happens, we know the due date is "real". Otherwise, it's a clue that it's not in any production 
                          schedule yet, even though the QE has put in a ticket for it. By default, we show these tasks, but this allows us to hide them.

        Sorting:
          Sorting is handled via clickable column headers. Clicking a header sets the sort field and toggles the sort direction.
          If you click on a sort field that is already the current sort field, it toggles the direction.  
          If you click on a different sort field, it sets that field as the sort field and sets the direction to ascending.
            
            Hidden Sort Fields:
              .sort-field-ordinal input: Field to sort by 
              .sort-direction input: Sort direction (ASC or DESC)

            Sort column mappings:
              #q236  ->  Due Date (default)
              #q88   ->  Ticket Number
              #q83   ->  Ticket Name
              #q84   ->  Task Name
              #q234  ->  Status
              #q87   ->  Task Type
              #q235  ->  Assignee
              #q102  ->  Department
              #q221  ->  Submittor
              #q241  ->  Create Date


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

      Mapping:
       There are several differnent lookup tables on the form which are used to populate dropdowns, nearly all of which are for filtering.
       Task types are stored both as ID?Name and Name?ID because LFF only stores the display value in the select, for example, the TaskType
       select shows the names of the task types, but we are storing the TaskTypeID in a the database, so we need to have a way to 
       figure out what the TaskTypeID is so that we can set the value of the hidden field that the workflow is going to use to 
       set the value in the task table. So we need to be able to look up the ID by name when the user selects a task type.
       The only way I've been able to figure out how to do this is to have a hidden lookup table on the page which contains all of the 
       task types and their IDs. So when the page loads, we read that table and build two maps: one for ID?Name and one for Name?ID.
       When the user selects a task type, we look up the ID by name and set the value of the hidden field.

 * Dependencies:
 * - jQuery, jQuery UI (dialog), moment.js
 * - jquery-cookie, jquery-confirm, simplePagination CSS
 * - Parent markup conventions: numerous CSS class-based columns/fields.
 *
 * Custom events:
 * - 'lookupcomplete' (data bound and lookup tables ready)
 * - 'onloadlookupfinished' (page scaffolding done and ready to render/print)
 *
 * DOM contract (selected examples):
 * - Hidden/value columns: '.tasklist-*-col input[type="text"]'
 * - Filters store backing values in hidden inputs: '.ftname', '.fpname', '.fpid', '.fttid', '.fsid', '.faid', '.fdid', '.finitid'
 * - Flags: '.fincns', '.finccom', '.fexw'
 * - Table: '.tasklist-table table'
 * - Pagination: '#tasklist-pagination'
 * - Popup host: '#popUpDiv'
 */

const status_NotStarted = 1;
const status_Started = 2;
const status_Waiting = 3;
const status_Completed = 4;
const status_Cancelled = 5;
const status_NotSched = 7;

var assigneeMap = new Map();
var assigneeNameMap = new Map();
var departmentMap = new Map();
var departmentNameMap = new Map();
var taskTypeMap = new Map();
var taskTypeByNameMap = new Map();
var taskStatusMap = new Map();
var taskStatusNameMap = new Map();
var initiatorMap = new Map();
var initiatorNameMap = new Map();



$(document).ready(function () {
  $('.Submit').hide();
  $(document).prop('title', 'Task Maintenance');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simplePagination.js/1.6/simplePagination.min.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
  var bootstrapButton = $.fn.button.noConflict(); // return $.fn.button to previously assigned value
  $.fn.bootstrapBtn = bootstrapButton;

  // Normalize and capture the current user into a hidden field.
  var lfUserName = $('.lf-username input').val();
  if (lfUserName != 'Anonymous User') {
    $('.network-user-name input').val(lfUserName.toUpperCase().substr(lfUserName.lastIndexOf('\\') + 1)).change();
  }

  // Support closing or closing-with-refresh from child iframes via postMessage. See "Dialog/Popup Mechanism" above.
  window.onmessage = function (event) {
    if (event.data == "CloseDialog") {

      $("#popupIFrame").dialog("destroy");
      $("#popupIFrame").remove();
    }
    if (event.data == "CloseDialogWithRefresh") {

      $("#popupIFrame").dialog("destroy");
      $("#popupIFrame").remove();
      refreshPage();
    }
  };

  // Persist selected site to a cookie.
  $(document).on('change', '.site-name select', function () {
    var sitename = $('.site-name select').val();
    $.cookie('site_name', sitename, { expires: 365, path: '/' });
  });

  // When lookup tables are available, finish wiring the grid.
  $(document).on('lookupcomplete', function (e) {
    //See "Mapping"
    loadAssigneeMap();
    loadStatusMap();
    loadDepartmentMap();
    loadTaskTypeMap();
    loadInitiatorMap();

    // Trim date display to the date portion.    // Trim date display to the date portion.
    $('.tasklist-datestarted-col input').each((i, dateField) => $(dateField).val($(dateField).val().split(" ")[0]));
    $('.tasklist-duedate-col input').each((i, dateField) => $(dateField).val($(dateField).val().split(" ")[0]));
    $('.tasklist-schedduedate-col input').each((i, dateField) => $(dateField).val($(dateField).val().split(" ")[0]));


    generateTaskListColumnFields();
    reApplyFilterValues(); // See "Page Refresh Quirks" above.
    appendPagination(); // See "Pagination" above.
    generateFilterRow(); // See "Filtering and Sorting" above.
    lockRows();
    $('.tasklist-table').show();
  });

  // Final page activation after load.
  $(document).on("onloadlookupfinished", function (e) {
    // Host element for modal iframe dialogs.    // Host element for modal iframe dialogs.
    $('#q0').append("<div class='hidden-text' id='popUpDiv'></div>");

    $(".tasklist-filter-checks input").on("change", function () { filterTable(); });

    //See "Page Refresh Quirks" above.
    if ($('.tasklist-page input').val() == '999') {
      $('.tasklist-page input').val(1).change();
    }

    // Restore last-selected site from cookie.
    var sitename = $.cookie('site_name');
    if (sitename != null) {
      $('.site-name select').val(sitename).change();
    }

    // Trigger any dependent logic that listens to network-user-name changes.
    $('.network-user-name input').trigger("change");
    $('.tasklist-table').show();
  });

});


/**
  * Append simple pagination controls based on current page and row count.
 * Relies on '.tasklist-page input' value and current table rows.
 */
function appendPagination() {

  var current_page = Number($('.tasklist-page input').val());
  if (current_page == 999) { return; }

  var row_count = getTaskListRowCount();

  if (row_count > 0) {
    $('#tasklist-pagination').remove();
    if ((current_page == 1) && (row_count < 25)) {
      $('.tasklist-table table').parent().append("<div id='tasklist-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled'>‹‹</a></li><li><a class='page-link prev isDisabled'>‹</a></li><li><a class='page-link next isDisabled'>›</a></li></ul></div>");
      return;
    }
    if ((current_page == 1) && (row_count == 25)) {
      $('.tasklist-table table').parent().append("<div id='tasklist-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled'>‹‹</a></li><li><a class='page-link prev isDisabled'>‹</a></li><li><a class='page-link next' onclick='callNextPage();' href='javascript:void(0);'>›</a></li></ul></div>")
      return;
    }
    if ((current_page > 1) && (row_count == 25)) {
      $('.tasklist-table table').parent().append("<div id='tasklist-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev' onclick='resetPageNumber();' href='javascript:void(0);''>‹‹</a></li><li><a class='page-link prev' onclick='callPrevPage();' href='javascript:void(0);''>‹</a></li><li><a class='page-link next' onclick='callNextPage();' href='javascript:void(0);'>›</a></li></ul></div>")
      return;
    }
    if ((current_page > 1) && (row_count < 25)) {
      $('.tasklist-table table').parent().append("<div id='tasklist-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev' onclick='resetPageNumber();' href='javascript:void(0);''>‹‹</a></li><li><a class='page-link prev' onclick='callPrevPage();' href='javascript:void(0);''>‹</a></li><li><a class='page-link next isDisabled'>›</a></li></ul></div>")
      return;
    }
  }
}


/**
 * Open "Add Note" dialog for a given task.
 * @param {number} task_id
 */
function callAddNote(task_id) {
  var user_type_id = Number($(".user-type-id input").val());
  if (user_type_id != 0) {
    var task_name = getColumnValueByTaskID(task_id, '.tasklist-task-name-col input[type="text"]');
    popUpIframe(`http://rmslf/Forms/MPMAddNote?TaskID=${task_id}&nt=1`, `Add Note for task '${task_name}'`, 400, 650, false, task_id);
  }
  else {
    $.alert({ title: 'Nope!', content: 'Sorry, you do not have permissions to do this.' });
  }

}


/**
 * Open "Add Time" dialog for a given task (metrology only).
 * @param {number} task_id
 */
function callAddTime(task_id) {
  var user_type_id = Number($(".user-type-id input").val());

  if (user_type_id == 1) {
    var task_name = getColumnValueByTaskID(task_id, '.tasklist-task-name-col input[type="text"]');
    popUpIframe(`http://rmslf/Forms/MPMAddTaskTime?tid=${task_id}`, `Add Time to task '${task_name}'`, 300, 800, false, task_id);
  }
}


/**
 * Open 1Factory search in a new tab using the task name.
 * I wish I could figure out how to open 1Factory and forward to the search page if you have to 
 * log in to 1Factory, but I can't figure it out.
 * @param {string} task_name
 */
function callOpenOneFactory(task_name) {

  window.open(`https://val.1factory.com/plans/list?f3=0&search=${task_name}`, "_blank");
}


/** Advance to next page and reload list. */
function callNextPage() {
  $('.tasklist-table').hide();
  removeAppendedFields();
  current_page = Number($('.tasklist-page input').val());
  $('.tasklist-page input').val(current_page + 1).change();
}


/** Go to previous page if possible and reload list. */
function callPrevPage() {
  $('.tasklist-table').hide();
  removeAppendedFields();
  current_page = Number($('.tasklist-page input').val());
  if (current_page == 1) {
    return;
  }
  $('.tasklist-page input').val(current_page - 1).change();
}


/**
 * Apply CSS classes to rows based on status and dates for quick visual scanning.
 * - Overdue: due date <= today
 * - Started: started recently or long-running (> 30 days)
 * - Waiting: status waiting
 * - Completed/Cancelled rows are ignored here (handled elsewhere)
 */
function colorCodeRows() {
  var status_ids = $('.tasklist-status-id-col input[type="text"]');
  var tasklist_rows = $(".tasklist-table table tbody tr");

  var currentDate = new Date();
  var aMonthAgoNumber = new Date().setDate(currentDate.getDate() - 30);
  var aMonthAgo = new Date(aMonthAgoNumber).toISOString();

  $(tasklist_rows).removeClass('colorOverDue');
  $(tasklist_rows).removeClass('colorStarted');
  $(tasklist_rows).removeClass('colorStartedButOld');
  $(tasklist_rows).removeClass('colorWaiting');
  $(tasklist_rows).removeClass('colorClosedCancelled');

  status_ids.each(function (index) {
    let status_id = $(status_ids[index]).val();
    let tasklist_row = tasklist_rows[index];
    let dueDateString = $(tasklist_row).find('.tasklist-date-col input[type="text"]').val();
    let dueDate = moment(dueDateString, "M/D/YYYY").toDate();

    let dateStartedString = $(tasklist_row).find('.tasklist-datestarted-col input[type="text"]').val();

    if ((status_id == status_Completed) || (status_id == status_Cancelled)) {
      return;
    }

    if (dueDate <= currentDate) {
      $(tasklist_row).addClass('colorOverDue');
      return;
    }
    if (status_id == status_Started) {
      if ((dateStartedString != null) && (dateStartedString.length > 0)) {
        let dateStarted = new Date(dateStartedString).toISOString();
        if (dateStarted < aMonthAgo) {
          $(tasklist_row).addClass('colorStartedButOld');
          return;
        }
        else {
          $(tasklist_row).addClass('colorStarted');
          return;
        }
      }
      else {
        $(tasklist_row).addClass('colorStarted');
      }
    }

    if ((status_id == status_Waiting)) {
      $(tasklist_row).addClass('colorWaiting');
    }

  });
}


/**
 * Push filter UI values into their backing hidden fields and refresh the list.
 * Reads values from the filter row controls.
 */
function filterTable() {
  $('.tasklist-assignee-cbo-col select').off();
  $('.tasklist-duedate-col input[type="text"]').off();
  $('.tasklist-schedduedate-col input[type="text"]').off();
  $('.tasklist-status-cbo-col select').off();
  if ($('#filterRow').length == 0) {
    return;
  }

  if ($("#Field206-0").is(":checked")) {
    $('.fincns input').val(1);
  }
  else {
    $('.fincns input').val(0);
  }

  if ($("#Field206-1").is(":checked")) {
    $('.finccom input').val(1);
  }
  else {
    $('.finccom input').val(0);
  }

  if ($("#Field206-2").is(":checked")) {
    $('.fexw input').val(1);
  }
  else {
    $('.fexw input').val(0);
  }

  if ($("#Field206-3").is(":checked")) {
    $('.fexsd input').val(1);
  }
  else {
    $('.fexsd input').val(0);
  }

  var taskNameFilterValue = $('#txtFilter_TaskName').val();
  var projectNameFilterValue = $('#txtFilter_ProjectName').val();
  var ticketNumberFilterValue = $('#txtFilter_TicketNumber').val();
  var taskTypeFilterVal = $('#cboFilter_TaskType').val();
  var statusFilterVal = $('#cboFilter_Status').val();
  var assigneeFilterVal = $('#cboFilter_Assignee').val();
  var departmentFilterVal = $('#cboFilter_Department').val();
  var initiatorFilterVal = $('#cboFilter_Initiator').val();

  $('.ftname input').val(taskNameFilterValue);
  $('.fpname input').val(projectNameFilterValue);
  $('.fpid input').val(ticketNumberFilterValue);



  if ((taskTypeFilterVal != null) && (taskTypeFilterVal.length > 0)) {
    let taskTypeID = taskTypeByNameMap.get(taskTypeFilterVal);
    $('.fttid input').val(taskTypeID);
  }
  else {
    $('.fttid input').val(0);
  }


  if ((statusFilterVal != null) && (statusFilterVal.length > 0)) {
    let statusID = taskStatusNameMap.get(statusFilterVal);
    $('.fsid input').val(statusID);
  }
  else {
    $('.fsid input').val(0);
  }

  if ((assigneeFilterVal != null) && (assigneeFilterVal.length > 0)) {
    let assigneeID = assigneeNameMap.get(assigneeFilterVal);
    $('.faid input').val(assigneeID);
  }
  else {
    $('.faid input').val(0);
  }

  if ((departmentFilterVal != null) && (departmentFilterVal.length > 0)) {
    let departmentID = departmentNameMap.get(departmentFilterVal);
    $('.fdid input').val(departmentID);
  }
  else {
    $('.fdid input').val(0);
  }

  if ((initiatorFilterVal != null) && (initiatorFilterVal.length > 0)) {
    let initiatorID = initiatorNameMap.get(initiatorFilterVal);
    $('.finitid input').val(initiatorID);
  }
  else {
    $('.finitid input').val(0);
  }

  $('.tasklist-table').hide();
  removeAppendedFields();
  $('.tasklist-page input').val(1).change();

}


/**
 * Create the filter header row and wire change/dblclick reset handlers.
 * Populates filter dropdowns from corresponding hidden lookup combos.
 */
function generateFilterRow() {

  if ($('#filterRow').length == 0) {

    var filter_row = "<TR id='filterRow'><TH/><TH/><TH/><TH/><TH/><TH/><TH><input id='txtFilter_TicketNumber'/></TH><TH><input type='text' id='txtFilter_ProjectName'></TH><TH><input type='text' id='txtFilter_TaskName'></TH><TH/><TH/><TH/><TH><select id='cboFilter_Status'/></TH><TH/><TH><select id='cboFilter_TaskType'/></TH><TH><select id='cboFilter_Assignee'/></TH><TH/><TH/><TH/><TH><TH/><TH/><TH><select id='cboFilter_Department'/></TH><TH><select id='cboFilter_Initiator'/></TH><TH/><TH/></TR>"
    $('.tasklist-table table thead').append(filter_row);
    $("#txtFilter_TicketNumber").on("change", function () { filterTable(); });
    $("#txtFilter_ProjectName").on("change", function () { filterTable(); });
    $("#txtFilter_TaskName").on("change", function () { filterTable(); });
    $("#cboFilter_Status").on("change", function () { filterTable(); });
    $("#cboFilter_TaskType").on("change", function () { filterTable(); });
    $("#cboFilter_Assignee").on("change", function () { filterTable(); });
    $("#cboFilter_Department").on("change", function () { filterTable(); });
    $("#cboFilter_Initiator").on("change", function () { filterTable(); });

    // Quick clear on double-click.
    $("#txtFilter_TicketNumber").dblclick(function () { $("#txtFilter_TicketNumber").val(null).change(); });
    $("#txtFilter_ProjectName").dblclick(function () { $("#txtFilter_ProjectName").val(null).change(); });
    $("#txtFilter_TaskName").dblclick(function () { $("#txtFilter_TaskName").val(null).change(); });
    $("#cboFilter_Status").dblclick(function () { $("#cboFilter_Status").val(0).change(); });
    $("#cboFilter_TaskType").dblclick(function () { $("#cboFilter_TaskType").val(0).change(); });
    $("#cboFilter_Assignee").dblclick(function () { $("#cboFilter_Assignee").val(0).change(); });
    $("#cboFilter_Department").dblclick(function () { $("#cboFilter_Department").val(0).change(); });
    $("#cboFilter_Initiator").dblclick(function () { $("#cboFilter_Initiator").val(0).change(); });
    wireUpSortFields();
  }

  // Repopulate the filter controls from backing fields if present.
  if ((($('.ftname input').val() != null) && ($('.ftname input').val().length > 0)) && (($('#txtFilter_TaskName').val() == null) || ($('#txtFilter_TaskName').val() == ''))) {
    $('#txtFilter_TaskName').val($('.ftname input').val());
  }

  if ((($('.fpname input').val() != null) && ($('.fpname input').val().length > 0)) && (($('#txtFilter_TaskName').val() == null) || ($('#txtFilter_TaskName').val() == ''))) {
    $('#txtFilter_TaskName').val($('.fpname input').val());
  }

  if ((($('.fpid input').val() != null) && ($('.fpid input').val().length > 0)) && (($('#txtFilter_TicketNumber').val() == null) || ($('#txtFilter_TicketNumber').val() == ''))) {
    $('#txtFilter_TicketNumber').val($('.fpid input').val());
  }

  // Populate dropdowns from lookup combos (do this once).
  if (($(".initiator-lookup-combo select option").length > 1) && ($("#cboFilter_Initiator option").length == 0)) {
    $("#cboFilter_Initiator").html($(".initiator-lookup-combo select").html());
  }

  if (($(".status-lookup-combo select option").length > 1) && ($("#cboFilter_Status option").length == 0)) {
    $("#cboFilter_Status").html($(".status-lookup-combo select").html());
  }
  if (($(".tasktype-lookup-combo select option").length > 1) && ($("#cboFilter_TaskType option").length == 0)) {
    $("#cboFilter_TaskType").html($(".tasktype-lookup-combo select").html());
  }
  if (($(".assignee-lookup-combo select option").length > 1) && ($("#cboFilter_Assignee option").length == 0)) {
    $("#cboFilter_Assignee").html($(".assignee-lookup-combo select").html());
    $("#cboFilter_Assignee option").eq(0).after($('<option>', {
      value: 'Unassigned',
      text: 'Unassigned'
    }));

  }
  if (($(".department-lookup-combo select option").length > 1) && ($("#cboFilter_Department option").length == 0)) {
    $("#cboFilter_Department").html($(".department-lookup-combo select").html());
  }
}


/**
 * Build per-row action buttons/checkboxes and enhance columns, then lock/color rows.
 * Safe to call on each refresh after table content changes.
 */
function generateTaskListColumnFields() {
  removeAppendedFields();
  if ($('.tasklist-table table tbody tr').length > 0) {

    generateTableButtons(".tasklist-note-col", "ui-icon-document", "Add Note", "callAddNote", true);
    generateTableButtons(".tasklist-time-col", "ui-icon-clock", "Add Time", "callAddTime", true);
    generateTableButtons(".tasklist-1f-col", "ui-icon-extlink", "Open 1Factory", "callOpenOneFactory", false);
    generateTableCheckBox(".tasklist-mandate-col", "mandate-chk");
    generateProjectColumn();
    generateTaskColumn();
    lockCompletedRows();
    colorCodeRows();
  }
}


/**
 * Append project and ticket links to their respective columns.
 * Links open project/ticket details via modal iframe.
 */
function generateProjectColumn() {
  var project_names = $('.tasklist-project-name-col input[type="text"]');
  var project_ids = $('.tasklist-project-id-col input[type="text"]');
  var ticket_numbers = $('.tasklist-ticket-number-col input[type="text"]');
  project_names.each(function (index) {
    let project_id = $(project_ids[index]).val();
    let ticket_number = $(ticket_numbers[index]);
    let ticket_number_value = $(ticket_numbers[index]).val();
    let project_name = $(this).val();
    let project_link = $("<a>", { text: project_name.substr(0, 30), class: 'project-link', href: `javascript:void(0);`, onclick: `showProjectDetails(${project_id})` });
    $(this).parent().append(project_link);
    project_link = $("<a>", { text: ticket_number_value, class: 'project-link', href: `javascript:void(0);`, onclick: `showProjectDetails(${project_id})` });
    $(ticket_number).parent().append(project_link);
  });

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
  var btn_html
  var selectionString = buttonSelector + " input[type=text]";
  var buttons = $(selectionString);
  buttons.each(function () {
    var btn_value = $(this).val();
    if (isArgNumeric) {
      btn_html = `<div class='table-button ui-button' onclick='${buttonFunction}(${btn_value})'><span title='${buttonTitle}' class='ui-button-icon ui-icon ${buttonClass}'/></div>`
    }
    else {
      btn_html = `<div class='table-button ui-button' onclick='${buttonFunction}("${btn_value}")'><span title='${buttonTitle}' class='ui-button-icon ui-icon ${buttonClass}'/></div>`
    }

    

    var has_button = $(this).parent().find(`.${buttonClass}`).length;
    if (has_button == 0) {
      $(this).parent().append(btn_html);
    }
  });
}


/**
 * Render a disabled checkbox reflecting 0/1 state for a given hidden column.
 * @param {string} selector - Column selector
 * @param {string} checkboxClass - CSS class to apply to the appended checkbox
 */
function generateTableCheckBox(selector, checkboxClass) {
  var selectionString = selector + " input[type=text]";
  var checkboxes = $(selectionString);
  checkboxes.each(function () {
    var btn_value = $(this).val();
    if (btn_value == '1') {
      var btn_html = "<input class='" + checkboxClass + "' type='checkbox' disabled checked/>";
      var has_button = $(this).parent().find(`.${checkboxClass}`).length;
      if (has_button == 0) {
        $(this).parent().append(btn_html);
      }
    }
    else {
      var btn_html = "<input class='" + checkboxClass + "' type='checkbox' disabled/>";
      var has_button = $(this).parent().find(`.${checkboxClass}`).length;
      if (has_button == 0) {
        $(this).parent().append(btn_html);
      }
    }
  });
}


/**
 * Append a clickable task link to the task name column for each row.
 * Opens task details in a modal iframe.
 */
function generateTaskColumn() {
  var task_names = $('.tasklist-task-name-col input[type="text"]');
  var task_ids = $('.tasklist-task-id-col input[type="text"]');
  task_names.each(function (index) {
    let task_id = $(task_ids[index]).val();
    let task_name = $(this).val();
    let task_link = $("<a>", { text: task_name.substr(0, 30), class: 'task-link', href: `javascript:void(0);`, onclick: `showTaskDetails(${task_id})` });
    $(this).parent().append(task_link);
  });
}


/** @returns {number} Count of task rows in the table body. */
function getTaskListRowCount() {
  var row_count = $('.tasklist-table table tbody tr').length;
  return row_count;
}


/**
 * Find a column value in the row corresponding to a specific task id.
 * @param {number} task_id
 * @param {string} column_name - jQuery selector (scoped within row)
 * @returns {string|undefined} The value from the column input
 */
function getColumnValueByTaskID(task_id, column_name) {

  var tasklist_rows = $(".tasklist-table table tbody tr");
  var task_ids = $('.tasklist-task-id-col input[type="text"]');
  var column_value;

  task_ids.each(function (index) {
    let row_task_id = $(this).val();
    if (row_task_id == task_id) {
      let tasklist_row = tasklist_rows[index];
      column_value = $(tasklist_row).find(column_name).val();
      return;
    }
  });
  return column_value;
}


/**
 * Return the DOM row for a given task id.
 * @param {number} task_id
 * @returns {HTMLElement|undefined}
 */
function getRowByTaskID(task_id) {
  var tasklist_rows = $(".tasklist-table table tbody tr");
  var task_ids = $('.tasklist-task-id-col input[type="text"]');
  var row;

  task_ids.each(function (index) {
    let row_task_id = $(this).val();
    if (row_task_id == task_id) {
      row = tasklist_rows[index];
      return;
    }
  });
  return row;
}


/**
 * Populate assignee lookup maps (id->name and name->id) from hidden lookup table.
 * Adds a special 'Unassigned' entry (-1).
 */
function loadAssigneeMap() {

  if (assigneeMap.keys.length == 0) {
    var assignee_rows = $('.assignee-lookup-table table tbody tr');
    if (assignee_rows.length == 0) {
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


/** Populate department lookup maps (id<->name). */
function loadDepartmentMap() {
  if (departmentMap.keys.length == 0) {
    var department_rows = $('.department-lookup-table table tbody tr');
    if (department_rows.length == 0) {
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


/** Populate initiator lookup maps (id<->name). */
function loadInitiatorMap() {
  if (initiatorMap.keys.length == 0) {
    var initiator_rows = $('.initiator-lookup-table table tbody tr');
    if (initiator_rows.length == 0) {
      return;
    }
    initiator_rows.each(function (index) {
      initiatorID = $(this).find('.initiator-lookup-table-id input').val();
      initiatorName = $(this).find('.initiator-lookup-table-name input').val();
      initiatorMap.set(initiatorID, initiatorName);
      initiatorNameMap.set(initiatorName, initiatorID);
    });
  }
}


/** Populate task status lookup maps (id<->name). */
function loadStatusMap() {
  if (taskStatusMap.keys.length == 0) {
    var status_rows = $('.status-lookup-table table tbody tr');
    if (status_rows.length == 0) {
      return;
    }
    status_rows.each(function (index) {
      statusID = Number($(this).find('.status-lookup-table-id input').val());
      statusName = $(this).find('.status-lookup-table-name input').val();
      taskStatusMap.set(statusID, statusName);
      taskStatusNameMap.set(statusName, statusID);
    });
  }
}


/** Populate task type lookup maps (id<->name). */
function loadTaskTypeMap() {

  if (taskTypeMap.keys.length == 0) {
    var tasktype_rows = $('.tasktype-lookup-table table tbody tr');
    if (tasktype_rows.length == 0) {
      return;
    }
    tasktype_rows.each(function (index) {
      tasktypeID = Number($(this).find('.tasktype-lookup-table-id input').val());
      tasktypeName = $(this).find('.tasktype-lookup-table-name input').val();
      taskTypeMap.set(tasktypeID, tasktypeName);
      taskTypeByNameMap.set(tasktypeName, tasktypeID);
    });
  }
}


/**
 * Visually lock completed/cancelled rows and disable time logging button when
 * the "include completed" filter is active.
 */
function lockCompletedRows() {
  var status_ids = $('.tasklist-status-id-col input[type="text"]');
  var tasklist_rows = $(".tasklist-table table tbody tr");
  var includeCompleted = Number($('.finccom input').val());

  if (includeCompleted == 1) {

    status_ids.each(function (index) {
      let status_id = $(status_ids[index]).val();
      let tasklist_row = tasklist_rows[index];

      if ((status_id == status_Completed) || (status_id == status_Cancelled)) {
        $(tasklist_row).addClass('colorClosedCancelled');
        $(tasklist_row).find(".time-button").prop("disabled", true);

      }
      else {
        $(tasklist_row).removeClass('colorClosedCancelled');
        $(tasklist_row).find(".time-button").prop("disabled", false);
      }
    });
  }
}


/**
 * Apply per-user permission logic to enable/disable action buttons in each row.
 * - Admin (user_type_id 1): full access
 * - Department manager (user_type_id 3): time disabled; notes limited to own department
 * - Others: both actions disabled
 */
function lockRows() {
  var tasklist_rows = $(".tasklist-table table tbody tr");
  var user_type_id = Number($(".user-type-id input").val());
  var userDepartmentID = Number($(".user-department-id input").val());
  tasklist_rows.each(function (index) {
    if (user_type_id == 1) {

      $(this).find(".tasklist-note-col").find(".table-button").removeClass("ui-state-disabled");
      $(this).find(".tasklist-time-col").find(".table-button").removeClass("ui-state-disabled");
      return;
    }
    if (user_type_id == 3) {
      $(this).find(".tasklist-time-col").find(".table-button").addClass("ui-state-disabled");
      let departmentID = Number($(this).find('.tasklist-dept-id-col input[type="text"]').val());
      if (departmentID != userDepartmentID) {
        $(this).find(".tasklist-note-col").find(".table-button").addClass("ui-state-disabled");
      }
      return;
    }

    $(this).find(".tasklist-note-col").find(".table-button").addClass("ui-state-disabled");
    $(this).find(".tasklist-time-col").find(".table-button").addClass("ui-state-disabled");
  });
}


/**
 * Open a jQuery UI dialog that hosts an iframe.
 * @param {string} src - Iframe URL
 * @param {string} title - Dialog title
 * @param {number} height - Dialog height (px)
 * @param {number} width - Dialog width (px)
 * @param {boolean} dorefresh - Whether to refresh certain fields on close
 * @param {number} task_id - Task ID for refresh callbacks
 */
function popUpIframe(src, title, height, width, dorefresh, task_id) {
  //var iframe_height = height - 100;

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
      if (dorefresh) {
        resetAssignee(task_id);
        resetTaskStatus(task_id);
      }
    }
  });


  $("#popupIFrame").dialog("open");
  $("#popupIFrame").attr('style', `width: ${width};`);
  var resizeableStyle = $('.ui-resizable').attr('style');
  let newStyle = resizeableStyle.replaceAll('width: 0px;', `width: ${width}px;`);
  $('.ui-resizable').attr('style', newStyle);
}


/**
 * Reapply filter values from hidden fields to the filter row controls.
 * See "Page Refresh Quirks" for full explanation.
 */
function reApplyFilterValues() {
  if ($('#filterRow').length == 0) {
    return;
  }

  var includeNotScheduled = Number($('.fincns input').val());
  var includeCompleted = Number($('.finccom input').val());
  var excludeWaiting = Number($('.fexw input').val());

  if (includeNotScheduled == 1) {
    $('#Field206-0').prop('checked', true);
  }
  else {
    $('#Field206-0').prop('checked', false);
  }

  if (includeCompleted == 1) {
    $('#Field206-1').prop('checked', true);
  }
  else {
    $('#Field206-1').prop('checked', false);
  }

  if (excludeWaiting == 1) {
    $('#Field206-2').prop('checked', true);
  }
  else {
    $('#Field206-2').prop('checked', false);
  }



  var taskNameFilterValue = $('.ftname input').val();
  var projectNameFilterValue = $('.fpname input').val();
  var projectIDFilterValue = $('.fpid input').val();

  var taskTypeFilterVal = Number($('.fttid input').val());
  var statusFilterVal = Number($('.fsid input').val());
  var assigneeFilterVal = Number($('.faid input').val());
  var departmentFilterVal = Number($('.fdid input').val());
  var initiatorFilterVal = $('.finitid input').val();

  if (initiatorFilterVal != 0) {

    let initiatorName = initiatorMap.get(initiatorFilterVal);

    $('#cboFilter_Initiator').val(initiatorName);
  }
  else {

    $("#cboFilter_Initiator").val($("#cboFilter_Initiator option:first").val());
  }

  if ((taskNameFilterValue != null) && (taskNameFilterValue.length > 0)) {
    $('#txtFilter_TaskName').val(taskNameFilterValue);
  }

  if ((projectNameFilterValue != null) && (projectNameFilterValue.length > 0)) {
    $('#txtFilter_ProjectName').val(projectNameFilterValue);
  }

  if ((projectIDFilterValue != null) && (projectIDFilterValue.length > 0)) {
    $('#txtFilter_TicketNumber').val(projectIDFilterValue);
  }


  if (taskTypeFilterVal != 0) {
    let taskTypeName = taskTypeMap.get(taskTypeFilterVal);
    $('#cboFilter_TaskType').val(taskTypeName);
  }
  if (statusFilterVal != 0) {
    let statusName = taskStatusMap.get(statusFilterVal);
    $('#cboFilter_Status').val(statusName);
  }
  if (assigneeFilterVal != 0) {
    let assigneeName = assigneeMap.get(assigneeFilterVal);
    console.log(`assigneeName: ${assigneeName}`);
    $('#cboFilter_Assignee').val(assigneeName);

  }
  if (departmentFilterVal != 0) {
    let departmentName = departmentMap.get(departmentFilterVal);
    $('#cboFilter_Department').val(departmentName);
  }

}


/**
 * Build a new URL with current filter values as query string parameters and navigate to it.
 * See "Page Refresh Quirks" for full explanation.
 */
function refreshPage() {

  var taskNameFilter = $('.ftname input').val();
  var projectFilter = $('.fpname input').val();
  var include_NotSched = Number($('.fincns input').val());
  var exclude_Waiting = Number($('.fexw input').val());
  var include_Complete = Number($('.finccom input').val());
  var taskTypeIDFilter = Number($('.fttid input').val());
  var statusIDFilter = Number($('.fsid input').val());
  var assigneeIDFilter = Number($('.faid input').val());
  var departmentIDFilter = Number($('.fdid input').val());
  var taskListPage = Number($('.tasklist-page input').val());
  var initiatorID = Number($('.finitid input').val());

  var current_url = window.location.href;
  if (current_url.includes('?')) {
    indexOfQuestionMark = current_url.indexOf('?');
    current_url = current_url.substring(0, indexOfQuestionMark);
  }

  if ((taskListPage != null) && (taskListPage != NaN) && (taskListPage > 0)) {
    current_url = current_url + `?TaskListPage=${taskListPage}`;
  }

  if ((projectFilter != null) && (projectFilter.length > 0)) {
    current_url = current_url + `&fpname=${projectFilter}`;
  }

  if ((taskNameFilter != null) && (taskNameFilter.length > 0)) {
    current_url = current_url + `&ftname=${taskNameFilter}`;
  }

  if ((include_NotSched != null) && (include_NotSched != NaN) && (include_NotSched > 0)) {
    current_url = current_url + `&fincns=${include_NotSched}`;
  }

  if ((exclude_Waiting != null) && (exclude_Waiting != NaN) && (exclude_Waiting > 0)) {
    current_url = current_url + `&fexw=${exclude_Waiting}`;
  }

  if ((include_Complete != null) && (include_Complete != NaN) && (include_Complete > 0)) {
    current_url = current_url + `&finccom=${include_Complete}`;
  }

  if ((assigneeIDFilter != null) && (assigneeIDFilter != NaN) && (assigneeIDFilter > 0)) {
    current_url = current_url + `&faid=${assigneeIDFilter}`;
  }

  if ((statusIDFilter != null) && (statusIDFilter != NaN) && (statusIDFilter > 0)) {
    current_url = current_url + `&fsid=${statusIDFilter}`;
  }

  if ((taskTypeIDFilter != null) && (taskTypeIDFilter != NaN) && (taskTypeIDFilter > 0)) {
    current_url = current_url + `&fttid=${taskTypeIDFilter}`;
  }

  if ((departmentIDFilter != null) && (departmentIDFilter != NaN) && (departmentIDFilter > 0)) {
    current_url = current_url + `&fdid=${departmentIDFilter}`;
  }

  if ((initiatorID != null) && (initiatorID != NaN) && (initiatorID > 0)) {
    current_url = current_url + `&finitid=${initiatorID}`;
  }

  window.location = current_url;
}


// Remove appended buttons/links/checkboxes so they don't accumulate on refresh.
function removeAppendedFields() {
  $('#tasklist-pagination').remove();
  $('.table-button').remove();
  $('.project-link').remove();
  $('.task-link').remove();
  $('.mandate-chk').remove();

}


// Reset to page 1 and refresh the list.
function resetPageNumber() {
  $('.tasklist-table').hide();
  removeAppendedFields();
  $('.tasklist-page input').val(1).change();
}


// Open project/ticket details in a modal iframe.
function showProjectDetails(ticket_id) {
  var widowHeight = $(window).height();
  widowHeight = widowHeight - 50;
  popUpIframe(`http://rmslf/Forms/MPM-EditProgrammingTicket?tid=${ticket_id}`, 'Ticket Details', widowHeight, 1500, false, ticket_id);
}


// Open task details in a modal iframe.
function showTaskDetails(task_id) {
  var widowHeight = $(window).height();
  widowHeight = widowHeight - 50;
  popUpIframe(`http://rmslf/Forms/MPM-EditProgrammingTask?tid=${task_id}`, 'Task Details', widowHeight, 1100, false, task_id);
}


// Sort the table by a given column, toggling direction if already sorted by that column.
function sortTable(newSortOrdinal, selector) {

  removeAppendedFields();
  $('.sort-icon').remove();

  var currentSortOrdinal = Number($('.sort-field-ordinal input').val());
  var sortDirection = Number($('.sort-direction input').val());

  if (newSortOrdinal == currentSortOrdinal) {
    if (sortDirection == 0) {
      sortDirection = 1
      $('.sort-direction input').val(1).change();
    }
    else {
      sortDirection = 0;
      $('.sort-direction input').val(0).change();
    }
  }
  else {
    $('.sort-field-ordinal input').val(newSortOrdinal);
    $('.sort-direction input').val(0).change();
    sortDirection = 0;
  }

  if (sortDirection == 0) {
    $(`${selector} .cf-col-label`).append('<span class="ui-icon ui-icon-triangle-1-n sort-icon"></span>');
  }
  else {
    $(`${selector} .cf-col-label`).append('<span class="ui-icon ui-icon-triangle-1-s sort-icon"></span>');
  }
}


// Wire up click handlers on column headers to enable sorting.
function wireUpSortFields() {

  $('#q236 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-n sort-icon"></span>');

  $('#q236').on('click', function () { sortTable(0, '#q236'); });   // Due Date (default)
  $('#q88').on('click', function () { sortTable(1, '#q88'); });     // Ticket Number
  $('#q83').on('click', function () { sortTable(2, '#q83'); });     // Ticket Name
  $('#q84').on('click', function () { sortTable(3, '#q84'); });     // Task Name
  $('#q234').on('click', function () { sortTable(4, '#q234'); });   // Status
  $('#q87').on('click', function () { sortTable(5, '#q87'); });     // Task Type
  $('#q235').on('click', function () { sortTable(6, '#q235'); });   // Assignee
  $('#q102').on('click', function () { sortTable(7, '#q102'); });   // Department
  $('#q221').on('click', function () { sortTable(8, '#q221'); });   // Submittor
  $('#q241').on('click', function () { sortTable(9, '#q241'); });   // Create Date
}