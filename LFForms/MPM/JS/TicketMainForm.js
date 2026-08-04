/**
TicketMainForm.js -   This form houses the four main tabs for managing tickets and tasks.
                      It also shows the last schedule update information, a link to see the 1Factory logs, 
                      and a search helper for looking through the production schedules by task name.
                      If the user is anonymous, it shows a "Log In" link.
                      If the user is a Metrology user, it shows an "Admin" link to the admin form.

 Author:   Jeffrey Whitney
            jtwhitney@machine.com
            651-391-7982
  Date:     9/29/2025


Responsibilities:
- Initialize page chrome (title, hide default submit).
- Resolve user identity and display status/links (login/admin).
- Lazy-load and refresh embedded iframes for tickets/tasks.
- Build jQuery UI tab layout and wire refresh on activation/double-click.
- Surface last schedule update metadata and quick links.
- Provide schedule search helper by task name.

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

External dependencies (loaded at runtime):
- jQuery
- jQuery UI (Tabs); the UI stylesheet is injected at runtime.
- jquery-cookie (1.4.1) for reading `site_name`.

DOM contract (expected elements/fields):
- Inputs: `.lf-user-name input`, `.network-user-name input`, `.user-isadmin input`,
          `.user-type-id input`, `.user-name-hidden input`, `.user-name-display input`,
          `.last-schedule-update-run input`, `.last-schedule-run-by input`,
          `.last-schedule-is-automated input`, `.last-schedule-run-id input`,
          `.site-name input`, `.task-schedule-info input`
- Containers: `.user-name-display`, `.schedule-update-message`,
              `#service-ticket-div`, `#program-task-div`, `#program-ticket-div`
- Tabs source containers: `#q0`, `#q1`, `#q2`, `#q3`, `#q23`
- Iframe IDs (created if missing): `#frm-servicetickets`, `#frm-programming-tasks`, `#frm-programming-tickets`

Custom/observed events:
- `lookupcomplete` (triggers title generation and iframe loading)
- `onloadlookupfinished` (reserved hook; currently no-op)
- jQuery UI `tabsactivate` on `#ticket-tabs` (refreshes active iframe)

Notes:
- Double-clicking a tab header forces a reload of the corresponding iframe.
- Anonymous users see a "Log In" link and iframes are loaded immediately.
- Metrology users get an "Admin" link to the admin form.
 */

/* global $ */

$(function () {
  // Ensure jQuery UI styles are available for tabs.
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');

  // Load jquery-cookie to restore `site_name` (if present) into the form.
  $.when(
    $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js')
  ).done(function () {
    const sitename = $.cookie('site_name');
    if (sitename !== null) {
      $('.site-name input').val(sitename).trigger("change");
    }
  });

  // Base page setup.
  $('.Submit').hide();
  $(document).prop('title', 'Metrology Tickets');

  // Normalize/display the current user and load iframes for anonymous users.
  const lfUserName = $('.lf-user-name input').val();
  if (lfUserName !== 'Anonymous User') {
    $('.network-user-name input').val(lfUserName.toUpperCase().slice(lfUserName.lastIndexOf('\\') + 1)).trigger("change");
  }
  else {
    loadIFrames();
  }

  // Update title info when switching tabs (single click).
  $(document).on('click', '.ui-tabs-anchor', function () {
    generateTitleInfo();
  });

  // Force reload of the active iframe on tab header double-click.
  $(document).on('dblclick', '.ui-tabs-anchor', function () {
    const tabID = $(this).attr('id');
    if (tabID === 'ui-id-1') {
      const iframeServiceTickets = $('#frm-servicetickets');
      if (iframeServiceTickets.length) {
        iframeServiceTickets.attr('src', iframeServiceTickets.attr('src'));
      }
    }
    else if (tabID === 'ui-id-2') {

      const iframeProgrammingTasks = $('#frm-programming-tasks');
      if (iframeProgrammingTasks.length) {
        iframeProgrammingTasks.attr('src', iframeProgrammingTasks.attr('src'));
      }
    }
    else if (tabID === 'ui-id-3') {

      const iframeProgrammingTickets = $('#frm-programming-tickets');
      if (iframeProgrammingTickets.length) {
        iframeProgrammingTickets.attr('src', iframeProgrammingTickets.attr('src'));
      }
    }
    else if (tabID === 'ui-id-4') {

      const iframePurchaseOrders = $('#frm-purchase-orders');
      if (iframePurchaseOrders.length) {
        iframePurchaseOrders.attr('src', iframePurchaseOrders.attr('src'));
      }
    }
    //This is here to handle odd situations where the Schedule Update info doesn't show up.
    generateTitleInfo();
  });

  // Build tabs and initialize UI.
  tabifyFormSections();

  // After lookups complete, finalize header and ensure iframes are loaded.
  // I had to put it in the lookupcomplete event because there was a weird timing issue
  // which caused the Schedule Update info not to show sometimes. Same with the user name/admin link.
  // It would show sometimes, and not other. Seemingly at random. Putting it in the lookupcomplete event
  // seems to have fixed it, though I also have the genereateTitleInfo call whenever you switch tabs or 
  // double-click on a tab to reload it. Between these three, it seems like the issue has been resolved. 
  $(document).on('lookupcomplete', function () {

    generateTitleInfo();
    loadIFrames();
  });

});

