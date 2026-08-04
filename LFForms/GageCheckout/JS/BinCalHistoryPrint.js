

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
      const curdate = moment(fdmax).format("MM/DD/YYYY");
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




function getTableRowCount() {
  return $('.cal-table table tbody tr').length;
}


function loadiFrame(src) {
  $("#popUpDiv").html("<iframe id='print-iframe' name='print-iframe' src='" + src + "' />");
}
