$(document).ready(function () {
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $('.Submit').hide();
  $(document).prop('title', 'Gage Checkout');
  tabifyFormSections();

  // Force reload of the active iframe on tab header double-click.
  $(document).on('dblclick', '.ui-tabs-anchor', function () {
    const tabID = $(this).attr('id');
    if (tabID === 'ui-id-1') {
      const iframeGageCheckout = $('#frm-gage-checkout');
      if (iframeGageCheckout.length) {
        let gageCheckoutSource = trimQueryString(iframeGageCheckout.attr('src'));
        iframeGageCheckout.attr('src', gageCheckoutSource);
      }
    }
    if (tabID === 'ui-id-2') {
      const iframeModifyTicket = $('#frm-modify-ticket');
      if (iframeModifyTicket.length) {
        let modifyTicketSource = trimQueryString(iframeModifyTicket.attr('src'));
        iframeModifyTicket.attr('src', modifyTicketSource);
      }
    }
    if (tabID === 'ui-id-3') {
      const iframeGageRequest = $('#frm-gage-request');
      if (iframeGageRequest.length) {
        let gageRequestSource = trimQueryString(iframeGageRequest.attr('src'));
        iframeGageRequest.attr('src', gageRequestSource);
      }
    }
  });

  $(document).on("onloadlookupfinished", function () {
    generateVersionLink();
  });

});


function generateVersionLink() {
  const current_version = $('.current-version input').val(); 

  if (current_version.length === 0) {
    return;
  }

  if ($('#version-div').length === 0) {
    const versionInfo = `<div id="version-div"><a href="http://rmslf/Forms/RMS-GAGE-ApplicationVersion" target="_blank">App Version</a>: ${current_version} </div>`;
    $(versionInfo).insertAfter('#ticket-history-tab');
  }
}


function tabifyFormSections() {
  $('#q0').children().wrapAll('<div id="history-tabs"></div>');
  $('#history-tabs').prepend('<ul id="ticket-history-tab"><li><a href="#q2"><span>GageCheckout</span></a></li><li><a href="#q3"><span>Modify Existing Tickets</span></a></li><li><a href="#q9"><span>Gage Requests</span></a></li></ul>');
  $('#history-tabs').tabs();

  $("#history-tabs").on("tabsactivate", function (event, ui) {
    const tab = ui.newTab.index();
    if (tab === 0) {
      const iframeGageCheckout = $('#frm-gage-checkout');
      if (iframeGageCheckout.length) {
        let gageCheckoutSource = trimQueryString(iframeGageCheckout.attr('src'));
        iframeGageCheckout.attr('src', gageCheckoutSource);
      }
    }
    else if (tab === 1) {
      const iframeModifyTicket = $('#frm-modify-ticket');
      if (iframeModifyTicket.length) {
        let modifyTicketSource = trimQueryString(iframeModifyTicket.attr('src'));
        iframeModifyTicket.attr('src', modifyTicketSource);
      }
    }
    else if (tab === 2) {
      const iframeGageRequest = $('#frm-gage-request');
      if (iframeGageRequest.length) {
        let gageRequestSource = trimQueryString(iframeGageRequest.attr('src'));
        iframeGageRequest.attr('src', gageRequestSource );
      }
    }
  });
  
}


function trimQueryString(url) {
  return url.split('?')[0];
}
