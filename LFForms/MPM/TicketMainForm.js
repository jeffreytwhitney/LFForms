$(document).ready(function () {
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $('.Submit').hide();
  $(document).prop('title', 'MPM Ticket Mainform');
  tabifyFormSections();
});


function tabifyFormSections() {
  $('#q0').children().wrapAll('<div id="ticket-tabs"></div>');
  $('#ticket-tabs').prepend('<ul id="ticket-tab"><li><a href="#q1"><span>Service Tickets</span></a></li><li><a href="#q2"><span>Programming Tasks</span></a></li><li><a href="#q3"><span>Programming Tickets</span></a></li></ul>');
  $('#ticket-tabs').tabs();

}