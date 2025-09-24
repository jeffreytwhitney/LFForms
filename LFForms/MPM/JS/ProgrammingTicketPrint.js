/**
 * ProgrammingTicketPrint.js
 *
 * Purpose
 * - Prepares a "Programming Ticket" form for printing in a Laserfiche Forms context.
 * - Hides submit controls, normalizes textarea content for print, updates the title with the ticket number,
 *   and signals the parent window to trigger printing.
 *
 * How it works
 * - On DOM ready:
 *   - Hides elements with class `.Submit`.
 *   - Injects jQuery UI Smoothness theme CSS from CDN (for consistent print styling).
 *   - Subscribes to custom Laserfiche Forms events.
 * - On `onloadlookupfinished`:
 *   - Reads the ticket number from `.ticket-number input`.
 *   - Updates `#form-title-wrap h1` to "Programming Ticket Number {X}".
 *   - Calls `generateTextAreaDivs()` to replace all `<textarea>` elements with `<div class="textarea-div">` containing their values (print-friendly).
 *   - Sends `postMessage("printme", "*")` to the parent window to trigger printing.
 * - On `lookupcomplete`:
 *   - Currently a no-op placeholder (reserved for future logic).
 *
 * Dependencies and environment
 * - jQuery is required.
 * - Expects the host (parent window) to listen for the `"printme"` message and invoke `window.print()`.
 * - DOM structure assumptions:
 *   - `.ticket-number input` holds the ticket number.
 *   - `#form-title-wrap h1` is the page title element to update.
 *   - `.Submit` matches submit controls that should be hidden for print.
 *   - One or more `<textarea>` elements exist and should be rendered as static content for printing.
 *
 * Side effects and considerations
 * - Textareas are permanently replaced with non-editable `<div>` elements; this is intended for a print-only view.
 * - The textarea value is injected via `innerHTML`; if values can contain user-supplied HTML, sanitize or escape
 *   to prevent XSS. Consider using `text()` or building the node via `document.createElement` with `textContent`.
 * - Line breaks in textarea values may not render as expected in a `<div>` unless styled. Consider CSS:
 *     .textarea-div { white-space: pre-wrap; }
 * - The CSS for jQuery UI is included via CDN; ensure network access and pin versions as needed.
 * - `postMessage` uses `"*"` as the target origin; for stricter security, specify the expected origin.
 *
 * Extensibility
 * - Add print-specific styles for `.textarea-div`.
 * - Implement logic in the `lookupcomplete` handler if needed.
 * - If this runs outside of a parent container that listens for `"printme"`, you can fall back to `window.print()`.
 */

$(document).ready(function () {

  $('.Submit').hide();
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');

  $(document).on("onloadlookupfinished", function () {
    var ticketNumber = $('.ticket-number input').val();
    $('#form-title-wrap h1').text(`Programming Ticket Number ${ticketNumber}`)
    generateTextAreaDivs();
    parent.postMessage("printme", "*");
  });

  $(document).on('lookupcomplete', function (e) {

  });
});

/**
 * Replace all <textarea> elements with non-editable <div class="textarea-div"> blocks containing their values.
 */
function generateTextAreaDivs() {
  $('.textarea-div').remove();
  $('textarea').each(function () {
    let textarea_text = $(this).val();
    $(this).parent().html('<div class="textarea-div">' + textarea_text + '</div>');
  });

}
