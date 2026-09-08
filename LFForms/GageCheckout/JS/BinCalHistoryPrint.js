/**
 # BinCalHistoryPrint.js Documentation

 Author:  Jeffrey Whitney
          jtwhitney@machine.com
          651-319-7982
 Date:    9/8/2026

 ## Overview

 This script is the print-focused companion to the Bin Calibration History page.
 It is designed to run inside an iframe launched by the main BinCalHistory page and prepares the
 report for printing by normalizing date display, converting note inputs to rendered divs,
 writing filter text, and then notifying the parent window to trigger the browser print dialog.

 KEY CONCEPTS:
 Print-Only Workflow:
   The main BinCalHistory page opens a report URL in an iframe and sets the `should_print_report` flag.
   This print script listens for the initial LaserFiche lookup to finish, then it prepares the table for
   display. Once this is completed it sends a `postMessage("printme")` back to the parent window so the parent can call the iframe's
   print function after the document has finished rendering.

 Date Normalization:
   LaserFiche often includes a time component on date values, such as `MM/DD/YYYY HH:mm:ss`.
   This script strips the time portion from each field in `.cal-date-col input` before rendering the page.
   It also ensures the end date field has a value by defaulting it to today when the lookup completes and it is empty.

 Note Rendering:
   `generateNoteDivs()` converts each `.cal-notes-col input[type="text"]` element into a plain `div.note-div` so
   the printed version shows the note text cleanly without editable input elements.

 Filter Text:
   `generateFilterText()` builds a simple summary of the active date-range values and writes the result to
   `#filter-text`. This lets the report show the effective filter context without needing the parent page UI.

 ## Dependencies

 - [jQuery](https://jquery.com/)
 - [jQuery UI](https://jqueryui.com/)
 - [moment.js](https://momentjs.com/)

 ## Usage

 This script expects these fields/elements to exist:
 - `.std input` (start date)
 - `.ed input` (end date)
 - `.cal-date-col input`
 - `.cal-notes-col input[type="text"]`
 - `.cal-table`
 - `#filter-text`
 - Parent window capable of receiving `message` events (for print trigger)

 ## Events

 - `onloadlookupfinished`: Normalizes the date values, writes filter text, then posts `printme` to the parent.
 - `lookupcomplete`: Default-fills the end date if empty and regenerates note divs so the report stays current.
 */
$(function () {

  $('.Submit').hide();
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $(document).prop('title', 'Bin Calibration History');

  $(document).on("onloadlookupfinished", function () {
    $('.cal-date-col input').each((i, dateField) => $(dateField).val($(dateField).val().split(" ")[0]));
    generateFilterText();
    parent.postMessage("printme", "*");
  });


  $(document).on('lookupcomplete', function () {

    if (($('.ed input').val() === '') || ($('.ed input').val() === null)) {
      const curdate = moment().format("MM/DD/YYYY");
      $('.ed input').val(curdate).trigger("change");
    }

    generateNoteDivs();
  });

});


function generateNoteDivs() {
  $('.note-div').remove();
  $('.cal-notes-col input[type="text"]').each(function () {
    const note_text = $(this).val();
    $(this).parent().html('<div class="note-div">' + note_text + '</div>');
  });

}


function generateFilterText() {
  const startDateFilterValue = $('.std input').val();
  const endDateFilterVal = $('.ed input').val();

  let filterText = 'Date Range Shown: ';
  if (startDateFilterValue !== '01/01/1980') {
    filterText += 'Start Date: <b>' + startDateFilterValue + '</b>    ';
  }
  if (endDateFilterVal !== '') {
    filterText += 'End Date: <b>' + endDateFilterVal + '</b>';
  }
  $('#filter-text').html(filterText);

}


function loadiFrame(src) {
  $("#popUpDiv").html("<iframe id='print-iframe' name='print-iframe' src='" + src + "' />");
}
