
$(document).ready(function () {
  var lfUserName = $('.lf-user-name input').val();
  $('.Submit').hide();
  $(document).prop('title', 'Probe and Tip Angles');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simplePagination.js/1.6/simplePagination.min.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
  var bootstrapButton = $.fn.button.noConflict(); // return $.fn.button to previously assigned value
  $.fn.bootstrapBtn = bootstrapButton;



  $(document).on('lookupcomplete', function (e) {
    if (e.triggerId == 'Field2') {
      refreshProbes();
    }
    if (e.triggerId == 'Field3') {
      refreshTipAngles();
    }
  });

  $(document).on("onloadlookupfinished", function (e) {
    if ($('#probe-tip-table-div table').length == 0) {
      $('#probe-tip-table-div').append('<table class="probe-tip-table"><tr><td class="probe-table-cell"><fieldset class="probe-checkboxes"><legend>Probes</legend></td><td class="tip-table-cell"><fieldset class="tip-checkboxes"><legend>Tip Angles</legend></td></tr></table>');
    }
  });

  $(document).on('change', '.probe-chkbox', function (e) {
    generateSelectedProbeList();
  });

  $(document).on('change', '.tip-chkbox', function (e) {
    generateSelectedTipAngles();
  });

});


function refreshProbes() {
  var probe_length = $('.probe-table table tbody tr').length;
  var probe_divs_html = '';

  $('.selected-probes input').val('').change();
  $('.selected-tips input').val('').change();
  $('.tip-div').remove();
  $('.probe-div').remove();

  $('[id^="Field9"]').each(function (index, element) {
    let probeName = $(element).val();
    let probe_div_html = '';
    if (probeName) {
      probe_div_html = `<div class="probe-div"><input id="probe-chkbox${index}" type="checkbox" value="${probeName}" class="probe-chkbox"><label class="probe-label" for="probe-chkbox${index}">${probeName}</label></div>`;
      probe_divs_html = probe_divs_html + probe_div_html;
    }
  });
  $('.probe-table-cell').append(probe_divs_html);


}

function refreshTipAngles() {
  var tipangle_length = $('.tipangle-table table tbody tr').length;
  var tipangle_divs_html = '';
  $('.selected-tips input').val('').change();
  $('.tip-div').remove();
  $('[id^="Field14"]').each(function (index, element) {
    let tipName = $(element).val();
    let tip_div_html = '';
    if (tipName) {
      tip_div_html = `<div class="tip-div"><input id="tip-chkbox${index}" type="checkbox" value="${tipName}" class="tip-chkbox"><label class="tip-label" for="tip-chkbox${index}">${tipName}</label></div>`;
      tipangle_divs_html = tipangle_divs_html + tip_div_html;
    }
  });
  $('.tip-table-cell').append(tipangle_divs_html);
}

function generateSelectedProbeList() {
  var selectedProbeList = '';

  $('.probe-chkbox').each(function (index, element) {
    probeCheckBox = $(element);

    if ($(probeCheckBox).is(':checked')) {
      if (selectedProbeList.length == 0) {
        selectedProbeList = $(probeCheckBox).val().trim();
      }
      else {
        selectedProbeList += ',' + $(probeCheckBox).val().trim()
      }
    }
  });

  $('.selected-probes input').val(selectedProbeList).change();
}

function generateSelectedTipAngles() {
  var selectedTipList = '';

  $('.tip-chkbox').each(function (index, element) {
    tipCheckBox = $(element);

    if ($(tipCheckBox).is(':checked')) {
      if (selectedTipList.length == 0) {
        selectedTipList = $(tipCheckBox).val().trim();
      }
      else {
        selectedTipList += ',' + $(tipCheckBox).val().trim()
      }
    }
  });

  $('.selected-tips input').val(selectedTipList).change();
}