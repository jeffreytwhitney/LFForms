

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

  $(document).on("onloadlookupfinished", function () {
    $('.closeme input').val(1);
    $('.section-add-note').append('<div class="section-add-note-content"><textarea class="note-textarea" rows="5" cols="50"></textarea></div>');
  });

  $(document).on('lookupcomplete', function (e) {
    setDepartmentEmail();

  });

});


function setDepartmentEmail() {
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

}

function submitForm(e) {

  e.preventDefault();
  var noteField = $('.note-textarea').clone();

  $(noteField).dialog({
    title: 'Add Note',
    modal: true,
    width: 600,
    height: 400,
    autoOpen: false,
    resizable: false,
    buttons: {
      'OK': function () {
        $(this).dialog('close');
      }
    }
  });
  
  $(noteField).dialog("open");

  var noteText = $('.note-textarea').val();
  
  console.log("Form submitted with note: " + noteText);
  
}