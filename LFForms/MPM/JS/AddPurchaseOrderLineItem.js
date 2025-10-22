$(document).ready(function () {

  $(document).prop('title', 'Add Line Item');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simplePagination.js/1.6/simplePagination.min.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
  var bootstrapButton = $.fn.button.noConflict(); // return $.fn.button to previously assigned value so that popup close button displays correctly.
  $.fn.bootstrapBtn = bootstrapButton;

  $('.Submit').click(function (e) { submitForm(e); });

  if ($('.closeme input').val() == 1) {
    console.log('Calling home with refresh');
    window.parent.postMessage('CloseDialogWithRefresh', '*');
  }

  $('.network-user-name input').val($('.lf-user-name input').val().toUpperCase().substr($('.lf-user-name input').val().lastIndexOf('\\') + 1)).change();

  $(document).on('lookupcomplete', function (e) {
    if ((!isAdminUser()) || ($('.poid input').val() == '')) {
      $('.Submit').hide();
    }
    else {
      $('.Submit').show();
    }
  });

  $(document).on("onloadlookupfinished", function (e) {
    $('.closeme input').val(1);
    $('.network-user-name input').trigger("change");
  });

});


/**
 * @returns {boolean} True when the current user is an admin user.
 */
function isAdminUser() {
  if ($('.user-isadmin input').val() == '1') {
    return true;
  }
  return false;
}


/**
 * Submit the form but sets quantity to zero if not a 'Purchase' line item.
 * @param {Event} e The event object.
 */
function submitForm(e) {
  e.preventDefault();
  var isPurchaseLineItem = Number($('.line-item-type-id input').val());
  if (isPurchaseLineItem != 1) {
    $('.quantity input').val(0);
  }
  $('#form1').submit();
}