/**
 ProbeAndTipAngles.js
 
 Author:  Jeffrey Whitney
          jtwhitney@machine.com
          651-319-7982
 Date:    9/29/2025

 Purpose
 This page allows users to view the CMM Programs which use various probes and tip angles. 
 There are two lists, one of probes and one tip angles but the tip angle one doesn't have anything in it
 until you select one or more probes. (Then it will show you all the tip angles that are used by that probe.)
 Then, once you start selecting the tip angles you want to see, LFF has enough info to build the table of CMM Programs. 
 - Dynamically builds and maintains two checklists ("Probes" and "Tip Angles") based on lookup results.
 - Writes the selected values as comma-separated strings into designated form inputs.
 
 Key Behaviors
 - On lookup completion:
   - When triggerId === "Field2": rebuild the Probe list.
   - When triggerId === "Field3": rebuild the Tip Angles list.
 - On initial lookup load completion: ensure the checklist container/table exists.
 - On checkbox changes: update the hidden/target inputs with selected values.
 
 Inputs (expected in DOM)
 - Probe source values: inputs with ids starting with "Field9" (e.g., #Field9, #Field91, ...).
 - Tip Angle source values: inputs with ids starting with "Field14".
 - Target containers:
   - #probe-tip-table-div: parent container; a table is injected if missing.
   - .probe-table-cell: container where Probe checkboxes are appended.
   - .tip-table-cell: container where Tip Angle checkboxes are appended.
 - Target outputs:
   - .selected-probes input: receives comma-separated Probe selections.
   - .selected-tips input: receives comma-separated Tip Angle selections.
 
 Side Effects
 - Hides elements with class ".Submit".
 - Sets the document title to "Probe and Tip Angles".
 - Lazy-loads external scripts and styles via CDNs.
 - Resolves Bootstrap/jQuery UI button conflict via $.fn.button.noConflict().
 
 Dependencies
 - jQuery (required)
 - Optionally loaded at runtime:
   - jquery-cookie (CDN)
   - jquery-confirm (CDN)
   - CSS: jQuery UI Smoothness, simplePagination, jquery-confirm
 
 Events (custom/platform)
 - "lookupcomplete" (expects e.triggerId to identify which lookup finished)
 - "onloadlookupfinished" (signals initial lookup data available)
 
 Notes
 - The variable lfUserName is captured but not used; retained for potential auditing/future needs.
 - Variables probe_length and tipangle_length are currently unused (kept if needed for future logic/diagnostics).
 */

$(document).ready(function () {
  // Capture current LF user name (not used elsewhere in this script; available for diagnostics/auditing).
  const lfUserName = $('.lf-user-name input').val();

  // Hide Submit controls on this form/page.
  $('.Submit').hide();

  // Set page title for clarity.
  $(document).prop('title', 'Probe and Tip Angles');

  // Lazily load optional dependencies (non-blocking).
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');

  // Add styles needed by other widgets used across the app/site (present but not directly referenced in this file).
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simplePagination.js/1.6/simplePagination.min.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');

  // Resolve Bootstrap/jQuery UI button plugin naming conflict, if Bootstrap is present.
  const bootstrapButton = $.fn.button.noConflict(); // return $.fn.button to previously assigned value
  $.fn.bootstrapBtn = bootstrapButton;

  /**
   * When a lookup finishes, rebuild the relevant checklist.
   * Expects: e.triggerId === "Field2" for Probes, "Field3" for Tip Angles.
   * @param {JQuery.Event & {triggerId?: string}} e
   */
  $(document).on('lookupcomplete', function (e) {
    if (e.triggerId === 'Field2') {
      refreshProbes();
    }
    if (e.triggerId === 'Field3') {
      refreshTipAngles();
    }
  });

  /**
   * Ensure the checklist table exists after initial lookup load.
   * The table structure:
   * <table class="probe-tip-table">
   *   <tr>
   *     <td class="probe-table-cell"><fieldset class="probe-checkboxes"><legend>Probes</legend></fieldset></td>
   *     <td class="tip-table-cell"><fieldset class="tip-checkboxes"><legend>Tip Angles</legend></fieldset></td>
   *   </tr>
   * </table>
   */
  $(document).on("onloadlookupfinished", function (e) {
    if ($('#probe-tip-table-div table').length === 0) {
      $('#probe-tip-table-div').append('<table class="probe-tip-table"><tr><td class="probe-table-cell"><fieldset class="probe-checkboxes"><legend>Probes</legend></td><td class="tip-table-cell"><fieldset class="tip-checkboxes"><legend>Tip Angles</legend></td></tr></table>');
    }
  });

  /**
   * Update selected Probes immediately on checkbox changes.
   */
  $(document).on('change', '.probe-chkbox', function (e) {
    generateSelectedProbeList();
  });

  /**
   * Update selected Tip Angles immediately on checkbox changes.
   */
  $(document).on('change', '.tip-chkbox', function (e) {
    generateSelectedTipAngles();
  });

});


