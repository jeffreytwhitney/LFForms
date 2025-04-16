$(document).ready(function () {
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $('.Submit').hide();
  $(document).prop('title', 'MPM Ticket Mainform');
  var lfUserName = $('.lf-user-name input').val();
  if (lfUserName != 'Anonymous User') {
    $('.network-user-name input').val(lfUserName.toUpperCase().substr(lfUserName.lastIndexOf('\\') + 1)).change();
  }
  if (lfUserName == 'Anonymous User') {
    $('.user-name-display input').val('User :Anonymous');
    let login_link = $("<a>", { text: 'Log In', class: 'login-link', href: 'http://rmslf/Forms/account/login?returnUrl=%2fForms%2fMPM-TicketMainform' });
    $('.user-name-display').append(login_link);
  }

  $(document).on('change', '.user-name-hidden input', function () {
    let userName = $('.user-name-hidden input').val()
    if (userName != '') {
      let userText = `User: ${userName}`
      $('.user-name-display input').val(userText);
    }
  });

  tabifyFormSections();

  $(document).on("onloadlookupfinished", function (e) {
    if ($('.user-name-hidden input').val() == '') {
      $('.network-user-name input').trigger("change");
    }
    
  });

  $(document).on('lookupcomplete', function (e) {
    if ($('.user-name-display input').val() == '') {
      var lfUserName = $('.lf-user-name input').val();
      if (lfUserName == 'Anonymous User') {
        $('.user-name-display input').val('User :Anonymous');
        let login_link = $("<a>", { text: 'Log In', class: 'login-link', href: 'http://rmslf/Forms/account/login?returnUrl=%2fForms%2fMPM-TicketMainform' });
        $('.user-name-display').append(login_link);
      }
      else {
        let userName = $('.user-name-hidden input').val()
        if (userName != '') {
          let userText = `User: ${userName}`
          $('.user-name-display input').val(userText);
        }
        
      }
    }
  });
  

});


function tabifyFormSections() {
  $('#q0').children().wrapAll('<div id="ticket-tabs"></div>');
  $('#ticket-tabs').prepend('<ul id="ticket-tab"><li><a href="#q1"><span>Service Tickets</span></a></li><li><a href="#q2"><span>Programming Tasks</span></a></li><li><a href="#q3"><span>Programming Tickets</span></a></li></ul>');
  $('#ticket-tabs').tabs();

}