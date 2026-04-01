$(document).ready(function () {
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


  $(document).on('lookupcomplete', function (e) {
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
  $('#q5').next().andSelf().wrapAll('<div id="history-tabs"></div>');
  $('#history-tabs').prepend('<ul id="ticket-history-tab"><li><a href="#q5"><span>Bin Ticket History</span></a></li><li><a href="#q6"><span>Bin Calibration History</span></a></li></ul>');
  $('#history-tabs').tabs();

}
