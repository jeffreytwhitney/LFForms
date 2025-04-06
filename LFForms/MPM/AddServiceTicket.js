

$(document).ready(function () {
  $(document).prop('title', 'Add Service Ticket');
  $('.Submit').click(function (e) { submitForm(e); });
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
  var bootstrapButton = $.fn.button.noConflict(); 
  $.fn.bootstrapBtn = bootstrapButton;
  
  if ($('.closeme input').val() == 1) {
    window.parent.postMessage('CloseDialogWithRefresh', '*');
  }

  $(document).on('change', '.contact-user-type-id input', function (e) {
    var userTypeID = Number($('.contact-user-type-id input').val());
    var cellLeadEmail = $('.cell-lead-email-address input').val();
    var qeEmail = $('.qe-email-address input').val();
    var meEmail = $('.me-email-address input').val();
    var submitEmailAddressField = $('.department-email-address input');


    if (userTypeID == 0) {
      return;
    }

    switch (userTypeID) {
      case 1:
      case 2:
      case 5:
        $(submitEmailAddressField).val(cellLeadEmail);
        break;
      case 3:
        $(submitEmailAddressField).val(qeEmail);
        break;
      case 4:
        $(submitEmailAddressField).val(meEmail);
        break;
    }
  });


  $(document).on("onloadlookupfinished", function () {
    $('.closeme input').val(1);
    getSiteNameFromCookie();
  });

  $(document).on('lookupcomplete', function (e) {
    

  });

});


function getSiteNameFromCookie() {
  var sitename = $.cookie('site_name');
  var siteNameFieldVal = $('.site-name input').val();
  if ((sitename != null) && (siteNameFieldVal == '')) {
    $('.site-name input').val(sitename).change();
  }
}


function submitForm(e) {
  var ticketType = Number($('.ttid input').val());

  if (ticketType == 0) {
    e.preventDefault();
    return;
  }

  if (ticketType != 1) {
    $('.cmmid input').val(0);
    $('.probeid input').val(0);
  }

  if ($('.broken-probe-name select').val() == '') {
    $('.probeid input').val(0);
  }

}