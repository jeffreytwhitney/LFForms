/**
 * # AddNote.js Documentation
 * 
 * ## Overview
 * 
 * This script manages the client - side logic for the "Add Note" functionality in the LFForms MPM module.It handles UI initialization, input validation, form submission, time entry, user permissions,
 * and dialog control.
 * 
 * Dialog Looping Mechanism:
 * The form is called as a popup dialog from other pages, and it communicates with the parent window to close the dialog and refresh the parent page after this page is submitted.
 * This loop is essential to understand because it's a common pattern that you will see again and again any form which is being used as a popup. This form is one of those.
 * The way it works is when this page loads initially, the $('.closeme input') is not provided from the query string, and so is set to the default value of 0.
 * Submitting the form sets that value to 1. In LFF, when that the form is submitted it executes the workflow and then, 
 * the On Event Completion event redirects back to this same page, but this time with the closeme value set to 1 in the query string. 
 * This tells the page that it should close the dialog and refresh the parent page, so it sends off a message to the parent window to do that.
 * 
 * User Permissions:
 * There is a user permission model in place to restrict who can add/edit tasks based on their department and user type.
 * Metrology users (user-type-id == 1) have elevated permissions and can add/edit tasks across departments.
 * QE users can only add/edit tasks within their own department. They can also add notes to tasks in their department.
 * Non-authenticated users (user-id == 0) are not allowed to add/edit tasks. This includes Cell Leads and anybody else who does not have a LaserFiche Forms account.
 * This is how it works: when the user first loads the form, LFF fills in the .lf-user-name field with CRETEX\username, but we only want the username portion so we copy just the 
 * username portion (trimming off the "CRETEX/" part) into the .network-user-name field, which is what gets posted back to the server.
 * This will be matched against the user database to determine the user's ID, user type, and department.
 * 
 * 
 * ## Constants
 * 
 *  Integer constants representing different note / task types.
 *  These values correspond to the `nt` input field in the form. They are used by the workflow to determine what kind of note is being added and what actions to take.
 *  For example, if the note type is `type_Completed`, workflow will send and email to the QE's department and to the Assignee. If it's `type_PesterQE`, it will send an email to the QE only.
 *   type_AddNote:         Just add a note, no email is sent.
 *   type_PesterQE:        Send a pester email to the QE only.
 *   type_PesterAssginee:  Send a pester email to the Assignee only.
 *   type_Completed:       Send a completed email to both to everyone in the QE's department and the Assignee.
 *   type_Cancelled:       Send a cancelled email to both to everyone in the QE's department and the Assignee.
 *   type_Waiting:         Send a waiting email to both to everyone in the QE's department and the Assignee.
 * 
 * - `refresh_Types`: Array of types that trigger a the parent page to refresh(`Completed`, `Cancelled`, `Waiting`).
 * 
 * ## Main Logic
 * 
 * ### Document Ready Handler
 * 
 * Initializes UI elements and event handlers when the DOM is fully loaded.
 * 
 * #### 1. Task ID Validation
 * 
 * Disables the submit button if the task ID input is empty.
 * 
 * #### 2. Date Initialization
 * 
 * Sets the "date-to-add" input to the current date using[Moment.js](https://momentjs.com/).
 * 
 * #### 3. Submit Button Handler
 * 
 *   - Prevents default form submission.
 * - Sets a hidden "closeme" input to`1` so that when the form submits and comes back to the same page, it will know to call the parent page to close the dialog.
 * - Submits the form programmatically.
 * 
 * #### 4. Time Entry Handlers
 * 
 *   - ** Radio Button Change:** Updates the "time-to-add" input when a time radio button is selected(unless 'X' is chosen).
 * - ** Manual Time Entry:** Updates the "time-to-add" input when the user manually enters a time value.
 * 
 * #### 5. Dialog Control
 * 
 * If the "closeme" input is set to`1`:
 *     - If the note type(`nt`) is greater than 3, sends a`CloseDialogWithRefresh` message to the parent window.
 * - Otherwise, sends a`CloseDialog` message. This mechanism allows the parent page to refresh if necessary after the dialog is closed.
 * 
 * #### 6. User Name Formatting
 * 
 * Sets the "network-user-name" input to the uppercase username extracted from the "lf-user-name" input(removes domain prefix).
 * LFF adds the username as CRETEX\username, but we only want the username portion.
 * Once we've set the network username, LFF will automatically populate the user type ID and other fields based on that username.
 * This is important because we need the user type ID to determine if the user has permission to add certain types of notes.
 * 
 * #### 7. Permission Check(onloadlookupfinished Event)
 * 
 *   - If the note type(`nt`) is greater than 1 and the user type ID is not 1 (Metrology User):
 *  (So, if the user is trying to add a note type that requires higher permissions and they are not a Metrology User - user type ID 1 is Metrology User)
 *     - Disables the submit button and note textarea.
 *   - Displays an error message indicating insufficient permissions.
 * 
 * ## Dependencies
 * 
 *   - [jQuery](https://jquery.com/)
 *     -[Moment.js](https://momentjs.com/)
 * 
 * ## Usage
 * 
 * This script should be included on pages where users can add notes to tasks.It expects specific input fields and elements to be present in the DOM, such as:
 *       - `.task-id input`                              The ID of the task in the DB.
 *       - `.Submit`                                     The Submit button.
 *       - `.date-to-add input`                          The date the note is being added.
 *       - `.add-time fieldset input[type="radio"]`      The radio buttons for selecting time to add. This only shows if the task type is 'Completed'.
 *       - `.amount-of-time input`                       How much time to add if manually entered.
 *       - `.time-to-add input`                          This is the hidden field that actually gets submitted to the Workflow. It is set either by the radio buttons or the manual entry field.
 *       - `.closeme input`                              This hidden field is used to control whether the dialog should close and whether the parent page should refresh when this form is submitted.
 *       - `.nt input`                                   This is the note type. It controls what kind of note is being added and what actions to take. It is set in the query string when the form is opened.
 *       - `.network-user-name input`                    This is the username of the person adding the note, extracted from the lf-user-name field.
 *       - `.lf-user-name input`                         This is the full username including domain, e.g. CRETEX\jdoe. It is set by LFF when the user is logged in.
 *       - `.user-type-id input`                         This is the user type ID, which determines the user's permissions. It is automatically populated by LFF based on the network username.
 *       - `.required-note textarea`                     This is the textarea where the user enters the note content. There are certain types of notes that require this field to be filled in.
 *       - `#q3`                                         This is a container element for everything visible on the form. The error message about permissions is appended here.
 * 
 * ## Events
 * 
 * - `onloadlookupfinished`: Custom event used to trigger permission checks after lookup operations.
 * 
 * ## Security & Validation
 * 
 * - Ensures only authorized users can add certain types of notes.
 * - Prevents form submission if required fields are missing.
 * 
 * ## Dialog Communication
 * 
 * Uses `window.parent.postMessage` to communicate with the parent window for dialog control whether the parent pages refreshes itself when it closes this form.
 */
