/*# MainForm.js — Documentation

 Author:  Jeffrey Whitney
          jtwhitney@machine.com
          651-319-7982
 Date:    9/29/2025

Overview
This form is the gateway to all things administrative. It's really nothing but a bunch of links. 
Some links go to forms that all Metrology users can see, some are reserved for admins, (see "User Permissions" below).

- Client-side logic for the Admin Main Form in LFForms/MPM.
- Initializes UI, normalizes the network username, and enforces admin-only UI behavior.

Permissions: (See "User Permissions" section below for details)
             Technically all users can access this form, but unless you are a Metrology user, 
             you'll never see a link to this form, so you won't know about it. _
             Non-Admin users will have the links to the administrative forms disabled. 
             Again, technically, they could figure out the address of the form and access it,
             but they won't be able to do anything because the forms themselves will prevent them from making any changes.

Dependencies
- jQuery
- jQuery UI (CSS theme)
- jquery-confirm (CSS/JS)
- Uses Bootstrap’s jQuery plugin; resolves conflict via `$.fn.button.noConflict()`.

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
 

Key behaviors
- Hides the default Submit button on load.
- Sets the document title to "Admin Main Form".
- Loads jquery-confirm and stylesheets.
- Copies the user name from `#Field2` into `#Field3`, stripping the domain (text after the last backslash).
- On lookup completion:
  - If `#Field6` is not "1" (not admin), adds the `disabledAnchor` class to `.is-admin` elements to prevent admin actions.

*/

$(document).ready(function () {
  /**
   * Entry point: initialize Admin Main Form UI and wire events.
   * - Hide Submit, set page title, load assets, and resolve Bootstrap/jQuery UI button conflict.
   * - Normalize username in `#Field3` from `#Field2` by removing the domain prefix.
   * - Register handlers for lookup lifecycle events.
   */
  $('.Submit').hide();
  $(document).prop('title', 'Admin Main Form');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
  var bootstrapButton = $.fn.button.noConflict(); // return $.fn.button to previously assigned value
  $.fn.bootstrapBtn = bootstrapButton;
  var lfUserName = $('.lf-user-name input').val();
  $('.network-user-name input').val(lfUserName.toUpperCase().substr(lfUserName.lastIndexOf('\\') + 1)).change();

  /**
   * Fired when lookup data is loaded.
   * If the user is not an admin, disable admin-only anchors.
   */
  $(document).on('lookupcomplete', function (e) {
    if (!isAdmin()) {
      $(".is-admin").removeClass('disabledAnchor').addClass('disabledAnchor');
    }
  });


});


/**
 * Returns whether the current user is an administrator.
 * Reads the value from `.user-isadmin input` (expects 1 for true).
 * @returns {boolean} True if admin; otherwise false.
 */
function isAdmin() {
  var isAdmin = Number($('.user-isadmin input').val());
  if (isAdmin == 1) {
    return true;
  }
  else {
    return false;
  }
}