$(function () {

  const lfUserNameRaw = $('.lf-username input').val();
  const lfUserName = (typeof lfUserNameRaw === 'string') ? lfUserNameRaw.trim() : '';
  if ((lfUserName !== '') && (lfUserName !== 'Anonymous User')) {
    $('.network-user-name input').val(lfUserName.toUpperCase().slice(lfUserName.lastIndexOf('\\') + 1)).trigger("change");
  }


  $.when(
    $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js')
  ).done(function () {
    $(document).prop('title', 'Task Maintenance');
    $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
    $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simplePagination.js/1.6/simplePagination.min.css">');
    $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
    $.fn.bootstrapBtn = $.fn.button.noConflict();

  }).fail(function () {
    console.error('Failed to load required scripts');
  });

  $('.Submit').hide();

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

  $(document).on("onloadlookupfinished", function () {
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