/**
 * Build the Probe checklist from inputs whose ids start with "Field9".
 * - Clears previous selections and UI.
 * - Appends a checkbox + label for each non-empty value found.
 * - Writes no values to outputs here; selection writing occurs on change via generateSelectedProbeList().
 */
function refreshProbes() {
  // Kept for potential diagnostics/future use.
  const probe_length = $('.probe-table table tbody tr').length;

  let probe_divs_html = '';

  // Clear outputs and prior UI before rebuilding.
  $('.selected-probes input').val('').trigger("change");
  $('.selected-tips input').val('').trigger("change");
  $('.tip-div').remove();
  $('.probe-div').remove();

  // Build probe checkbox items from lookup fields.
  $('[id^="Field9"]').each(function (index, element) {
    const probeName = $(element).val();
    let probe_div_html = '';
    if (probeName) {
      probe_div_html = `<div class="probe-div"><input id="probe-chkbox${index}" type="checkbox" value="${probeName}" class="probe-chkbox"><label class="probe-label" for="probe-chkbox${index}">${probeName}</label></div>`;
      probe_divs_html = probe_divs_html + probe_div_html;
    }
  });

  // Insert into probe container.
  $('.probe-table-cell').append(probe_divs_html);
}


/**
 * Build the Tip Angles checklist from inputs whose ids start with "Field14".
 * - Clears previous Tip selections and UI (does not alter Probes).
 * - Appends a checkbox + label for each non-empty value found.
 */
function refreshTipAngles() {
  // Kept for potential diagnostics/future use.
  const tipangle_length = $('.tipangle-table table tbody tr').length;

  let tipangle_divs_html = '';

  // Clear current Tip selections/UI before rebuilding.
  $('.selected-tips input').val('').trigger("change");
  $('.tip-div').remove();

  // Build tip angle checkbox items from lookup fields.
  $('[id^="Field14"]').each(function (index, element) {
    const tipName = $(element).val();
    let tip_div_html = '';
    if (tipName) {
      tip_div_html = `<div class="tip-div"><input id="tip-chkbox${index}" type="checkbox" value="${tipName}" class="tip-chkbox"><label class="tip-label" for="tip-chkbox${index}">${tipName}</label></div>`;
      tipangle_divs_html = tipangle_divs_html + tip_div_html;
    }
  });

  // Insert into tip container.
  $('.tip-table-cell').append(tipangle_divs_html);
}


/**
 * Gather all checked Probe checkboxes and write a comma-separated list
 * into the ".selected-probes input" element, then trigger change().
 */
function generateSelectedProbeList() {
  let selectedProbeList = '';

  $('.probe-chkbox').each(function (index, element) {
    // Using implicit global 'probeCheckBox' from original code; kept to avoid changing behavior.
    probeCheckBox = $(element);

    if ($(probeCheckBox).is(':checked')) {
      if (selectedProbeList.length === 0) {
        selectedProbeList = $(probeCheckBox).val().trim();
      }
      else {
        selectedProbeList += ',' + $(probeCheckBox).val().trim();
      }
    }
  });

  $('.selected-probes input').val(selectedProbeList).trigger("change");
}


/**
 * Gather all checked Tip Angle checkboxes and write a comma-separated list
 * into the ".selected-tips input" element, then trigger change().
 */
function generateSelectedTipAngles() {
  let selectedTipList = '';

  $('.tip-chkbox').each(function (index, element) {
    // Using implicit global 'tipCheckBox' from original code; kept to avoid changing behavior.
    tipCheckBox = $(element);

    if ($(tipCheckBox).is(':checked')) {
      if (selectedTipList.length === 0) {
        selectedTipList = $(tipCheckBox).val().trim();
      }
      else {
        selectedTipList += ',' + $(tipCheckBox).val().trim();
      }
    }
  });

  $('.selected-tips input').val(selectedTipList).trigger("change");
}