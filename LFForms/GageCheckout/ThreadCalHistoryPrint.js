

$(document).ready(function () {

  $('.Submit').hide();
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $(document).prop('title', 'Thread Calibration History');

  $(document).on("onloadlookupfinished", function () {
    
    $('.cal-date-col input').each((i, dateField) => $(dateField).val($(dateField).val().split(" ")[0]));
    generateFilterText();
    parent.postMessage("printme", "*");
  });


  $(document).on('lookupcomplete', function (e) {
    if (($('.ed input').val() == '') || ($('.ed input').val() == null)) {
      var curdate = moment().format("MM/DD/YYYY");
      $('.ed input').val(curdate).change();
    }

    generateNoteDivs();
  });

});


function generateNoteDivs() {
  $('.note-div').remove();
  $('.cal-notes-col input[type="text"]').each(function () {
    let note_text = $(this).val();
    $(this).parent().html('<div class="note-div">' + note_text + '</div>');
  });

}


function generateFilterText() {
  var startDateFilterValue = $('.std input').val();
  var endDateFilterVal = $('.ed input').val();

  var filterText = 'Date Range Shown: ';
  if (startDateFilterValue != '01/01/1980') {
    filterText += 'Start Date: <b>' + startDateFilterValue + '</b>    ';
  }
  if (endDateFilterVal != '') {
    filterText += 'End Date: <b>' + endDateFilterVal + '</b>';
  }
  $('#filter-text').html(filterText);

}




