/**
 # AdminMainForm.js Documentation
 
 Author:  Jeffrey Whitney
          jtwhitney@machine.com
          651-319-7982
 Date:    9/7/2026
 
 ## Overview
 
 This script controls the Gage Administration Main Form landing page.
 If the user is not authenticated (see User Permissions below), it will make all the links
 just pop up an error message. If they are authenticated, then it will make the links actually go somewhere.
 There are two exceptions to this. The first is the Login link which will only show if the user is not logged in to
 LFF. The other is the Users link which requires you to be an Admin.


 KEY CONCEPTS:
 User Permissions:
   There is a user permission model in place to restrict which updates a user can make.
   This is separate from LFF security, which can, (but in practice does not), limit who
   can even access a particular form. For our purposes, this is not particularly useful because we want
   all users to be able to view the forms. What we want instead is to limit their ability to do certain things
   inside the application.
   There are three "levels" of users in the system.
     Operators/Cell Leads:
       The first level is the Operator/Cell Lead.
       Operators and Cell Leads are not logged in to LFF at all, and they do not have LFF accounts. As such, they
       cannot be validated in the traditional sense (there is no password to validate against). Therefore, they are validated
       in an "on your honor" kind of way. We do look them up by their employee number against the profit key database, so
       that goes some of the way towards limiting anyone from spoofing another user. (Though why anyone would do that, I can't imagine.)
       We do keep a list of cell leads in a lookup table by department, but that's only because we don't want the operator
       to put in a bogus cell lead or misspell the cell lead's name. This also allows us to reassign open tickets
       to another cell lead if a cell lead goes inactive.
     Calibration Techs:  
       These people all have LFF accounts, as well as records in the tlkpUser table. They have permissions to use forms that
       everyone else does not.
     Cal Tech Admins: The only thing that Admins can do that regular cal techs cannot is add/edit users.

   How authentication is performed:
   When the user first loads the form, LFF fills in the .lf-user-name field with CRETEX\username.
   (Predicated on the fact that the user has a LFF account and is logged in to LFF).
   Because of the expense, Cell Leads have not been given LFF accounts, so the .lf-user-name field will be set to "Anonymous User" for them.
   In any case, if the user is logged in to LFF, it sets the .lf-user-name to CRETEX\username.
    This will be matched against the user database table to determine the user's ID, employee number, and whether they are an admin.

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
 We take that value, keeping only the username portion and put that in NetworkUserName.
 This causes a lookup for all the user-related fields, including SiteID. Once the SiteID is set, this in turn
 causes another lookup to pull in all the departments related to that site. The Department Lookup cannot be loaded until
 we know which site we're talking about. Sometimes this daisy-chaining can get 3 and sometimes even 4 levels deep because of all the relationships between
 various fields on a form. This causes the form to be slower than it otherwise would have been, but there's not a lot we can do about it.
 It sort of is what it is. This is what happens when you have to make an application with a non-application framework.

 ### Link Rendering
 
 `generateApplicationLinks()` creates two columns of links:
 - Operational links (tickets, checkout, reports, etc.)
 - Administration links (users, machine groups, departments, etc.)
 
 Rules applied during rendering:
 - Anonymous-only links (Login) only display for anonymous users.
 - Admin-only links (Users) require both active permissions and admin rights.
 - Disabled links are rendered with `javascript:void(0)` and show a permission alert.
 
 ### User Display
 
 The script appends `User: <name>` to `#form-title-wrap`.
 Empty or anonymous values are normalized to `Anonymous User`.
 
 ### Permission Alert
 
 `showPermissionAlert()` displays a standardized jquery-confirm error dialog:
 `Sorry, you do not have permissions to see this form.`
 
 ## Dependencies
 
 - [jQuery](https://jquery.com/)
 - [jquery-confirm](https://craftpip.github.io/jquery-confirm/)
 
 ## Usage
 
 This script expects these fields/elements to exist:
 - `.user-id input`
 - `.user-isactive input`
 - `.user-isadmin input`
 - `.network-user-name input`
 - `.user-name input`
 - `.site-id input`
 - `#form-title-wrap`
 - `.main-window`

 ## Events
 
 - `onloadlookupfinished`: Triggers link generation after lookup data is available.
 */
$(function () {

  $.when(
    $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js')
  ).done(function () {
    $(document).prop('title', 'Gage Administration MainForm');
    $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
  }).fail(function () {
    console.error('Failed to load required scripts');
  });

  $('.Submit').hide();

  $(document).on("onloadlookupfinished", function () {
    console.log('Is Anonymous', isUserAnonymous());
    generateApplicationLinks();
  });

});


function buildLinkItem(link, isEnabled) {
  if (isEnabled) {
    return `<li><a href="${link.href}" title="${link.title}" target="_self">${link.label}</a></li>`;
  }

  return `<li><a href="javascript:void(0);" title="${link.title}" onclick="showPermissionAlert()">${link.label}</a></li>`;
}


