$(document).ready(function () {

  $(document).prop('title', 'Add Purchase Order');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simplePagination.js/1.6/simplePagination.min.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
  var bootstrapButton = $.fn.button.noConflict(); // return $.fn.button to previously assigned value so that popup close button displays correctly.
  $.fn.bootstrapBtn = bootstrapButton;

  if ($('.closeme input').val() == 1) {
    console.log('Calling home with refresh');
    window.parent.postMessage('CloseDialogWithRefresh', '*');
  }


  //$('.Submit').click(function (e) { submitForm(e); });
  $('.network-user-name input').val($('.lf-user-name input').val().toUpperCase().substr($('.lf-user-name input').val().lastIndexOf('\\') + 1)).change();

  $(document).on('change', '.line-item-type-id-col input', function (e) {
    var row = $(this).closest('tr');
    if (Number($(this).val()) > 1) {
      row.find('.quantity-col input').val(0).prop('readonly', true);
    } else {
      row.find('.quantity-col input').prop('readonly', false);
    }
  });

  $(document).on('lookupcomplete', function (e) {
    if (!isAdminUser()) {
      $('.Submit').hide();
    }
    else {
      $('.Submit').show();
    }

  });

  $(document).on("onloadlookupfinished", function (e) {
    $('.closeme input').val(1);
    $('.network-user-name input').trigger("change");
    var siteid = Number($('.site-id input').val());
    
    if (siteid == 0) {
      $('.Submit').hide();
    }

    

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
