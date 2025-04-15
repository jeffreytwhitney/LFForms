

$(document).ready(function () {
  $(document).prop('title', 'Add Service Ticket Note');
  
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simplePagination.js/1.6/simplePagination.min.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
  var bootstrapButton = $.fn.button.noConflict(); // return $.fn.button to previously assigned value
  $.fn.bootstrapBtn = bootstrapButton;
   

  if ($('.closeme input').val() == 1) {
      window.parent.postMessage('CloseDialogWithRefresh', '*');
  }


  $(document).on("onloadlookupfinished", function () {
    if ($('.uid input').val() == '') {
      $('.Submit').hide();
      $('.note-text textarea').addClass("ui-state-disabled"); 
    }
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
