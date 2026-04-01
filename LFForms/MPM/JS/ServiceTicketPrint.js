/**
 ServiceTicketPrint.js

  Author:   Jeffrey Whitney
            jtwhitney@machine.com
            651-391-7982
  Date:     9/29/2025

 Purpose
 - Prepares the Service Ticket form for printing.
 - Sets the browser title, hides submit controls, injects a jQuery UI theme for styling,
   and after data load, updates the page header, converts textareas to static blocks,
   then signals the parent window to print.

 Dependencies
 - jQuery
 - An external process must trigger the "onloadlookupfinished" event on document when form data has finished loading.

 DOM Contracts (expected elements)
 - ".ticket-number input": holds the service ticket number.
 - "#form-title-wrap h1": the H1 where the title "Service Ticket {number}" is displayed.
 - ".Submit": submit controls that should be hidden for print.

 Event Flow
 1) $(document).ready:
    - Set page title.
    - Hide submit controls.
    - Inject jQuery UI CSS for consistent print styling.
    - Bind handler for "onloadlookupfinished".
 2) "onloadlookupfinished":
    - Read ticket number and update the header H1.
    - Convert all <textarea> elements into static <div> blocks for better print layout.
    - postMessage("printme", "*") to parent to initiate printing.

 Side Effects
 - Modifies the DOM structure by:
   - Replacing each textarea's parent inner HTML with a single div containing the textarea's value.
   - Removing any prior ".textarea-div" elements before regeneration.
 - Sends a cross-window message to the parent frame/window.

 Security and Safety Notes
 - postMessage uses targetOrigin "*". Consider specifying an explicit origin for improved security if possible.
 - Textarea values are injected via .html() without escaping; if values can include user input containing HTML,
   this can render as markup. Use text escaping if HTML should not be interpreted.
 */

$(document).ready(function () {
  // Set the browser tab title to clarify we're in an editable print context.
  $(document).prop('title', 'Edit Service Ticket');

  // Hide submit controls so they do not appear in print.
  $('.Submit').hide();

  // Inject a stable jQuery UI theme for predictable print styling.
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  
  // Once external data lookups have finished, finalize the print view and trigger print in the parent.
  $(document).on("onloadlookupfinished", function () {
    // Update the visible title with the ticket number from the form.
    const ticketNumber = $('.ticket-number input').val();
    $('#form-title-wrap h1').text(`Service Ticket ${ticketNumber}`);

    // Convert all textareas into static divs to improve print layout.
    generateTextAreaDivs();

    // Notify the parent window/frame to initiate printing.
    // Note: targetOrigin is "*" for broad compatibility; prefer a specific origin when feasible.
    parent.postMessage("printme", "*");
  });
});


/**
 * Converts all <textarea> elements into static <div class="textarea-div"> blocks containing their current value.
 *
 * Rationale
 * - Textareas can render poorly in print. Replacing them with divs preserves content and layout.
 *
 * Behavior
 * - Removes any existing ".textarea-div" elements to prevent duplication.
 * - For each textarea:
 *   - Reads its current value.
 *   - Replaces the parent element's entire inner HTML with a single div holding that value.
 *
 * Caveats
 * - Replacing the parent element�s HTML removes the original textarea and any siblings inside the same parent.
 * - The value is injected as HTML (via .html()). If the value contains HTML, it will be interpreted.
 *   Escape content if raw text rendering is desired.
 */
function generateTextAreaDivs() {
  $('.textarea-div').remove();
  $('textarea').each(function () {
    const textarea_text = $(this).val();
    $(this).parent().html('<div class="textarea-div">' + textarea_text + '</div>');
  });
}
