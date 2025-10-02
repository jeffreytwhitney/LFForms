/*
 File: ProgramTaskHistory.js
 
  Author:   Jeffrey Whitney
            jtwhitney@machine.com
            651-391-7982
  Date:     9/29/2025


 Purpose: UI behavior for the "Programming Task History" page.

 Behavior:
 - On DOM ready:
    - Sets the document title to "Programming Task History".
    - Hides elements with the class "Submit".
 - After the custom event "onloadlookupfinished" fires:
    - Renders read-only checkboxes inside cells matched by ".man-date-col"
      based on adjacent text input values ("1" => checked; anything else => unchecked).

 Dependencies: jQuery
 */

$(document).ready(function () {
  // Set page title and hide submit controls when the DOM is ready.
  $(document).prop('title', 'Programming Task History');
  $('.Submit').hide();


  /**
   * Custom event: "onloadlookupfinished"
   * Description:
   * - Expected to be triggered once lookup/data loading for the page completes.
   * - When received, generate disabled checkboxes in the mandate column, reflecting
   *   the values present in text inputs (value "1" => checked).
   */
  $(document).on("onloadlookupfinished", function () {
    generateTableCheckBox(".man-date-col", "mandate-chk");
  });
});


/**
 * Appends a disabled checkbox next to each text input under the given selector.
 * The checkbox reflects the text input's value:
 * - If the value is exactly "1", the checkbox is rendered as checked.
 * - Otherwise, the checkbox is rendered as unchecked.
 *
 * To preserve idempotency, a checkbox is only appended if one with the given class
 * does not already exist within the same parent element. This allows the function
 * to be safely called multiple times (e.g., on repeated data loads/renders).
 *
 * @param {string} selector - CSS selector narrowing the search scope (e.g., a column/cell selector).
 * @param {string} checkboxClass - Class name to assign to the generated checkbox elements.
 * @returns {void}
 */
function generateTableCheckBox(selector, checkboxClass) {
  var selectionString = selector + " input[type=text]";
  var checkboxes = $(selectionString);

  checkboxes.each(function () {
    var btn_value = $(this).val();
    var isChecked = btn_value == '1';
    var btn_html = "<input class='" + checkboxClass + "' type='checkbox' disabled" + (isChecked ? " checked" : "") + "/>";
    var has_button = $(this).parent().find(`.${checkboxClass}`).length;

    if (has_button == 0) {
      $(this).parent().append(btn_html);
    }
  });
}

