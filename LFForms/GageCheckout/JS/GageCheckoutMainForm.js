$(document).ready(function () {
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $('.Submit').hide();
  $(document).prop('title', 'Modify Ticket');
  tabifyFormSections();

  // Force reload of the active iframe on tab header double-click.
  $(document).on('dblclick', '.ui-tabs-anchor', function () {
    var tabID = $(this).attr('id');
    if (tabID == 'ui-id-1') {
      let iframeGageCheckout = $('#frm-gage-checkout');
      if (iframeGageCheckout.length) {
        gageCheckoutSource = trimQueryString(iframeGageCheckout.attr('src'));
        iframeGageCheckout.attr('src', gageCheckoutSource);
      }
    }
    else if (tabID == 'ui-id-2') {
      let iframeModifyTicket = $('#frm-modify-ticket');
      if (iframeModifyTicket.length) {
        modifyTicketSource = trimQueryString(iframeModifyTicket.attr('src'));
        iframeModifyTicket.attr('src', modifyTicketSource);
      }
    }
  });

});


function tabifyFormSections() {
  $('#q0').children().wrapAll('<div id="history-tabs"></div>');
  $('#history-tabs').prepend('<ul id="ticket-history-tab"><li><a href="#q2"><span>GageCheckout</span></a></li><li><a href="#q3"><span>Modify Existing Tickets</span></a></li></ul>');
  $('#history-tabs').tabs();

  $("#history-tabs").on("tabsactivate", function (event, ui) {
    var tab = ui.newTab.index();
    if (tab == 0) {
      let iframeGageCheckout = $('#frm-gage-checkout');
      if (iframeGageCheckout.length) {
        gageCheckoutSource = trimQueryString(iframeGageCheckout.attr('src'));
        iframeGageCheckout.attr('src', gageCheckoutSource);
      }
    }
    else if (tab == 1) {
      let iframeModifyTicket = $('#frm-modify-ticket');
      if (iframeModifyTicket.length) {
        modifyTicketSource = trimQueryString(iframeModifyTicket.attr('src'));
        iframeModifyTicket.attr('src', modifyTicketSource);
      }
    }
  });


}


function trimQueryString(url) {
  return url.split('?')[0];
}