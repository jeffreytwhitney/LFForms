$(document).ready(function () {
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $('.Submit').hide();
  $(document).prop('title', 'Thread Gage History');
  tabifyFormSections();

  $('.thread-gage-is-active-val input').on('change', function () {
    if ($(this).val() === '0') {
      $('.thread-gage-is-active-display input').val('No');
    }
    else {
      $('.thread-gage-is-active-display input').val('Yes');
    }
  });

  $('.gid input').on('change', function () {
    if (($(this).val() !== null) && ($(this).val().length > 0)) {
      $('#q12 .collapsible').trigger('click');
    }
  });
  $('.thread-gage-name input[type="text"]').on("dblclick", function () { $('.thread-gage-name input[type="text"]').val(null).trigger("change"); });


  $(document).on('lookupcomplete', function (e) {
    fillIFrames();
  });

});


function fillIFrames() {
  const ginID = $('.gid input').val();
  $('#frm-ticket-history').remove();
  $('#frm-calibration-history').remove();

  if ((ginID !== '') && (ginID !== null)) {
    $('#ticket-history-iframe').prepend(`<iframe id="frm-ticket-history" src="http://rmslf/Forms/RMS-GAGE-ThreadTicketHistory/?gid=${ginID}"></iframe>`);
    $('#calibration-history-iframe').prepend(`<iframe id="frm-calibration-history" src="http://rmslf/Forms/RMS-GAGE-ThreadCalibrationHistory/?gid=${ginID}"></iframe>`);
  }
}


function tabifyFormSections() {
  $('#q4').next().andSelf().wrapAll('<div id="history-tabs"></div>');
  $('#history-tabs').prepend('<ul id="ticket-history-tab"><li><a href="#q4"><span>Thread Gage Ticket History</span></a></li><li><a href="#q5"><span>Thread Gage Calibration History</span></a></li></ul>');
  $('#history-tabs').tabs();

}
