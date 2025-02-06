$(document).ready(function () {
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $('.Submit').hide();
  $(document).prop('title', 'Modify Ticket');
  tabifyFormSections();
});


function tabifyFormSections() {
  $('#q0').children().wrapAll('<div id="history-tabs"></div>');
  $('#history-tabs').prepend('<ul id="ticket-history-tab"><li><a href="#q2"><span>GageCheckout</span></a></li><li><a href="#q3"><span>Modify Existing Tickets</span></a></li></ul>');
  $('#history-tabs').tabs();

}