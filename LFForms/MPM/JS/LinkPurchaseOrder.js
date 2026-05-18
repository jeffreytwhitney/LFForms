$(document).ready(function () {
  /* Page bootstrap: set title, load assets, wire submit, compute user display name */
  $(document).prop('title', 'Task Maintenance');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simplePagination.js/1.6/simplePagination.min.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
  $('.Submit').hide();


  /* Avoid Bootstrap/jQuery UI plugin name conflicts */
   // return $.fn.button to previously assigned value
  $.fn.bootstrapBtn = $.fn.button.noConflict();

  /* Compute DOMAIN\user -> USER and push into .network-user-name. See 'User Permissions' above */
  const username = $('.lf-username input').val() || '';
  $('.network-user-name input')
    .val(username.toUpperCase().slice(username.lastIndexOf('\\') + 1))
    .trigger('change');

  /* If host requests dialog close, notify parent See 'Dialog Looping Mechanism' above */
  if ($('.closeme input').val() === '1') {
    window.parent.postMessage('CloseDialogWithRefresh', '*');
  }

  $(document).on('change', 'input[id^="Field19"]', function () {

    if (this.checked) {
      const selectedRowIndex = $(this).closest('tr').index();
      const selectedID = $(this).closest('tr').find('.poid-col input').val();
      $('.selected-purchase-order-id input').val(selectedID);
      uncheckEveryOtherCheckbox(selectedRowIndex);
    } else {
      $('.selected-purchase-order-id input').val('');
    }
    showHideSubmit();
  });


  $(document).on('lookupcomplete', function (e) {

  });

  /* Finalize UI after on-load lookup work finishes */
  $(document).on("onloadlookupfinished", function (e) {
    $('.closeme input').val(1);
  });

});


/**
 * Determines whether the current user is classified as a "Metrology" user.
 * Business Rule: user-type-id == 1 => elevated privilege.
 * @returns {boolean} True if metrology user; false otherwise.
 */
function isMetrologyUser() {
  const userTypeId = Number($('.user-type-id input').val());
  return userTypeId === 1 || userTypeId === 2;
}

function showHideSubmit(){
  let serviceTicketID = $('.sid input').val();
  let selectedPurchaseOrderId = $('.selected-purchase-order-id input').val();

  if (serviceTicketID === '' || selectedPurchaseOrderId === '' || isMetrologyUser() === false) {
    $('.Submit').hide();
  }
  else {
    $('.Submit').show();
  }
}



function uncheckEveryOtherCheckbox(selectedRowIndex) {
  $('input[id^="Field19"]').each(function () {
    const currentRowIndex = $(this).closest('tr').index();
    if (currentRowIndex !== selectedRowIndex) {
      $(this).prop('checked', false);
    }
  });
}