/**
 * Returns whether the current user is an administrator.
 * Reads the value from `.user-isadmin input` (expects 1 for true).
 * @returns {boolean} True if admin; otherwise false.
 */
function isAdmin() {
  const isAdmin = Number($('.user-isadmin input').val());
  return isAdmin === 1;
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
 * Generates and updates the user/title section and auxiliary actions if they don't exist.
 * - Shows "Log In" link for anonymous users and loads iframes.
 * - Shows "Admin" link for Metrology users.
 * - Displays "User: <name>" derived from `.user-name-hidden`.
 * - Ensures the schedule search icon is present.
 * - Emits last run message via `generateLastRunMessage()`.
 * Side effects: Mutates DOM under `.user-name-display` and `.task-schedule-info`.
 */
function generateTitleInfo() {

  if ($('.user-name-display input').val() === '') {
    const lfUserName = $('.lf-user-name input').val();
    if (lfUserName === 'Anonymous User') {
      $('.user-name-display input').val('User :Anonymous');
      const login_link = $("<a>", { text: 'Log In', class: 'login-link', href: 'http://rmslf/Forms/account/login?returnUrl=%2fForms%2fMPM-TicketMainform' });
      $('.user-name-display').append(login_link);
      loadIFrames();
    }
    else {
      const userName = $('.user-name-hidden input').val()
      if (userName !== '') {
        const userText = `User: ${userName}`
        $('.user-name-display input').val(userText);
        if (isMetrologyUser()) {
          const admin_link = $("<a>", { text: 'Admin', class: 'admin-link', href: 'http://rmslf/Forms/MPM-AdminMainform', target: '_blank' });
          $('.user-name-display').append(admin_link);
        }
      }
    }
  }

  generateLastRunMessage();
  if ($('.task-search-button').length === 0) {
    $('.task-schedule-info input').show();
    $('.task-schedule-info input').parent().append('<span class="ui-icon ui-icon-search task-search-button" onclick="searchScheduleByTaskName()"></span>')
  }

}

/**
 * Creates a one-time "last schedule update" status banner that links to:
 * - Schedules page
 * - Specific schedule run (if id/date available)
 * - Curl Logs
 * Handles both automated and manual runs and no-ops if required metadata is missing.
 * Side effects: Appends `#last-run-div` into `.schedule-update-message`.
 */
function generateLastRunMessage() {
  const lastRunDate = $('.last-schedule-update-run input').val();
  const lastRunBy = $('.last-schedule-run-by input').val();
  const isAutomated = Number($('.last-schedule-is-automated input').val());
  const lastRunID = $('.last-schedule-run-id input').val();
  let lastRunMessage = "";

  if ($('#last-run-div').length === 0) {

    // For manual runs, require both date and user.
    if (isAutomated !== 1) {
      if (lastRunDate === '' || lastRunBy === '') {
        return;
      }
    }

    const schedule_page_link = `<a href='http://rmslf/Forms/MPM-ScheduleUpdate' target='_blank' class='schedule-page-link'>Schedules</a>`
    const schedule_link = `<a href='http://rmslf/Forms/MPM-ScheduleUpdate?rid=${lastRunID}' target='_blank' class='schedule-run-link'>${lastRunDate}</a>`
    const isOld = lastRunDate !== '' && new Date(new Date(lastRunDate).toDateString()) < new Date(new Date().toDateString());
    const blinkClass = isOld ? 'slow-blink' : '';
    if (isAutomated === 1) {
      lastRunMessage = `<div id="last-run-div" class="${blinkClass.trim()}">${schedule_page_link} Updated: ${schedule_link} (Automated)</div>`;
    }
    else {
      lastRunMessage = `<div id="last-run-div" class="${blinkClass.trim()}">${schedule_page_link} Updated: ${schedule_link} by ${lastRunBy}</div>`;
    }

    $('.schedule-update-message').append(lastRunMessage);

    if ($('.curl-logs-link').length === 0) {
      const curl_logs_link = $("<a>", { text: 'Curl Logs', class: 'curl-logs-link', href: 'http://rmslf/Forms/RMS-MPM-CurlLogs', target: '_blank' });
      $('#last-run-div').append(curl_logs_link);
    }
  }
}

/**
 * Ensures the three core iframes are present on the page; creates them if missing.
 * Iframes:
 * - `#frm-servicetickets` => Service Tickets
 * - `#frm-programming-tasks` => Programming Tasks
 * - `#frm-programming-tickets` => Programming Tickets
 * Side effects: Appends iframes to their respective container divs.
 */
function loadIFrames() {
  if ($('#frm-servicetickets').length === 0) {
    $('#service-ticket-div').append(`<iframe id="frm-servicetickets" src="http://rmslf/Forms/RMS-MPM-ServiceTickets/"></iframe>`);
  }

  if ($('#frm-programming-tasks').length === 0) {
    $('#program-task-div').append(`<iframe id="frm-programming-tasks" src="http://rmslf/Forms/MPM-ProgrammingTasks/"></iframe>`);
  }

  if ($('#frm-programming-tickets').length === 0) {
    $('#program-ticket-div').append(`<iframe id="frm-programming-tickets" src="http://rmslf/Forms/MPM-ProgrammingTickets"></iframe>`);
  }

  if ($('#frm-purchase-orders').length === 0) {
    $('#purchase-order-div').append(`<iframe id="frm-purchase-orders" src="http://rmslf/Forms/MPM-PurchaseOrders"></iframe>`);
  }

}

/**
 * Opens the schedule search page in a new tab, optionally filtered by task name.
 * Reads the search term from `.task-schedule-info input`.
 * Side effects: `window.open` for the search URL.
 */
function searchScheduleByTaskName() {
  const searchTaskName = $('.task-schedule-info input').val();
  let searchURL

  if (searchTaskName === '') {
    searchURL = `http://rmslf/Forms/MPM-SearchScheduleByTaskName`;
  }
  else {
    searchURL = `http://rmslf/Forms/MPM-SearchScheduleByTaskName?tname=${encodeURIComponent(searchTaskName)}`;
  }

  window.open(searchURL, '_blank');

}

/**
 * Converts the form into a jQuery UI tabbed interface and wires behavior:
 * - Wraps `#q0` children into `#ticket-tabs` with a header `<ul>` containing four tabs.
 * - Initializes tabs and refreshes the associated iframe on activation.
 * - Calls `generateTitleInfo()` once initialized.
 * Side effects: DOM restructuring and event binding on `#ticket-tabs`.
 */
function tabifyFormSections() {
  $('#q0').children().wrapAll('<div id="ticket-tabs"></div>');
  $('#ticket-tabs').prepend('<ul id="ticket-tab"><li><a href="#q1"><span>Service Tickets</span></a></li><li><a href="#q2"><span>Programming Tasks</span></a></li><li><a href="#q3"><span>Programming Tickets</span></a></li><li><a href="#q23"><span>Purchase Orders</span></a></li></ul>');
  $('#ticket-tabs').tabs();

  $("#ticket-tabs").on("tabsactivate", function (event, ui) {
    const tab = ui.newTab.index();
    if (tab === 0) {
      const iframeServiceTickets = $('#frm-servicetickets');
      if (iframeServiceTickets.length) {
        iframeServiceTickets.attr('src', iframeServiceTickets.attr('src'));
      }
    }
    else if (tab === 1) {
      const iframeProgrammingTasks = $('#frm-programming-tasks');
      if (iframeProgrammingTasks.length) {
        iframeProgrammingTasks.attr('src', iframeProgrammingTasks.attr('src'));
      }
    }
    else if (tab === 2) {
      const iframeProgrammingTickets = $('#frm-programming-tickets');
      if (iframeProgrammingTickets.length) {
        iframeProgrammingTickets.attr('src', iframeProgrammingTickets.attr('src'));
      }
    }
    else if (tab === 3) {
      const iframePurchaseOrders = $('#frm-purchase-orders');
      if (iframePurchaseOrders.length) {
        iframePurchaseOrders.attr('src', iframePurchaseOrders.attr('src'));
      }
    }
  });
  generateTitleInfo();
}
