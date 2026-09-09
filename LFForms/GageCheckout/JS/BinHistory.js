/**
 # BinHistory.js Documentation

 Author:  Jeffrey Whitney
          jtwhitney@machine.com
          651-319-7982
 Date:    9/9/2026

 ## Overview

 This script controls the Bin History parent form behavior.
 It initializes UI dependencies, converts the form sections into tabs,
 and dynamically loads ticket and calibration history sub-forms based on the selected bin.

 Parent/Child Form Relationship:
 This page acts as the parent container for two history sub-forms:
 - Bin Ticket History
 - Bin Calibration History
 
 The selected bin ID is passed to each child page through query-string parameters.
 This allows the child forms to independently load and filter their own data
 while staying synchronized to whichever bin is selected on this form.

 Lookup-Driven Rendering:
 The history iFrames are rebuilt on `lookupcomplete` rather than page load because
 the selected bin can change via Laserfiche lookup activity.
 Recreating the iFrames ensures both history tabs always point to the current bin ID
 and prevents stale content from a previously selected record.

 Active-State Display Sync:
 The `.bin-is-active-val` field appears to store the source value (0/1),
 while `.bin-is-active-display` stores a user-friendly text representation (Yes/No).
 The change handler keeps the display field aligned whenever the source value changes.

 ## Dependencies

 - [jQuery](https://jquery.com/)
 - [jQuery UI](https://jqueryui.com/)

 ## Usage

 This script expects these fields/elements to exist:
 - `.bid input` (bin id)
 - `.bin-is-active-val input` (raw active value)
 - `.bin-is-active-display input` (display active value)
 - `.bin-number input[type="text"]` (bin selector/entry field)
 - `#ticket-history-iframe` (host container)
 - `#calibration-history-iframe` (host container)
 - `#q5` and `#q6` (sections wrapped as tabs)

 ## Events

 - `change` on `.bin-is-active-val input`: Updates display text to Yes/No.
 - `change` on `.bid input`: Expands section `#q8` when a bin is selected.
 - `dblclick` on `.bin-number input[type="text"]`: Clears selected bin.
 - `lookupcomplete`: Rebuilds both history iFrames for the current bin.
 */
$(function () {
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $('.Submit').hide();
  $(document).prop('title', 'Bin History');
  tabifyFormSections();

  $('.bin-is-active-val input').on('change', function () {
    if ($(this).val() === '0') {
      $('.bin-is-active-display input').val('No');
    }
    else {
      $('.bin-is-active-display input').val('Yes');
    }
  });

  $('.bid input').on('change', function () {
    if (($(this).val() !== null) && ($(this).val().length > 0)) {
      $('#q8 .collapsible').trigger('click');
    }
  });
  $('.bin-number input[type="text"]').on("dblclick", function () { $('.bin-number input[type="text"]').val(null).trigger("change"); });


  $(document).on('lookupcomplete', function () {
    fillIFrames();
  });

});


function fillIFrames() {
  const binID = $('.bid input').val();
  $('#frm-ticket-history').remove();
  $('#frm-calibration-history').remove();

  if ((binID !== '') && (binID !== null)) {
    $('#ticket-history-iframe').prepend(`<iframe id="frm-ticket-history" src="http://rmslf/Forms/RMS-GAGE-BinTicketHistory/?bid=${binID}"></iframe>`);
    $('#calibration-history-iframe').prepend(`<iframe id="frm-calibration-history" src="http://rmslf/Forms/RMS-GAGE-BinCalibrationHistory/?bid=${binID}"></iframe>`);
  }
}


function tabifyFormSections() {
  $('#q5').next().addBack().wrapAll('<div id="history-tabs"></div>');
  $('#history-tabs').prepend('<ul id="ticket-history-tab"><li><a href="#q5"><span>Bin Ticket History</span></a></li><li><a href="#q6"><span>Bin Calibration History</span></a></li></ul>');
  $('#history-tabs').tabs();

}
