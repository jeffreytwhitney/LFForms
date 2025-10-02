/**
 # AddNote.js Documentation
 
 Author:  Jeffrey Whitney
          jtwhitney@machine.com
          651-319-7982
 Date:    9/29/2025

 Permissions:
   - Users must be authenticated to add notes.
   - Metrology Users (user-type-id == 1) can add all types of notes.
   - QE Users can only add generic notes of type_AddNote (1), but only to tasks in their own department.

 ## Overview
 
 This script manages the client - side logic for the "Add Note" functionality in the LFForms MPM module.
 It handles UI initialization, input validation, form submission, time entry, user permissions, and dialog control.
 
 KEY CONCEPTS:
   Dialog Looping Mechanism:
     The form is called as a popup dialog from other pages, and it communicates with the parent window to close the dialog 
     and refresh the parent page after this page is submitted.
     This loop is essential to understand because it's a common pattern that you will see again and again any form which 
     is being used as a popup. This form is one of those.
     The way it works is when this page loads initially, the $('.closeme input') is not provided from the query 
     string, and so is set to the default value of 0.
     Submitting the form sets that value to 1. In LFF, when that the form is submitted it executes the workflow 
     and then, the On Event Completion event redirects back to this same page, but this time with the closeme value 
     set to 1 in the query string. 
     This tells the page that it should close the dialog and refresh the parent page, so it sends off a message 
     to the parent window to do that.
 
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

 ## Constants
 
  Integer constants representing different note / task types.
  These values correspond to the `nt` input field in the form. They are used by the workflow to determine what kind of note is 
  being added and what actions to take.
  For example, if it's `type_PesterQE`, it will send an email to the QE only.
   type_AddNote:         Just add a note, no email is sent.
   type_PesterQE:        Send a pester email to the QE only.
   type_PesterAssginee:  Send a pester email to the Assignee only.

 
 ## Main Logic
 
 ### Document Ready Handler
 
 Initializes UI elements and event handlers when the DOM is fully loaded.
 
 #### 1. Task ID Validation
 
 Disables the submit button if the task ID input is empty.
 
 #### 2. Date Initialization
 
 Sets the "date-to-add" input to the current date using[Moment.js](https://momentjs.com/).
 
 #### 3. Submit Button Handler
 
   - Prevents default form submission.
 - Sets a hidden "closeme" input to`1` so that when the form submits and comes back to the same page, it will know to call the parent 
   page to close the dialog.
 - Submits the form programmatically.
 
 #### 4. Time Entry Handlers
 
   - ** Radio Button Change:** Updates the "time-to-add" input when a time radio button is selected(unless 'X' is chosen).
 - ** Manual Time Entry:** Updates the "time-to-add" input when the user manually enters a time value.
 
 #### 5. Dialog Control
 
 If the "closeme" input is set to`1`:
     - If the note type(`nt`) is greater than 3, sends a`CloseDialogWithRefresh` message to the parent window.
 - Otherwise, sends a`CloseDialog` message. This mechanism allows the parent page to refresh if necessary after the dialog is closed.
 
 #### 6. User Name Formatting
 
 Sets the "network-user-name" input to the uppercase username extracted from the "lf-user-name" input(removes domain prefix).
 LFF adds the username as CRETEX\username, but we only want the username portion.
 Once we've set the network username, LFF will automatically populate the user type ID and other fields based on that username.
 This is important because we need the user type ID to determine if the user has permission to add certain types of notes.
 
 #### 7. Permission Check(onloadlookupfinished Event)
 
   If the note type(`nt`) is greater than 1 and the user type ID is not 1 (Metrology User):
    (If the user is trying to add a note type that requires higher permissions and they are not a 
    Metrology User - user type ID 1 is Metrology User)
      - Disables the submit button and note textarea.
      - Displays an error message indicating insufficient permissions.
 
 ## Dependencies
 
   - [jQuery](https://jquery.com/)
     -[Moment.js](https://momentjs.com/)
 
 ## Usage
 
 This script should be included on pages where users can add notes to tasks.It expects specific input fields and elements to be present in the DOM, such as:
       - `.task-id input`                               The ID of the task in the DB.
       - `.Submit`                                      The Submit button.
       - `.date-to-add input`                           The date the note is being added.
       - `.add-time fieldset input[type="radio"]`       The radio buttons for selecting time to add. This only shows if the task type is 'Completed'.
       - `.amount-of-time input`                        How much time to add if manually entered.
       - `.time-to-add input`                           This is the hidden field that actually gets submitted to the Workflow. It is set either by 
                                                        the radio buttons or the manual entry field.
       - `.closeme input`                               This hidden field is used to control whether the dialog should close and whether the parent 
                                                        page should refresh when this form is submitted.
       - `.nt input`                                    This is the note type. It controls what kind of note is being added and what actions to take. 
                                                        It is set in the query string when the form is opened.
       - `.network-user-name input`                     This is the username of the person adding the note, extracted from the lf-user-name field.
       - `.lf-user-name input`                          This is the full username including domain, e.g. CRETEX\jdoe. It is set by LFF when the 
                                                        user is logged in.
       - `.user-type-id input`                          This is the user type ID, which determines the user's permissions. 
                                                        It is automatically populated by LFF based on the network username.
       - `.required-note textarea`                      This is the textarea where the user enters the note content. 
                                                        There are certain types of notes that require this field to be filled in.
       - `#q3`                                          This is a container element for everything visible on the form. 
                                                        The error message about permissions is appended here.
 
 ## Events
 
 - `onloadlookupfinished`: Custom event used to trigger permission checks after lookup operations.
 
 ## Security & Validation
 
 - Ensures only authorized users can add certain types of notes.
 - Prevents form submission if required fields are missing.
 
 ## Dialog Communication
 
   Uses `window.parent.postMessage` to communicate with the parent window for dialog control whether the parent pages refreshes 
   itself when it closes this form.
 */
