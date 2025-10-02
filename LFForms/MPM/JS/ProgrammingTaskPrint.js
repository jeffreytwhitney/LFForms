/**
 ProgrammingTaskPrint.js

 Author:  Jeffrey Whitney
          jtwhitney@machine.com
          651-319-7982
 Date:    9/29/2025

 Purpose:
 - Render a print-friendly view of the MPM Programming Task form.

 Behavior:
 - Hides interactive controls not needed for printing.
 - Ensures a jQuery UI theme stylesheet is present for consistent styling.
 - After form data is loaded (via the custom 'onloadlookupfinished' event):
   - Updates the page title with the task name.
   - Converts all <textarea> elements into non-editable <div> blocks for printing.
   - Injects a Task History iframe when a valid task ID is present.
   - Notifies the parent window to initiate printing via postMessage('printme').

 Events:
 - Document ready
 - Custom 'onloadlookupfinished' (raised elsewhere when lookups/data have finished loading)

 Dependencies:
 - jQuery
 - Parent window listening for the "printme" postMessage to trigger printing
 */

$(document).ready(function () {
  // Hide submission controls to prevent accidental changes in print view.
  $('.Submit').hide();

  // Ensure jQuery UI theme CSS is available for consistent look-and-feel in print.
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');

  // When the form's lookup/data population completes, finalize the print-friendly rendering.
  $(document).on("onloadlookupfinished", function () {
    // Update the page title with the task name (e.g., "Programming Task MyTask").
    var taskName = $('.task-name input').val();
    $('#form-title-wrap h1').text(`Programming Task ${taskName}`);

    // Replace all textareas with static <div> blocks for a cleaner print layout.
    generateTextAreaDivs();

    // If a valid task ID exists, embed the Task History for context in the printout.
    var taskID = $('.tid input').val();
    if ((taskID != '') && (taskID != '0')) {
      $('#task-history').append(`<iframe id='task-history-iframe' name='task-history-iframe' src='http://rmslf/Forms/MPM-ProgamTaskHistory?tid=${taskID}' height='500' width='100%'/>`);
    }

    // Signal the parent window to trigger print (the parent should handle this message).
    parent.postMessage("printme", "*");
  });

});


/**
 * Convert all <textarea> elements into non-editable <div class="textarea-div"> blocks.
 *
 * Implementation details:
 * - Removes any existing '.textarea-div' to avoid duplication when re-run.
 * - For each <textarea>, captures its current value and replaces the textarea's parent
 *   content with a <div class="textarea-div"> containing that value.
 *
 * Notes:
 * - The textarea value is inserted unescaped into the DIV. Any HTML present in the value
 *   will be rendered as HTML. Ensure the content is trusted or sanitize if needed.
 * - This transformation is intended for generating a clean, print-friendly snapshot.
 */
function generateTextAreaDivs() {
  $('.textarea-div').remove();
  $('textarea').each(function () {
    let textarea_text = $(this).val();
    $(this).parent().html('<div class="textarea-div">' + textarea_text + '</div>');
  });

}
