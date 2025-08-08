$(document).ready(function () {
  $('.Submit').hide();
  $(document).prop('title', 'Admin Main Form');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
  var bootstrapButton = $.fn.button.noConflict(); // return $.fn.button to previously assigned value
  $.fn.bootstrapBtn = bootstrapButton;
  $('#Field3').val($('#Field2').val().substr($('#Field2').val().lastIndexOf('\\') + 1)).change();






  $(document).on('lookupcomplete', function (e) {
    if ($('#Field6').val() != '1') {
      console.log('Not Admin');

      $(".is-admin").removeClass('disabledAnchor').addClass('disabledAnchor');
    }
  });

  $(document).on("onloadlookupfinished", function (e) {

  });

});