const type_AddNote = 1;
const type_PesterQE = 2;
const type_PesterAssginee = 3;
const type_Completed = 4;
const type_Cancelled = 5;
const type_Waiting = 6;
const refresh_Types = [4, 5, 6];

$(document).ready(function () {

  if (($('.task-id input').val() == null) || ($('.task-id input').val().length == 0)) {
    $('.Submit').addClass("ui-state-disabled");
  }

  $('.date-to-add input').val(moment().format("l"));


  $('.Submit').click(function (e) {
    e.preventDefault();
    $('.closeme input').val(1);
    $(this.form).submit();
  });

  $('.add-time fieldset').change(function () {
    var time_to_add = $('.add-time fieldset input[type="radio"]:checked').val();
    if (time_to_add != 'X') {
      $('.time-to-add input').val(time_to_add);
    }
  });

  $('.amount-of-time input').change(function () {
    $('.time-to-add input').val($('.amount-of-time input').val());
  });


  if ($('.closeme input').val() == 1) {
    if ($('.nt input').val() > 3) {
      window.parent.postMessage('CloseDialogWithRefresh', '*');
    }
    else {
      window.parent.postMessage('CloseDialog', '*');
    }

  }
  $('.network-user-name input').val($('.lf-user-name input').val().toUpperCase().substr($('.lf-user-name input').val().lastIndexOf('\\') + 1)).change();


  $(document).on("onloadlookupfinished", function (e) {
    if (($('.nt input').val() > 1) && ($('.user-type-id input').val() != 1)) {
      $('.Submit').addClass("ui-state-disabled");
      $('.required-note textarea').addClass("ui-state-disabled");
      $('#q3').append('<p class="error"><b><font size="4">You do not have permission to add a note of this kind.</font></b></p>');

    }

  });



});