function checkPermissions() {

  const employee_number = $(".user-id input").val();
  const is_active_user = Number($(".user-isactive input").val());
  let return_val = true;


  if (typeof is_active_user === 'undefined') {
    return false;
  }

  if (typeof employee_number === 'undefined') {
    return false;
  }


  if ((is_active_user === 0) || (is_active_user === null)) {
    return_val = false;
  }

  if ((employee_number === '') || (employee_number === null)) {
    return_val = false;
  }

  return return_val

}


function isUserAnonymous() {
  const networkUserName = $(".network-user-name input").val();
  return networkUserName === "Anonymous User";
}


function generateApplicationLinks() {
  const siteID = $('.site-id input').val();
  const hasPermissions = checkPermissions();
  const isAdmin = isUserAdmin();
  const isAnonymous = isUserAnonymous();
  const firstColumnLinks = [
    {
      label: 'Login',
      title: 'Login',
      href: 'http://rmslf/Forms/account/login?returnUrl=%2fForms%2fGAGE-AdminMainForm',
      anonymousOnly: true
    },
    {label: 'Tickets', title: 'Gage Administration', href: 'http://rmslf/Forms/GageTicketAdministration'},

    {
      label: 'Gage Request Maintenance',
      title: 'Gage Request Maintenance',
      href: 'http://rmslf/Forms/GageRequestMaintenance'
    },
    {label: 'Gage Checkout', title: 'Gage Checkout', href: 'http://rmslf/Forms/RMS-GAGE-CheckoutMainform'},
    {label: 'Ticket History', title: 'Ticket History', href: 'http://rmslf/Forms/RMS-GAGE-TicketHistory'},
    {label: 'Bin History', title: 'Ticket History', href: 'http://rmslf/Forms/RMS-GAGE-BinHistory'},
    {label: 'Thread Gages', title: 'Thread Gages', href: 'http://rmslf/Forms/RMS-GAGE-ThreadGages'},
    {label: 'Overdue Tickets', title: 'Overdue Tickets', href: `${window.location.origin}/Forms//RMS-GAGE-OverDueTicketsReport?site-id=${siteID}`},
    {label: 'Thread Member Inventory', title: 'Thread Member Inventory', href: 'http://rmslf/Forms/RMS-Gage-ThreadMemberInventory'},
  ];

  const secondColumnLinks = [
    {label: 'Users', title: 'Users', href: 'http://rmslf/Forms/GageUserMaintenance', adminOnly: true},
    {label: 'Cell Leaders', title: 'Cell Leaders', href: 'http://rmslf/Forms/RMS-GAGE-CellLeaders'},
    {label: 'Machine Groups', title: 'Machine Groups', href: 'http://rmslf/Forms/RMS-GAGE-MachineGroups'},
    {label: 'Departments', title: 'Departments', href: 'http://rmslf/Forms/RMS-GAGE-Departments'},
    {label: 'Pin Bins', title: 'Pin Bins', href: 'http://rmslf/Forms/RMS-GAGE-Bins'},
    {label: 'Pin Types', title: 'Pin Types', href: 'http://rmslf/Forms/RMS-GAGE-PinTypes'},
    {
      label: 'Production Machines',
      title: 'Production Machines',
      href: 'http://rmslf/Forms/RMS-GAGE-ProductionMachines'
    },
    {label: 'Sites', title: 'Sites', href: 'http://rmslf/Forms/RMS-GAGE-Sites'},
  ];


  const firstColumnHtml = firstColumnLinks
    .filter(function (link) {
      return !link.anonymousOnly || isAnonymous;
    })
    .map(function (link) {
      const canAccessLink = link.anonymousOnly ? true : hasPermissions;
      return buildLinkItem(link, canAccessLink);
    })
    .join('');

  const secondColumnHtml = secondColumnLinks
    .map(function (link) {
      const canAccessLink = hasPermissions && (!link.adminOnly || isAdmin);
      return buildLinkItem(link, canAccessLink);
    })
    .join('');


  let userName = $('.user-name input').val();
  if (userName === 'Anonymous User' || userName === '') {
    userName = 'Anonymous User';
  }

  const userNameHTML = `<span class="user-name-display">User: ${userName}</span>`;
  $('#form-title-wrap').append(userNameHTML);

  const mainWindowHTML = `<div class="row"><div class="column"><ul>${firstColumnHtml}</ul></div><div class="column"><ul>${secondColumnHtml}</ul></div></div>`;


  $('.main-window').html(mainWindowHTML);

}


function isUserAdmin() {
  let return_val = true;
  const is_admin_user = Number($(".user-isadmin input").val());

  if (typeof is_admin_user === 'undefined') {
    return false;
  }

  if ((is_admin_user === 0) || (is_admin_user === null)) {
    return_val = false;
  }
  return return_val;
}


function showPermissionAlert() {
  $.alert({
    title: 'Error',
    icon: 'fa fa-warning',
    type: 'orange',
    content: 'Sorry, you do not have permissions to see this form.',
  });

}
