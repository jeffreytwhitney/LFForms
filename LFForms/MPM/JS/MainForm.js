/*# MainForm.js — Documentation

Overview
This script manages if a bunch of links are enabled or disabled based on the user's admin status.
- Client-side logic for the Admin Main Form in LFForms/MPM.
- Initializes UI, normalizes the network username, and enforces admin-only UI behavior.

Dependencies
- jQuery
- jQuery UI (CSS theme)
- jquery-confirm (CSS/JS)
- Uses Bootstrap’s jQuery plugin; resolves conflict via `$.fn.button.noConflict()`.

 
User Permissions:
 There is a user permission model in place to restrict who can add/edit tasks based on their user type and whether they are marked in the database
 as an admin.
 
 This is how it works: when the user first loads the form, LFF fills in the .lf-user-name field with CRETEX\username, but we only want the username portion so we copy just the 
 username portion (trimming off the "CRETEX/" part) into the .network-user-name field, which is what gets posted back to the server.
 This will be matched against the user database to determine the user's ID, user type, and admin status.

 For those users who are not admins, we disable the ability to add/edit tasks by adding a disabledAnchor class to any element with the is-admin class.

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

  // Copy username sans domain from #Field2 into #Field3, then trigger change.
  $('#Field3').val($('#Field2').val().substr($('#Field2').val().lastIndexOf('\\') + 1)).change();

  /**
   * Fired when lookup data is loaded.
   * If the user is not an admin (`#Field6` != '1'), disable admin-only anchors.
   */
  $(document).on('lookupcomplete', function (e) {
    if ($('#Field6').val() != '1') {
      $(".is-admin").removeClass('disabledAnchor').addClass('disabledAnchor');
    }
  });


});