$(document).ready(function () {
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $('.Submit').hide();
  $(document).prop('title', 'Metrology Tickets');
  var lfUserName = $('.lf-user-name input').val();
  if (lfUserName != 'Anonymous User') {
    $('.network-user-name input').val(lfUserName.toUpperCase().substr(lfUserName.lastIndexOf('\\') + 1)).change();
  }

  $(document).on('change', '.user-name-hidden input', function () {
    //generateTitleInfo();
  });


  $(document).on('click', '.ui-tabs-anchor', function () {
    console.log('Tab clicked');
    generateTitleInfo();
  });


  $(document).on('dblclick', '.ui-tabs-anchor', function () {
    var tabID = $(this).attr('id');
    if (tabID == 'ui-id-1') {
      let iframeServiceTickets = $('#frm-servicetickets');
      if (iframeServiceTickets.length) {
        iframeServiceTickets.attr('src', iframeServiceTickets.attr('src'));
      }
    }
    else if (tabID == 'ui-id-2') {

      let iframeProgrammingTasks = $('#frm-programming-tasks');
      if (iframeProgrammingTasks.length) {
        iframeProgrammingTasks.attr('src', iframeProgrammingTasks.attr('src'));
      }
    }
    else if (tabID == 'ui-id-3') {

      let iframeProgrammingTickets = $('#frm-programming-tickets');
      if (iframeProgrammingTickets.length) {
        iframeProgrammingTickets.attr('src', iframeProgrammingTickets.attr('src'));
      }
    }
    generateTitleInfo();
  });

  tabifyFormSections();

  $(document).on("onloadlookupfinished", function (e) {
    if ($('.user-name-hidden input').val() == '') {
      $('.network-user-name input').trigger("change");
    }
    generateTitleInfo();

  });


  $(document).on('lookupcomplete', function (e) {
    //generateTitleInfo();
  });

});



function isAdmin() {
  var isAdmin = Number($('.user-isadmin input').val());
  if (isAdmin == 1) {
    return true;
  }
  else {
    return false;
  }
}


function generateTitleInfo() {

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
        if (isAdmin()) {
          let admin_link = $("<a>", { text: 'Admin', class: 'admin-link', href: 'http://rmslf/Forms/MPM-AdminMainform', target: '_blank' });
          $('.user-name-display').append(admin_link);
        }
      }
    }
   
    
  }
  generateLastRunMessage();
  if ($('.task-search-button').length == 0) {
    $('.task-schedule-info input').show();
    $('.task-schedule-info input').parent().append('<span class="ui-icon ui-icon-search task-search-button" onclick="searchScheduleByTaskName()"></span>')
  }

}


function generateLastRunMessage() {

  var lastRunDate = $('.last-schedule-update-run input').val();
  var lastRunBy = $('.last-schedule-run-by input').val();
  var isAutomated = Number($('.last-schedule-is-automated input').val());
  var lastRunID = $('.last-schedule-run-id input').val();
  var lastRunMessage = "";

  if ($('#last-run-div').length == 0) {

    if (lastRunDate == '' || lastRunBy == '') {
      $('.site-id input').trigger("change");
      return;
    }


    if (lastRunDate != '' && lastRunBy != '') {

      let schedule_page_link = `<a href='http://rmslf/Forms/MPM-ScheduleUpdate' target='_blank' class='schedule-page-link'>Schedules</a>`
      let schedule_link = `<a href='http://rmslf/Forms/MPM-ScheduleUpdate?rid=${lastRunID}' target='_blank' class='schedule-run-link'>${lastRunDate}</a>`
      if (isAutomated == 1) {
        lastRunMessage = `<div id="last-run-div">${schedule_page_link} Updated: ${schedule_link} (Automated)</div>`;
      }
      else {
        lastRunMessage = `<div id="last-run-div">${schedule_page_link} Updated: ${schedule_link} by ${lastRunBy}</div>`;
      }

      $('.schedule-update-message').append(lastRunMessage);
    }


  }
}


function searchScheduleByTaskName() {
  var searchTaskName = $('.task-schedule-info input').val();
  var searchURL

  if (searchTaskName == '') {
    searchURL = `http://rmslf/Forms/MPM-SearchScheduleByTaskName`;
  }
  else {
    searchURL = `http://rmslf/Forms/MPM-SearchScheduleByTaskName?tname=${encodeURIComponent(searchTaskName)}`;
  }

  window.open(searchURL, '_blank');

}

function tabifyFormSections() {
  $('#q0').children().wrapAll('<div id="ticket-tabs"></div>');
  $('#ticket-tabs').prepend('<ul id="ticket-tab"><li><a href="#q1"><span>Service Tickets</span></a></li><li><a href="#q2"><span>Programming Tasks</span></a></li><li><a href="#q3"><span>Programming Tickets</span></a></li></ul>');
  $('#ticket-tabs').tabs();

  $("#ticket-tabs").on("tabsactivate", function (event, ui) {
    var tab = ui.newTab.index();
    if (tab == 0) {
      let iframeServiceTickets = $('#frm-servicetickets');
      if (iframeServiceTickets.length) {
        iframeServiceTickets.attr('src', iframeServiceTickets.attr('src'));
      }
    }
    else if (tab == 1) {

      let iframeProgrammingTasks = $('#frm-programming-tasks');
      if (iframeProgrammingTasks.length) {
        iframeProgrammingTasks.attr('src', iframeProgrammingTasks.attr('src'));
      }
    }
    else if (tab == 2) {

      let iframeProgrammingTickets = $('#frm-programming-tickets');
      if (iframeProgrammingTickets.length) {
        iframeProgrammingTickets.attr('src', iframeProgrammingTickets.attr('src'));
      }
    }
  });
}