const type_AddNote = 1;             //General note, no email is sent.
const type_PesterQE = 2;            //Pester the QE only. It sends an email to the QE.
const type_PesterAssignee = 3;      //Pester the Assignee only. It sends an email to the Assignee.

$(document).ready(function () {

  //If there is no task ID, disable the submit button.
  if (($('.task-id input').val() == null) || ($('.task-id input').val().length == 0)) {
    $('.Submit').addClass("ui-state-disabled");
  }

  $('.date-to-add input').val(moment().format("l"));

  //When the user clicks the submit button, we want to set the 'closeme' field to 1 so that when the form submits and comes 
  //back to the same page, it will know to call the parent page to close the dialog.
  $('.Submit').click(function (e) {
    e.preventDefault();
    $('.closeme input').val(1);
    $(this.form).submit();
  });

  //When the user clicks one of the radio buttons to add time, we want to copy that value into the 'time-to-add' field, 
  //unless they choose 'X' which means they're hand-entering an amount of hours.
  $('.add-time fieldset').change(function () {
    var time_to_add = $('.add-time fieldset input[type="radio"]:checked').val();
    if (time_to_add != 'X') {
      $('.time-to-add input').val(time_to_add);
    }
  });

  //If the user manually enters a time, we want to use that instead of the radio buttons.
  //'time-to-add' is the field that actually gets submitted to the workflow.
  $('.amount-of-time input').change(function () {
    $('.time-to-add input').val($('.amount-of-time input').val());
  });

  //This code runs when the form is reloaded after being submitted. If the closeme value is set to 1, it tells the parent page to close the dialog.
  //See 'Dialog Looping Mechanism' in the documentation above for an explanation of this.
  if ($('.closeme input').val() == 1) {
    if ($('.nt input').val() > 3) {
      window.parent.postMessage('CloseDialogWithRefresh', '*');
    }
    else {
      window.parent.postMessage('CloseDialog', '*');
    }

  }
  //See 'User Permissions' in the documentation above for an explanation of this.
  $('.network-user-name input').val($('.lf-user-name input').val().toUpperCase().substr($('.lf-user-name input').val().lastIndexOf('\\') + 1)).change();

  /**
   * onloadlookupfinished Event Handler
   * Checks user permissions and disables form elements if the user lacks the necessary rights to add certain types of notes.
   */
  $(document).on("onloadlookupfinished", function (e) {
    // If the note type is greater than 1 (i.e., requires higher permissions) and the user is not a Metrology User (user-type-id != 1)
    // 'nt' - Note Type. This is set in the query string when the form is opened.
    if (($('.nt input').val() > 1) && ($('.user-type-id input').val() != 1)) {
      $('.Submit').addClass("ui-state-disabled");
      $('.required-note textarea').addClass("ui-state-disabled");
      $('#q3').append('<p class="error"><b><font size="4">You do not have permission to add a note of this kind.</font></b></p>');

    }

  });



});